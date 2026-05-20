import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { getNewsItem } from "../../lib/firestore";
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

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle(item?.title ?? "", item ? `${item.title} - أخبار سند الإعلامية` : undefined);

  useEffect(() => {
    if (!id) return;
    getNewsItem(id).then((data) => { setItem(data); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "1.25rem" }}>الخبر غير موجود</span>
        <Link to="/news" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>← العودة إلى الأخبار</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Cover image */}
      {item.image && (
        <div style={{ height: "320px", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, #0e0e0e 100%)", zIndex: 1 }} />
          <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 mb-6 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
        >
          <ArrowRight size={16} />
          العودة إلى الأخبار
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{ background: categoryColors[item.category], color: categoryText[item.category] }}
          >
            {item.category}
          </span>
          <span className="text-sm" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>{item.date}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6 leading-snug" style={{ color: "var(--theme-text, #e8f5e9)" }}>{item.title}</h1>

        {/* Body */}
        <div
          className="leading-relaxed text-base"
          style={{ color: "var(--theme-text-secondary, #a5d6a7)", whiteSpace: "pre-wrap" }}
        >
          {item.body}
        </div>

        {/* External link */}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: "var(--p-15)", border: "1px solid var(--p-30)", color: "var(--theme-accent, #00a355)", textDecoration: "none" }}
          >
            <ExternalLink size={15} />
            المصدر الأصلي
          </a>
        )}

        <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--p-15)" }}>
          <Link to="/news" className="text-sm transition-opacity hover:opacity-70" style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}>
            ← أخبار أخرى
          </Link>
        </div>
      </div>
    </div>
  );
}
