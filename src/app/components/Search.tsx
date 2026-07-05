import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, Briefcase, BookOpen, Trophy, Package, Newspaper, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { subscribeToCollection } from "../../lib/firestore";
import type { Job, Course, Competition, Equipment, NewsItem } from "../../lib/types";

interface Result {
  id: string;
  title: string;
  subtitle?: string;
  link: string;
  category: string;
  icon: React.ElementType;
  color: string;
}

const CATS = [
  { key: "jobs",         label: "وظائف",     icon: Briefcase, color: "#7d3c98" },
  { key: "courses",      label: "دورات",     icon: BookOpen,  color: "var(--theme-primary, #006233)" },
  { key: "competitions", label: "مسابقات",   icon: Trophy,    color: "#784212" },
  { key: "equipment",    label: "عتاد",      icon: Package,   color: "#1a5276" },
  { key: "news",         label: "أخبار",     icon: Newspaper, color: "#1a6b47" },
];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [inputVal, setInputVal] = useState(params.get("q") ?? "");

  const [jobs,   setJobs]   = useState<Job[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [comps,  setComps]  = useState<Competition[]>([]);
  const [equip,  setEquip]  = useState<Equipment[]>([]);
  const [news,   setNews]   = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = 0;
    const check = () => { done++; if (done >= 5) setLoading(false); };
    const u1 = subscribeToCollection<Job>("jobs", (d) => { setJobs(d.filter((j) => j.status === "approved" || !j.status)); check(); });
    const u2 = subscribeToCollection<Course>("courses", (d) => { setCourses(d.filter((c) => c.status === "approved" || !c.status)); check(); });
    const u3 = subscribeToCollection<Competition>("competitions", (d) => { setComps(d.filter((c) => c.status === "approved" || !c.status)); check(); });
    const u4 = subscribeToCollection<Equipment>("equipment", (d) => { setEquip(d.filter((e) => e.status === "approved" || !e.status)); check(); });
    const u5 = subscribeToCollection<NewsItem>("news", (d) => { setNews(d); check(); });
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setParams(q ? { q } : {});
  }, [setParams]);

  const q = query.toLowerCase().trim();

  const results: Result[] = q.length < 2 ? [] : [
    ...jobs.filter((j) => j.title?.toLowerCase().includes(q) || j.company?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q)).map((j) => ({
      id: j.id, title: j.title, subtitle: j.company, link: `/jobs/${j.id}`, category: "وظائف", icon: Briefcase, color: "#7d3c98",
    })),
    ...courses.filter((c) => c.title?.toLowerCase().includes(q) || c.instructor?.toLowerCase().includes(q)).map((c) => ({
      id: c.id, title: c.title, subtitle: c.instructor, link: `/courses/${c.id}`, category: "دورات", icon: BookOpen, color: "var(--theme-primary)",
    })),
    ...comps.filter((c) => c.name?.toLowerCase().includes(q) || c.organizer?.toLowerCase().includes(q)).map((c) => ({
      id: c.id, title: c.name, subtitle: c.organizer, link: `/competitions/${c.id}`, category: "مسابقات", icon: Trophy, color: "#784212",
    })),
    ...equip.filter((e) => e.name?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q)).map((e) => ({
      id: e.id, title: e.name, subtitle: e.category, link: `/equipment/${e.id}`, category: "عتاد", icon: Package, color: "#1a5276",
    })),
    ...news.filter((n) => n.title?.toLowerCase().includes(q)).map((n) => ({
      id: n.id, title: n.title, subtitle: undefined, link: `/news/${n.id}`, category: "أخبار", icon: Newspaper, color: "#1a6b47",
    })),
  ];

  const grouped = CATS.map((cat) => ({ ...cat, items: results.filter((r) => r.category === cat.label) })).filter((g) => g.items.length > 0);

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
              <SearchIcon size={20} style={{ color: "var(--theme-accent)" }} />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--theme-text)" }}>البحث الشامل</h1>
          </div>
          <div className="relative animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
            <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--theme-text-muted)" }} />
            <input
              type="text"
              autoFocus
              placeholder="ابحث عن وظيفة، دورة، مسابقة، عتاد..."
              className="input-dz w-full pr-12 pl-4 py-4 rounded-xl text-base"
              value={inputVal}
              onChange={(e) => { setInputVal(e.target.value); handleSearch(e.target.value); }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--theme-text-dim)" }}>جاري تحميل قاعدة البيانات...</div>
        ) : q.length < 2 ? (
          <div className="text-center py-16">
            <Users size={40} style={{ color: "var(--p-25)", margin: "0 auto 1rem" }} />
            <p style={{ color: "var(--theme-text-muted)" }}>اكتب كلمتين على الأقل للبحث</p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {CATS.map((cat) => (
                <span key={cat.key} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "var(--p-10)", border: "1px solid var(--p-20)", color: "var(--theme-text-muted)" }}>
                  <cat.icon size={12} /> {cat.label}
                </span>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: "var(--theme-text-muted)" }}>لا توجد نتائج لـ "<span style={{ color: "var(--theme-accent)" }}>{query}</span>"</p>
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>{results.length} نتيجة</p>
            {grouped.map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-4">
                  <group.icon size={16} style={{ color: group.color }} />
                  <h2 className="font-bold text-sm" style={{ color: "var(--theme-text-secondary)" }}>{group.label}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--p-15)", color: "var(--theme-text-muted)" }}>{group.items.length}</span>
                </div>
                <div className="space-y-2">
                  {group.items.slice(0, 5).map((r) => (
                    <Link
                      key={r.id}
                      to={r.link}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                      style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-15)", textDecoration: "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-25)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-15)"; }}
                    >
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${group.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <group.icon size={14} style={{ color: group.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: "var(--theme-text)" }}>{r.title}</p>
                        {r.subtitle && <p className="text-xs truncate" style={{ color: "var(--theme-text-muted)" }}>{r.subtitle}</p>}
                      </div>
                    </Link>
                  ))}
                  {group.items.length > 5 && (
                    <p className="text-xs text-center pt-1" style={{ color: "var(--theme-text-dim)" }}>و {group.items.length - 5} نتيجة أخرى — دقّق البحث لرؤية المزيد</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
