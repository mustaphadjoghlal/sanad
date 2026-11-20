import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Briefcase, Tv, Trophy, ArrowLeft, Users, CalendarDays, Newspaper, ChevronLeft, ChevronRight, Store, MapPin } from "lucide-react";
import { subscribeToFeatured, subscribeToCollection, subscribeToSiteContent, getLatestNews, subscribeToWorks } from "../../lib/firestore";
import type { Course, Job, Equipment, Competition, SiteContent, NewsItem, Work } from "../../lib/types";
import { DEFAULT_SITE_CONTENT } from "../../lib/types";
import heroImage from "../assets/hero.webp";
import { usePageTitle } from "../../lib/usePageTitle";
import WorkCard from "./WorkCard";
import { CardCover } from "./Cover";

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

/* ── The logo's three bars ── */
function Bars() {
  return <span className="b-bars" aria-hidden="true"><span /><span /><span /></span>;
}

/* ── Signal waves from the logo, used as decoration ── */
function SignalWaves({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <circle cx="40" cy="160" r="14" fill="#0fa659" />
      <path d="M40 106a54 54 0 0 1 54 54" stroke="#0fa659" strokeWidth="12" strokeLinecap="round" />
      <path d="M40 60a100 100 0 0 1 100 100" stroke="#0fa659" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/* ── Section header ── */
function SectionHeader({ title, link, linkLabel }: { title: string; link: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <Bars />
        <h2 className="text-xl md:text-2xl font-extrabold truncate" style={{ color: "var(--b-text)" }}>{title}</h2>
      </div>
      <Link to={link} className="b-link">
        {linkLabel} <ArrowLeft size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

function Section({ children, tinted = false }: { children: React.ReactNode; tinted?: boolean }) {
  return (
    <section style={{ borderTop: "1px solid var(--b-line)", background: tinted ? "var(--b-surface)" : undefined }}>
      <div className="container mx-auto px-4 py-10 md:py-16">{children}</div>
    </section>
  );
}

function CardImage({ src, alt, ratio }: { src?: string; alt: string; ratio?: number }) {
  if (!src) return null;
  return (
    <div style={{ borderBottom: "1px solid var(--b-line)" }}>
      <CardCover src={src} alt={alt} ratio={ratio} />
    </div>
  );
}

const services = [
  { icon: BookOpen,  title: "الدورات التدريبية", desc: "طوّر مهاراتك مع مدرّبين ومراكز معتمدة", link: "/courses" },
  { icon: Briefcase, title: "عروض التوظيف",      desc: "فرص عمل في المؤسسات الإعلامية",      link: "/jobs" },
  { icon: Tv,        title: "دليل القنوات",      desc: "القنوات الجزائرية في مكان واحد",       link: "/channels" },
  { icon: Trophy,    title: "المسابقات",          desc: "مسابقات وطنية وجامعية ودولية",        link: "/competitions" },
  { icon: Newspaper, title: "أخبار الإعلام",     desc: "آخر مستجدات القطاع الإعلامي",          link: "/news" },
  { icon: Store,     title: "سوق المعدات",       desc: "كاميرات وصوت وإضاءة بين المحترفين",    link: "/stores" },
];

/* ── Auto carousel ── */
function AutoCarousel({ children, label }: { children: React.ReactNode[]; label: string }) {
  const [idx, setIdx] = useState(0);
  const pausedRef = useRef(false);
  const idxRef = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const n = children.length;

  // idxRef mirrors idx so the interval below always advances from the current
  // slide rather than the one captured when it was created.
  const goTo = useCallback((i: number) => { idxRef.current = i; setIdx(i); }, []);
  const prev = useCallback(() => goTo((idxRef.current - 1 + n) % n), [goTo, n]);
  const next = useCallback(() => goTo((idxRef.current + 1) % n), [goTo, n]);

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => { if (!pausedRef.current) next(); }, 4500);
    return () => clearInterval(t);
  }, [n, next]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocus={() => { pausedRef.current = true; }}
      onBlur={() => { pausedRef.current = false; }}
      onTouchStart={(e) => { pausedRef.current = true; touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        pausedRef.current = false;
        if (touchStartX.current === null) return;
        const dx = touchStartX.current - e.changedTouches[0].clientX;
        // RTL: swiping right moves forward.
        if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); }
        touchStartX.current = null;
      }}
    >
      <div style={{ position: "relative" }}>
        {children.map((child, i) => (
          <div
            key={i}
            aria-hidden={i !== idx}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} من ${n}`}
            style={{
              opacity: i === idx ? 1 : 0,
              transition: "opacity 0.4s ease",
              position: i === idx ? "relative" : "absolute",
              inset: 0,
              pointerEvents: i === idx ? "auto" : "none",
              visibility: i === idx ? "visible" : "hidden",
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button onClick={prev} type="button" aria-label="السابق" className="b-icon-btn" style={{ width: "2.25rem", height: "2.25rem" }}>
            <ChevronRight size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            {children.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`الشريحة ${i + 1}`}
                aria-current={i === idx}
                style={{ width: i === idx ? "20px" : "7px", height: "7px", borderRadius: "4px", background: i === idx ? "var(--b-green)" : "rgba(255,255,255,0.18)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s" }}
              />
            ))}
          </div>
          <button onClick={next} type="button" aria-label="التالي" className="b-icon-btn" style={{ width: "2.25rem", height: "2.25rem" }}>
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

const muted = { color: "var(--b-text-3)" } as const;
const soft = { color: "var(--b-text-2)" } as const;

export default function Home() {
  usePageTitle("", "منصة سند الإعلامية — المنصة الجزائرية الشاملة للإعلام: دورات تدريبية، فرص عمل، معدات، مسابقات، دليل القنوات والمحترفين.", { path: "/" });
  const [featuredCourses,   setFeaturedCourses]   = useState<Course[]>([]);
  const [featuredJobs,      setFeaturedJobs]      = useState<Job[]>([]);
  const [featuredEquipment, setFeaturedEquipment] = useState<Equipment[]>([]);
  const [upcomingComps,     setUpcomingComps]     = useState<Competition[]>([]);
  const [latestNews,        setLatestNews]        = useState<NewsItem[]>([]);
  const [content, setContent] = useState<SiteContent | null>(() => {
    try { const cached = localStorage.getItem("sanad_site_content"); if (cached) return JSON.parse(cached) as SiteContent; } catch { /* private mode / blocked storage */ }
    return null;
  });

  // The landing page degrades section by section: a feed that fails to load
  // is simply left empty rather than taking the whole page down.
  const noop = () => {};

  const [works, setWorks] = useState<Work[]>([]);

  // Featured first, so the front page shows what the platform has picked and
  // falls back to the newest when nothing has been picked yet.
  useEffect(() => subscribeToWorks("featured", setWorks, undefined, 12), []);

  useEffect(() => {
    const unsubs = [
      subscribeToFeatured<Course>("courses",       setFeaturedCourses, noop),
      subscribeToCollection<Job>("jobs", (d) => {
        const approved = d.filter((j) => j.status === "approved" || !j.status);
        setFeaturedJobs([...approved].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8));
      }, noop),
      subscribeToFeatured<Equipment>("equipment",  (d) => setFeaturedEquipment(d.slice(0, 3)), noop),
      subscribeToCollection<Competition>("competitions", (comps) => {
        const approved = comps.filter((c) => c.status === "approved" || !c.status);
        setUpcomingComps([...approved].sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 8));
      }, noop),
      subscribeToSiteContent((data) => {
        setContent(data);
        try { localStorage.setItem("sanad_site_content", JSON.stringify(data)); } catch { /* private mode */ }
      }, noop),
    ];
    getLatestNews(3).then(setLatestNews).catch(() => setLatestNews([]));
    return () => unsubs.forEach((u) => u());
  }, []);

  const c = content ?? DEFAULT_SITE_CONTENT;
  const ready = content !== null;
  const fade = (delay: number): React.CSSProperties => ({ opacity: ready ? 1 : 0, transition: `opacity 0.5s ${delay}s` });

  const stats = [
    { value: 6,   suffix: "",    label: "خدمات متكاملة" },
    { value: 69,  suffix: "",    label: "ولاية" },
    { value: 100, suffix: "%",   label: "محتوى جزائري" },
    { value: 7,   suffix: "/24", label: "متاح دائماً" },
  ];

  return (
    <div className="brand" style={{ background: "var(--b-ink)", minHeight: "100vh", position: "relative", overflow: "hidden" }}>

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", isolation: "isolate" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: -2, pointerEvents: "none",
            backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.32,
            WebkitMaskImage: "linear-gradient(to bottom, #000 30%, transparent 95%)",
            maskImage: "linear-gradient(to bottom, #000 30%, transparent 95%)",
            animation: "hero-zoom 18s ease-in-out infinite alternate",
          }}
        />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -1, background: "linear-gradient(90deg, rgba(6,10,7,0.2), rgba(6,10,7,0.85) 70%)" }} />
        <div className="b-glow" aria-hidden="true" style={{ top: "-16rem", left: "-14rem", zIndex: -1 }} />

        <div className="container mx-auto px-4 pt-12 pb-10 md:pt-20 md:pb-16">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              {c.heroBadge && <div className="b-eyebrow mb-6" style={fade(0)}>{c.heroBadge}</div>}

              <h1
                style={{
                  fontSize: "clamp(2.6rem, 7vw, 5rem)",
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: 0,
                  marginBottom: "1.25rem",
                  color: "var(--b-text)",
                  ...fade(0.1),
                }}
              >
                {c.heroTitle}{" "}
                <span style={{ color: "var(--b-green)" }}>{c.siteName}</span>
              </h1>

              <p style={{ ...soft, fontSize: "clamp(1.05rem, 2.2vw, 1.3rem)", fontWeight: 500, lineHeight: 1.7, marginBottom: "0.5rem", ...fade(0.2) }}>
                {c.heroSubtitle}
              </p>
              <p style={{ ...muted, fontSize: "0.95rem", lineHeight: 1.9, maxWidth: "34rem", marginBottom: "2rem", ...fade(0.3) }}>
                {c.heroDescription}
              </p>

              <div className="flex flex-wrap gap-3" style={fade(0.4)}>
                <Link to="/courses" className="b-btn b-btn--primary">
                  <span>{c.heroCta1}</span>
                  <ArrowLeft size={18} aria-hidden="true" />
                </Link>
                <Link to="/register" className="b-btn b-btn--ghost">
                  <Users size={18} aria-hidden="true" />
                  <span>{c.heroCta2}</span>
                </Link>
              </div>
            </div>

            {/* Stats: a 2×2 panel beside the text on desktop, a strip under it on phones */}
            <div className="md:col-span-5 relative">
              <SignalWaves className="hidden md:block" style={{ position: "absolute", width: "9rem", top: "-4.5rem", left: "-1rem", opacity: 0.5 }} />
              <div
                className="grid grid-cols-4 md:grid-cols-2"
                style={{ background: "var(--b-line)", gap: "1px", border: "1px solid var(--b-line)", borderRadius: "var(--b-radius)", overflow: "hidden", position: "relative" }}
              >
                {stats.map((s) => (
                  <div key={s.label} className="text-center px-1 py-4 md:py-7" style={{ background: "rgba(12,18,14,0.92)" }}>
                    <div className="text-xl md:text-4xl" style={{ fontWeight: 800, color: "var(--b-green-hi)", lineHeight: 1.1 }}>
                      <AnimatedCounter target={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-[0.68rem] md:text-sm mt-1.5" style={muted}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══════════════════════════════════════════════════ */}
      <Section>
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          {c.servicesLabel && <span className="b-eyebrow">{c.servicesLabel}</span>}
          <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: "var(--b-text)" }}>{c.servicesTitle}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {services.map((s) => (
            <Link key={s.link} to={s.link} className="b-service">
              <div className="flex items-center">
                <span className="b-service__icon"><s.icon size={22} aria-hidden="true" /></span>
                <ArrowLeft size={16} className="b-service__arrow hidden sm:block" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-[0.95rem] md:text-base" style={{ color: "var(--b-text)" }}>{s.title}</h3>
                <p className="text-xs md:text-sm mt-1" style={{ ...muted, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ══ WORKS GALLERY ═════════════════════════════════════════════ */}
      {works.length > 0 && (
        <Section tinted>
          <SectionHeader title="أعمال أعضاء المنصة" link="/works" linkLabel="كل الأعمال" />
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 14rem), 1fr))" }}>
            {works.slice(0, 8).map((w) => <WorkCard key={w.id} work={w} />)}
          </div>
        </Section>
      )}

      {/* ══ FEATURED COURSES ══════════════════════════════════════════ */}
      {featuredCourses.length > 0 && (
        <Section>
          <SectionHeader title="دورات مميزة" link="/courses" linkLabel="كل الدورات" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCourses.slice(0, 3).map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`} className="b-card">
                <CardImage src={course.image} alt={course.title} />
                <div className="p-5">
                  <h3 className="font-bold mb-1.5 line-clamp-2" style={{ color: "var(--b-text)", fontSize: "1rem" }}>{course.title}</h3>
                  {course.instructor && <p className="text-sm mb-3" style={muted}>{course.instructor}</p>}
                  <div className="flex gap-2 flex-wrap">
                    <span className={course.type === "free" ? "b-chip" : "b-chip b-chip--blue"}>
                      {course.type === "free" ? "مجانية" : `${course.price?.toLocaleString()} دج`}
                    </span>
                    {course.duration && <span className="b-chip b-chip--muted">{course.duration}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ══ JOBS ══════════════════════════════════════════════════════ */}
      {featuredJobs.length > 0 && (
        <Section tinted>
          <SectionHeader title="فرص عمل" link="/jobs" linkLabel="كل الفرص" />
          <AutoCarousel label="فرص عمل">
            {featuredJobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="b-card" style={{ maxWidth: "48rem", marginInline: "auto" }}>
                <CardImage src={job.image} alt={job.title} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold" style={{ color: "var(--b-text)", fontSize: "1.05rem", minWidth: 0, wordBreak: "break-word" }}>{job.title}</h3>
                    {job.jobType && <span className="b-chip">{job.jobType}</span>}
                  </div>
                  <p className="text-sm" style={soft}>{job.company}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs" style={muted}>
                    {job.location && <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{job.location}</span>}
                    {job.deadline && <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden="true" />آخر أجل: {job.deadline}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </AutoCarousel>
        </Section>
      )}

      {/* ══ FEATURED EQUIPMENT ════════════════════════════════════════ */}
      {featuredEquipment.length > 0 && (
        <Section>
          <SectionHeader title="عتاد مميز" link="/equipment" linkLabel="كل العتاد" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredEquipment.map((eq) => (
              <Link key={eq.id} to={`/equipment/${eq.id}`} className="b-card">
                <CardImage src={eq.image} alt={eq.name} ratio={4 / 3} />
                <div className="p-4">
                  {eq.category && <span className="b-chip mb-2">{eq.category}</span>}
                  <h3 className="font-bold mt-2 line-clamp-2" style={{ color: "var(--b-text)", fontSize: "0.95rem" }}>{eq.name}</h3>
                  <p className="mt-1.5 font-bold" style={{ color: "var(--b-green-hi)", fontSize: "0.95rem" }}>{eq.price?.toLocaleString()} دج</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ══ COMPETITIONS ═════════════════════════════════════════════ */}
      {upcomingComps.length > 0 && (
        <Section tinted>
          <SectionHeader title="مسابقات قادمة" link="/competitions" linkLabel="كل المسابقات" />
          <AutoCarousel label="مسابقات قادمة">
            {upcomingComps.map((comp) => (
              <Link key={comp.id} to={`/competitions/${comp.id}`} className="b-card" style={{ maxWidth: "48rem", marginInline: "auto" }}>
                <CardImage src={comp.image} alt={comp.name} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold" style={{ color: "var(--b-text)", fontSize: "1.05rem", minWidth: 0, wordBreak: "break-word" }}>{comp.name}</h3>
                    {comp.type && (
                      <span className={comp.type === "international" ? "b-chip b-chip--amber" : comp.type === "university" ? "b-chip b-chip--blue" : "b-chip"}>
                        {comp.type === "university" ? "جامعي" : comp.type === "national" ? "وطني" : "دولي"}
                      </span>
                    )}
                  </div>
                  {comp.organizer && <p className="text-sm mb-3" style={soft}>{comp.organizer}</p>}
                  <span className="inline-flex items-center gap-1.5 text-xs" style={muted}>
                    <CalendarDays size={13} aria-hidden="true" style={{ color: "var(--b-green)" }} />
                    {comp.startDate}{comp.endDate && ` — ${comp.endDate}`}
                  </span>
                </div>
              </Link>
            ))}
          </AutoCarousel>
        </Section>
      )}

      {/* ══ LATEST NEWS ═══════════════════════════════════════════════ */}
      {latestNews.length > 0 && (
        <Section>
          <SectionHeader title="آخر الأخبار" link="/news" linkLabel="كل الأخبار" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestNews.map((item) => (
              <Link key={item.id} to={`/news/${item.id}`} className="b-card">
                <CardImage src={item.image} alt={item.title} />
                <div className="p-5">
                  <span className="inline-flex items-center gap-1.5 text-xs mb-2" style={muted}>
                    <Newspaper size={13} aria-hidden="true" style={{ color: "var(--b-green)" }} />
                    {item.date}
                  </span>
                  <h3 className="font-bold line-clamp-2 mb-2" style={{ color: "var(--b-text)", fontSize: "1rem" }}>{item.title}</h3>
                  <p className="text-sm line-clamp-2" style={{ ...muted, lineHeight: 1.8 }}>{item.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ══ CTA ═══════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div
          className="relative overflow-hidden p-7 md:p-14"
          style={{ borderRadius: "24px", background: "linear-gradient(135deg, #0d1a12, var(--b-surface))", border: "1px solid var(--b-green-30)", isolation: "isolate" }}
        >
          <div className="b-glow" aria-hidden="true" style={{ bottom: "-20rem", right: "-12rem", zIndex: -1 }} />
          <SignalWaves style={{ position: "absolute", width: "14rem", bottom: "-3rem", left: "-3rem", opacity: 0.1, zIndex: -1 }} />
          <div className="grid md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-3">
              <span className="b-eyebrow mb-4">انضم إلى المنصة</span>
              <h2 style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", fontWeight: 800, lineHeight: 1.25, color: "var(--b-text)", margin: "1rem 0" }}>
                {c.ctaTitle}
              </h2>
              <p style={{ ...soft, lineHeight: 1.9, fontSize: "1rem", maxWidth: "30rem" }}>{c.ctaSubtitle}</p>
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row md:flex-col gap-3 md:items-end">
              <Link to="/register" className="b-btn b-btn--primary">
                <span>{c.ctaButton}</span>
                <ArrowLeft size={18} aria-hidden="true" />
              </Link>
              <Link to="/courses" className="b-btn b-btn--ghost">{c.ctaButton2}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
