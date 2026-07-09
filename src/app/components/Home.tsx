import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Briefcase, Package, Trophy, ArrowLeft, Users, Zap, Newspaper, ChevronLeft, ChevronRight, Store } from "lucide-react";
import { subscribeToFeatured, subscribeToCollection, subscribeToSiteContent, getLatestNews } from "../../lib/firestore";
import type { Course, Job, Equipment, Competition, SiteContent, NewsItem } from "../../lib/types";
import { DEFAULT_SITE_CONTENT } from "../../lib/types";
import heroImage from "../assets/hero.webp";

/* ── Animated counter ── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = Math.ceil(target / 40);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        setVal(start);
        if (start >= target) clearInterval(timer);
      }, 30);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Editorial section header ── */
function SectionHeader({ title, link, linkLabel }: { title: string; link: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 w-1 h-7 rounded-sm" style={{ background: "var(--theme-accent, #00a355)" }} />
        <h2 className="text-xl font-black" style={{ color: "var(--theme-text, #e8f5e9)" }}>{title}</h2>
        <div className="h-px flex-1" style={{ background: "var(--p-15)" }} />
      </div>
      <Link
        to={link}
        className="flex items-center gap-1.5 text-sm mr-6 flex-shrink-0 transition-all duration-200"
        style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
      >
        {linkLabel} <ArrowLeft size={14} />
      </Link>
    </div>
  );
}

/* ── Editorial card ── */
function EditorialCard({ to, children, delay = "0s" }: { to: string; children: React.ReactNode; delay?: string }) {
  return (
    <Link
      to={to}
      className="block animate-fade-in-up"
      style={{
        textDecoration: "none",
        background: "#0a0d0a",
        borderTop: "2px solid var(--p-20)",
        borderRight: "1px solid var(--p-10)",
        borderBottom: "1px solid var(--p-10)",
        borderLeft: "1px solid var(--p-10)",
        transition: "border-top-color 0.2s, transform 0.2s",
        opacity: 0,
        animationFillMode: "forwards",
        animationDelay: delay,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderTopColor = "var(--theme-accent, #00a355)";
        el.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderTopColor = "var(--p-20)";
        el.style.transform = "translateY(0)";
      }}
    >
      {children}
    </Link>
  );
}

const services = [
  { icon: BookOpen,  title: "الدورات التدريبية", link: "/courses" },
  { icon: Briefcase, title: "عروض التوظيف",      link: "/jobs" },
  { icon: Package,   title: "عتاد إعلامي",       link: "/equipment" },
  { icon: Trophy,    title: "المسابقات",          link: "/competitions" },
  { icon: Newspaper, title: "أخبار الإعلام",     link: "/news" },
  { icon: Store,     title: "سوق المعدات",       link: "/stores" },
];

/* ── Auto carousel ── */
function AutoCarousel({ children }: { children: React.ReactNode[] }) {
  const [idx, setIdx] = useState(0);
  const pausedRef = useRef(false);
  const idxRef = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const n = children.length;

  const goTo = (i: number) => { idxRef.current = i; setIdx(i); };
  const prev = () => goTo((idxRef.current - 1 + n) % n);
  const next = () => goTo((idxRef.current + 1) % n);

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => { if (!pausedRef.current) next(); }, 3800);
    return () => clearInterval(t);
  }, [n]);

  return (
    <div
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 40) dx > 0 ? next() : prev();
        touchStartX.current = null;
      }}
    >
      {/* Slide — show only active, fade between */}
      <div style={{ position: "relative" }}>
        {children.map((child, i) => (
          <div
            key={i}
            style={{
              opacity: i === idx ? 1 : 0,
              transition: "opacity 0.4s ease",
              position: i === idx ? "relative" : "absolute",
              top: 0, left: 0, right: 0,
              pointerEvents: i === idx ? "auto" : "none",
              width: "100%",
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Controls */}
      {n > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "1.1rem" }}>
          <button onClick={prev} style={{ background: "var(--p-10)", border: "1px solid var(--p-20)", color: "var(--theme-text-muted)", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ChevronRight size={14} />
          </button>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {children.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ width: i === idx ? "18px" : "6px", height: "6px", borderRadius: "3px", background: i === idx ? "var(--theme-accent)" : "var(--p-20)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s" }} />
            ))}
          </div>
          <button onClick={next} style={{ background: "var(--p-10)", border: "1px solid var(--p-20)", color: "var(--theme-text-muted)", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <ChevronLeft size={14} />
          </button>
        </div>
      )}
    </div>
  );
}


export default function Home() {
  const [featuredCourses,   setFeaturedCourses]   = useState<Course[]>([]);
  const [featuredJobs,      setFeaturedJobs]      = useState<Job[]>([]);
  const [featuredEquipment, setFeaturedEquipment] = useState<Equipment[]>([]);
  const [upcomingComps,     setUpcomingComps]     = useState<Competition[]>([]);
  const [latestNews,        setLatestNews]        = useState<NewsItem[]>([]);
  const [content, setContent] = useState<SiteContent | null>(() => {
    try { const cached = localStorage.getItem("sanad_site_content"); if (cached) return JSON.parse(cached) as SiteContent; } catch {}
    return null;
  });

  useEffect(() => {
    const unsubs = [
      subscribeToFeatured<Course>("courses",       setFeaturedCourses),
      subscribeToCollection<Job>("jobs", (d) => {
        const approved = d.filter((j) => j.status === "approved" || !j.status);
        setFeaturedJobs([...approved].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8));
      }),
      subscribeToFeatured<Equipment>("equipment",  (d) => setFeaturedEquipment(d.slice(0, 3))),
      subscribeToCollection<Competition>("competitions", (comps) => {
        const approved = comps.filter((c) => c.status === "approved" || !c.status);
        setUpcomingComps([...approved].sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 8));
      }),
      subscribeToSiteContent((data) => {
        setContent(data);
        try { localStorage.setItem("sanad_site_content", JSON.stringify(data)); } catch {}
      }),
    ];
    getLatestNews(3).then(setLatestNews);
    return () => unsubs.forEach((u) => u());
  }, []);

  const c = content ?? DEFAULT_SITE_CONTENT;
  const ready = content !== null;

  const stats = [
    { value: 6,   suffix: "",    label: "خدمات متكاملة" },
    { value: 69,  suffix: "",    label: "ولاية" },
    { value: 100, suffix: "%",   label: "محتوى جزائري" },
    { value: 7,   suffix: "/24", label: "متاح دائماً" },
  ];

  return (
    <div style={{ background: "#080b08", minHeight: "100vh", position: "relative" }}>

      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.04,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ══ HERO ═══════════════════════════════════════════════════════ */}
        <section style={{ borderBottom: "1px solid var(--p-15)", position: "relative", overflow: "hidden" }}>
          {/* Top accent line */}
          <div style={{ height: "2px", background: "linear-gradient(to left, transparent, var(--theme-accent, #00a355) 50%, transparent)", position: "relative", zIndex: 1 }} />

          {/* Cinematic background — purely aesthetic, never intercepts
              clicks. Focal point at 35% width so the text stays the hero.
              One-shot settle zoom 1.02 -> 1 over 8s on page load. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
              backgroundImage: `url(${heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "35% center",
              backgroundRepeat: "no-repeat",
              WebkitMaskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0.8) 75%, transparent 100%)",
              maskImage: "radial-gradient(circle, rgba(0,0,0,1) 55%, rgba(0,0,0,0.8) 75%, transparent 100%)",
              animation: "hero-zoom 8s ease-out forwards",
            }}
          />
          {/* Dark overlay — lighter up top, dissolving to the page black at
              the bottom so the transition into the services section is
              seamless. Also dims the artwork's HUD details to ~20-30%. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.82) 45%, rgba(0,0,0,0.92) 70%, rgba(8,11,8,1) 100%)",
            }}
          />
          {/* Faint green glow behind the title column (right side, RTL) */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
              background: "radial-gradient(ellipse 34% 30% at 80% 32%, rgba(0,163,85,0.12), transparent 70%)",
            }}
          />

          <div className="container mx-auto px-4 py-14 md:py-24" style={{ position: "relative", zIndex: 1 }}>
            <div className="grid md:grid-cols-5 gap-0 items-center md:min-h-[520px]">

              {/* Content — right column (RTL = displayed first) */}
              <div
                className="md:col-span-3 flex flex-col justify-center md:pl-16"
                style={{ borderLeft: "1px solid var(--p-12)" }}
              >
                {/* Label */}
                <div
                  className="flex items-center gap-3 mb-8"
                  style={{ opacity: ready ? 1 : 0, transition: "opacity 0.5s" }}
                >
                  <div style={{ width: "2rem", height: "1px", background: "var(--theme-accent, #00a355)" }} />
                  <span style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.7rem", letterSpacing: "0.25em", fontWeight: 700, textTransform: "uppercase" }}>
                    {c.heroBadge}
                  </span>
                </div>

                {/* H1 */}
                <h1
                  style={{
                    fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    marginBottom: "1.5rem",
                    color: "var(--theme-text, #e8f5e9)",
                    opacity: ready ? 1 : 0,
                    transition: "opacity 0.5s 0.1s",
                  }}
                >
                  {c.heroTitle}{" "}
                  <span style={{ color: "var(--theme-accent, #00a355)" }}>{c.siteName}</span>
                </h1>

                {/* Subtitle */}
                <p
                  style={{
                    color: "var(--theme-text-secondary, #a5d6a7)",
                    fontSize: "clamp(1rem, 2vw, 1.2rem)",
                    lineHeight: 1.6,
                    marginBottom: "0.75rem",
                    opacity: ready ? 1 : 0,
                    transition: "opacity 0.5s 0.2s",
                  }}
                >
                  {c.heroSubtitle}
                </p>

                {/* Description */}
                <p
                  style={{
                    color: "var(--theme-text-muted, #6aad6a)",
                    fontSize: "0.9rem",
                    lineHeight: 1.9,
                    maxWidth: "460px",
                    marginBottom: "2.5rem",
                    opacity: ready ? 1 : 0,
                    transition: "opacity 0.5s 0.3s",
                  }}
                >
                  {c.heroDescription}
                </p>

                {/* CTAs */}
                <div
                  className="flex flex-wrap gap-3"
                  style={{ opacity: ready ? 1 : 0, transition: "opacity 0.5s 0.4s" }}
                >
                  <Link
                    to="/courses"
                    className="btn-dz flex items-center gap-2 font-semibold"
                    style={{ textDecoration: "none", padding: "0.85rem 1.75rem", borderRadius: "4px", fontSize: "0.95rem" }}
                  >
                    <span>{c.heroCta1}</span>
                    <ArrowLeft size={17} />
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 font-semibold transition-all duration-200"
                    style={{
                      border: "1px solid var(--p-30)",
                      color: "var(--theme-text-secondary, #a5d6a7)",
                      textDecoration: "none",
                      padding: "0.85rem 1.75rem",
                      borderRadius: "4px",
                      fontSize: "0.95rem",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--theme-accent)";
                      el.style.color = "var(--theme-accent)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--p-30)";
                      el.style.color = "var(--theme-text-secondary, #a5d6a7)";
                    }}
                  >
                    <Users size={17} />
                    {c.heroCta2}
                  </Link>
                </div>
              </div>

              {/* Decorative — left column (hidden on mobile) */}
              <div
                className="hidden md:flex md:col-span-2 items-center justify-center relative"
                style={{ paddingRight: "2rem" }}
              >
                {/* Large ghost "سند" */}
                <span style={{
                  position: "absolute",
                  fontSize: "18rem",
                  fontWeight: 900,
                  color: "var(--theme-accent, #00a355)",
                  opacity: 0.04,
                  userSelect: "none",
                  lineHeight: 1,
                  left: "50%",
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}>سند</span>

                {/* Decorative geometric lines */}
                <div style={{ position: "absolute", top: "18%", right: "15%", width: "1px", height: "100px", background: "linear-gradient(to bottom, transparent, var(--p-25), transparent)" }} />
                <div style={{ position: "absolute", bottom: "18%", left: "20%", width: "70px", height: "1px", background: "linear-gradient(to left, transparent, var(--p-25))" }} />
                <div style={{ position: "absolute", top: "12%", left: "30%", width: "1px", height: "40px", background: "var(--theme-accent, #00a355)", opacity: 0.25 }} />
                <div style={{ position: "absolute", bottom: "30%", right: "20%", width: "30px", height: "1px", background: "var(--theme-accent, #00a355)", opacity: 0.25 }} />

                {/* Stats — 2×2 grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--p-15)", border: "1px solid var(--p-15)", position: "relative", zIndex: 2, width: "240px" }}>
                  {stats.map((s, i) => (
                    <div key={i} style={{ background: "#080b08", padding: "1.5rem 1rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--theme-accent, #00a355)", lineHeight: 1 }}>
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                      </div>
                      <div style={{ color: "var(--theme-text-dim, #455a64)", fontSize: "0.65rem", marginTop: "0.35rem", letterSpacing: "0.04em" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile stats */}
            <div className="grid grid-cols-4 md:hidden mt-10" style={{ gap: "1px", background: "var(--p-12)" }}>
              {stats.map((s, i) => (
                <div key={i} style={{ background: "#080b08", padding: "1rem 0.25rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--theme-accent, #00a355)" }}>
                    <AnimatedCounter target={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ color: "var(--theme-text-dim, #455a64)", fontSize: "0.6rem", marginTop: "0.2rem" }}>{s.label}</div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ══ SERVICES — Orbital circle layout ═══════════════════════════ */}
        <section style={{ borderBottom: "1px solid var(--p-15)" }}>
          <div className="container mx-auto px-4 py-10 md:py-16">
            <div className="mb-8 text-center">
              <p style={{ color: "var(--theme-accent)", fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                {c.servicesLabel}
              </p>
              <h2 className="text-2xl font-black" style={{ color: "var(--theme-text)" }}>{c.servicesTitle}</h2>
            </div>

            {/* ── Desktop: orbital ── */}
            <div className="hidden md:flex justify-center">
              {(() => {
                const W = 520, H = 560, CX = 260, CY = 280, R = 190, ITEM = 92;
                const positions = services.map((_, i) => {
                  const a = (-90 + i * 60) * Math.PI / 180;
                  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
                });
                return (
                  <div style={{ position: "relative", width: `${W}px`, height: `${H}px`, flexShrink: 0 }}>
                    {/* SVG: orbit ring + spokes */}
                    <svg
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
                      viewBox={`0 0 ${W} ${H}`}
                    >
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--p-15)" strokeWidth="1" strokeDasharray="5 7" />
                      {positions.map((p, i) => (
                        <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="var(--p-10)" strokeWidth="1" />
                      ))}
                    </svg>

                    {/* Center circle */}
                    <div style={{
                      position: "absolute",
                      width: "128px", height: "128px",
                      top: "50%", left: "50%",
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #141414, #101010)",
                      border: "1px solid var(--p-30)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      zIndex: 2,
                      boxShadow: "0 0 40px rgba(0,163,85,0.08)",
                    }}>
                      <span style={{ color: "var(--theme-accent)", fontWeight: 900, fontSize: "0.75rem", lineHeight: 1.4, padding: "0 12px" }}>
                        خدمات<br />المنصة
                      </span>
                    </div>

                    {/* Service items */}
                    {services.map((s, i) => {
                      const p = positions[i];
                      return (
                        <Link
                          key={s.link}
                          to={s.link}
                          style={{
                            position: "absolute",
                            left: `${p.x}px`,
                            top: `${p.y}px`,
                            transform: "translate(-50%, -50%)",
                            textDecoration: "none",
                            textAlign: "center",
                            zIndex: 3,
                            width: `${ITEM}px`,
                          }}
                          onMouseEnter={(e) => {
                            const circle = e.currentTarget.querySelector(".svc-circle") as HTMLElement;
                            if (circle) { circle.style.borderColor = "var(--theme-accent)"; circle.style.boxShadow = "0 0 20px rgba(0,163,85,0.25)"; circle.style.transform = "scale(1.08)"; }
                          }}
                          onMouseLeave={(e) => {
                            const circle = e.currentTarget.querySelector(".svc-circle") as HTMLElement;
                            if (circle) { circle.style.borderColor = "var(--p-20)"; circle.style.boxShadow = "none"; circle.style.transform = "scale(1)"; }
                          }}
                        >
                          <div
                            className="svc-circle"
                            style={{
                              width: `${ITEM}px`, height: `${ITEM}px`,
                              borderRadius: "50%",
                              background: "linear-gradient(145deg, #141414, #101010)",
                              border: "1px solid var(--p-20)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
                            }}
                          >
                            <s.icon size={22} style={{ color: "var(--theme-accent, #00a355)" }} />
                          </div>
                          <p style={{ marginTop: "8px", fontSize: "0.72rem", fontWeight: 700, color: "var(--theme-text-muted, #6aad6a)", lineHeight: 1.35, whiteSpace: "nowrap" }}>
                            {s.title}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* ── Mobile: 2×3 grid ── */}
            <div className="md:hidden grid grid-cols-2 gap-4">
              {services.map((s) => (
                <Link
                  key={s.link}
                  to={s.link}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "1.25rem 0.75rem",
                    borderRadius: "12px",
                    background: "linear-gradient(145deg, #141414, #101010)",
                    border: "1px solid var(--p-20)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--p-10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon size={22} style={{ color: "var(--theme-accent, #00a355)" }} />
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--theme-text-muted, #6aad6a)" }}>{s.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURED COURSES ══════════════════════════════════════════ */}
        {featuredCourses.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-8 md:py-14">
              <SectionHeader title="دورات مميزة" link="/courses" linkLabel="كل الدورات" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--p-10)" }}>
                {featuredCourses.slice(0, 3).map((course, i) => (
                  <EditorialCard key={course.id} to={`/courses/${course.id}`} delay={`${i * 0.09}s`}>
                    {course.image && <div style={{ height: "170px", overflow: "hidden" }}><img src={course.image} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                    <div className="p-5">
                      <h3 className="font-bold mb-2" style={{ color: "var(--theme-text)", fontSize: "0.95rem" }}>{course.title}</h3>
                      {course.instructor && <p style={{ color: "var(--theme-text-dim)", fontSize: "0.78rem", marginBottom: "0.75rem" }}>{course.instructor}</p>}
                      <div className="flex gap-2 flex-wrap">
                        <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.6rem", background: course.type === "free" ? "var(--p-15)" : "rgba(26,82,118,0.3)", color: course.type === "free" ? "var(--theme-accent)" : "#64b5f6" }}>
                          {course.type === "free" ? "مجانية" : `${course.price?.toLocaleString()} دج`}
                        </span>
                        {course.duration && <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.6rem", background: "var(--p-08)", color: "var(--theme-text-muted)" }}>{course.duration}</span>}
                      </div>
                    </div>
                  </EditorialCard>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ JOBS CAROUSEL ═════════════════════════════════════════════ */}
        {featuredJobs.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-8 md:py-14">
              <SectionHeader title="فرص عمل" link="/jobs" linkLabel="كل الفرص" />
              <AutoCarousel>
                {featuredJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    style={{ textDecoration: "none", display: "block", width: "100%", background: "#0a0d0a", borderTop: "2px solid var(--p-20)" }}
                  >
                    {job.image && <div style={{ height: "200px", overflow: "hidden" }}><img src={job.image} alt={job.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                    <div className="p-5" style={{ minWidth: 0 }}>
                      <div className="flex items-start gap-2 mb-2" style={{ justifyContent: "space-between" }}>
                        <h3 className="font-bold" style={{ color: "var(--theme-text)", fontSize: "1rem", minWidth: 0, wordBreak: "break-word", flex: 1 }}>{job.title}</h3>
                        {job.jobType && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", background: "var(--p-15)", color: "var(--theme-accent)", flexShrink: 0 }}>{job.jobType}</span>}
                      </div>
                      <p style={{ color: "var(--theme-text-secondary)", fontSize: "0.85rem", marginBottom: "0.3rem" }}>{job.company}</p>
                      {job.location && <p style={{ color: "var(--theme-text-dim)", fontSize: "0.76rem" }}>{job.location}</p>}
                      {job.deadline && <p style={{ color: "var(--theme-text-muted)", fontSize: "0.72rem", marginTop: "0.5rem" }}>الموعد النهائي: {job.deadline}</p>}
                    </div>
                  </Link>
                ))}
              </AutoCarousel>
            </div>
          </section>
        )}

        {/* ══ FEATURED EQUIPMENT ════════════════════════════════════════ */}
        {featuredEquipment.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-8 md:py-14">
              <SectionHeader title="عتاد مميز" link="/equipment" linkLabel="كل العتاد" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--p-10)" }}>
                {featuredEquipment.map((eq, i) => (
                  <EditorialCard key={eq.id} to={`/equipment/${eq.id}`} delay={`${i * 0.09}s`}>
                    {eq.image && <div style={{ height: "150px", overflow: "hidden" }}><img src={eq.image} alt={eq.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                    <div className="p-4">
                      <h3 className="font-bold mb-1" style={{ color: "var(--theme-text)", fontSize: "0.9rem" }}>{eq.name}</h3>
                      {eq.category && <p style={{ color: "var(--theme-accent)", fontSize: "0.75rem" }}>{eq.category}</p>}
                      <p style={{ color: "var(--theme-text-dim)", fontSize: "0.75rem", marginTop: "0.25rem" }}>{eq.price?.toLocaleString()} دج</p>
                    </div>
                  </EditorialCard>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ COMPETITIONS CAROUSEL ════════════════════════════════════ */}
        {upcomingComps.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-8 md:py-14">
              <SectionHeader title="مسابقات قادمة" link="/competitions" linkLabel="كل المسابقات" />
              <AutoCarousel>
                {upcomingComps.map((comp) => (
                  <Link
                    key={comp.id}
                    to={`/competitions/${comp.id}`}
                    style={{ textDecoration: "none", display: "block", width: "100%", background: "#0a0d0a", borderTop: "2px solid var(--p-20)" }}
                  >
                    {comp.image && <div style={{ height: "200px", overflow: "hidden" }}><img src={comp.image} alt={comp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                    <div className="p-5" style={{ minWidth: 0 }}>
                      <div className="flex items-start gap-2 mb-2" style={{ justifyContent: "space-between" }}>
                        <h3 className="font-bold" style={{ color: "var(--theme-text)", fontSize: "1rem", minWidth: 0, wordBreak: "break-word", flex: 1 }}>{comp.name}</h3>
                        {comp.type && (
                          <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", flexShrink: 0, background: comp.type === "international" ? "rgba(122,56,0,0.3)" : comp.type === "university" ? "rgba(26,79,122,0.3)" : "var(--p-15)", color: comp.type === "international" ? "#fb923c" : comp.type === "university" ? "#64b5f6" : "var(--theme-accent)" }}>
                            {comp.type === "university" ? "جامعي" : comp.type === "national" ? "وطني" : "دولي"}
                          </span>
                        )}
                      </div>
                      {comp.organizer && <p style={{ color: "var(--theme-text-secondary)", fontSize: "0.83rem", marginBottom: "0.4rem" }}>{comp.organizer}</p>}
                      <div className="flex items-center gap-2">
                        <Zap size={12} style={{ color: "var(--theme-accent)" }} />
                        <span style={{ color: "var(--theme-text-dim)", fontSize: "0.73rem" }}>{comp.startDate}</span>
                        {comp.endDate && <><span style={{ color: "var(--p-25)" }}>—</span><span style={{ color: "var(--theme-text-dim)", fontSize: "0.73rem" }}>{comp.endDate}</span></>}
                      </div>
                    </div>
                  </Link>
                ))}
              </AutoCarousel>
            </div>
          </section>
        )}


        {/* ══ LATEST NEWS ═══════════════════════════════════════════════ */}
        {latestNews.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-8 md:py-14">
              <SectionHeader title="آخر الأخبار" link="/news" linkLabel="كل الأخبار" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--p-10)" }}>
                {latestNews.map((item, i) => (
                  <EditorialCard key={item.id} to={`/news/${item.id}`} delay={`${i * 0.09}s`}>
                    {item.image && <div style={{ height: "150px", overflow: "hidden" }}><img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Newspaper size={12} style={{ color: "var(--theme-accent)" }} />
                        <span style={{ color: "var(--theme-text-dim)", fontSize: "0.72rem" }}>{item.date}</span>
                      </div>
                      <h3 className="font-bold line-clamp-2 mb-2" style={{ color: "var(--theme-text)", fontSize: "0.95rem" }}>{item.title}</h3>
                      <p className="text-xs line-clamp-2" style={{ color: "var(--theme-text-muted)" }}>{item.body}</p>
                    </div>
                  </EditorialCard>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ CTA — Full-bleed editorial ════════════════════════════════ */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          {/* Accent line top */}
          <div style={{ height: "1px", background: "linear-gradient(to left, transparent, var(--theme-accent, #00a355) 50%, transparent)" }} />

          <div className="container mx-auto px-4 py-10 md:py-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left — big statement text */}
              <div>
                <p style={{ color: "var(--theme-accent)", fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1rem" }}>
                  انضم إلى المنصة
                </p>
                <h2
                  style={{
                    fontSize: "clamp(2rem, 5vw, 3.5rem)",
                    fontWeight: 900,
                    lineHeight: 1.1,
                    color: "var(--theme-text, #e8f5e9)",
                    marginBottom: "1.5rem",
                  }}
                >
                  {c.ctaTitle}
                </h2>
                <p style={{ color: "var(--theme-text-muted, #6aad6a)", lineHeight: 1.8, fontSize: "0.95rem", maxWidth: "400px" }}>
                  {c.ctaSubtitle}
                </p>
              </div>

              {/* Right — buttons + geometric accent */}
              <div className="flex flex-col gap-4 md:items-end">
                <div style={{ width: "60px", height: "1px", background: "var(--theme-accent, #00a355)", marginBottom: "0.5rem" }} />
                <Link
                  to="/register"
                  className="btn-dz flex items-center gap-2 font-semibold"
                  style={{ textDecoration: "none", padding: "1rem 2rem", borderRadius: "4px", fontSize: "1rem", width: "fit-content" }}
                >
                  <span>{c.ctaButton}</span>
                  <ArrowLeft size={18} />
                </Link>
                <Link
                  to="/courses"
                  className="flex items-center gap-2 font-semibold transition-all duration-200"
                  style={{
                    border: "1px solid var(--p-25)",
                    color: "var(--theme-text-secondary, #a5d6a7)",
                    textDecoration: "none",
                    padding: "1rem 2rem",
                    borderRadius: "4px",
                    fontSize: "1rem",
                    width: "fit-content",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-accent)"; (e.currentTarget as HTMLElement).style.color = "var(--theme-accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-25)"; (e.currentTarget as HTMLElement).style.color = "var(--theme-text-secondary, #a5d6a7)"; }}
                >
                  {c.ctaButton2}
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div style={{ height: "1px", background: "linear-gradient(to right, transparent, var(--theme-accent, #00a355) 50%, transparent)" }} />
        </section>

      </div>
    </div>
  );
}
