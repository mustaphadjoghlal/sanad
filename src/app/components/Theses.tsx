import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Search, ArrowLeft } from "lucide-react";
import { subscribeToTheses } from "../../lib/firestore";
import type { Thesis, ThesisSpecialty } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

const SPECIALTIES: ThesisSpecialty[] = ["إعلام واتصال", "صحافة", "سمعي بصري", "إعلام آلي"];

const specColors: Record<ThesisSpecialty, string> = {
  "إعلام واتصال": "var(--p-25)",
  "صحافة":        "rgba(0,60,120,0.3)",
  "سمعي بصري":   "rgba(80,50,0,0.3)",
  "إعلام آلي":    "rgba(60,0,80,0.3)",
};
const specText: Record<ThesisSpecialty, string> = {
  "إعلام واتصال": "var(--theme-badge-text, #81c784)",
  "صحافة":        "#64b5f6",
  "سمعي بصري":   "#ffb74d",
  "إعلام آلي":    "#ce93d8",
};

export default function ThesesPage() {
  usePageTitle("مذكرات التخرج", "مذكرات تخرج في تخصصات الإعلام والاتصال والصحافة والسمعي البصري — الجزائر");

  const [items, setItems] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState<ThesisSpecialty | "all">("all");
  const [year, setYear] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    return subscribeToTheses((data) => { setItems(data); setLoading(false); });
  }, []);

  const years = [...new Set(items.map((t) => String(t.year)))].sort((a, b) => +b - +a);

  const filtered = items.filter((t) => {
    const matchSpec = spec === "all" || t.specialty === spec;
    const matchYear = year === "all" || String(t.year) === year;
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.author.toLowerCase().includes(q) || (t.keywords ?? []).some((k) => k.toLowerCase().includes(q));
    return matchSpec && matchYear && matchSearch;
  });

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
              <GraduationCap size={20} style={{ color: "var(--theme-accent, #00a355)" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>مذكرات التخرج</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "var(--theme-text-secondary, #6aad6a)", paddingRight: "3.25rem", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
            مذكرات في تخصصات الإعلام والاتصال والصحافة والسمعي البصري
          </p>
          <div className="flex flex-wrap gap-3 mt-4 animate-fade-in-up" style={{ paddingRight: "3.25rem", animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
            {SPECIALTIES.map((s) => (
              <span key={s} className="text-sm" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
                <span style={{ color: specText[s] }}>{items.filter((t) => t.specialty === s).length}</span> {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="space-y-4 mb-8">
          {/* Specialty tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSpec("all")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: spec === "all" ? "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))" : "var(--p-10)",
                color: spec === "all" ? "#fff" : "var(--theme-text-secondary, #6aad6a)",
                border: spec === "all" ? "none" : "1px solid var(--p-20)",
              }}
            >
              الكل
            </button>
            {SPECIALTIES.map((s) => (
              <button
                key={s}
                onClick={() => setSpec(s)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: spec === s ? specColors[s] : "var(--p-10)",
                  color: spec === s ? specText[s] : "var(--theme-text-secondary, #6aad6a)",
                  border: spec === s ? `1px solid ${specText[s]}55` : "1px solid var(--p-20)",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search + year */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
              <input
                type="text"
                placeholder="ابحث بالعنوان أو المؤلف أو الكلمات المفتاحية..."
                className="input-dz w-full pr-9 pl-4 py-2.5 rounded-lg text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {years.length > 0 && (
              <select
                className="select-dz px-3 py-2.5 rounded-lg text-sm"
                style={{ background: "#161616", border: "1px solid var(--p-30)", color: "var(--theme-text, #e8f5e9)", minWidth: "100px" }}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="all">كل السنوات</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
            {items.length === 0 ? "لم يتم إضافة مذكرات بعد." : "لا توجد نتائج."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t, i) => (
              <Link
                key={t.id}
                to={`/theses/${t.id}`}
                className="card-glow p-5 rounded-2xl animate-fade-in-up block"
                style={{ textDecoration: "none", background: "linear-gradient(145deg, #141414, #101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex gap-2 flex-wrap">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: specColors[t.specialty], color: specText[t.specialty] }}
                    >
                      {t.specialty}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--p-15)", color: "var(--theme-text-muted, #6aad6a)" }}>
                      {t.year}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-base mb-2 line-clamp-2 leading-snug" style={{ color: "var(--theme-text, #e8f5e9)" }}>{t.title}</h3>
                <p className="text-sm mb-1" style={{ color: "var(--theme-text-secondary, #a5d6a7)" }}>{t.author}</p>
                <p className="text-xs mb-3" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>{t.university}</p>
                {t.abstract && (
                  <p className="text-xs line-clamp-3" style={{ color: "var(--theme-text-muted, #4a7a4a)", lineHeight: 1.6 }}>{t.abstract}</p>
                )}
                {t.keywords && t.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {t.keywords.slice(0, 3).map((k) => (
                      <span key={k} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--p-10)", color: "var(--theme-text-secondary, #6aad6a)", border: "1px solid var(--p-20)" }}>
                        {k}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-4 text-sm" style={{ color: "var(--theme-accent, #00a355)" }}>
                  <span>عرض المذكرة</span><ArrowLeft size={14} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
