import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Search } from "lucide-react";
import { subscribeToWorks } from "../../lib/firestore";
import type { Work, WorkType } from "../../lib/types";
import type { WorkSort as Sort } from "../../lib/firestore";
import { usePageTitle } from "../../lib/usePageTitle";
import { matchesQuery } from "../../lib/text";
import { WORK_LABEL } from "../../lib/works";
import WorkCard from "./WorkCard";
import { useStructuredData } from "../../lib/structuredData";
import LoadError from "./LoadError";

const SORTS: { key: Sort; label: string }[] = [
  { key: "featured", label: "مختارات المنصة" },
  { key: "newest", label: "الأحدث" },
  { key: "popular", label: "الأكثر إعجاباً" },
];


export default function WorksPage() {
  usePageTitle(
    "معرض الأعمال",
    "أعمال الطلبة والمحترفين في الإعلام الجزائري — مقالات وفيديوهات وتسجيلات صوتية وصور منشورة على منصة سند."
  );

  const [works, setWorks] = useState<Work[]>([]);
  const [sort, setSort] = useState<Sort>("featured");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<WorkType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoading(true);
    return subscribeToWorks(
      sort,
      (data) => { setWorks(data); setLoading(false); },
      () => { setLoadError(true); setLoading(false); }
    );
  }, [sort]);

  const filtered = works.filter((w) => {
    const matchType = type === "all" || w.type === type;
    return matchType && matchesQuery(search, w.title, w.ownerName, w.description ?? "");
  });

  useStructuredData(
    filtered.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "معرض الأعمال",
          inLanguage: "ar",
          hasPart: filtered.slice(0, 20).map((w) => ({
            "@type": "CreativeWork",
            name: w.title,
            author: { "@type": "Person", name: w.ownerName },
            url: `https://sanadz.media/works/${w.id}`,
          })),
        }
      : null
  );

  if (loadError) return <LoadError />;

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div
        className="relative py-12 px-4 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
              <Sparkles size={20} style={{ color: "var(--theme-accent, #00a355)" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>معرض الأعمال</h1>
          </div>
          <p
            className="animate-fade-in-up"
            style={{ color: "var(--theme-text-secondary, #6aad6a)", paddingRight: "3.25rem", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
          >
            ما ينشره طلبة الإعلام والمحترفون على منصة سند — مقالات، فيديوهات، تسجيلات وصور
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: sort === s.key ? "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))" : "var(--p-10)",
                  color: sort === s.key ? "#fff" : "var(--theme-text-secondary, #6aad6a)",
                  border: sort === s.key ? "none" : "1px solid var(--p-20)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1" style={{ minWidth: "12rem" }}>
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
              <input
                type="text"
                className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg"
                placeholder="ابحث في الأعمال..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="ابحث في الأعمال"
              />
            </div>
            <select
              className="input-dz px-4 py-2.5 rounded-lg"
              value={type}
              onChange={(e) => setType(e.target.value as WorkType | "all")}
              aria-label="نوع العمل"
            >
              <option value="all">كل الأنواع</option>
              {(Object.keys(WORK_LABEL) as WorkType[]).map((t) => (
                <option key={t} value={t}>{WORK_LABEL[t]}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "4rem" }}>
            جاري التحميل...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <p style={{ color: "var(--theme-text-dim, #3a5e3a)", marginBottom: "1rem" }}>
              {works.length === 0 ? "لم يُنشر أي عمل بعد." : "لا توجد نتائج."}
            </p>
            {works.length === 0 && (
              <Link to="/user/dashboard" className="btn-dz inline-block px-5 py-2.5 rounded-xl text-sm" style={{ textDecoration: "none" }}>
                انشر عملك الأول
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 15rem), 1fr))" }}>
            {filtered.map((w) => <WorkCard key={w.id} work={w} />)}
          </div>
        )}
      </div>
    </div>
  );
}
