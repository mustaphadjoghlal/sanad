import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Briefcase, Tv, Trophy, ArrowLeft, Users, CalendarDays, Newspaper, ChevronLeft, ChevronRight, Store, MapPin } from "lucide-react";
import { subscribeToFeatured, subscribeToCollection, subscribeToFirstBy, subscribeToSiteContent, getLatestNews, subscribeToWorks } from "../../lib/firestore";

import type { Course, Job, Equipment, Competition, SiteContent, NewsItem, Work } from "../../lib/types";
import { DEFAULT_SITE_CONTENT } from "../../lib/types";
import heroImage from "../assets/hero.webp";
import { usePageTitle } from "../../lib/usePageTitle";
import WorkCard from "./WorkCard";
import { CardCover } from "./Cover";

/** How many documents a front-page block reads to show its 8. */
const HOME_FETCH = 30;

/* ── The logo's three bars ── */
function Bars() {
  return <span className="b-bars" aria-hidden="true"><span /><span /><span /></span>;
}

/* ── On-air board: the newest openings, in place of decorative figures ── */
const today = () => new Date().toISOString().slice(0, 10);

/** Open means a deadline that has not passed yet; it gets the live dot. */
function isOpen(job: Job) {
  return Boolean(job.deadline && job.deadline >= today());
}

function OnAirBoard({ jobs, loaded }: { jobs: Job[]; loaded: boolean }) {
  return (
    <div className="b-board">
      <div className="b-board__head">
        <span className="b-live" aria-hidden="true" />
        <span>آخر الفرص</span>
        <Link to="/jobs" className="b-link" style={{ marginInlineStart: "auto", fontSize: "0.8125rem" }}>
          كل الفرص <ArrowLeft size={14} aria-hidden="true" />
        </Link>
      </div>
      <ul>
        {!loaded
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="b-board__row" aria-hidden="true">
                <div className="flex-1 space-y-2 animate-pulse">
                  <div style={{ height: "14px", width: "70%", borderRadius: "4px", background: "rgba(255,255,255,0.06)" }} />
                  <div style={{ height: "12px", width: "40%", borderRadius: "4px", background: "rgba(255,255,255,0.04)" }} />
                </div>
              </li>
            ))
          : jobs.slice(0, 3).map((job) => (
              <li key={job.id}>
                <Link to={`/jobs/${job.id}`} className="b-board__row">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2" style={{ color: "var(--b-text)", fontWeight: 500, lineHeight: 1.6 }}>{job.title}</p>
                    <p className="truncate text-sm mt-1" style={{ color: "var(--b-text-3)" }}>
                      {[job.company, job.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {job.deadline && (
                    <span className="b-board__meta">
                      {isOpen(job) && <span className="b-live b-live--sm" aria-label="مفتوحة" />}
                      <bdi>{job.deadline}</bdi>
                    </span>
                  )}
                </Link>
              </li>
            ))}
      </ul>
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ title, link, linkLabel }: { title: string; link: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <Bars />
        <h2 className="text-xl md:text-2xl font-semibold truncate" style={{ color: "var(--b-text)" }}>{title}</h2>
      </div>
      <Link to={link} className="b-link">
        {linkLabel} <ArrowLeft size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

function Section({ children, tinted = false, id }: { children: React.ReactNode; tinted?: boolean; id?: string }) {
  return (
    <section id={id} style={{ borderTop: "1px solid var(--b-line)", background: tinted ? "var(--b-surface)" : undefined, scrollMarginTop: "64px" }}>
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
                style={{ width: i === idx ? "20px" : "7px", height: "7px", borderRadius: "4px", background: i === idx ? "var(--b-green)" : "rgba(255,255,255,0.18)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.2s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s" }}
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
  const [jobsLoaded,        setJobsLoaded]        = useState(false);
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
  // Which sections the live listeners have already filled. The CDN copy
  // below only fills what is still empty, never overwrites live data.
  const live = useRef(new Set<string>());
  const mark = <T,>(key: string, set: (v: T) => void) => (v: T) => { live.current.add(key); set(v); };

  useEffect(() => subscribeToWorks("featured", mark("works", setWorks), undefined, 12), []);

  // First paint from /api/home: one CDN-cached request, so a first visit on a
  // slow connection shows content in a moment instead of waiting for
  // Firestore's live connection to open.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/home")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.ok) return;
        const fill = <T,>(key: string, value: T[] | null | undefined, set: (v: T[]) => void) => {
          if (Array.isArray(value) && !live.current.has(key)) set(value);
        };
        fill("jobs", d.jobs, (v: Job[]) => { setFeaturedJobs(v); setJobsLoaded(true); });
        fill("competitions", d.competitions, setUpcomingComps);
        fill("news", d.news, setLatestNews);
        fill("courses", d.courses, setFeaturedCourses);
        fill("equipment", d.equipment, setFeaturedEquipment);
        fill("works", d.works, setWorks);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const unsubs = [
      subscribeToFeatured<Course>("courses",       mark("courses", setFeaturedCourses), noop),
      // The front page shows 8 of each, so it reads a few more than 8 (room
      // for pending ones to be filtered out) instead of the whole collection.
      subscribeToCollection<Job>("jobs", (d) => {
        live.current.add("jobs");
        const approved = d.filter((j) => j.status === "approved" || !j.status);
        setFeaturedJobs([...approved].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8));
        setJobsLoaded(true);
      }, () => setJobsLoaded(true), HOME_FETCH),
      subscribeToFeatured<Equipment>("equipment",  (d) => { live.current.add("equipment"); setFeaturedEquipment(d.slice(0, 3)); }, noop),
      subscribeToFirstBy<Competition>("competitions", "startDate", "asc", HOME_FETCH, (comps) => {
        live.current.add("competitions");
        const approved = comps.filter((c) => c.status === "approved" || !c.status);
        setUpcomingComps([...approved].sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 8));
      }, noop),
      subscribeToSiteContent((data) => {
        setContent(data);
        try { localStorage.setItem("sanad_site_content", JSON.stringify(data)); } catch { /* private mode */ }
      }, noop),
    ];
    getLatestNews(3).then(mark("news", setLatestNews)).catch(() => {});
    return () => unsubs.forEach((u) => u());
  }, []);

  const c = content ?? DEFAULT_SITE_CONTENT;
  const ready = content !== null;

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
          }}
        />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -1, background: "linear-gradient(90deg, rgba(6,10,7,0.2), rgba(6,10,7,0.85) 70%)" }} />

        <div className="container mx-auto px-4 pt-12 pb-10 md:pt-20 md:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7 min-w-0">
              {!ready ? (
                // First visit, before the copy arrives from Firestore: the
                // shape of the headline instead of an empty band.
                <div className="animate-pulse" aria-busy="true" aria-label="جاري التحميل">
                  <div style={{ height: "3.25rem", width: "85%", borderRadius: "8px", background: "rgba(255,255,255,0.06)", marginBottom: "1rem" }} />
                  <div style={{ height: "3.25rem", width: "55%", borderRadius: "8px", background: "rgba(255,255,255,0.06)", marginBottom: "1.5rem" }} />
                  <div style={{ height: "1.25rem", width: "70%", borderRadius: "6px", background: "rgba(255,255,255,0.04)", marginBottom: "2rem" }} />
                  <div className="flex gap-3">
                    <div style={{ height: "3rem", width: "9rem", borderRadius: "12px", background: "rgba(255,255,255,0.06)" }} />
                    <div style={{ height: "3rem", width: "9rem", borderRadius: "12px", background: "rgba(255,255,255,0.04)" }} />
                  </div>
                </div>
              ) : (
                <>
                  {c.heroBadge && <div className="b-eyebrow mb-4">{c.heroBadge}</div>}

                  <h1
                    style={{
                      fontSize: "clamp(2.25rem, 6vw, 4rem)",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      letterSpacing: 0,
                      marginBottom: "1.25rem",
                      color: "var(--b-text)",
                    }}
                  >
                    {c.heroTitle}{" "}
                    <span style={{ color: "var(--b-green-hi)" }}>{c.siteName}</span>
                  </h1>

                  <p style={{ ...soft, fontSize: "clamp(1.0625rem, 2vw, 1.25rem)", fontWeight: 400, lineHeight: 1.7, marginBottom: "0.5rem", maxWidth: "36rem" }}>
                    {c.heroSubtitle}
                  </p>
                  <p style={{ ...muted, fontSize: "0.9375rem", lineHeight: 1.8, maxWidth: "34rem", marginBottom: "2rem" }}>
                    {c.heroDescription}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {/* Exploring starts with what the platform holds, not one
                        section of it: the button scrolls to the services. */}
                    <a
                      href="#services"
                      className="b-btn b-btn--primary"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      <span>{c.heroCta1}</span>
                      <ArrowLeft size={18} aria-hidden="true" />
                    </a>
                    <Link to="/register" className="b-btn b-btn--ghost">
                      <Users size={18} aria-hidden="true" />
                      <span>{c.heroCta2}</span>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* The newest openings, drawn like a broadcast rundown */}
            {(!jobsLoaded || featuredJobs.length > 0) && (
              <div className="md:col-span-5 min-w-0">
                <OnAirBoard jobs={featuredJobs} loaded={jobsLoaded} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══════════════════════════════════════════════════ */}
      <Section id="services">
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          {c.servicesLabel && <span className="b-eyebrow">{c.servicesLabel}</span>}
          <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: "var(--b-text)" }}>{c.servicesTitle}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {services.map((s) => (
            <Link key={s.link} to={s.link} className="b-service">
              <div className="flex items-center">
                <span className="b-service__icon"><s.icon size={18} strokeWidth={1.5} aria-hidden="true" /></span>
                <ArrowLeft size={16} className="b-service__arrow hidden sm:block" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-medium text-[0.95rem] md:text-base" style={{ color: "var(--b-text)" }}>{s.title}</h3>
                <p className="text-xs md:text-sm mt-1" style={{ ...muted, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

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
                    {job.deadline && <span className="inline-flex items-center gap-1"><CalendarDays size={13} aria-hidden="true" />آخر أجل: <bdi>{job.deadline}</bdi></span>}
                  </div>
                </div>
              </Link>
            ))}
          </AutoCarousel>
        </Section>
      )}

      {/* ══ WORKS GALLERY ═════════════════════════════════════════════ */}
      {works.length > 0 && (
        <Section>
          <SectionHeader title="أعمال أعضاء المنصة" link="/works" linkLabel="كل الأعمال" />
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 14rem), 1fr))" }}>
            {works.slice(0, 8).map((w) => <WorkCard key={w.id} work={w} />)}
          </div>
        </Section>
      )}

      {/* ══ FEATURED COURSES ══════════════════════════════════════════ */}
      {featuredCourses.length > 0 && (
        <Section tinted>
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
                    <bdi>{comp.startDate}</bdi>{comp.endDate && <> — <bdi>{comp.endDate}</bdi></>}
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
          style={{ borderRadius: "20px", background: "var(--b-surface)", border: "1px solid var(--b-line)" }}
        >
          <div className="grid md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-3">
              <span className="b-eyebrow mb-4">انضم إلى المنصة</span>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 600, lineHeight: 1.35, color: "var(--b-text)", margin: "1rem 0" }}>
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
