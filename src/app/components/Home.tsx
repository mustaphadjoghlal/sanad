import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Briefcase, Package, Trophy, Mic2, Tv2, ArrowLeft, Star, Users, Zap, Newspaper, ShoppingBag } from "lucide-react";
import { subscribeToFeatured, subscribeToCollection, subscribeToSiteContent, getLatestNews, getLatestProducts } from "../../lib/firestore";
import type { Course, Job, Equipment, Competition, UserProfile, VoiceArtist, SiteContent, NewsItem, Product } from "../../lib/types";
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

/* ── Section header ── */
function SectionHeader({ num, title, link, linkLabel }: { num: string; title: string; link: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div className="flex items-center gap-4">
        <span className="text-5xl font-black select-none" style={{ color: "var(--p-15)", lineHeight: 1 }}>{num}</span>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>{title}</h2>
          <div className="h-0.5 mt-1 rounded-full" style={{ width: "3rem", background: "var(--theme-accent, #00a355)" }} />
        </div>
      </div>
      <Link to={link} className="flex items-center gap-1 text-sm transition-colors" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}>
        {linkLabel} <ArrowLeft size={14} />
      </Link>
    </div>
  );
}

const services = [
  { icon: BookOpen,  title: "الدورات التدريبية",  desc: "برامج تدريبية احترافية في مجال الإعلام والصحافة والإنتاج",   link: "/courses",       delay: "0.05s" },
  { icon: Briefcase,   title: "عروض التوظيف",         desc: "فرص عمل إعلامية وصحفية في جميع أنحاء الجزائر",      link: "/jobs",           delay: "0.10s" },
  { icon: Package,     title: "عتاد إعلامي",          desc: "معدات تصوير وصوت وبث من أفضل الموردين",              link: "/equipment",      delay: "0.15s" },
  { icon: Trophy,      title: "المسابقات",            desc: "مسابقات إعلامية محلية ودولية للمحترفين والطلاب",      link: "/competitions",   delay: "0.20s" },
  { icon: Mic2,        title: "طلبات المنشطين",       desc: "ابحث عن منشطين محترفين أو قدّم نفسك للفرص المتاحة",   link: "/voice-requests", delay: "0.25s" },
  { icon: Tv2,         title: "دليل القنوات",         desc: "دليل شامل للقنوات الجزائرية التلفزيونية والإذاعية",    link: "/channels",       delay: "0.30s" },
];

/* ── Rotating section ── */
const ROTATE_INTERVAL = 5000;
const PANELS = [
  { key: "products", label: "سوق المعدات",  icon: ShoppingBag, link: "/stores",  linkLabel: "تصفح المتاجر" },
  { key: "news",     label: "آخر الأخبار", icon: Newspaper,   link: "/news",    linkLabel: "كل الأخبار" },
  { key: "jobs",     label: "فرص توظيف",   icon: Briefcase,   link: "/jobs",    linkLabel: "كل الفرص" },
] as const;
type PanelKey = typeof PANELS[number]["key"];

function RotatingSection({ products, news, jobs }: { products: Product[]; news: NewsItem[]; jobs: Job[] }) {
  const [active, setActive] = useState<PanelKey>("products");
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotateRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimers = (current: PanelKey) => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (rotateRef.current)   clearInterval(rotateRef.current);
    setProgress(0);
    const tick = 50;
    let elapsed = 0;
    progressRef.current = setInterval(() => {
      elapsed += tick;
      setProgress(Math.min((elapsed / ROTATE_INTERVAL) * 100, 100));
    }, tick);
    rotateRef.current = setInterval(() => {
      setActive((prev) => {
        const idx = PANELS.findIndex((p) => p.key === prev);
        return PANELS[(idx + 1) % PANELS.length].key;
      });
    }, ROTATE_INTERVAL);
  };

  useEffect(() => {
    startTimers(active);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (rotateRef.current)   clearInterval(rotateRef.current);
    };
  }, []);

  useEffect(() => { startTimers(active); }, [active]);

  const panel = PANELS.find((p) => p.key === active)!;

  const handleTab = (key: PanelKey) => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (rotateRef.current)   clearInterval(rotateRef.current);
    setActive(key);
  };

  return (
    <section className="py-20" style={{ borderTop: "1px solid var(--p-15)" }}>
      <div className="container mx-auto px-4">
        {/* Header with tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {PANELS.map((p) => (
              <button
                key={p.key}
                onClick={() => handleTab(p.key)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: active === p.key ? "var(--theme-accent, #00a355)" : "var(--p-10)",
                  color:      active === p.key ? "#fff" : "var(--theme-text-muted)",
                  border:     `1px solid ${active === p.key ? "var(--theme-accent)" : "var(--p-20)"}`,
                  cursor: "pointer",
                }}
              >
                <p.icon size={13} />
                {p.label}
              </button>
            ))}
          </div>
          <Link
            to={panel.link}
            className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}
          >
            {panel.linkLabel} <ArrowLeft size={14} />
          </Link>
        </div>

        {/* Progress bar */}
        <div style={{ height: "2px", background: "var(--p-15)", borderRadius: "9999px", marginBottom: "1.5rem", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--theme-accent, #00a355)",
              transition: "width 0.05s linear",
              borderRadius: "9999px",
            }}
          />
        </div>

        {/* Content panels */}
        {active === "products" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length === 0 ? (
              <p style={{ color: "var(--theme-text-dim)", gridColumn: "1/-1", textAlign: "center", padding: "2rem 0" }}>لا توجد منتجات حالياً</p>
            ) : products.map((prod, i) => (
              <Link key={prod.id} to={`/products/${prod.id}`} className="card-glow rounded-2xl overflow-hidden animate-fade-in-up block"
                style={{ textDecoration: "none", background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.08}s` }}>
                {prod.image ? (
                  <div style={{ height: "160px", overflow: "hidden" }}>
                    <img src={prod.image} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", background: "var(--p-08)" }}>📷</div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1 truncate" style={{ color: "var(--theme-text)" }}>{prod.name}</h3>
                  <p className="text-sm font-semibold" style={{ color: "var(--theme-accent)" }}>{prod.price.toLocaleString("ar-DZ")} دج</p>
                  <span className="text-xs px-2 py-0.5 rounded-full mt-2 inline-block" style={{ background: "var(--p-10)", color: "var(--theme-text-muted)" }}>{prod.category}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {active === "news" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.length === 0 ? (
              <p style={{ color: "var(--theme-text-dim)", gridColumn: "1/-1", textAlign: "center", padding: "2rem 0" }}>لا توجد أخبار حالياً</p>
            ) : news.map((item, i) => (
              <Link key={item.id} to={`/news/${item.id}`} className="card-glow p-5 rounded-2xl animate-fade-in-up block"
                style={{ textDecoration: "none", background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.08}s` }}>
                {item.image && (
                  <div style={{ height: "150px", overflow: "hidden", borderRadius: "0.75rem", marginBottom: "0.75rem" }}>
                    <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper size={13} style={{ color: "var(--theme-accent)" }} />
                  <span className="text-xs" style={{ color: "var(--theme-text-dim)" }}>{item.date}</span>
                </div>
                <h3 className="font-bold text-base mb-2 line-clamp-2" style={{ color: "var(--theme-text)" }}>{item.title}</h3>
                <p className="text-sm line-clamp-2" style={{ color: "var(--theme-text-muted)" }}>{item.body}</p>
              </Link>
            ))}
          </div>
        )}

        {active === "jobs" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.length === 0 ? (
              <p style={{ color: "var(--theme-text-dim)", gridColumn: "1/-1", textAlign: "center", padding: "2rem 0" }}>لا توجد فرص عمل حالياً</p>
            ) : jobs.map((job, i) => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="card-glow rounded-2xl overflow-hidden animate-fade-in-up block"
                style={{ textDecoration: "none", background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.08}s` }}>
                {job.image && (
                  <div style={{ height: "160px", overflow: "hidden" }}>
                    <img src={job.image} alt={job.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-base" style={{ color: "var(--theme-text)" }}>{job.title}</h3>
                    {job.jobType && <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--p-15)", color: "var(--theme-accent)" }}>{job.jobType}</span>}
                  </div>
                  <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>{job.company}</p>
                  {job.location && <p className="text-xs mt-1" style={{ color: "var(--theme-text-dim)" }}>{job.location}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [featuredCourses,    setFeaturedCourses]    = useState<Course[]>([]);
  const [featuredProfiles,   setFeaturedProfiles]   = useState<UserProfile[]>([]);
  const [featuredJobs,       setFeaturedJobs]       = useState<Job[]>([]);
  const [featuredEquipment,  setFeaturedEquipment]  = useState<Equipment[]>([]);
  const [featuredVoice,      setFeaturedVoice]      = useState<VoiceArtist[]>([]);
  const [upcomingComps,      setUpcomingComps]      = useState<Competition[]>([]);
  const [latestNews,         setLatestNews]         = useState<NewsItem[]>([]);
  const [latestProducts,     setLatestProducts]     = useState<Product[]>([]);
  const [content, setContent] = useState<SiteContent | null>(() => {
    try {
      const cached = localStorage.getItem("sanad_site_content");
      if (cached) return JSON.parse(cached) as SiteContent;
    } catch {}
    return null;
  });

  useEffect(() => {
    const unsubs = [
      subscribeToFeatured<Course>("courses",       setFeaturedCourses),
      subscribeToFeatured<UserProfile>("users",    setFeaturedProfiles),
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
    getLatestProducts(3).then(setLatestProducts);
    return () => unsubs.forEach((u) => u());
  }, []);

  const c = content ?? DEFAULT_SITE_CONTENT;
  const contentReady = content !== null;

  return (
    <div style={{ background: "var(--theme-bg-main, #0e0e0e)", minHeight: "100vh" }}>

      {/* ══ HERO ═════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}>

        {/* Grid */}
        <div className="absolute inset-0 bg-grid-pattern" style={{ opacity: 0.35 }} />

        {/* Glow top */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -5%, var(--p-25) 0%, transparent 60%)" }} />

        {/* Glow blobs */}
        <div className="absolute w-96 h-96 rounded-full" style={{ top: "10%", left: "5%", background: "radial-gradient(circle, var(--theme-accent), transparent 70%)", filter: "blur(80px)", opacity: 0.07 }} />
        <div className="absolute w-96 h-96 rounded-full" style={{ bottom: "10%", right: "5%", background: "radial-gradient(circle, var(--theme-primary), transparent 70%)", filter: "blur(80px)", opacity: 0.07 }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center" style={{ opacity: contentReady ? 1 : 0, transition: "opacity 0.4s ease" }}>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 animate-fade-in" style={{ background: "var(--p-12)", border: "1px solid var(--p-30)", opacity: 0, animationFillMode: "forwards" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--theme-accent)" }} />
              <span className="text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>{c.heroBadge}</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-black mb-4 animate-fade-in-up delay-100" style={{ color: "var(--theme-text, #e8f5e9)", lineHeight: 1.1, opacity: 0, animationFillMode: "forwards" }}>
              {c.heroTitle}{" "}
              <span className="text-shimmer">{c.siteName}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl mb-4 animate-fade-in-up delay-200" style={{ color: "var(--theme-text-secondary, #a5d6a7)", opacity: 0, animationFillMode: "forwards" }}>
              {c.heroSubtitle}
            </p>

            {/* Description */}
            <p className="text-base md:text-lg mb-10 animate-fade-in-up delay-300" style={{ color: "var(--theme-text-muted, #6aad6a)", maxWidth: "600px", margin: "0 auto 2.5rem", opacity: 0, animationFillMode: "forwards" }}>
              {c.heroDescription}
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-400" style={{ opacity: 0, animationFillMode: "forwards" }}>
              <Link to="/courses" className="btn-dz px-8 py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2" style={{ textDecoration: "none" }}>
                <span>{c.heroCta1}</span>
                <ArrowLeft size={20} />
              </Link>
              <Link to="/register" className="px-8 py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300" style={{ border: "1px solid var(--p-35)", color: "var(--theme-badge-text, #81c784)", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-12)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <Users size={20} />
                {c.heroCta2}
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto mt-16 animate-fade-in delay-500" style={{ opacity: 0, animationFillMode: "forwards" }}>
            {[
              { value: 6,   suffix: "",    label: "خدمات متكاملة" },
              { value: 69,  suffix: "",    label: "ولاية جزائرية" },
              { value: 100, suffix: "%",   label: "محتوى جزائري" },
              { value: 7,   suffix: "/24", label: "متاح دائماً" },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 rounded-2xl" style={{ background: "var(--p-08)", border: "1px solid var(--p-20)" }}>
                <div className="text-2xl font-black" style={{ color: "var(--theme-accent)" }}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--theme-text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICES ═════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ borderTop: "1px solid var(--p-15)" }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p style={{ color: "var(--theme-accent)", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{c.servicesLabel}</p>
            <h2 className="text-3xl font-bold" style={{ color: "var(--theme-text)" }}>{c.servicesTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <Link
                key={s.link}
                to={s.link}
                className="card-glow group p-6 rounded-2xl flex flex-col gap-3 animate-fade-in-up"
                style={{ textDecoration: "none", background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: s.delay }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--p-15)" }}>
                  <s.icon size={22} style={{ color: "var(--theme-accent)" }} />
                </div>
                <h3 className="font-bold text-lg" style={{ color: "var(--theme-text)" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>{s.desc}</p>
                <div className="flex items-center gap-1 text-sm mt-auto" style={{ color: "var(--theme-accent)" }}>
                  <span>اكتشف</span> <ArrowLeft size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED COURSES ════════════════════════════════════════════ */}
      {featuredCourses.length > 0 && (
        <section className="py-20" style={{ borderTop: "1px solid var(--p-15)" }}>
          <div className="container mx-auto px-4">
            <SectionHeader num="01" title="دورات مميزة" link="/courses" linkLabel="كل الدورات" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.slice(0, 3).map((course, i) => (
                <Link key={course.id} to={`/courses/${course.id}`}
                  className="card-glow group rounded-2xl overflow-hidden animate-fade-in-up"
                  style={{ textDecoration: "none", background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.1}s` }}>
                  {course.image && (
                    <div style={{ height: "180px", overflow: "hidden" }}>
                      <img src={course.image} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"} />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-base mb-2" style={{ color: "var(--theme-text)" }}>{course.title}</h3>
                    {course.instructor && <p className="text-xs" style={{ color: "var(--theme-text-dim)" }}>{course.instructor}</p>}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: course.type === "free" ? "var(--p-15)" : "rgba(26,82,118,0.3)", color: course.type === "free" ? "var(--theme-accent)" : "#64b5f6" }}>
                        {course.type === "free" ? "مجانية" : `${course.price?.toLocaleString()} دج`}
                      </span>
                      {course.duration && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--p-10)", color: "var(--theme-text-muted)" }}>{course.duration}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED PROFESSIONALS ══════════════════════════════════════ */}
      {featuredProfiles.length > 0 && (
        <section className="py-20" style={{ borderTop: "1px solid var(--p-15)" }}>
          <div className="container mx-auto px-4">
            <SectionHeader num="02" title="محترفون مميزون" link="/professionals" linkLabel="كل المحترفين" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProfiles.slice(0, 3).map((p, i) => (
                <div key={p.id} className="card-glow p-5 rounded-2xl flex gap-4 items-start animate-fade-in-up"
                  style={{ background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.1}s` }}>
                  <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0" style={{ background: "var(--p-15)" }}>
                    {p.photo
                      ? <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: "var(--theme-accent)" }}>{p.name?.[0]}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base" style={{ color: "var(--theme-text)" }}>{p.name}</h3>
                    {p.specialty && <p className="text-xs mt-0.5" style={{ color: "var(--theme-accent)" }}>{p.specialty}</p>}
                    {p.location && <p className="text-xs mt-1" style={{ color: "var(--theme-text-dim)" }}>{p.location}</p>}
                    {p.bio && <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--theme-text-muted)", lineHeight: 1.5 }}>{p.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED JOBS ═══════════════════════════════════════════════ */}
      {featuredJobs.length > 0 && (
        <section className="py-20" style={{ borderTop: "1px solid var(--p-15)" }}>
          <div className="container mx-auto px-4">
            <SectionHeader num="03" title="فرص عمل مميزة" link="/jobs" linkLabel="كل الفرص" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job, i) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="card-glow rounded-2xl overflow-hidden animate-fade-in-up block"
                  style={{ textDecoration: "none", background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.1}s` }}>
                  {job.image && (
                    <div style={{ height: "160px", overflow: "hidden" }}>
                      <img src={job.image} alt={job.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-base" style={{ color: "var(--theme-text)" }}>{job.title}</h3>
                      {job.jobType && <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--p-15)", color: "var(--theme-accent)" }}>{job.jobType}</span>}
                    </div>
                    <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>{job.company}</p>
                    {job.location && <p className="text-xs mt-1" style={{ color: "var(--theme-text-dim)" }}>{job.location}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED EQUIPMENT ══════════════════════════════════════════ */}
      {featuredEquipment.length > 0 && (
        <section className="py-20" style={{ borderTop: "1px solid var(--p-15)" }}>
          <div className="container mx-auto px-4">
            <SectionHeader num="04" title="عتاد مميز" link="/equipment" linkLabel="كل العتاد" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEquipment.map((eq, i) => (
                <Link key={eq.id} to={`/equipment/${eq.id}`} className="card-glow rounded-2xl overflow-hidden animate-fade-in-up block"
                  style={{ textDecoration: "none", background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.1}s` }}>
                  {eq.image && (
                    <div style={{ height: "160px", overflow: "hidden" }}>
                      <img src={eq.image} alt={eq.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-sm" style={{ color: "var(--theme-text)" }}>{eq.name}</h3>
                    {eq.category && <p className="text-xs mt-1" style={{ color: "var(--theme-accent)" }}>{eq.category}</p>}
                    <p className="text-xs mt-0.5" style={{ color: "var(--theme-text-dim)" }}>{eq.price?.toLocaleString()} دج</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ UPCOMING COMPETITIONS ═══════════════════════════════════════ */}
      {upcomingComps.length > 0 && (
        <section className="py-20" style={{ borderTop: "1px solid var(--p-15)" }}>
          <div className="container mx-auto px-4">
            <SectionHeader num="05" title="مسابقات قادمة" link="/competitions" linkLabel="كل المسابقات" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingComps.map((comp, i) => {
                const typeBg: Record<string,string>  = { university: "#1a4f7a", national: "#1b5e35", international: "#7a3800" };
                const typeClr: Record<string,string> = { university: "#ffffff", national: "#ffffff", international: "#ffffff" };
                return (
                  <Link key={comp.id} to={`/competitions/${comp.id}`} className="card-glow rounded-2xl overflow-hidden animate-fade-in-up block"
                    style={{ textDecoration: "none", background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.1}s` }}>
                    {comp.image && (
                      <div style={{ height: "150px", overflow: "hidden" }}>
                        <img src={comp.image} alt={comp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-bold text-base" style={{ color: "var(--theme-text)" }}>{comp.name}</h3>
                        {comp.type && (
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: typeBg[comp.type] ?? "#1b5e35", color: typeClr[comp.type] ?? "#ffffff" }}>
                            {comp.type === "university" ? "جامعي" : comp.type === "national" ? "وطني" : "دولي"}
                          </span>
                        )}
                      </div>
                      {comp.organizer && <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>{comp.organizer}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        <Zap size={13} style={{ color: "var(--theme-accent)" }} />
                        <span className="text-xs" style={{ color: "var(--theme-text-dim)" }}>{comp.startDate}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED VOICE ARTISTS ══════════════════════════════════════ */}
      {featuredVoice.length > 0 && (
        <section className="py-20" style={{ borderTop: "1px solid var(--p-15)" }}>
          <div className="container mx-auto px-4">
            <SectionHeader num="06" title="منشطون مميزون" link="/voice-requests" linkLabel="كل المنشطين" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVoice.map((v, i) => (
                <div key={v.id} className="card-glow p-5 rounded-2xl animate-fade-in-up"
                  style={{ background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ background: "var(--p-15)" }}>
                      {v.photoUrl
                        ? <img src={v.photoUrl} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div className="w-full h-full flex items-center justify-center font-bold" style={{ color: "var(--theme-accent)" }}>{v.name?.[0]}</div>}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm" style={{ color: "var(--theme-text)" }}>{v.name}</h3>
                      {v.specialty && <p className="text-xs" style={{ color: "var(--theme-accent)" }}>{v.specialty}</p>}
                    </div>
                  </div>
                  {v.description && <p style={{ color: "var(--theme-text-dim)", fontSize: "0.78rem", lineHeight: 1.6, marginTop: "0.4rem" }}>{v.description.slice(0, 80)}{v.description.length > 80 ? "…" : ""}</p>}
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {v.languages?.slice(0, 3).map(l => (
                      <span key={l} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--p-12)", color: "var(--theme-text-secondary)" }}>{l}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ LATEST NEWS ═════════════════════════════════════════════════ */}
      {latestNews.length > 0 && (
        <section className="py-20" style={{ borderTop: "1px solid var(--p-15)" }}>
          <div className="container mx-auto px-4">
            <SectionHeader num="07" title="آخر الأخبار" link="/news" linkLabel="كل الأخبار" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestNews.map((item, i) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="card-glow p-5 rounded-2xl animate-fade-in-up block"
                  style={{ textDecoration: "none", background: "linear-gradient(145deg,#141414,#101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.1}s` }}
                >
                  {item.image && (
                    <div style={{ height: "150px", overflow: "hidden", borderRadius: "0.75rem", marginBottom: "0.75rem" }}>
                      <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper size={13} style={{ color: "var(--theme-accent)" }} />
                    <span className="text-xs" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>{item.date}</span>
                  </div>
                  <h3 className="font-bold text-base mb-2 line-clamp-2" style={{ color: "var(--theme-text)" }}>{item.title}</h3>
                  <p className="text-sm line-clamp-2" style={{ color: "var(--theme-text-muted)" }}>{item.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ ROTATING SECTION ════════════════════════════════════════════ */}
      <RotatingSection products={latestProducts} news={latestNews} jobs={featuredJobs} />

      {/* ══ CTA ══════════════════════════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden" style={{ borderTop: "1px solid var(--p-15)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, var(--p-12) 0%, transparent 70%)" }} />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 animate-float" style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-accent))", boxShadow: "0 0 32px var(--p-40)" }}>
            <Star size={28} color="#fff" />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--theme-text)" }}>{c.ctaTitle}</h2>
          <p className="mb-8" style={{ color: "var(--theme-text-muted)" }}>{c.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-dz px-8 py-3 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ textDecoration: "none" }}>
              <span>{c.ctaButton}</span>
              <ArrowLeft size={18} />
            </Link>
            <Link to="/courses" className="px-8 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300" style={{ border: "1px solid var(--p-35)", color: "var(--theme-badge-text, #81c784)", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--p-12)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {c.ctaButton2}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
