import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, Star, ExternalLink } from "lucide-react";
import { getUserProfile } from "../../lib/firestore";
import type { UserProfile, IndividualType } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

const typeLabels: Record<IndividualType, string> = {
  journalist:   "صحفي",
  voice:        "منشط صوتي",
  photographer: "مصور",
  editor:       "مونتير",
  student:      "طالب إعلام",
  other:        "أخرى",
};

const typeColors: Record<IndividualType, { bg: string; text: string }> = {
  journalist:   { bg: "rgba(0,80,40,0.3)",   text: "#66bb6a" },
  voice:        { bg: "rgba(120,60,0,0.3)",   text: "#ffa726" },
  photographer: { bg: "rgba(0,60,120,0.3)",   text: "#64b5f6" },
  editor:       { bg: "rgba(80,0,120,0.3)",   text: "#ce93d8" },
  student:      { bg: "rgba(0,100,100,0.3)",  text: "#4dd0e1" },
  other:        { bg: "var(--p-20)",           text: "var(--theme-badge-text, #81c784)" },
};

export default function ProfessionalDetail() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle(
    profile?.name ?? "",
    profile ? `${profile.name} — ${typeLabels[profile.type as IndividualType] ?? profile.type} في منصة سند الإعلامية` : undefined
  );

  useEffect(() => {
    if (!id) return;
    getUserProfile(id).then((p) => { setProfile(p); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</span>
      </div>
    );
  }

  if (!profile || profile.status !== "approved" || profile.type === "store") {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "1.25rem" }}>الملف الشخصي غير موجود</span>
        <Link to="/professionals" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>← العودة إلى دليل المحترفين</Link>
      </div>
    );
  }

  const tColor = typeColors[profile.type as IndividualType] ?? typeColors.other;
  const typeLabel = profile.type === "other" && profile.otherType
    ? profile.otherType
    : (typeLabels[profile.type as IndividualType] ?? profile.type);

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <Link
          to="/professionals"
          className="inline-flex items-center gap-2 mb-8 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
        >
          <ArrowRight size={16} />
          دليل المحترفين
        </Link>

        {/* Header */}
        <div className="flex items-center gap-5 mb-6">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={profile.name}
              className="rounded-full object-cover flex-shrink-0"
              style={{ width: 80, height: 80, border: "2px solid var(--p-20)" }}
            />
          ) : (
            <div
              className="rounded-full flex-shrink-0 flex items-center justify-center text-2xl font-bold"
              style={{ width: 80, height: 80, background: "var(--p-20)", color: "var(--theme-accent, #00a355)" }}
            >
              {profile.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>{profile.name}</h1>
              {profile.featured && <Star size={16} fill="currentColor" style={{ color: "#ffa726" }} />}
            </div>
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{ background: tColor.bg, color: tColor.text }}
            >
              {typeLabel}
            </span>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {profile.specialty && (
            <div className="rounded-xl p-3" style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>التخصص</div>
              <div className="text-sm font-medium" style={{ color: "var(--theme-text, #e8f5e9)" }}>{profile.specialty}</div>
            </div>
          )}
          {profile.experience && (
            <div className="rounded-xl p-3" style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>الخبرة</div>
              <div className="text-sm font-medium" style={{ color: "var(--theme-text, #e8f5e9)" }}>{profile.experience}</div>
            </div>
          )}
          {profile.location && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}>
              <MapPin size={14} style={{ color: "var(--theme-accent, #00a355)", flexShrink: 0 }} />
              <div>
                <div className="text-xs mb-0.5" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>الولاية</div>
                <div className="text-sm font-medium" style={{ color: "var(--theme-text, #e8f5e9)" }}>{profile.location}</div>
              </div>
            </div>
          )}
          {profile.phone && (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}>
              <Phone size={14} style={{ color: "var(--theme-accent, #00a355)", flexShrink: 0 }} />
              <div>
                <div className="text-xs mb-0.5" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>الهاتف</div>
                <div className="text-sm font-medium" style={{ color: "var(--theme-text, #e8f5e9)" }}>{profile.phone}</div>
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>نبذة</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-secondary, #a5d6a7)", whiteSpace: "pre-wrap" }}>
              {profile.bio}
            </p>
          </div>
        )}

        {/* Achievements */}
        {profile.achievements && (
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>الإنجازات</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-secondary, #a5d6a7)", whiteSpace: "pre-wrap" }}>
              {profile.achievements}
            </p>
          </div>
        )}

        {/* Portfolio links */}
        {profile.portfolio && profile.portfolio.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-3" style={{ color: "var(--theme-text, #e8f5e9)" }}>أعمالي</h2>
            <div className="flex flex-col gap-2">
              {profile.portfolio.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}
                >
                  <ExternalLink size={13} />
                  {link.label || link.url}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--p-15)" }}>
          <Link to="/professionals" className="text-sm transition-opacity hover:opacity-70" style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}>
            ← محترفون آخرون
          </Link>
        </div>
      </div>
    </div>
  );
}
