import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Trophy, Calendar, Users, Building2, ExternalLink, ArrowRight, Globe } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Competition } from "../../lib/types";

const typeLabel: Record<string, string> = { university: "جامعية", national: "وطنية", international: "دولية" };
const typeBg: Record<string, string> = { university: "rgba(26,82,118,0.3)", national: "var(--p-30)", international: "rgba(120,66,18,0.3)" };
const typeColor: Record<string, string> = { university: "#7fb3d3", national: "var(--theme-badge-text, #81c784)", international: "#f0b27a" };

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "competitions", id)).then((snap) => {
      if (!snap.exists()) {
        setNotFound(true);
      } else {
        setCompetition({ id: snap.id, ...snap.data() } as Competition);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "#0e0e0e" }}>
        <div style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</div>
      </div>
    );
  }

  if (notFound || !competition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl" style={{ background: "#0e0e0e" }}>
        <Trophy size={48} style={{ color: "#2a4a2a" }} />
        <p style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>المسابقة غير موجودة</p>
        <Link to="/competitions" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none", fontSize: "0.875rem" }}>← العودة للمسابقات</Link>
      </div>
    );
  }

  const c = competition;

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Back link */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          to="/competitions"
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-green-400"
          style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
        >
          <ArrowRight size={15} />
          العودة إلى المسابقات
        </Link>
      </div>

      {/* Cover image */}
      {c.image ? (
        <div className="w-full mt-4 overflow-hidden" style={{ maxHeight: "420px" }}>
          <img
            src={c.image}
            alt={c.name}
            className="w-full object-cover"
            style={{ maxHeight: "420px", objectPosition: "center" }}
          />
        </div>
      ) : (
        <div
          className="w-full mt-4 flex items-center justify-center"
          style={{ height: "200px", background: "linear-gradient(135deg, var(--p-15), var(--p-05))", borderBottom: "1px solid var(--p-20)" }}
        >
          <Trophy size={64} style={{ color: "var(--p-30)" }} />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Category badge */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{ background: typeBg[c.type] || "var(--p-30)", color: typeColor[c.type] || "var(--theme-badge-text, #81c784)" }}
          >
            {typeLabel[c.type]}
          </span>
          {c.targetAudience && (
            <span className="text-xs px-3 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(0,60,120,0.2)", color: "#64b5f6" }}>
              <Users size={11} />
              {c.targetAudience}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-3 leading-snug" style={{ color: "var(--theme-text, #e8f5e9)" }}>{c.name}</h1>

        {/* Excerpt/description */}
        {c.description && (
          <p className="text-lg mb-6 leading-relaxed" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>{c.description}</p>
        )}

        {/* Meta row */}
        <div
          className="flex flex-wrap gap-4 p-4 rounded-xl mb-8"
          style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-20)" }}
        >
          {c.startDate && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>
              <Calendar size={15} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>البداية:</span> {c.startDate}
            </div>
          )}
          {c.endDate && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>
              <Calendar size={15} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>النهاية:</span> {c.endDate}
            </div>
          )}
          {c.organizer && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>
              <Building2 size={15} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>الجهة:</span> {c.organizer}
            </div>
          )}
          {c.source && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>
              <Globe size={15} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>المصدر:</span> {c.source}
            </div>
          )}
        </div>

        {/* Article content */}
        {c.content && (
          <div className="mb-8">
            <div
              className="h-px mb-6"
              style={{ background: "linear-gradient(90deg, transparent, var(--p-40), transparent)" }}
            />
            <div
              className="leading-loose text-base whitespace-pre-wrap"
              style={{ color: "var(--theme-text, #c8e6c9)", lineHeight: "2" }}
            >
              {c.content}
            </div>
          </div>
        )}

        {/* Organizer card */}
        {c.organizerDescription && (
          <div
            className="p-5 rounded-xl mb-6"
            style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-20)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} style={{ color: "var(--theme-accent, #00a355)" }} />
              <h3 className="font-semibold" style={{ color: "var(--theme-text, #c8e6c9)" }}>عن {c.organizer}</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>{c.organizerDescription}</p>
          </div>
        )}

        {/* CTA link */}
        {c.link && (
          <a
            href={c.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #006233, #00a355)",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 4px 16px var(--p-30)",
            }}
          >
            <span>التقديم / التفاصيل الرسمية</span>
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
}
