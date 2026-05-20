import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, GraduationCap, FileText, ExternalLink } from "lucide-react";
import { getThesis } from "../../lib/firestore";
import type { Thesis, ThesisSpecialty } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

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

export default function ThesisDetail() {
  const { id } = useParams<{ id: string }>();
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle(
    thesis?.title ?? "",
    thesis ? `${thesis.title} — مذكرة تخرج ${thesis.specialty} — ${thesis.university} ${thesis.year}` : undefined
  );

  useEffect(() => {
    if (!id) return;
    getThesis(id).then((data) => { setThesis(data); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</span>
      </div>
    );
  }

  if (!thesis) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "1.25rem" }}>المذكرة غير موجودة</span>
        <Link to="/theses" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>← العودة إلى المذكرات</Link>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative py-14 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-12) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10 max-w-3xl">
          <Link
            to="/theses"
            className="inline-flex items-center gap-2 mb-6 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
          >
            <ArrowRight size={16} />
            العودة إلى المذكرات
          </Link>

          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{ background: specColors[thesis.specialty], border: `1px solid ${specText[thesis.specialty]}44` }}
            >
              <GraduationCap size={26} style={{ color: specText[thesis.specialty] }} />
            </div>
            <div>
              <div className="flex gap-2 mb-3 flex-wrap">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: specColors[thesis.specialty], color: specText[thesis.specialty] }}
                >
                  {thesis.specialty}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--p-15)", color: "var(--theme-text-muted, #6aad6a)" }}>
                  {thesis.year}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold leading-snug" style={{ color: "var(--theme-text, #e8f5e9)" }}>{thesis.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-5">

        {/* Metadata */}
        <div
          className="rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
          style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)" }}
        >
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>المؤلف</p>
            <p className="font-semibold" style={{ color: "var(--theme-text, #e8f5e9)" }}>{thesis.author}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>الجامعة</p>
            <p className="font-semibold" style={{ color: "var(--theme-text, #e8f5e9)" }}>{thesis.university}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>سنة المناقشة</p>
            <p className="font-semibold" style={{ color: "var(--theme-text, #e8f5e9)" }}>{thesis.year}</p>
          </div>
          {thesis.supervisor && (
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>المشرف</p>
              <p className="font-semibold" style={{ color: "var(--theme-text, #e8f5e9)" }}>{thesis.supervisor}</p>
            </div>
          )}
        </div>

        {/* Abstract */}
        {thesis.abstract && (
          <div
            className="rounded-xl p-5"
            style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)" }}
          >
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--theme-badge-text, #81c784)" }}>ملخص المذكرة</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-secondary, #a5d6a7)", whiteSpace: "pre-wrap" }}>{thesis.abstract}</p>
          </div>
        )}

        {/* Keywords */}
        {thesis.keywords && thesis.keywords.length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)" }}
          >
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--theme-badge-text, #81c784)" }}>الكلمات المفتاحية</h2>
            <div className="flex flex-wrap gap-2">
              {thesis.keywords.map((k) => (
                <span key={k} className="text-sm px-3 py-1 rounded-xl" style={{ background: "var(--p-12)", color: "var(--theme-text-secondary, #a5d6a7)", border: "1px solid var(--p-25)" }}>
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PDF link */}
        {thesis.pdfUrl && (
          <a
            href={thesis.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))", color: "#fff", textDecoration: "none" }}
          >
            <FileText size={16} />
            تحميل / عرض المذكرة PDF
            <ExternalLink size={14} />
          </a>
        )}

        <div className="pt-4" style={{ borderTop: "1px solid var(--p-15)" }}>
          <p className="text-xs" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
            مذكرة تخرج في {thesis.specialty} — {thesis.university} {thesis.year} — منصة سند الإعلامية الجزائرية
          </p>
        </div>
      </div>
    </div>
  );
}
