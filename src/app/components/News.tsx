import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Newspaper, ArrowLeft } from "lucide-react";
import { subscribeToNews } from "../../lib/firestore";
import type { NewsItem, NewsCategory } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

const categoryColors: Record<NewsCategory, string> = {
  "قناة جديدة": "rgba(0,80,40,0.3)",
  "مسابقة":     "rgba(120,60,0,0.3)",
  "توظيف":      "rgba(0,60,120,0.3)",
  "عام":        "var(--p-20)",
};
const categoryText: Record<NewsCategory, string> = {
  "قناة جديدة": "#66bb6a",
  "مسابقة":     "#ffa726",
  "توظيف":      "#64b5f6",
  "عام":        "var(--theme-badge-text, #81c784)",
};

const ALL_CATS: NewsCategory[] = ["قناة جديدة", "مسابقة", "توظيف", "عام"];

export default function NewsPage() {
  usePageTitle("أخبار سند", "آخر أخبار الإعلام الجزائري — قنوات جديدة، مسابقات، فرص عمل، وأكثر");

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<NewsCategory | "all">("all");

  useEffect(() => {
    return subscribeToNews((data) => { setItems(data); setLoading(false); });
  }, []);

  const filtered = cat === "all" ? items : items.filter((n) => n.category === cat);

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
              <Newspaper size={20} style={{ color: "var(--theme-accent, #00a355)" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>آخر الأخبار</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "var(--theme-text-secondary, #6aad6a)", paddingRight: "3.25rem", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
            مستجدات الإعلام الجزائري — قنوات، مسابقات، فرص عمل، وأكثر
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCat("all")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: cat === "all" ? "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))" : "var(--p-10)",
              color: cat === "all" ? "#fff" : "var(--theme-text-secondary, #6aad6a)",
              border: cat === "all" ? "none" : "1px solid var(--p-20)",
            }}
          >
            الكل ({items.length})
          </button>
          {ALL_CATS.map((c) => {
            const count = items.filter((n) => n.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: cat === c ? categoryColors[c] : "var(--p-10)",
                  color: cat === c ? categoryText[c] : "var(--theme-text-secondary, #6aad6a)",
                  border: cat === c ? `1px solid ${categoryText[c]}44` : "1px solid var(--p-20)",
                }}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
            {items.length === 0 ? "لم يتم نشر أخبار بعد." : "لا توجد أخبار في هذه الفئة."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, i) => (
              <Link
                key={item.id}
                to={`/news/${item.id}`}
                className="card-glow rounded-2xl overflow-hidden animate-fade-in-up block"
                style={{ textDecoration: "none", background: "linear-gradient(145deg, #141414, #101010)", opacity: 0, animationFillMode: "forwards", animationDelay: `${i * 0.05}s` }}
              >
                {item.image && (
                  <div style={{ height: "180px", overflow: "hidden" }}>
                    <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: categoryColors[item.category], color: categoryText[item.category] }}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>{item.date}</span>
                  </div>
                  <h3 className="font-bold text-base mb-2 line-clamp-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>{item.title}</h3>
                  <p className="text-sm line-clamp-3" style={{ color: "var(--theme-text-muted, #6aad6a)" }}>{item.body}</p>
                  <div className="flex items-center gap-1 mt-3 text-sm" style={{ color: "var(--theme-accent, #00a355)" }}>
                    <span>اقرأ المزيد</span><ArrowLeft size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
