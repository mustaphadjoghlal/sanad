import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Briefcase, MapPin, Calendar, Building2, Phone, ArrowRight, Globe, Mail, ExternalLink } from "lucide-react";
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
                {j.source.startsWith("http") ? (
                  <a
                    href={j.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:opacity-75 transition-opacity"
                    style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.95rem", textDecoration: "none" }}
                  >
                    صفحة المؤسسة على موقع التواصل الاجتماعي فيسبوك
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <div style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.95rem" }}>{j.source}</div>
                )}
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
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,163,85,0.15)", border: "1px solid rgba(0,163,85,0.3)" }}
              >
                <Phone size={22} style={{ color: "var(--theme-accent, #00a355)" }} />
              </div>
              <h3 className="font-semibold text-xl" style={{ color: "var(--theme-text, #c8e6c9)" }}>للتقديم والتواصل</h3>
            </div>
            
            <div className="space-y-4">
              {j.contact.split(/[\n,;]+/).map((method, idx) => {
                const trimmed = method.trim();
                if (!trimmed) return null;
                
                // Determine icon and link type
                let Icon = Phone;
                let href = "";
                let label = trimmed;
                
                if (trimmed.includes("@")) {
                  Icon = Mail;
                  href = `mailto:${trimmed}`;
                } else if (trimmed.startsWith("http")) {
                  Icon = Globe;
                  href = trimmed;
                  label = "رابط التقديم الإلكتروني";
                } else if (/^[\d\s+.-]+$/.test(trimmed.replace(/[^\d]/g, ""))) {
                  Icon = Phone;
                  href = `tel:${trimmed.replace(/\s+/g, "")}`;
                }

                return (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <Icon size={16} style={{ color: "var(--theme-accent, #00a355)" }} />
                    </div>
                    {href ? (
                      <a 
                        href={href} 
                        target={trimmed.startsWith("http") ? "_blank" : undefined}
                        rel={trimmed.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-lg hover:underline transition-all" 
                        style={{ color: "var(--theme-text-secondary, #a5d6a7)", textDecoration: "none" }}
                      >
                        {label}
                      </a>
                    ) : (
                      <span className="text-lg" style={{ color: "var(--theme-text-secondary, #a5d6a7)" }}>{trimmed}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
