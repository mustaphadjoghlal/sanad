import { Link } from "react-router-dom";
import { BookOpen, ShoppingCart, Briefcase, Trophy, Mic, ArrowLeft, MapPin, Calendar, Camera, Radio, Users, Star } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { subscribeToFeatured, subscribeToCollection, subscribeToSiteContent } from "../../lib/firestore";
import type { Course, Job, Equipment, Competition, UserProfile, VoiceArtist, SiteContent } from "../../lib/types";
import { DEFAULT_SITE_CONTENT } from "../../lib/types";

const services = [
  { icon: BookOpen,    title: "الدورات التدريبية",    desc: "دورات مجانية ومدفوعة في جميع مجالات الإعلام",       link: "/courses",        delay: "0.05s" },
  { icon: Briefcase,   title: "عروض التوظيف",         desc: "فرص عمل إعلامية وصحفية في جميع أنحاء الجزائر",      link: "/jobs",           delay: "0.10s" },
  { icon: ShoppingCart,title: "متجر العتاد",          desc: "بيع وشراء معدات الإعلام الاحترافية",                link: "/equipment",      delay: "0.15s" },
  { icon: Trophy,      title: "المسابقات الإعلامية",  desc: "مواعيد المسابقات الجامعية والوطنية والدولية",        link: "/competitions",   delay: "0.20s" },
  { icon: Mic,         title: "المنشطون والمعلقون",   desc: "ابحث عن منشطين ومعلقين صوتيين محترفين لمشاريعك",    link: "/voice-requests", delay: "0.25s" },
  { icon: Radio,       title: "القنوات الإعلامية",    desc: "دليل شامل للقنوات التلفزيونية والإذاعية الجزائرية", link: "/channels",       delay: "0.30s" },
];

const typeLabel: Record<string, string> = {
  journalist: "صحفي", voice: "منشط صوتي", vendor: "بائع عتاد",
};

/* ── Animated counter ── */
function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
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
          <div className="h-0.5 w-16 mt-1.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--theme-accent), transparent)" }} />
        </div>
      </div>
      <Link
        to={link}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
        style={{ color: "var(--theme-text-muted)", border: "1px solid var(--p-20)", textDecoration: "none" }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--theme-accent)"; el.style.borderColor = "var(--p-40)"; el.style.background = "var(--p-08)"; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "var(--theme-text-muted)"; el.style.borderColor = "var(--p-20)"; el.style.background = ""; }}
      >
        <span>{linkLabel}</span>
        <ArrowLeft size={13} />
      </Link>
    </div>
  );
}

export default function Home() {
  const [featuredCourses,    setFeaturedCourses]    = useState<Course[]>([]);
  const [featuredProfiles,   setFeaturedProfiles]   = useState<UserProfile[]>([]);
  const [featuredJobs,       setFeaturedJobs]       = useState<Job[]>([]);
  const [featuredEquipment,  setFeaturedEquipment]  = useState<Equipment[]>([]);
  const [featuredVoice,      setFeaturedVoice]      = useState<VoiceArtist[]>([]);
  const [upcomingComps,      setUpcomingComps]      = useState<Competition[]>([]);
  const [content,            setContent]            = useState<SiteContent>(DEFAULT_SITE_CONTENT);

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
      subscribeToSiteContent(setContent),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <div style={{ background: "var(--theme-bg-main, #0e0e0e)", minHeight: "100vh" }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}>

        {/* Grid */}
        <div className="absolute inset-0 bg-grid-pattern" style={{ opacity: 0.35 }} />

        {/* Glow top */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -5%, var(--p-25) 0%, transparent 60%)" }} />

        {/* Glow blobs */}
        <div className="absolute w-96 h-96 rounded-full" style={{ top: "10%", left: "5%", background: "radial-gradient(circle, var(--theme-accent), transparent 70%)", filter: "blur(80px)", opacity: 0.07 }} />
        <div className="absolute w-72 h-72 rounded-full" style={{ bottom: "15%", right: "8%", background: "radial-gradient(circle, var(--theme-primary), transparent 70%)", filter: "blur(60px)", opacity: 0.09 }} />

        {/* Floating icons */}
        {[
          { icon: Camera,   top: "18%", left:  "8%",  size: 22, delay: "0s",    dur: "6s"  },
          { icon: Mic,      top: "60%", left:  "5%",  size: 18, delay: "1s",    dur: "7s"  },
          { icon: Radio,    top: "25%", right: "7%",  size: 20, delay: "0.5s",  dur: "8s"  },
          { icon: Trophy,   top: "65%", right: "9%",  size: 16, delay: "1.5s",  dur: "6.5s"},
          { icon: BookOpen, top: "40%", left:  "3%",  size: 16, delay: "2s",    dur: "7.5s"},
          { icon: Star,     top: "12%", right: "15%", size: 14, delay: "0.8s",  dur: "9s"  },
        ].map(({ icon: Icon, top, left, right, size, delay, dur }, i) => (
          <div
            key={i}
            className="absolute hidden lg:flex items-center justify-center rounded-xl animate-float"
            style={{
              top, left, right,
              width: size * 2 + 16, height: size * 2 + 16,
              background: "var(--p-10)", border: "1px solid var(--p-20)",
              animationDelay: delay, animationDuration: dur,
              backdropFilter: "blur(4px)",
            }}
          >
            <Icon size={size} style={{ color: "var(--theme-accent)" }} />
          </div>
        ))}

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10 animate-fade-in"
            style={{ border: "1px solid var(--p-30)", background: "var(--p-08)", color: "var(--theme-accent)", fontSize: "0.78rem" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--theme-accent)" }} />
            {content.heroBadge}
          </div>

          {/* Heading */}
          <h1
            className="font-black mb-6 animate-fade-in-up"
            style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)", lineHeight: 1.1, color: "var(--theme-text, #e8f5e9)", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
          >
            {content.heroTitle}{" "}
            <span className="text-shimmer">{content.siteName}</span>
            <br />
            <span style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)", fontWeight: 400, color: "var(--theme-text-secondary)" }}>
              {content.heroSubtitle}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="max-w-xl mx-auto mb-10 animate-fade-in-up"
            style={{ fontSize: "1.05rem", color: "var(--theme-text-secondary)", lineHeight: 1.8, animationDelay: "0.22s", opacity: 0, animationFillMode: "forwards" }}
          >
            {content.heroDescription}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: "0.35s", opacity: 0, animationFillMode: "forwards" }}>
            <Link to="/courses" className="btn-dz inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-base" style={{ textDecoration: "none" }}>
              <span>{content.heroCta1}</span>
              <ArrowLeft size={18} />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200"
              style={{ border: "1px solid var(--p-40)", color: "var(--theme-badge-text)", background: "transparent", textDecoration: "none" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--p-12)"; el.style.borderColor = "var(--p-60)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = "var(--p-40)"; }}
            >
              <Users size={17} />
              {content.heroCta2}
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="mt-16 animate-bounce" style={{ color: "var(--p-30)", fontSize: "1.5rem" }}>↓</div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--p-40), transparent)" }} />
      </section>

      {/* ══ QUICK STATS ════════════════════════════════════════════════════ */}
      <section className="py-10 px-4" style={{ background: "var(--p-05)", borderBottom: "1px solid var(--p-15)" }}>
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { target: 6,   suffix: "",   label: "خدمات متكاملة",  icon: Star },
              { target: 58,  suffix: "",   label: "ولاية جزائرية",  icon: MapPin },
              { target: 100, suffix: "٪",  label: "محتوى جزائري",   icon: Radio },
              { target: 24,  suffix: "/٧", label: "متاح دائماً",    icon: Calendar },
            ].map((s, i) => (
              <div
                key={i}
                className="py-5 px-4 rounded-xl animate-fade-in-up"
                style={{ background: "var(--p-08)", border: "1px solid var(--p-20)", animationDelay: `${i * 0.08}s`, opacity: 0, animationFillMode: "forwards" }}
              >
                <div className="text-3xl font-black mb-1" style={{ color: "var(--theme-accent)" }}>
                  <AnimatedCount target={s.target} suffix={s.suffix} />
                </div>
                <div style={{ color: "var(--theme-text-muted)", fontSize: "0.82rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICES GRID ══════════════════════════════════════════════════ */}
      <section className="py-20 px-4" style={{ borderBottom: "1px solid var(--p-10)" }}>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p style={{ color: "var(--theme-accent)", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{content.servicesLabel}</p>
            <h2 className="text-3xl font-bold" style={{ color: "var(--theme-text)" }}>{content.servicesTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.link}
                  to={s.link}
                  className="group card-glow rounded-2xl p-6 animate-fade-in-up"
                  style={{ textDecoration: "none", animationDelay: s.delay, opacity: 0, animationFillMode: "forwards", display: "block" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ background: "var(--p-20)", border: "1px solid var(--p-35)" }}
                  >
                    <Icon size={22} style={{ color: "var(--theme-accent)" }} />
                  </div>
                  <h3 className="font-bold mb-2 group-hover:text-theme-accent transition-colors" style={{ color: "var(--theme-text)", fontSize: "1rem" }}>{s.title}</h3>
                  <p style={{ color: "var(--theme-text-muted)", fontSize: "0.84rem", lineHeight: 1.7 }}>{s.desc}</p>
                  <div className="flex items-center gap-1 mt-4 transition-all duration-200 group-hover:gap-2" style={{ color: "var(--theme-accent)", fontSize: "0.78rem" }}>
                    <span>اكتشف المزيد</span>
                    <ArrowLeft size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ FEATURED COURSES ═══════════════════════════════════════════════ */}
      {featuredCourses.length > 0 && (
        <section className="py-16 px-4" style={{ borderBottom: "1px solid var(--p-10)" }}>
          <div className="container mx-auto">
            <SectionHeader num="01" title="الدورات المميزة" link="/courses" linkLabel="عرض الكل" />
            <div className="flex gap-5 overflow-x-auto pb-3" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--p-25) transparent" }}>
              {featuredCourses.map((c, i) => (
                <Link
                  key={c.id} to={`/courses/${c.id}`}
                  className="card-glow rounded-2xl flex-shrink-0 overflow-hidden animate-fade-in-up"
                  style={{ width: "260px", textDecoration: "none", display: "block", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  {c.image ? (
                    <img src={c.image} alt={c.title} style={{ width: "100%", height: "130px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "90px", background: "linear-gradient(135deg, var(--p-20), var(--p-08))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BookOpen size={28} style={{ color: "var(--p-40)" }} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ background: c.type === "free" ? "var(--p-25)" : "rgba(26,82,118,0.35)", color: c.type === "free" ? "var(--theme-badge-text)" : "#7fb3d3", fontSize: "0.7rem", padding: "0.15rem 0.55rem", borderRadius: "9999px" }}>
                        {c.type === "free" ? "مجانية" : `${c.price?.toLocaleString()} دج`}
                      </span>
                      {c.duration && <span style={{ color: "var(--theme-text-dim)", fontSize: "0.72rem" }}>{c.duration}</span>}
                    </div>
                    <h3 className="font-semibold mb-1" style={{ color: "var(--theme-text)", fontSize: "0.9rem" }}>{c.title}</h3>
                    <p style={{ color: "var(--theme-text-muted)", fontSize: "0.77rem" }}>{c.instructor}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED JOBS ══════════════════════════════════════════════════ */}
      {featuredJobs.length > 0 && (
        <section className="py-16 px-4" style={{ borderBottom: "1px solid var(--p-10)" }}>
          <div className="container mx-auto">
            <SectionHeader num="02" title="أحدث الفرص الوظيفية" link="/jobs" linkLabel="عرض الكل" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredJobs.map((j, i) => (
                <Link
                  key={j.id} to={`/jobs/${j.id}`}
                  className="card-glow rounded-2xl overflow-hidden animate-fade-in-up"
                  style={{ textDecoration: "none", display: "block", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  {j.image ? (
                    <img src={j.image} alt={j.title} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "90px", background: "linear-gradient(135deg, var(--p-18), var(--p-05))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Briefcase size={30} style={{ color: "var(--p-40)" }} />
                    </div>
                  )}
                  <div className="p-4">
                    {j.jobType && <span style={{ background: "var(--p-25)", color: "var(--theme-badge-text)", fontSize: "0.7rem", padding: "0.15rem 0.55rem", borderRadius: "9999px" }}>{j.jobType}</span>}
                    <h3 className="font-semibold mt-2 mb-1" style={{ color: "var(--theme-text)", fontSize: "0.92rem" }}>{j.title}</h3>
                    <p style={{ color: "var(--theme-text-secondary)", fontSize: "0.8rem" }}>{j.company}</p>
                    <div className="flex flex-wrap gap-2 mt-2" style={{ color: "var(--theme-text-muted)", fontSize: "0.75rem" }}>
                      {j.location && <span className="flex items-center gap-1"><MapPin size={10} />{j.location}</span>}
                      {j.deadline && <span className="flex items-center gap-1"><Calendar size={10} />آخر أجل: {j.deadline}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ UPCOMING COMPETITIONS ══════════════════════════════════════════ */}
      {upcomingComps.length > 0 && (
        <section className="py-16 px-4" style={{ borderBottom: "1px solid var(--p-10)" }}>
          <div className="container mx-auto">
            <SectionHeader num="03" title="مسابقات قادمة" link="/competitions" linkLabel="عرض الكل" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {upcomingComps.map((c, i) => {
                const typeBg: Record<string,string>  = { university: "rgba(26,82,118,0.3)", national: "var(--p-25)", international: "rgba(120,66,18,0.3)" };
                const typeClr: Record<string,string> = { university: "#7fb3d3", national: "var(--theme-badge-text)", international: "#f0b27a" };
                const typeLbl: Record<string,string> = { university: "جامعية", national: "وطنية", international: "دولية" };
                return (
                  <Link
                    key={c.id} to={`/competitions/${c.id}`}
                    className="card-glow rounded-2xl overflow-hidden animate-fade-in-up"
                    style={{ textDecoration: "none", display: "block", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}
                  >
                    {c.image ? (
                      <img src={c.image} alt={c.name} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                    ) : (
                      <div style={{ height: "90px", background: "linear-gradient(135deg, var(--p-18), var(--p-05))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trophy size={30} style={{ color: "var(--p-40)" }} />
                      </div>
                    )}
                    <div className="p-4">
                      <span style={{ background: typeBg[c.type] || "var(--p-25)", color: typeClr[c.type] || "var(--theme-badge-text)", fontSize: "0.7rem", padding: "0.15rem 0.55rem", borderRadius: "9999px" }}>
                        {typeLbl[c.type]}
                      </span>
                      <h3 className="font-semibold mt-2 mb-1" style={{ color: "var(--theme-text)", fontSize: "0.92rem" }}>{c.name}</h3>
                      <p style={{ color: "var(--theme-text-secondary)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>{c.organizer}</p>
                      {c.startDate && <span className="flex items-center gap-1" style={{ color: "var(--theme-text-muted)", fontSize: "0.75rem" }}><Calendar size={10} />{c.startDate}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED EQUIPMENT ═════════════════════════════════════════════ */}
      {featuredEquipment.length > 0 && (
        <section className="py-16 px-4" style={{ borderBottom: "1px solid var(--p-10)" }}>
          <div className="container mx-auto">
            <SectionHeader num="04" title="معدات للبيع" link="/equipment" linkLabel="عرض الكل" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredEquipment.map((eq, i) => (
                <Link
                  key={eq.id} to={`/equipment/${eq.id}`}
                  className="card-glow rounded-2xl overflow-hidden animate-fade-in-up"
                  style={{ textDecoration: "none", display: "block", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  {eq.image ? (
                    <img src={eq.image} alt={eq.name} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: "90px", background: "linear-gradient(135deg, var(--p-18), var(--p-05))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Camera size={30} style={{ color: "var(--p-40)" }} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold" style={{ color: "var(--theme-text)", fontSize: "0.92rem" }}>{eq.name}</h3>
                      <span style={{ background: eq.condition === "new" ? "var(--p-25)" : "rgba(120,66,18,0.3)", color: eq.condition === "new" ? "var(--theme-badge-text)" : "#f0b27a", fontSize: "0.68rem", padding: "0.15rem 0.45rem", borderRadius: "9999px", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {eq.condition === "new" ? "جديد" : "مستعمل"}
                      </span>
                    </div>
                    <p style={{ color: "var(--theme-accent)", fontWeight: 700, fontSize: "0.92rem" }}>{eq.price?.toLocaleString()} دج</p>
                    <p style={{ color: "var(--theme-text-muted)", fontSize: "0.77rem" }}>{eq.seller}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED VOICES ════════════════════════════════════════════════ */}
      {featuredVoice.length > 0 && (
        <section className="py-16 px-4" style={{ borderBottom: "1px solid var(--p-10)" }}>
          <div className="container mx-auto">
            <SectionHeader num="05" title="منشطون مميزون" link="/voice-requests" linkLabel="عرض الكل" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredVoice.map((v, i) => (
                <div
                  key={v.id}
                  className="card-glow rounded-2xl p-5 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--p-20)", border: "1px solid var(--p-35)" }}>
                      <Mic size={18} style={{ color: "var(--theme-accent)" }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: "var(--theme-text)", fontSize: "0.92rem" }}>{v.name}</h3>
                      {v.specialty && <span style={{ background: "var(--p-18)", color: "var(--theme-badge-text)", fontSize: "0.68rem", padding: "0.1rem 0.45rem", borderRadius: "9999px" }}>{v.specialty}</span>}
                    </div>
                  </div>
                  {v.experience && <p style={{ color: "var(--theme-text-muted)", fontSize: "0.78rem" }}>الخبرة: {v.experience}</p>}
                  {v.description && <p style={{ color: "var(--theme-text-dim)", fontSize: "0.78rem", lineHeight: 1.6, marginTop: "0.4rem" }}>{v.description.slice(0, 80)}{v.description.length > 80 ? "…" : ""}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FEATURED PROFESSIONALS ═════════════════════════════════════════ */}
      {featuredProfiles.length > 0 && (
        <section className="py-16 px-4" style={{ borderBottom: "1px solid var(--p-10)" }}>
          <div className="container mx-auto">
            <SectionHeader num="06" title="محترفون مميزون" link="/voice-requests" linkLabel="عرض الكل" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredProfiles.map((p, i) => (
                <div
                  key={p.id}
                  className="card-glow rounded-2xl p-5 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" style={{ border: "2px solid var(--p-30)" }} />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--p-20)", border: "1px solid var(--p-35)" }}>
                        <span style={{ color: "var(--theme-accent)", fontWeight: 700 }}>{p.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold" style={{ color: "var(--theme-text)", fontSize: "0.92rem" }}>{p.name}</h3>
                      <span style={{ background: "var(--p-18)", color: "var(--theme-badge-text)", fontSize: "0.68rem", padding: "0.1rem 0.45rem", borderRadius: "9999px" }}>{typeLabel[p.type] || p.type}</span>
                    </div>
                  </div>
                  {p.specialty && <p style={{ color: "var(--theme-text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>{p.specialty}</p>}
                  {p.location && <div className="flex items-center gap-1" style={{ color: "var(--theme-text-muted)", fontSize: "0.77rem" }}><MapPin size={11} /><span>{p.location}</span></div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ JOIN CTA ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, var(--p-15) 0%, transparent 70%)" }} />
        <div className="container mx-auto text-center relative z-10 max-w-2xl">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float" style={{ background: "linear-gradient(135deg, var(--theme-primary), var(--theme-accent))", boxShadow: "0 0 40px var(--p-40)" }}>
            <Radio size={28} color="#fff" />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--theme-text)" }}>
            {content.ctaTitle}
          </h2>
          <p className="mb-8" style={{ color: "var(--theme-text-secondary)", fontSize: "1rem", lineHeight: 1.8 }}>
            {content.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-dz inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold" style={{ textDecoration: "none" }}>
              <Users size={17} />
              <span>{content.ctaButton}</span>
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200"
              style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary)", textDecoration: "none" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--p-10)"; el.style.borderColor = "var(--p-50)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = ""; el.style.borderColor = "var(--p-30)"; }}
            >
              {content.ctaButton2}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
