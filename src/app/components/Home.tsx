import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Briefcase, Package, Trophy, Mic2, Tv2, ArrowLeft, Users, Zap, Newspaper } from "lucide-react";
import { subscribeToFeatured, subscribeToCollection, subscribeToSiteContent, getLatestNews } from "../../lib/firestore";
import type { Course, Job, Equipment, Competition, VoiceArtist, SiteContent, NewsItem } from "../../lib/types";
import { DEFAULT_SITE_CONTENT } from "../../lib/types";

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
    <div className="flex items-center justify-between mb-10">
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
  { icon: BookOpen,  title: "الدورات التدريبية",  desc: "برامج تدريبية احترافية في مجال الإعلام والصحافة والإنتاج",  link: "/courses" },
  { icon: Briefcase, title: "عروض التوظيف",       desc: "فرص عمل إعلامية وصحفية في جميع أنحاء الجزائر",            link: "/jobs" },
  { icon: Package,   title: "عتاد إعلامي",        desc: "معدات تصوير وصوت وبث من أفضل الموردين",                    link: "/equipment" },
  { icon: Trophy,    title: "المسابقات",           desc: "مسابقات إعلامية محلية ودولية للمحترفين والطلاب",           link: "/competitions" },
  { icon: Mic2,      title: "طلبات المنشطين",     desc: "ابحث عن منشطين محترفين أو قدّم نفسك للفرص المتاحة",       link: "/voice-requests" },
  { icon: Tv2,       title: "دليل القنوات",        desc: "دليل شامل للقنوات الجزائرية التلفزيونية والإذاعية",        link: "/channels" },
];


export default function Home() {
  const [featuredCourses,   setFeaturedCourses]   = useState<Course[]>([]);
  const [featuredJobs,      setFeaturedJobs]      = useState<Job[]>([]);
  const [featuredEquipment, setFeaturedEquipment] = useState<Equipment[]>([]);
  const [featuredVoice,     setFeaturedVoice]     = useState<VoiceArtist[]>([]);
  const [upcomingComps,     setUpcomingComps]     = useState<Competition[]>([]);
  const [latestNews,        setLatestNews]        = useState<NewsItem[]>([]);
  const [content, setContent] = useState<SiteContent | null>(() => {
    try { const cached = localStorage.getItem("sanad_site_content"); if (cached) return JSON.parse(cached) as SiteContent; } catch {}
    return null;
  });

  useEffect(() => {
    const unsubs = [
      subscribeToFeatured<Course>("courses",       setFeaturedCourses),
      subscribeToFeatured<Job>("jobs",             (d) => setFeaturedJobs(d.slice(0, 3))),
      subscribeToFeatured<Equipment>("equipment",  (d) => setFeaturedEquipment(d.slice(0, 3))),
      subscribeToFeatured<VoiceArtist>("voice",    (d) => setFeaturedVoice(d.slice(0, 3))),
      subscribeToCollection<Competition>("competitions", (comps) => {
        const approved = comps.filter((c) => c.status === "approved" || !c.status);
        setUpcomingComps([...approved].sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 3));
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
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", borderBottom: "1px solid var(--p-15)" }}>
          {/* Top accent line */}
          <div style={{ height: "2px", background: "linear-gradient(to left, transparent, var(--theme-accent, #00a355) 50%, transparent)", flexShrink: 0 }} />

          <div className="container mx-auto px-4 flex-1 flex flex-col justify-center py-16">
            <div className="grid md:grid-cols-5 gap-0 items-center" style={{ minHeight: "55vh" }}>

              {/* Content — right column (RTL = displayed first) */}
              <div
                className="md:col-span-3 flex flex-col justify-center py-8 md:py-0 md:pl-16"
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

              {/* Hero Visual — desktop: left column, mobile: between CTAs and stats */}
              <div
                className="md:col-span-2 flex items-center justify-center relative"
                style={{ minHeight: "60vh", paddingRight: "2rem", paddingTop: "2rem", paddingBottom: "2rem" }}
              >
                {/* Broadcast SVG illustration */}
                <svg
                  viewBox="0 0 360 420"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: "100%", maxWidth: "320px", opacity: ready ? 1 : 0, transition: "opacity 0.8s 0.3s" }}
                >
                  {/* Background card */}
                  <rect x="20" y="20" width="320" height="380" rx="4" fill="#0a0d0a" stroke="rgba(0,163,85,0.15)" strokeWidth="1"/>

                  {/* Top accent bar */}
                  <rect x="20" y="20" width="320" height="2" rx="0" fill="#00a355" opacity="0.7"/>

                  {/* Signal waves — concentric arcs */}
                  <g transform="translate(180, 155)" opacity="0.18">
                    <path d="M-90,0 A90,90 0 0,1 90,0" fill="none" stroke="#00a355" strokeWidth="1.5"/>
                    <path d="M-65,0 A65,65 0 0,1 65,0" fill="none" stroke="#00a355" strokeWidth="1.5"/>
                    <path d="M-40,0 A40,40 0 0,1 40,0" fill="none" stroke="#00a355" strokeWidth="1.5"/>
                  </g>

                  {/* Microphone body */}
                  <rect x="163" y="100" width="34" height="55" rx="17" fill="none" stroke="#00a355" strokeWidth="2" opacity="0.9"/>
                  {/* Mic grille lines */}
                  <line x1="163" y1="118" x2="197" y2="118" stroke="#00a355" strokeWidth="1" opacity="0.4"/>
                  <line x1="163" y1="127" x2="197" y2="127" stroke="#00a355" strokeWidth="1" opacity="0.4"/>
                  <line x1="163" y1="136" x2="197" y2="136" stroke="#00a355" strokeWidth="1" opacity="0.4"/>
                  {/* Mic stand */}
                  <path d="M148,155 Q148,175 180,175 Q212,175 212,155" fill="none" stroke="#00a355" strokeWidth="2" opacity="0.6"/>
                  <line x1="180" y1="175" x2="180" y2="195" stroke="#00a355" strokeWidth="2" opacity="0.6"/>
                  <line x1="158" y1="195" x2="202" y2="195" stroke="#00a355" strokeWidth="2" opacity="0.6"/>

                  {/* Active dot */}
                  <circle cx="180" cy="90" r="5" fill="#00a355" opacity="0.9"/>
                  <circle cx="180" cy="90" r="9" fill="none" stroke="#00a355" strokeWidth="1" opacity="0.4"/>

                  {/* Decorative grid lines */}
                  <line x1="20" y1="230" x2="340" y2="230" stroke="rgba(0,163,85,0.08)" strokeWidth="1"/>
                  <line x1="20" y1="260" x2="340" y2="260" stroke="rgba(0,163,85,0.08)" strokeWidth="1"/>
                  <line x1="20" y1="290" x2="340" y2="290" stroke="rgba(0,163,85,0.08)" strokeWidth="1"/>
                  <line x1="20" y1="320" x2="340" y2="320" stroke="rgba(0,163,85,0.08)" strokeWidth="1"/>
                  <line x1="100" y1="230" x2="100" y2="400" stroke="rgba(0,163,85,0.06)" strokeWidth="1"/>
                  <line x1="180" y1="230" x2="180" y2="400" stroke="rgba(0,163,85,0.06)" strokeWidth="1"/>
                  <line x1="260" y1="230" x2="260" y2="400" stroke="rgba(0,163,85,0.06)" strokeWidth="1"/>

                  {/* Stats grid */}
                  <rect x="40" y="245" width="120" height="60" rx="2" fill="rgba(0,163,85,0.06)" stroke="rgba(0,163,85,0.12)" strokeWidth="1"/>
                  <rect x="200" y="245" width="120" height="60" rx="2" fill="rgba(0,163,85,0.06)" stroke="rgba(0,163,85,0.12)" strokeWidth="1"/>
                  <rect x="40" y="325" width="120" height="60" rx="2" fill="rgba(0,163,85,0.06)" stroke="rgba(0,163,85,0.12)" strokeWidth="1"/>
                  <rect x="200" y="325" width="120" height="60" rx="2" fill="rgba(0,163,85,0.06)" stroke="rgba(0,163,85,0.12)" strokeWidth="1"/>

                  {/* Stat numbers */}
                  <text x="100" y="272" textAnchor="middle" fill="#00a355" fontSize="20" fontWeight="900" fontFamily="Cairo, Tajawal, sans-serif">7/24</text>
                  <text x="100" y="288" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Tajawal, sans-serif">متاح دائماً</text>
                  <text x="260" y="272" textAnchor="middle" fill="#00a355" fontSize="20" fontWeight="900" fontFamily="Cairo, Tajawal, sans-serif">100%</text>
                  <text x="260" y="288" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Tajawal, sans-serif">محتوى جزائري</text>
                  <text x="100" y="352" textAnchor="middle" fill="#00a355" fontSize="20" fontWeight="900" fontFamily="Cairo, Tajawal, sans-serif">69</text>
                  <text x="100" y="368" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Tajawal, sans-serif">ولاية</text>
                  <text x="260" y="352" textAnchor="middle" fill="#00a355" fontSize="20" fontWeight="900" fontFamily="Cairo, Tajawal, sans-serif">6</text>
                  <text x="260" y="368" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Tajawal, sans-serif">خدمات متكاملة</text>

                  {/* Corner accent */}
                  <line x1="20" y1="50" x2="50" y2="50" stroke="#00a355" strokeWidth="1.5" opacity="0.5"/>
                  <line x1="310" y1="370" x2="340" y2="370" stroke="#00a355" strokeWidth="1.5" opacity="0.5"/>
                </svg>
              </div>
            </div>

          </div>
        </section>

        {/* ══ SERVICES — Editorial Numbered List ════════════════════════ */}
        <section style={{ borderBottom: "1px solid var(--p-15)" }}>
          <div className="container mx-auto px-4 py-16">
            <div className="mb-10">
              <p style={{ color: "var(--theme-accent)", fontSize: "0.7rem", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                {c.servicesLabel}
              </p>
              <h2 className="text-2xl font-black" style={{ color: "var(--theme-text)" }}>{c.servicesTitle}</h2>
            </div>
            <div>
              {services.map((s, i) => (
                <Link
                  key={s.link}
                  to={s.link}
                  className="flex items-center gap-4 md:gap-6 transition-all duration-200"
                  style={{
                    textDecoration: "none",
                    padding: "1.1rem 0.5rem",
                    borderBottom: i < services.length - 1 ? "1px solid var(--p-10)" : "none",
                    borderRight: "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderRightColor = "var(--theme-accent, #00a355)";
                    el.style.background = "var(--p-04)";
                    el.style.paddingRight = "1rem";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderRightColor = "transparent";
                    el.style.background = "transparent";
                    el.style.paddingRight = "0.5rem";
                  }}
                >
                  <span
                    className="hidden sm:block flex-shrink-0 font-black"
                    style={{
                      fontSize: "1.8rem",
                      color: "var(--theme-accent, #00a355)",
                      opacity: 0.18,
                      width: "60px",
                      textAlign: "center",
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    0{i + 1}
                  </span>
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--p-20)",
                    }}
                  >
                    <s.icon size={17} style={{ color: "var(--theme-accent, #00a355)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ fontWeight: 700, color: "var(--theme-text, #e8f5e9)", fontSize: "0.95rem", marginBottom: "0.2rem" }}>
                      {s.title}
                    </h3>
                    <p className="hidden sm:block" style={{ color: "var(--theme-text-muted, #6aad6a)", fontSize: "0.78rem", lineHeight: 1.5 }}>
                      {s.desc}
                    </p>
                  </div>
                  <ArrowLeft size={15} style={{ color: "var(--theme-text-dim, #3a5e3a)", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURED COURSES ══════════════════════════════════════════ */}
        {featuredCourses.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-16">
              <SectionHeader title="دورات مميزة" link="/courses" linkLabel="كل الدورات" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--p-10)" }}>
                {featuredCourses.slice(0, 3).map((course, i) => (
                  <EditorialCard key={course.id} to={`/courses/${course.id}`} delay={`${i * 0.09}s`}>
                    {course.image && (
                      <div style={{ height: "170px", overflow: "hidden" }}>
                        <img src={course.image} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }} />
                      </div>
                    )}
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

        {/* ══ FEATURED JOBS ═════════════════════════════════════════════ */}
        {featuredJobs.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-16">
              <SectionHeader title="فرص عمل مميزة" link="/jobs" linkLabel="كل الفرص" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--p-10)" }}>
                {featuredJobs.map((job, i) => (
                  <EditorialCard key={job.id} to={`/jobs/${job.id}`} delay={`${i * 0.09}s`}>
                    {job.image && <div style={{ height: "150px", overflow: "hidden" }}><img src={job.image} alt={job.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold" style={{ color: "var(--theme-text)", fontSize: "0.95rem" }}>{job.title}</h3>
                        {job.jobType && <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", background: "var(--p-15)", color: "var(--theme-accent)", flexShrink: 0 }}>{job.jobType}</span>}
                      </div>
                      <p style={{ color: "var(--theme-text-secondary)", fontSize: "0.83rem" }}>{job.company}</p>
                      {job.location && <p style={{ color: "var(--theme-text-dim)", fontSize: "0.75rem", marginTop: "0.3rem" }}>{job.location}</p>}
                    </div>
                  </EditorialCard>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ FEATURED EQUIPMENT ════════════════════════════════════════ */}
        {featuredEquipment.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-16">
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

        {/* ══ UPCOMING COMPETITIONS ════════════════════════════════════ */}
        {upcomingComps.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-16">
              <SectionHeader title="مسابقات قادمة" link="/competitions" linkLabel="كل المسابقات" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--p-10)" }}>
                {upcomingComps.map((comp, i) => (
                  <EditorialCard key={comp.id} to={`/competitions/${comp.id}`} delay={`${i * 0.09}s`}>
                    {comp.image && <div style={{ height: "140px", overflow: "hidden" }}><img src={comp.image} alt={comp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold" style={{ color: "var(--theme-text)", fontSize: "0.95rem" }}>{comp.name}</h3>
                        {comp.type && (
                          <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", flexShrink: 0, background: comp.type === "international" ? "rgba(122,56,0,0.3)" : comp.type === "university" ? "rgba(26,79,122,0.3)" : "var(--p-15)", color: comp.type === "international" ? "#fb923c" : comp.type === "university" ? "#64b5f6" : "var(--theme-accent)" }}>
                            {comp.type === "university" ? "جامعي" : comp.type === "national" ? "وطني" : "دولي"}
                          </span>
                        )}
                      </div>
                      {comp.organizer && <p style={{ color: "var(--theme-text-secondary)", fontSize: "0.82rem" }}>{comp.organizer}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        <Zap size={12} style={{ color: "var(--theme-accent)" }} />
                        <span style={{ color: "var(--theme-text-dim)", fontSize: "0.72rem" }}>{comp.startDate}</span>
                      </div>
                    </div>
                  </EditorialCard>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ FEATURED VOICE ARTISTS ════════════════════════════════════ */}
        {featuredVoice.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-16">
              <SectionHeader title="منشطون مميزون" link="/voice-requests" linkLabel="كل المنشطين" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--p-10)" }}>
                {featuredVoice.map((v, i) => (
                  <div
                    key={v.id}
                    className="p-5 animate-fade-in-up"
                    style={{ background: "#0a0d0a", borderTop: "2px solid var(--p-20)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.09}s` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div style={{ width: "44px", height: "44px", flexShrink: 0, overflow: "hidden", background: "var(--p-12)", border: "1px solid var(--p-20)" }}>
                        {v.photoUrl
                          ? <img src={v.photoUrl} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--theme-accent)" }}>{v.name?.[0]}</div>}
                      </div>
                      <div>
                        <h3 className="font-bold" style={{ color: "var(--theme-text)", fontSize: "0.9rem" }}>{v.name}</h3>
                        {v.specialty && <p style={{ color: "var(--theme-accent)", fontSize: "0.72rem" }}>{v.specialty}</p>}
                      </div>
                    </div>
                    {v.description && <p style={{ color: "var(--theme-text-dim)", fontSize: "0.78rem", lineHeight: 1.65 }}>{v.description.slice(0, 90)}{v.description.length > 90 ? "…" : ""}</p>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ LATEST NEWS ═══════════════════════════════════════════════ */}
        {latestNews.length > 0 && (
          <section style={{ borderBottom: "1px solid var(--p-15)" }}>
            <div className="container mx-auto px-4 py-16">
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

          <div className="container mx-auto px-4 py-20">
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
