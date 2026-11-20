import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tv, Radio, Search, Globe, Mail, Phone, MapPin, Facebook, Youtube, Instagram, Twitter, ExternalLink, Satellite, Mic, MonitorPlay, ArrowLeft } from "lucide-react";
import { subscribeToChannels } from "../../lib/firestore";
import type { Channel } from "../../lib/types";
import { matchesQuery } from "../../lib/text";
import { usePageTitle } from "../../lib/usePageTitle";
import LoadError from "./LoadError";
import { safeUrl } from "../../lib/url";
import { ShowMore, CardGridSkeleton } from "./ListStates";
import { useShowMore } from "../../lib/useShowMore";

/*
 * Category badges: a tinted background with a light text colour, chosen for
 * contrast on the dark card (every pair is above 4.5:1).
 */
const categoryTone: Record<string, { bg: string; fg: string }> = {
  "وطنية":           { bg: "rgba(15,166,89,0.16)",  fg: "#5ee39c" },
  "خاصة":            { bg: "rgba(56,132,255,0.16)", fg: "#9cc3ff" },
  "محلية":           { bg: "rgba(251,146,60,0.16)", fg: "#fdba74" },
  "دينية":           { bg: "rgba(192,132,252,0.16)", fg: "#d8b4fe" },
  "متخصصة":          { bg: "rgba(34,211,238,0.14)", fg: "#7ee3f3" },
  "إخبارية":         { bg: "rgba(250,204,21,0.14)", fg: "#fde047" },
  "رياضية":          { bg: "rgba(74,222,128,0.14)", fg: "#86efac" },
  "ثقافية":          { bg: "rgba(167,139,250,0.16)", fg: "#c4b5fd" },
  "قنوات الكترونية": { bg: "rgba(56,189,248,0.14)", fg: "#7dd3fc" },
  "نوادي إعلامية":   { bg: "rgba(251,191,36,0.14)", fg: "#fcd34d" },
};
const defaultTone = { bg: "rgba(255,255,255,0.08)", fg: "rgba(255,255,255,0.8)" };

const typeIcon = (type: Channel["type"]) => (type === "tv" ? Tv : type === "radio" ? Radio : Globe);

const socials = [
  { key: "facebook",  label: "فيسبوك", Icon: Facebook,  color: "#5b9bff" },
  { key: "youtube",   label: "يوتيوب", Icon: Youtube,   color: "#ff6b6b" },
  { key: "instagram", label: "إنستغرام", Icon: Instagram, color: "#f472b6" },
  { key: "twitter",   label: "إكس",    Icon: Twitter,   color: "#7dd3fc" },
] as const;

function ChannelCard({ ch }: { ch: Channel }) {
  const tone = categoryTone[ch.category] ?? defaultTone;
  const Icon = typeIcon(ch.type);
  const links = socials.filter((s) => ch[s.key]);

  return (
    <article className="flex flex-col h-full p-5" style={{ background: "var(--b-surface)", border: "1px solid var(--b-line)", borderRadius: "var(--b-radius)" }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="b-service__icon shrink-0" style={{ width: "2.6rem", height: "2.6rem" }}><Icon size={19} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base leading-snug" style={{ color: "var(--b-text)" }}>
            <Link to={`/channels/${ch.id}`} className="hover:underline underline-offset-4" style={{ color: "inherit", textDecoration: "none" }}>{ch.name}</Link>
          </h3>
          {ch.category && (
            <span className="inline-block mt-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: tone.bg, color: tone.fg }}>
              {ch.category}
            </span>
          )}
        </div>
      </div>

      {/* Frequency */}
      {ch.frequency && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4 text-sm"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--b-line)", color: "var(--b-text)", fontVariantNumeric: "tabular-nums" }}
          dir="ltr"
        >
          <Satellite size={15} aria-hidden="true" style={{ color: "var(--b-green-hi)", flexShrink: 0 }} />
          <span>{ch.frequency}</span>
        </div>
      )}

      {/* Info rows */}
      <div className="space-y-2 mb-4 text-sm" style={{ color: "var(--b-text-2)" }}>
        {ch.email && (
          <a href={`mailto:${ch.email}`} className="flex items-center gap-2 hover:text-white" style={{ color: "inherit", textDecoration: "none" }}>
            <Mail size={14} aria-hidden="true" style={{ color: "var(--b-text-3)", flexShrink: 0 }} />
            <span dir="ltr" className="truncate">{ch.email}</span>
          </a>
        )}
        {ch.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} aria-hidden="true" style={{ color: "var(--b-text-3)", flexShrink: 0 }} />
            <span dir="ltr">{ch.phone}</span>
          </div>
        )}
        {ch.address && (
          <div className="flex items-start gap-2">
            <MapPin size={14} aria-hidden="true" style={{ color: "var(--b-text-3)", flexShrink: 0, marginTop: "0.2rem" }} />
            <span>{ch.address}</span>
          </div>
        )}
        {ch.website && (
          <a href={safeUrl(ch.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline underline-offset-4" style={{ color: "var(--b-green-hi)", textDecoration: "none", fontWeight: 600 }}>
            <Globe size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span dir="ltr" className="truncate">{ch.website.replace(/^https?:\/\//, "")}</span>
            <ExternalLink size={12} aria-hidden="true" style={{ flexShrink: 0 }} />
          </a>
        )}
      </div>

      {/* Footer: socials + full page */}
      <div className="mt-auto pt-3 flex items-center justify-between gap-3" style={{ borderTop: "1px solid var(--b-line)" }}>
        <div className="flex gap-2">
          {links.map(({ key, label, Icon: S, color }) => (
            <a
              key={key}
              href={safeUrl(ch[key] as string)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${ch.name} على ${label}`}
              className="b-icon-btn"
              style={{ width: "2.25rem", height: "2.25rem", color }}
            >
              <S size={16} />
            </a>
          ))}
        </div>
        <Link to={`/channels/${ch.id}`} className="b-link" style={{ fontSize: "0.8rem" }}>
          الصفحة الكاملة <ArrowLeft size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default function ChannelsPage() {
  usePageTitle("دليل القنوات الجزائرية", "دليل شامل للقنوات التلفزيونية والإذاعية والمواقع الإخبارية والنوادي الإعلامية في الجزائر.");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<"tv" | "electronic" | "radio" | "news" | "club">("tv");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeToChannels((data) => { setChannels(data); setLoading(false); }, () => { setLoadError(true); setLoading(false); });
    return unsub;
  }, []);

  const isTv         = (c: Channel) => c.type === "tv";
  const isElectronic = (c: Channel) => c.category === "قنوات الكترونية";
  const isRadio      = (c: Channel) => c.type === "radio";
  const isNews       = (c: Channel) => (c.type === "website" || (c.type !== "tv" && c.type !== "radio")) && c.category !== "قنوات الكترونية" && c.category !== "نوادي إعلامية";
  const isClub       = (c: Channel) => c.category === "نوادي إعلامية";

  const tabFn: Record<typeof tab, (c: Channel) => boolean> = {
    tv: isTv, electronic: isElectronic, radio: isRadio, news: isNews, club: isClub,
  };

  const q = search;
  const filtered = channels.filter((ch) => {
    const matchTab = tabFn[tab](ch);
    const matchSearch = matchesQuery(q, ch.name, ch.frequency, ch.category);
    return matchTab && matchSearch;
  });

  const counts = {
    tv:         channels.filter(isTv).length,
    electronic: channels.filter(isElectronic).length,
    radio:      channels.filter(isRadio).length,
    news:       channels.filter(isNews).length,
    club:       channels.filter(isClub).length,
  };

  const tabs: { key: typeof tab; label: string; icon: typeof Tv }[] = [
    { key: "tv",         label: "قنوات تلفزيونية", icon: Tv },
    { key: "electronic", label: "قنوات الكترونية",  icon: MonitorPlay },
    { key: "radio",      label: "محطات إذاعية",    icon: Radio },
    { key: "news",       label: "مواقع إخبارية",   icon: Globe },
    { key: "club",       label: "نوادي إعلامية",   icon: Mic },
  ];

  const { shown, remaining, more } = useShowMore(filtered);

  return (
    <div className="brand" style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative px-4 py-10 md:py-14 overflow-hidden" style={{ borderBottom: "1px solid var(--b-line)", isolation: "isolate" }}>
        <div className="b-glow" aria-hidden="true" style={{ top: "-22rem", left: "-12rem", zIndex: -1 }} />
        <div className="container mx-auto">
          <span className="b-eyebrow mb-4">دليل سند</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-4 mb-3" style={{ color: "var(--b-text)" }}>دليل القنوات الجزائرية</h1>
          <p className="text-base md:text-lg max-w-2xl" style={{ color: "var(--b-text-2)", lineHeight: 1.8 }}>
            الترددات، البريد الإلكتروني، العناوين، ومواقع التواصل — كل ما تحتاجه في مكان واحد
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2" size={18} aria-hidden="true" style={{ color: "var(--b-text-3)" }} />
          <input
            type="search"
            placeholder="ابحث عن قناة أو تردد..."
            aria-label="ابحث عن قناة أو تردد"
            className="w-full pr-11 pl-4 rounded-xl text-sm outline-none focus:ring-2"
            style={{ height: "3rem", background: "var(--b-surface)", border: "1px solid var(--b-line-strong)", color: "var(--b-text)", ["--tw-ring-color" as string]: "var(--b-green-30)" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs: scroll sideways on a phone instead of wrapping into rows */}
        <div className="flex gap-2 mb-7 overflow-x-auto pb-1 -mx-4 px-4" role="tablist" aria-label="نوع الوسيلة" style={{ scrollbarWidth: "none" }}>
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => { setTab(t.key); setSearch(""); }}
                className="shrink-0 inline-flex items-center gap-2 px-4 rounded-full text-sm font-bold transition-colors"
                style={{
                  height: "2.5rem",
                  background: active ? "var(--b-green)" : "rgba(255,255,255,0.04)",
                  color: active ? "var(--b-on-green)" : "var(--b-text-2)",
                  border: `1px solid ${active ? "var(--b-green)" : "var(--b-line-strong)"}`,
                }}
              >
                <t.icon size={16} aria-hidden="true" />
                {t.label}
                <span className="text-xs rounded-full px-1.5" style={{ background: active ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.08)" }}>{counts[t.key]}</span>
              </button>
            );
          })}
        </div>

        {/* Results */}
        {loadError ? (
          <LoadError />
        ) : loading ? (
          <CardGridSkeleton withImage={false} />
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center rounded-2xl" style={{ border: "1px dashed var(--b-line-strong)" }}>
            <Tv size={32} aria-hidden="true" className="mx-auto mb-3" style={{ color: "var(--b-text-3)" }} />
            <p style={{ color: "var(--b-text-2)" }}>{channels.length === 0 ? "لم يتم إضافة قنوات بعد." : "لا توجد نتائج."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((ch) => <ChannelCard key={ch.id} ch={ch} />)}
            <ShowMore remaining={remaining} onMore={more} />
          </div>
        )}

        {!loading && channels.length > 0 && (
          <p className="text-center mt-10 text-xs" style={{ color: "var(--b-text-3)" }}>
            قد تتغيّر بعض الترددات — يُنصح بالتحقق من المصادر الرسمية لكل قناة
          </p>
        )}
      </div>
    </div>
  );
}
