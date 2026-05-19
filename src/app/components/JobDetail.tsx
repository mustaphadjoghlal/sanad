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
        <div style={{ color: "#3a5e3a" }}>جاري التحميل...</div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl" style={{ background: "#0e0e0e" }}>
        <Briefcase size={48} style={{ color: "#2a4a2a" }} />
        <p style={{ color: "#4a7a4a" }}>الوظيفة غير موجودة</p>
        <Link to="/jobs" style={{ color: "#00a355", textDecoration: "none", fontSize: "0.875rem" }}>← العودة لعروض التوظيف</Link>
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
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-green-400"
          style={{ color: "#4a7a4a", textDecoration: "none" }}
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
          style={{ height: "200px", background: "linear-gradient(135deg, rgba(0,98,51,0.15), rgba(0,98,51,0.05))", borderBottom: "1px solid rgba(0,98,51,0.2)" }}
        >
          <Briefcase size={64} style={{ color: "rgba(0,98,51,0.3)" }} />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Job type badge */}
        {j.jobType && (
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: "rgba(0,98,51,0.3)", color: "#81c784" }}
            >
              {j.jobType}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 leading-snug" style={{ color: "#e8f5e9" }}>{j.title}</h1>
        {j.company && (
          <p className="text-lg mb-4" style={{ color: "#6aad6a" }}>{j.company}</p>
        )}

        {/* Description */}
        {j.description && (
          <p className="text-base mb-6 leading-relaxed" style={{ color: "#a5d6a7" }}>{j.description}</p>
        )}

        {/* Meta row */}
        <div
          className="flex flex-wrap gap-4 p-4 rounded-xl mb-8"
          style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid rgba(0,98,51,0.2)" }}
        >
          {j.company && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6aad6a" }}>
              <Building2 size={15} style={{ color: "#00a355" }} />
              <span style={{ color: "#4a7a4a" }}>الجهة:</span> {j.company}
            </div>
          )}
          {j.location && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6aad6a" }}>
              <MapPin size={15} style={{ color: "#00a355" }} />
              <span style={{ color: "#4a7a4a" }}>الموقع:</span> {j.location}
            </div>
          )}
          {j.deadline && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6aad6a" }}>
              <Calendar size={15} style={{ color: "#00a355" }} />
              <span style={{ color: "#4a7a4a" }}>آخر أجل:</span> {j.deadline}
            </div>
          )}
          {j.contact && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6aad6a" }}>
              <Phone size={15} style={{ color: "#00a355" }} />
              <span style={{ color: "#4a7a4a" }}>التواصل:</span> {j.contact}
            </div>
          )}
          {j.source && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#6aad6a" }}>
              <Globe size={15} style={{ color: "#00a355" }} />
              <span style={{ color: "#4a7a4a" }}>المصدر:</span> {j.source}
            </div>
          )}
        </div>

        {/* Content images gallery */}
        {j.contentImages && j.contentImages.length > 0 && (
          <div className="mb-8">
            <div
              className="h-px mb-6"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,98,51,0.4), transparent)" }}
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
                  style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid rgba(0,98,51,0.2)" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Company description */}
        {j.companyDescription && (
          <div
            className="p-5 rounded-xl mb-6"
            style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid rgba(0,98,51,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} style={{ color: "#00a355" }} />
              <h3 className="font-semibold" style={{ color: "#c8e6c9" }}>عن {j.company}</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#6aad6a" }}>{j.companyDescription}</p>
          </div>
        )}

        {/* Contact CTA */}
        {j.contact && (
          <div
            className="p-5 rounded-xl"
            style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid rgba(0,98,51,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Phone size={16} style={{ color: "#00a355" }} />
              <h3 className="font-semibold" style={{ color: "#c8e6c9" }}>للتقديم والتواصل</h3>
            </div>
            <p style={{ color: "#6aad6a", fontSize: "0.9rem" }}>{j.contact}</p>
          </div>
        )}
      </div>
    </div>
  );
}
