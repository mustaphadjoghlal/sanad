import { useState, useEffect } from "react";
import { Tv, Radio, Search, Globe, Mail, Phone, MapPin, Facebook, Youtube, Instagram, Twitter, ExternalLink } from "lucide-react";
import { subscribeToChannels } from "../../lib/firestore";
import type { Channel } from "../../lib/types";

const categoryColors: Record<string, string> = {
  "وطنية":   "var(--p-25)",
  "خاصة":    "rgba(0,60,120,0.25)",
  "محلية":   "rgba(80,50,0,0.3)",
  "دينية":   "rgba(60,0,80,0.3)",
  "متخصصة":  "rgba(0,80,80,0.3)",
  "إخبارية": "rgba(120,60,0,0.3)",
  "رياضية":  "rgba(0,80,40,0.3)",
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

const S = {
  card: {
    background: "linear-gradient(145deg, #141414, #101010)",
    border: "1px solid var(--p-20)",
    borderRadius: "0.75rem",
  } as React.CSSProperties,
};

function ChannelCard({ ch }: { ch: Channel }) {
  const hasSocial = ch.facebook || ch.youtube || ch.instagram || ch.twitter;

  return (
    <div className="card-glow rounded-xl p-5" style={S.card}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: ch.type === "tv" ? "var(--p-20)" : ch.type === "radio" ? "rgba(0,60,120,0.2)" : "rgba(80,50,0,0.25)",
              border: `1px solid ${ch.type === "tv" ? "var(--p-30)" : ch.type === "radio" ? "rgba(0,100,200,0.3)" : "rgba(180,120,0,0.35)"}`,
            }}
          >
            {ch.type === "tv"
              ? <Tv size={16} style={{ color: "var(--theme-accent, #00a355)" }} />
              : ch.type === "radio"
                ? <Radio size={16} style={{ color: "#64b5f6" }} />
                : <Globe size={16} style={{ color: "#ffb74d" }} />  // website or any other type
            }
          </div>
          <h3 className="font-bold" style={{ color: "var(--theme-text, #c8e6c9)", fontSize: "0.95rem" }}>{ch.name}</h3>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: categoryColors[ch.category] || "var(--p-20)", color: categoryText[ch.category] || "var(--theme-badge-text, #81c784)" }}
        >
          {ch.category}
        </span>
      </div>

      {/* Frequency */}
      {ch.frequency && (
        <div
          className="rounded-lg px-3 py-2 mb-3 text-sm font-mono"
          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--p-15)", color: "var(--theme-text-secondary, #a5d6a7)" }}
          dir="ltr"
        >
          📡 {ch.frequency}
        </div>
      )}

      {/* Info rows */}
      <div className="space-y-1.5 mb-3">
        {ch.email && (
          <a href={`mailto:${ch.email}`} className="flex items-center gap-2 text-sm transition-colors" onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--theme-accent)"} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = ""} style={{ color: "var(--theme-text-secondary, #6aad6a)", textDecoration: "none" }}>
            <Mail size={13} />
            <span dir="ltr">{ch.email}</span>
          </a>
        )}
        {ch.phone && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>
            <Phone size={13} />
            <span dir="ltr">{ch.phone}</span>
          </div>
        )}
        {ch.address && (
          <div className="flex items-start gap-2 text-sm" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
            <MapPin size={13} style={{ marginTop: "0.15rem", flexShrink: 0 }} />
            <span>{ch.address}</span>
          </div>
        )}
        {ch.website && ch.type === "website" ? (
          <a href={ch.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors" onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "0.8"} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"} style={{ color: "#ffb74d", textDecoration: "none", fontWeight: 600, fontSize: "0.95rem" }}>
            <Globe size={15} />
            <span dir="ltr">{ch.website.replace(/^https?:\/\//, "")}</span>
            <ExternalLink size={13} />
          </a>
        ) : ch.website ? (
          <a href={ch.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm transition-colors" onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--theme-accent)"} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = ""} style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>
            <Globe size={13} />
            <span dir="ltr">{ch.website.replace(/^https?:\/\//, "")}</span>
            <ExternalLink size={11} />
          </a>
        ) : null}
      </div>

      {/* Social links */}
      {hasSocial && (
        <div className="flex gap-2 pt-2.5" style={{ borderTop: "1px solid var(--p-12)" }}>
          {ch.facebook && (
            <a href={ch.facebook} target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(24,119,242,0.15)", border: "1px solid rgba(24,119,242,0.25)" }}
            >
              <Facebook size={14} style={{ color: "#1877f2" }} />
            </a>
          )}
          {ch.youtube && (
            <a href={ch.youtube} target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(255,0,0,0.12)", border: "1px solid rgba(255,0,0,0.2)" }}
            >
              <Youtube size={14} style={{ color: "#ff4444" }} />
            </a>
          )}
          {ch.instagram && (
            <a href={ch.instagram} target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(193,53,132,0.15)", border: "1px solid rgba(193,53,132,0.25)" }}
            >
              <Instagram size={14} style={{ color: "#e1306c" }} />
            </a>
          )}
          {ch.twitter && (
            <a href={ch.twitter} target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(29,161,242,0.12)", border: "1px solid rgba(29,161,242,0.2)" }}
            >
              <Twitter size={14} style={{ color: "#1da1f2" }} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "tv" | "radio" | "website">("all");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  useEffect(() => {
    const unsub = subscribeToChannels((data) => { setChannels(data); setLoading(false); });
    return unsub;
  }, []);

  const q = search.toLowerCase();
  const WEBSITE_CATS = ["إخبارية", "رياضية", "ثقافية"];
  const isWebsite = (c: Channel) =>
    c.type === "website" ||
    (c.type !== "tv" && c.type !== "radio") ||
    WEBSITE_CATS.includes(c.category);

  const filtered = channels.filter((ch) => {
    const matchTab =
      tab === "all" ||
      (tab === "website" ? isWebsite(ch) : ch.type === tab);
    const matchSearch = !q || ch.name.toLowerCase().includes(q) || (ch.frequency || "").toLowerCase().includes(q);
    const matchCat = !catFilter || ch.category === catFilter;
    return matchTab && matchSearch && matchCat;
  });

  const tvCount = channels.filter((c) => c.type === "tv").length;
  const radioCount = channels.filter((c) => c.type === "radio").length;
  const websiteCount = channels.filter(isWebsite).length;
  const categories = [...new Set(channels.filter((c) => tab === "all" || (tab === "website" ? isWebsite(c) : c.type === tab)).map((c) => c.category))];

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
              <Tv size={20} style={{ color: "var(--theme-accent, #00a355)" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>دليل القنوات الجزائرية</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "var(--theme-text-secondary, #6aad6a)", paddingRight: "3.25rem", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
            الترددات، البريد الإلكتروني، العناوين، ومواقع التواصل — كل ما تحتاجه في مكان واحد
          </p>
          {/* Stats */}
          <div className="flex gap-4 mt-5 animate-fade-in-up" style={{ paddingRight: "3.25rem", animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
              <Tv size={14} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-badge-text, #81c784)" }}>{tvCount}</span> قناة تلفزيونية
            </span>
            <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>|</span>
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
              <Radio size={14} style={{ color: "#64b5f6" }} />
              <span style={{ color: "var(--theme-badge-text, #81c784)" }}>{radioCount}</span> محطة إذاعية
            </span>
            <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>|</span>
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
              <Globe size={14} style={{ color: "#ffb74d" }} />
              <span style={{ color: "var(--theme-badge-text, #81c784)" }}>{websiteCount}</span> موقع إخباري
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
          {(["all", "tv", "radio", "website"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setCatFilter(""); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: tab === t ? "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))" : "var(--p-10)",
                color: tab === t ? "#fff" : "var(--theme-text-secondary, #6aad6a)",
                border: tab === t ? "none" : "1px solid var(--p-20)",
              }}
            >
              {t === "all" ? `الكل (${channels.length})` : t === "tv" ? `📺 تلفزيون (${tvCount})` : t === "radio" ? `📻 إذاعة (${radioCount})` : `🌐 مواقع إخبارية (${websiteCount})`}
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="p-5 rounded-xl mb-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
              <input
                type="text"
                placeholder="ابحث عن قناة أو تردد..."
                className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="select-dz px-4 py-2.5 rounded-lg text-sm"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            >
              <option value="">جميع الفئات</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "var(--p-15)", border: "1px solid var(--p-30)" }}>
              <Tv size={28} style={{ color: "var(--theme-primary, #006233)" }} />
            </div>
            <p style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>{channels.length === 0 ? "لم يتم إضافة قنوات بعد." : "لا توجد نتائج."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((ch, i) => (
              <div key={ch.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}>
                <ChannelCard ch={ch} />
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        {!loading && channels.length > 0 && (
          <p className="text-center mt-10 text-xs" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
            قد تتغيّر بعض الترددات — يُنصح بالتحقق من المصادر الرسمية لكل قناة
          </p>
        )}
      </div>
    </div>
  );
}
