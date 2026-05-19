import { Link } from "react-router-dom";
import { BookOpen, ShoppingCart, Briefcase, Trophy, Mic, ArrowLeft, MapPin, Calendar, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { subscribeToFeatured, subscribeToCollection } from "../../lib/firestore";
import type { Course, Job, Equipment, Competition, UserProfile, VoiceArtist } from "../../lib/types";

const features = [
  {
    icon: BookOpen,
    title: "الدورات التدريبية",
    description: "دورات مجانية ومدفوعة في جميع مجالات الإعلام",
    link: "/courses",
    delay: "0.1s",
  },
  {
    icon: ShoppingCart,
    title: "متجر العتاد",
    description: "بيع وشراء معدات الإعلام الاحترافية",
    link: "/equipment",
    delay: "0.2s",
  },
  {
    icon: Briefcase,
    title: "عروض التوظيف",
    description: "فرص عمل إعلامية وصحفية في الجزائر",
    link: "/jobs",
    delay: "0.3s",
  },
  {
    icon: Trophy,
    title: "المسابقات",
    description: "مواعيد المسابقات الإعلامية الجامعية والوطنية",
    link: "/competitions",
    delay: "0.4s",
  },
  {
    icon: Mic,
    title: "طلبات المنشطين",
    description: "ابحث عن منشطين ومعلقين صوتيين محترفين",
    link: "/voice-requests",
    delay: "0.5s",
  },
];

const typeLabel: Record<string, string> = {
  journalist: "صحفي",
  voice: "منشط صوتي",
  vendor: "بائع عتاد",
};

function SectionHeader({ title, link, linkLabel }: { title: string; link: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#e8f5e9" }}>{title}</h2>
        <div className="h-px w-20" style={{ background: "linear-gradient(90deg, #006233, #00a355, transparent)" }} />
      </div>
      <Link
        to={link}
        className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: "#006233", textDecoration: "none" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#00a355"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#006233"; }}
      >
        <span>{linkLabel}</span>
        <ArrowLeft size={14} />
      </Link>
    </div>
  );
}

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [featuredProfiles, setFeaturedProfiles] = useState<UserProfile[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [featuredEquipment, setFeaturedEquipment] = useState<Equipment[]>([]);
  const [featuredVoice, setFeaturedVoice] = useState<VoiceArtist[]>([]);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    const unsubs = [
      subscribeToFeatured<Course>("courses", setFeaturedCourses),
      subscribeToFeatured<UserProfile>("users", setFeaturedProfiles),
      subscribeToFeatured<Job>("jobs", (jobs) => setFeaturedJobs(jobs.slice(0, 3))),
      subscribeToFeatured<Equipment>("equipment", (eq) => setFeaturedEquipment(eq.slice(0, 3))),
      subscribeToFeatured<VoiceArtist>("voice", (v) => setFeaturedVoice(v.slice(0, 3))),
      subscribeToCollection<Competition>("competitions", (comps) => {
        const approved = comps.filter((c) => c.status === "approved" || !c.status);
        const sorted = [...approved].sort((a, b) => a.startDate.localeCompare(b.startDate));
        setUpcomingCompetitions(sorted.slice(0, 3));
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-24 px-4"
        style={{
          background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)",
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 bg-grid-pattern"
          style={{ opacity: 0.4 }}
        />

        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% -10%, rgba(0,98,51,0.2) 0%, transparent 65%)",
          }}
        />

        {/* Decorative circles */}
        <div
          className="absolute top-16 left-1/4 w-64 h-64 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #00a355, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #006233, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        <div className="container mx-auto text-center relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 animate-fade-in"
            style={{
              border: "1px solid rgba(0,163,85,0.3)",
              background: "rgba(0,98,51,0.1)",
              color: "#4caf50",
              fontSize: "0.8rem",
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#00a355" }}
            />
            المنصة الجزائرية الإعلامية الشاملة
          </div>

          {/* Main heading */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up"
            style={{
              color: "#e8f5e9",
              lineHeight: "1.2",
              animationDelay: "0.1s",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            مرحباً بكم في{" "}
            <span className="text-shimmer">سند</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up"
            style={{
              color: "#6aad6a",
              animationDelay: "0.25s",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            المنصة الجزائرية الشاملة لكل شغوف بمجال الإعلام —
            دورات، معدات، وظائف، مسابقات، ومنشطون
          </p>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{
              animationDelay: "0.4s",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            <Link
              to="/courses"
              className="btn-dz inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium"
              style={{ textDecoration: "none" }}
            >
              <span>ابدأ الآن</span>
              <ArrowLeft size={18} />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300"
              style={{
                border: "1px solid rgba(0,98,51,0.4)",
                color: "#81c784",
                background: "transparent",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(0,98,51,0.12)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,163,85,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,98,51,0.4)";
              }}
            >
              انضم الآن
            </Link>
          </div>
        </div>

        {/* Bottom divider */}
        <div
          className="absolute bottom-0 right-0 left-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0,98,51,0.4), transparent)",
          }}
        />
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-14 px-4" style={{ borderBottom: "1px solid rgba(0,98,51,0.1)" }}>
          <div className="container mx-auto">
            <SectionHeader title="الدورات المميزة" link="/courses" linkLabel="عرض الكل" />
            <div className="flex gap-5 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,98,51,0.3) transparent" }}>
              {featuredCourses.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/courses/${c.id}`}
                  className="card-glow rounded-xl p-5 flex-shrink-0 animate-fade-in-up"
                  style={{
                    background: "linear-gradient(145deg, #141414, #101010)",
                    width: "280px",
                    animationDelay: `${i * 0.07}s`,
                    opacity: 0,
                    animationFillMode: "forwards",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span style={{ background: c.type === "free" ? "rgba(0,98,51,0.3)" : "rgba(26,82,118,0.35)", color: c.type === "free" ? "#81c784" : "#7fb3d3", fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                      {c.type === "free" ? "مجانية" : `${c.price?.toLocaleString()} دج`}
                    </span>
                    {c.duration && <span style={{ color: "#4a7a4a", fontSize: "0.75rem" }}>{c.duration}</span>}
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: "#c8e6c9" }}>{c.title}</h3>
                  <p style={{ color: "#4a7a4a", fontSize: "0.8rem" }}>المدرب: {c.instructor}</p>
                  {c.description && <p style={{ color: "#3a5e3a", fontSize: "0.78rem", lineHeight: 1.6, marginTop: "0.5rem" }}>{c.description.slice(0, 80)}{c.description.length > 80 ? "..." : ""}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Professionals */}
      {featuredProfiles.length > 0 && (
        <section className="py-14 px-4" style={{ borderBottom: "1px solid rgba(0,98,51,0.1)" }}>
          <div className="container mx-auto">
            <SectionHeader title="محترفون مميزون" link="/voice-requests" linkLabel="عرض الكل" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredProfiles.map((p, i) => (
                <div
                  key={p.id}
                  className="card-glow rounded-xl p-5 animate-fade-in-up"
                  style={{
                    background: "linear-gradient(145deg, #141414, #101010)",
                    animationDelay: `${i * 0.07}s`,
                    opacity: 0,
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}
                    >
                      <span style={{ color: "#00a355", fontSize: "1rem", fontWeight: 700 }}>
                        {p.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: "#c8e6c9", fontSize: "0.95rem" }}>{p.name}</h3>
                      <span style={{ background: "rgba(0,98,51,0.2)", color: "#81c784", fontSize: "0.7rem", padding: "0.1rem 0.5rem", borderRadius: "9999px" }}>
                        {typeLabel[p.type] || p.type}
                      </span>
                    </div>
                  </div>
                  {p.specialty && <p style={{ color: "#6aad6a", fontSize: "0.8rem", marginBottom: "0.25rem" }}>{p.specialty}</p>}
                  {p.location && (
                    <div className="flex items-center gap-1" style={{ color: "#4a7a4a", fontSize: "0.78rem" }}>
                      <MapPin size={12} />
                      <span>{p.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <section className="py-14 px-4" style={{ borderBottom: "1px solid rgba(0,98,51,0.1)" }}>
          <div className="container mx-auto">
            <SectionHeader title="أحدث الفرص" link="/jobs" linkLabel="عرض الكل" />
            <div className="space-y-4">
              {featuredJobs.map((j, i) => (
                <Link
                  key={j.id}
                  to={`/jobs/${j.id}`}
                  className="card-glow rounded-xl p-5 animate-fade-in-up"
                  style={{
                    background: "linear-gradient(145deg, #141414, #101010)",
                    animationDelay: `${i * 0.07}s`,
                    opacity: 0,
                    animationFillMode: "forwards",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold mb-1" style={{ color: "#c8e6c9" }}>{j.title}</h3>
                      <p style={{ color: "#6aad6a", fontSize: "0.875rem" }}>{j.company}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: "#4a7a4a" }}>
                        {j.location && <span className="flex items-center gap-1"><MapPin size={11} />{j.location}</span>}
                        {j.jobType && <span style={{ background: "rgba(0,98,51,0.2)", padding: "0.1rem 0.45rem", borderRadius: "9999px", color: "#81c784" }}>{j.jobType}</span>}
                        {j.deadline && <span className="flex items-center gap-1"><Calendar size={11} />آخر أجل: {j.deadline}</span>}
                      </div>
                    </div>
                    {j.contact && (
                      <div style={{ border: "1px solid rgba(0,98,51,0.3)", borderRadius: "0.5rem", padding: "0.4rem 0.85rem", color: "#6aad6a", fontSize: "0.8rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {j.contact}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Competitions */}
      {upcomingCompetitions.length > 0 && (
        <section className="py-14 px-4" style={{ borderBottom: "1px solid rgba(0,98,51,0.1)" }}>
          <div className="container mx-auto">
            <SectionHeader title="مسابقات قادمة" link="/competitions" linkLabel="عرض الكل" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {upcomingCompetitions.map((c, i) => {
                const typeBg: Record<string, string> = { university: "rgba(26,82,118,0.3)", national: "rgba(0,98,51,0.3)", international: "rgba(120,66,18,0.3)" };
                const typeColor2: Record<string, string> = { university: "#7fb3d3", national: "#81c784", international: "#f0b27a" };
                const typeLabelMap: Record<string, string> = { university: "جامعية", national: "وطنية", international: "دولية" };
                return (
                  <Link
                    key={c.id}
                    to={`/competitions/${c.id}`}
                    className="card-glow rounded-xl overflow-hidden animate-fade-in-up"
                    style={{
                      background: "linear-gradient(145deg, #141414, #101010)",
                      animationDelay: `${i * 0.07}s`,
                      opacity: 0,
                      animationFillMode: "forwards",
                      textDecoration: "none",
                      display: "block",
                    }}
                  >
                    {c.image ? (
                      <img src={c.image} alt={c.name} style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100px", background: "linear-gradient(135deg, rgba(0,98,51,0.15), rgba(0,98,51,0.05))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trophy size={32} style={{ color: "rgba(0,98,51,0.4)" }} />
                      </div>
                    )}
                    <div className="p-5">
                      <span style={{ background: typeBg[c.type] || "rgba(0,98,51,0.3)", color: typeColor2[c.type] || "#81c784", fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                        {typeLabelMap[c.type]}
                      </span>
                      <h3 className="font-semibold mt-3 mb-1" style={{ color: "#c8e6c9" }}>{c.name}</h3>
                      <p style={{ color: "#6aad6a", fontSize: "0.8rem", marginBottom: "0.5rem" }}>{c.organizer}</p>
                      <div className="flex gap-3 text-xs" style={{ color: "#4a7a4a" }}>
                        {c.startDate && <span className="flex items-center gap-1"><Calendar size={11} />{c.startDate}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Equipment */}
      {featuredEquipment.length > 0 && (
        <section className="py-14 px-4" style={{ borderBottom: "1px solid rgba(0,98,51,0.1)" }}>
          <div className="container mx-auto">
            <SectionHeader title="معدات مميزة للبيع" link="/equipment" linkLabel="عرض الكل" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredEquipment.map((eq, i) => (
                <Link
                  key={eq.id}
                  to={`/equipment/${eq.id}`}
                  className="card-glow rounded-xl overflow-hidden animate-fade-in-up"
                  style={{ background: "linear-gradient(145deg, #141414, #101010)", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards", textDecoration: "none", display: "block" }}
                >
                  {eq.image ? (
                    <img src={eq.image} alt={eq.name} style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100px", background: "linear-gradient(135deg, rgba(0,98,51,0.15), rgba(0,98,51,0.05))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Camera size={32} style={{ color: "rgba(0,98,51,0.4)" }} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold" style={{ color: "#c8e6c9", fontSize: "0.95rem" }}>{eq.name}</h3>
                      <span style={{ background: eq.condition === "new" ? "rgba(0,98,51,0.3)" : "rgba(120,66,18,0.3)", color: eq.condition === "new" ? "#81c784" : "#f0b27a", fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", whiteSpace: "nowrap" }}>
                        {eq.condition === "new" ? "جديد" : "مستعمل"}
                      </span>
                    </div>
                    <p style={{ color: "#00a355", fontWeight: 600, fontSize: "0.9rem" }}>{eq.price?.toLocaleString()} دج</p>
                    <p style={{ color: "#4a7a4a", fontSize: "0.78rem" }}>{eq.seller}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Voice Artists */}
      {featuredVoice.length > 0 && (
        <section className="py-14 px-4" style={{ borderBottom: "1px solid rgba(0,98,51,0.1)" }}>
          <div className="container mx-auto">
            <SectionHeader title="منشطون ومعلقون مميزون" link="/voice-requests" linkLabel="عرض الكل" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredVoice.map((v, i) => (
                <div
                  key={v.id}
                  className="card-glow rounded-xl p-5 animate-fade-in-up"
                  style={{ background: "linear-gradient(145deg, #141414, #101010)", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}>
                      <Mic size={18} style={{ color: "#00a355" }} />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: "#c8e6c9", fontSize: "0.95rem" }}>{v.name}</h3>
                      <span style={{ background: "rgba(0,98,51,0.2)", color: "#81c784", fontSize: "0.7rem", padding: "0.1rem 0.5rem", borderRadius: "9999px" }}>{v.specialty}</span>
                    </div>
                  </div>
                  {v.experience && <p style={{ color: "#4a7a4a", fontSize: "0.78rem" }}>الخبرة: {v.experience}</p>}
                  {v.description && <p style={{ color: "#3a5e3a", fontSize: "0.78rem", lineHeight: 1.6, marginTop: "0.35rem" }}>{v.description.slice(0, 80)}{v.description.length > 80 ? "..." : ""}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <h2
              className="text-3xl font-bold mb-3"
              style={{ color: "#e8f5e9" }}
            >
              خدمات المنصة
            </h2>
            <div
              className="h-px w-24 mx-auto"
              style={{
                background: "linear-gradient(90deg, transparent, #006233, #00a355, transparent)",
              }}
            />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.link}
                  to={feature.link}
                  className="group card-glow rounded-xl p-6 animate-fade-in-up"
                  style={{
                    background: "linear-gradient(145deg, #141414, #101010)",
                    textDecoration: "none",
                    animationDelay: feature.delay,
                    opacity: 0,
                    animationFillMode: "forwards",
                    display: "block",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,98,51,0.3), rgba(0,133,69,0.2))",
                      border: "1px solid rgba(0,98,51,0.4)",
                    }}
                  >
                    <Icon
                      size={26}
                      style={{ color: "#00a355" }}
                      className="icon-glow"
                    />
                  </div>

                  {/* Content */}
                  <h3
                    className="text-xl font-semibold mb-2 transition-colors duration-300 group-hover:text-green-400"
                    style={{ color: "#c8e6c9" }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ color: "#4a7a4a", fontSize: "0.9rem", lineHeight: "1.6" }}>
                    {feature.description}
                  </p>

                  {/* Arrow indicator */}
                  <div
                    className="flex items-center gap-1 mt-4 transition-all duration-300 group-hover:gap-2"
                    style={{ color: "#006233", fontSize: "0.8rem" }}
                  >
                    <span>استكشف</span>
                    <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section
        className="py-12 px-4"
        style={{
          background: "linear-gradient(135deg, #080808, #101010)",
          borderTop: "1px solid rgba(0,98,51,0.15)",
          borderBottom: "1px solid rgba(0,98,51,0.15)",
        }}
      >
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "٥+", label: "خدمات متكاملة" },
              { value: "٣٦", label: "ولاية مشمولة" },
              { value: "٢٤/٧", label: "متاح دائماً" },
              { value: "١٠٠٪", label: "جزائري أصيل" },
            ].map((stat, i) => (
              <div
                key={i}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${0.1 * i}s`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div
                  className="text-3xl font-bold mb-1"
                  style={{ color: "#00a355" }}
                >
                  {stat.value}
                </div>
                <div style={{ color: "#4a7a4a", fontSize: "0.85rem" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
