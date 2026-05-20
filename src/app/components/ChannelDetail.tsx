import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, Tv, Radio, Globe, Mail, Phone, MapPin, Facebook, Youtube, Instagram, Twitter, ExternalLink } from "lucide-react";
import { getChannel } from "../../lib/firestore";
import type { Channel } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

const categoryColors: Record<string, string> = {
  "وطنية":           "var(--p-25)",
  "خاصة":            "rgba(0,60,120,0.25)",
  "محلية":           "rgba(80,50,0,0.3)",
  "دينية":           "rgba(60,0,80,0.3)",
  "متخصصة":          "rgba(0,80,80,0.3)",
  "إخبارية":         "rgba(120,60,0,0.3)",
  "رياضية":          "rgba(0,80,40,0.3)",
  "ثقافية":          "rgba(40,0,80,0.3)",
  "قنوات الكترونية": "rgba(0,60,80,0.3)",
  "نوادي إعلامية":   "rgba(80,40,0,0.3)",
};
const categoryText: Record<string, string> = {
  "وطنية":           "var(--theme-badge-text, #81c784)",
  "خاصة":            "#64b5f6",
  "محلية":           "#ffb74d",
  "دينية":           "#ce93d8",
  "متخصصة":          "#4dd0e1",
  "إخبارية":         "#ffa726",
  "رياضية":          "#66bb6a",
  "ثقافية":          "#b39ddb",
  "قنوات الكترونية": "#4fc3f7",
  "نوادي إعلامية":   "#ffcc80",
};

export default function ChannelDetail() {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle(
    channel?.name ?? "",
    channel ? `${channel.name} - ${channel.category} - تردد وبيانات القناة الجزائرية` : undefined
  );

  useEffect(() => {
    if (!id) return;
    getChannel(id).then((data) => { setChannel(data); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</span>
      </div>
    );
  }

  if (!channel) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "1.25rem" }}>القناة غير موجودة</span>
        <Link to="/channels" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>← العودة إلى دليل القنوات</Link>
      </div>
    );
  }

  const hasSocial = channel.facebook || channel.youtube || channel.instagram || channel.twitter;
  const typeLabel = channel.type === "tv" ? "قناة تلفزيونية" : channel.type === "radio" ? "محطة إذاعية" : "موقع إلكتروني";
  const TypeIcon = channel.type === "tv" ? Tv : channel.type === "radio" ? Radio : Globe;
  const typeColor = channel.type === "tv" ? "var(--theme-accent, #00a355)" : channel.type === "radio" ? "#64b5f6" : "#ffb74d";

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative py-14 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-12) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10 max-w-3xl">
          <Link
            to="/channels"
            className="inline-flex items-center gap-2 mb-6 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--theme-text-muted, #4a7a4a)", textDecoration: "none" }}
          >
            <ArrowRight size={16} />
            العودة إلى دليل القنوات
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: channel.type === "tv" ? "var(--p-20)" : channel.type === "radio" ? "rgba(0,60,120,0.2)" : "rgba(80,50,0,0.25)",
                border: `1px solid ${channel.type === "tv" ? "var(--p-30)" : channel.type === "radio" ? "rgba(0,100,200,0.3)" : "rgba(180,120,0,0.35)"}`,
              }}
            >
              <TypeIcon size={30} style={{ color: typeColor }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>{channel.name}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-sm" style={{ color: typeColor }}>{typeLabel}</span>
                <span style={{ color: "var(--p-40)" }}>·</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: categoryColors[channel.category] || "var(--p-20)", color: categoryText[channel.category] || "var(--theme-badge-text, #81c784)" }}
                >
                  {channel.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="space-y-5">

          {/* Frequency */}
          {channel.frequency && (
            <div
              className="rounded-xl p-5"
              style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)" }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--theme-badge-text, #81c784)" }}>التردد</h2>
              <div
                className="rounded-lg px-4 py-3 font-mono text-lg"
                style={{ background: "rgba(0,0,0,0.35)", border: "1px solid var(--p-20)", color: "var(--theme-text-secondary, #a5d6a7)" }}
                dir="ltr"
              >
                📡 {channel.frequency}
              </div>
            </div>
          )}

          {/* Contact info */}
          {(channel.email || channel.phone || channel.address || channel.website) && (
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)" }}
            >
              <h2 className="text-sm font-semibold" style={{ color: "var(--theme-badge-text, #81c784)" }}>معلومات التواصل</h2>

              {channel.email && (
                <a
                  href={`mailto:${channel.email}`}
                  className="flex items-center gap-3 transition-opacity hover:opacity-75"
                  style={{ color: "var(--theme-text-secondary, #a5d6a7)", textDecoration: "none" }}
                >
                  <Mail size={16} style={{ flexShrink: 0, color: "var(--theme-accent)" }} />
                  <span dir="ltr">{channel.email}</span>
                </a>
              )}

              {channel.phone && (
                <div className="flex items-center gap-3" style={{ color: "var(--theme-text-secondary, #a5d6a7)" }}>
                  <Phone size={16} style={{ flexShrink: 0, color: "var(--theme-accent)" }} />
                  <span dir="ltr">{channel.phone}</span>
                </div>
              )}

              {channel.address && (
                <div className="flex items-start gap-3" style={{ color: "var(--theme-text-muted, #6aad6a)" }}>
                  <MapPin size={16} style={{ flexShrink: 0, marginTop: "0.15rem", color: "var(--theme-accent)" }} />
                  <span>{channel.address}</span>
                </div>
              )}

              {channel.website && (
                <a
                  href={channel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-opacity hover:opacity-75"
                  style={{ color: "#4fc3f7", textDecoration: "none" }}
                >
                  <Globe size={16} style={{ flexShrink: 0 }} />
                  <span dir="ltr">{channel.website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {/* Social links */}
          {hasSocial && (
            <div
              className="rounded-xl p-5"
              style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)" }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--theme-badge-text, #81c784)" }}>وسائل التواصل الاجتماعي</h2>
              <div className="flex flex-wrap gap-3">
                {channel.facebook && (
                  <a
                    href={channel.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:scale-105"
                    style={{ background: "rgba(24,119,242,0.15)", border: "1px solid rgba(24,119,242,0.3)", color: "#1877f2", textDecoration: "none" }}
                  >
                    <Facebook size={15} /> فيسبوك
                  </a>
                )}
                {channel.youtube && (
                  <a
                    href={channel.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:scale-105"
                    style={{ background: "rgba(255,0,0,0.12)", border: "1px solid rgba(255,0,0,0.25)", color: "#ff4444", textDecoration: "none" }}
                  >
                    <Youtube size={15} /> يوتيوب
                  </a>
                )}
                {channel.instagram && (
                  <a
                    href={channel.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:scale-105"
                    style={{ background: "rgba(193,53,132,0.15)", border: "1px solid rgba(193,53,132,0.3)", color: "#e1306c", textDecoration: "none" }}
                  >
                    <Instagram size={15} /> إنستغرام
                  </a>
                )}
                {channel.twitter && (
                  <a
                    href={channel.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:scale-105"
                    style={{ background: "rgba(29,161,242,0.12)", border: "1px solid rgba(29,161,242,0.25)", color: "#1da1f2", textDecoration: "none" }}
                  >
                    <Twitter size={15} /> تويتر
                  </a>
                )}
              </div>
            </div>
          )}

          {/* SEO note */}
          <p className="text-xs text-center" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
            بيانات {channel.name} — دليل القنوات الجزائرية على منصة سند
          </p>
        </div>
      </div>
    </div>
  );
}
