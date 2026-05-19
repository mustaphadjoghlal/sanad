import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Clock, User, ExternalLink, ArrowRight } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Course } from "../../lib/types";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "courses", id)).then((snap) => {
      if (!snap.exists()) {
        setNotFound(true);
      } else {
        setCourse({ id: snap.id, ...snap.data() } as Course);
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

  if (notFound || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl" style={{ background: "#0e0e0e" }}>
        <BookOpen size={48} style={{ color: "var(--theme-text-dim, #3a5e3a)" }} />
        <p style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>الدورة غير موجودة</p>
        <Link to="/courses" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none", fontSize: "0.875rem" }}>← العودة للدورات</Link>
      </div>
    );
  }

  const c = course;

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Back link */}
      <div className="container mx-auto px-4 pt-6">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm transition-colors" onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--theme-accent)"} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = ""}
          style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
        >
          <ArrowRight size={15} />
          العودة إلى الدورات
        </Link>
      </div>

      {/* Cover image */}
      {c.image ? (
        <div className="w-full mt-4 overflow-hidden" style={{ maxHeight: "420px" }}>
          <img
            src={c.image}
            alt={c.title}
            className="w-full object-cover"
            style={{ maxHeight: "420px", objectPosition: "center" }}
          />
        </div>
      ) : (
        <div
          className="w-full mt-4 flex items-center justify-center"
          style={{ height: "200px", background: "linear-gradient(135deg, var(--p-15), var(--p-05))", borderBottom: "1px solid var(--p-20)" }}
        >
          <BookOpen size={64} style={{ color: "var(--p-30)" }} />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Badge */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: c.type === "free" ? "var(--p-30)" : "rgba(26,82,118,0.3)",
              color: c.type === "free" ? "var(--theme-badge-text, #81c784)" : "#7fb3d3",
            }}
          >
            {c.type === "free" ? "مجانية" : `${c.price?.toLocaleString()} دج`}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-3 leading-snug" style={{ color: "var(--theme-text, #e8f5e9)" }}>{c.title}</h1>

        {/* Description */}
        {c.description && (
          <p className="text-lg mb-6 leading-relaxed" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>{c.description}</p>
        )}

        {/* Meta row */}
        <div
          className="flex flex-wrap gap-4 p-4 rounded-xl mb-8"
          style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-20)" }}
        >
          {c.instructor && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>
              <User size={15} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>المدرب:</span> {c.instructor}
            </div>
          )}
          {c.duration && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>
              <Clock size={15} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>المدة:</span> {c.duration}
            </div>
          )}
        </div>

        {/* Content images gallery */}
        {c.contentImages && c.contentImages.length > 0 && (
          <div className="mb-8">
            <div
              className="h-px mb-6"
              style={{ background: "linear-gradient(90deg, transparent, var(--p-40), transparent)" }}
            />
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
            >
              {c.contentImages.map((img, idx) => (
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

        {/* CTA link */}
        {c.link && (
          <a
            href={c.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 4px 16px var(--p-30)",
            }}
          >
            <span>الانتقال إلى الدورة</span>
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
}
