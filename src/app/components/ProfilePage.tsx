import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Phone, ExternalLink, Play, ArrowRight, User, Mic, Share2, Instagram, Linkedin, Facebook, Youtube, Globe, Twitter } from "lucide-react";
import { getUserProfile } from "../../lib/firestore";
import type { UserProfile } from "../../lib/types";

const typeLabel: Record<string, string> = {
  editor_news: "محرر أخبار", web_digital: "ويب ديجيتال",
  presenter_programs: "مقدم برامج", presenter_news: "مقدم أخبار",
  monteur: "مونتير", graphic_designer: "جرافيك ديزاينر",
  cameraman: "كاميرا مان", producer: "منتج", director: "مخرج",
  program_writer: "معد برامج", voice: "معلق صوتي",
  host_stage: "منشط على الركح", student: "طالب إعلام",
  journalist: "صحفي", photographer: "مصور", editor: "مخرج / مونتير",
  store: "متجر عتاد", trainer: "مدرب", other: "إعلامي",
};

function ytId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{ border: "1px solid var(--p-25)", color: copied ? "var(--theme-accent)" : "var(--theme-text-muted)", background: "none", cursor: "pointer" }}
    >
      <Share2 size={13} />
      {copied ? "تم نسخ الرابط ✓" : "مشاركة الملف"}
    </button>
  );
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getUserProfile(id).then((p) => { setProfile(p); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e0e0e" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--theme-accent) transparent transparent transparent" }} />
    </div>
  );

  if (!profile || profile.status !== "approved") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#0e0e0e", color: "var(--theme-text)" }} dir="rtl">
      <p>الملف الشخصي غير موجود</p>
      <Link to="/" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>العودة للرئيسية</Link>
    </div>
  );

  return (
    <div className="min-h-screen py-12" style={{ background: "#0e0e0e" }} dir="rtl">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>
          <ArrowRight size={14} /> الرئيسية
        </Link>

        {/* Profile card */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-20)" }}>
          {/* Banner */}
          <div style={{ height: "140px", background: "linear-gradient(135deg, var(--theme-primary), var(--theme-accent))", position: "relative" }}>
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
          </div>
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-12 mb-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4" style={{ borderColor: "#141414", background: "var(--p-20)" }}>
                {profile.photo
                  ? <img src={profile.photo} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div className="w-full h-full flex items-center justify-center"><User size={36} style={{ color: "var(--p-40)" }} /></div>
                }
              </div>
            </div>

            <h1 className="text-2xl font-black mb-1" style={{ color: "var(--theme-text)" }}>{profile.name}</h1>
            {profile.tagline && <p className="text-sm mb-2" style={{ color: "var(--theme-accent)", fontStyle: "italic" }}>{profile.tagline}</p>}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block text-sm px-3 py-1 rounded-full" style={{ background: "var(--p-15)", color: "var(--theme-accent)" }}>
                {typeLabel[profile.type] ?? profile.type}
              </span>
              {profile.gender && (
                <span className="inline-block text-sm px-3 py-1 rounded-full" style={{ background: "var(--p-10)", color: "var(--theme-text-muted)" }}>
                  {profile.gender === "male" ? "ذكر" : "أنثى"}
                </span>
              )}
            </div>
            {profile.bio && <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--theme-text-muted)" }}>{profile.bio}</p>}

            {/* Contact */}
            <div className="flex flex-wrap gap-3 mb-3">
              {profile.location && <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--theme-text-muted)" }}><MapPin size={14} />{profile.location}</span>}
              {profile.phone && <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg" style={{ color: "var(--theme-badge-text)", border: "1px solid var(--p-25)", textDecoration: "none" }}><Phone size={14} />{profile.phone}</a>}
            </div>

            {/* Social links */}
            {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.socialLinks.instagram && <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ color: "#e1306c", border: "1px solid rgba(225,48,108,0.25)", textDecoration: "none" }}><Instagram size={13} />Instagram</a>}
                {profile.socialLinks.facebook && <a href={profile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ color: "#1877f2", border: "1px solid rgba(24,119,242,0.25)", textDecoration: "none" }}><Facebook size={13} />Facebook</a>}
                {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ color: "#0a66c2", border: "1px solid rgba(10,102,194,0.25)", textDecoration: "none" }}><Linkedin size={13} />LinkedIn</a>}
                {profile.socialLinks.youtube && <a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ color: "#ff0000", border: "1px solid rgba(255,0,0,0.25)", textDecoration: "none" }}><Youtube size={13} />YouTube</a>}
                {profile.socialLinks.twitter && <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ color: "#aaa", border: "1px solid rgba(170,170,170,0.25)", textDecoration: "none" }}><Twitter size={13} />X</a>}
                {profile.socialLinks.website && <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ color: "var(--theme-accent)", border: "1px solid var(--p-25)", textDecoration: "none" }}><Globe size={13} />الموقع</a>}
              </div>
            )}

            {/* Share button */}
            <ShareButton />
          </div>
        </div>

        {/* Details */}
        {(profile.specialty || profile.experience || profile.achievements) && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-20)" }}>
            {profile.specialty && (
              <div className="mb-3">
                <p className="text-xs mb-1" style={{ color: "var(--theme-accent)" }}>التخصص</p>
                <p className="text-sm" style={{ color: "var(--theme-text)" }}>{profile.specialty}</p>
              </div>
            )}
            {profile.experience && (
              <div className="mb-3">
                <p className="text-xs mb-1" style={{ color: "var(--theme-accent)" }}>سنوات الخبرة</p>
                <p className="text-sm" style={{ color: "var(--theme-text)" }}>{profile.experience}</p>
              </div>
            )}
            {profile.achievements && (
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--theme-accent)" }}>الإنجازات</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>{profile.achievements}</p>
              </div>
            )}
          </div>
        )}

        {/* Portfolio links */}
        {profile.portfolio && profile.portfolio.length > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-20)" }}>
            <h2 className="font-bold mb-4" style={{ color: "var(--theme-text)" }}>روابط الأعمال</h2>
            <div className="flex flex-col gap-2">
              {profile.portfolio.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ color: "var(--theme-accent)", border: "1px solid var(--p-20)", textDecoration: "none" }}>
                  <ExternalLink size={13} /> {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio videos */}
        {profile.portfolioVideos && profile.portfolioVideos.length > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-20)" }}>
            <h2 className="font-bold mb-4" style={{ color: "var(--theme-text)" }}>أعمالي — فيديو</h2>
            <div className="flex flex-col gap-5">
              {profile.portfolioVideos.map((v, i) => {
                const vid = ytId(v.url);
                return (
                  <div key={i}>
                    {v.title && <p className="text-sm font-medium mb-2" style={{ color: "var(--theme-badge-text)" }}>{v.title}</p>}
                    {vid ? (
                      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: "0.75rem", overflow: "hidden" }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${vid}`}
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>
                        <Play size={14} /> {v.url}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Audio samples */}
        {profile.audioSamples && profile.audioSamples.length > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-20)" }}>
            <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--theme-text)" }}>
              <Mic size={16} style={{ color: "var(--theme-accent)" }} /> عينات صوتية
            </h2>
            <div className="flex flex-col gap-4">
              {profile.audioSamples.map((s, i) => (
                <div key={i} style={{ background: "var(--p-08)", borderRadius: "0.75rem", padding: "0.85rem 1rem" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>{s.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--p-15)", color: "var(--theme-accent)" }}>{s.category}</span>
                  </div>
                  <audio controls src={s.url} style={{ width: "100%", height: "36px" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center py-4">
          <Link to="/" style={{ color: "var(--theme-text-muted)", fontSize: "0.8rem", textDecoration: "none" }}>
            منصة <span style={{ color: "var(--theme-accent)" }}>سند</span> — sanadz.media
          </Link>
        </div>
      </div>
    </div>
  );
}
