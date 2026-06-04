import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Briefcase, MapPin, Calendar, Building2, Phone, ArrowRight, Globe } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Job } from "../../lib/types";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "jobs", id)).then((snap) => {
      if (!snap.exists()) {
        setNotFound(true);
      } else {
        setJob({ id: snap.id, ...snap.data() } as Job);
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

  if (notFound || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl" style={{ background: "#0e0e0e" }}>
        <Briefcase size={48} style={{ color: "var(--theme-text-dim, #3a5e3a)" }} />
        <p style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>الوظيفة غير موجودة</p>
        <Link to="/jobs" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none", fontSize: "0.875rem" }}>← العودة لعروض التوظيف</Link>
      </div>
    );
  }

  const j = job;

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Back link */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-sm transition-colors" onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--theme-accent)"} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = ""}
          style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
        >
          <ArrowRight size={15} />
          العودة إلى عروض التوظيف
        </Link>
      </div>

      {/* Cover image */}
      {j.image ? (
        <div className="w-full mt-4 overflow-hidden" style={{ maxHeight: "420px" }}>
          <img
            src={j.image}
            alt={j.title}
            className="w-full object-cover"
            style={{ maxHeight: "420px", objectPosition: "center" }}
          />
        </div>
      ) : (
        <div
          className="w-full mt-4 flex items-center justify-center"
          style={{ height: "200px", background: "linear-gradient(135deg, var(--p-15), var(--p-05))", borderBottom: "1px solid var(--p-20)" }}
        >
          <Briefcase size={64} style={{ color: "var(--p-30)" }} />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Job type badges */}
        {(j.jobType || j.employmentType) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {j.jobType && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--p-30)", color: "var(--theme-badge-text, #81c784)" }}>
                {j.jobType}
              </span>
            )}
            {j.employmentType && (() => {
              const map: Record<string, { label: string; bg: string; color: string }> = {
                fulltime:        { label: "دوام كلي",         bg: "rgba(0,80,40,0.3)",   color: "#66bb6a" },
                parttime:        { label: "دوام جزئي",        bg: "rgba(0,60,120,0.3)",  color: "#64b5f6" },
                internship:      { label: "تدريب (غير مدفوع)", bg: "rgba(120,60,0,0.3)", color: "#ffa726" },
                internship_paid: { label: "تدريب مدفوع",      bg: "rgba(80,0,120,0.3)",  color: "#ce93d8" },
              };
              const s = map[j.employmentType];
              return s ? (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
                  {s.label}
                </span>
              ) : null;
            })()}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold mb-4 leading-snug" style={{ color: "var(--theme-text, #e8f5e9)", fontWeight: 700 }}>{j.title}</h1>
        {j.company && (
          <p className="text-lg mb-4" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>{j.company}</p>
        )}

        {/* Description */}
        {j.description && (
          <p className="text-base mb-6 leading-relaxed" style={{ color: "var(--theme-text-secondary, #a5d6a7)" }}>{j.description}</p>
        )}

        {/* Meta row */}
        <div
          className="grid gap-3 mb-8"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}
        >
          {j.company && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "rgba(0,163,85,0.08)", border: "1px solid rgba(0,163,85,0.2)" }}
            >
              <Building2 size={18} style={{ color: "var(--theme-accent, #00a355)", flexShrink: 0 }} />
              <div>
                <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>الجهة</div>
                <div style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.95rem" }}>{j.company}</div>
              </div>
            </div>
          )}
          {j.location && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "rgba(100,181,246,0.08)", border: "1px solid rgba(100,181,246,0.2)" }}
            >
              <MapPin size={18} style={{ color: "#64b5f6", flexShrink: 0 }} />
              <div>
                <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>الموقع</div>
                <div style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.95rem" }}>{j.location}</div>
              </div>
            </div>
          )}
          {j.deadline && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "rgba(255,167,38,0.08)", border: "1px solid rgba(255,167,38,0.2)" }}
            >
              <Calendar size={18} style={{ color: "#ffa726", flexShrink: 0 }} />
              <div>
                <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>آخر أجل</div>
                <div style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.95rem" }}>{j.deadline}</div>
              </div>
            </div>
          )}
          {j.source && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)" }}
            >
              <Globe size={18} style={{ color: "#4db8a8", flexShrink: 0 }} />
              <div>
                <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>المصدر</div>
                <div style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.95rem" }}>{j.source}</div>
              </div>
            </div>
          )}
        </div>

        {/* Content images gallery */}
        {j.contentImages && j.contentImages.length > 0 && (
          <div className="mb-8">
            <div
              className="h-px mb-6"
              style={{ background: "linear-gradient(90deg, transparent, var(--p-40), transparent)" }}
            />
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
            >
              {j.contentImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`صورة ${idx + 1}`}
                  style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid var(--p-20)" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Company description */}
        {j.companyDescription && (
          <div
            className="p-5 rounded-xl mb-6"
            style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-20)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} style={{ color: "var(--theme-accent, #00a355)" }} />
              <h3 className="font-semibold" style={{ color: "var(--theme-text, #c8e6c9)" }}>عن {j.company}</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>{j.companyDescription}</p>
          </div>
        )}

        {/* Contact CTA */}
        {j.contact && (
          <div
            className="p-6 rounded-xl"
            style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-20)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,163,85,0.15)", border: "1px solid rgba(0,163,85,0.3)" }}
              >
                <Phone size={18} style={{ color: "var(--theme-accent, #00a355)" }} />
              </div>
              <h3 className="font-semibold text-lg" style={{ color: "var(--theme-text, #c8e6c9)" }}>للتقديم والتواصل</h3>
            </div>
            <p style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "1rem", lineHeight: "1.6" }}>{j.contact}</p>
          </div>
        )}
      </div>
    </div>
  );
}
