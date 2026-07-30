import { useState } from "react";
import { Youtube, Mic, FileText, ImageIcon, ExternalLink, Play, Briefcase } from "lucide-react";
import type { PortfolioWork, WorkType } from "../../lib/types";

function ytId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

const TABS: { type: WorkType; label: string; icon: React.ElementType }[] = [
  { type: "video", label: "فيديوهات", icon: Youtube },
  { type: "audio", label: "عينات صوتية", icon: Mic },
  { type: "article", label: "مقالات", icon: FileText },
  { type: "image", label: "صور", icon: ImageIcon },
];

export default function WorksSection({ works, title = "أعمالي" }: { works: PortfolioWork[]; title?: string }) {
  const availableTabs = TABS.filter((t) => works.some((w) => w.type === t.type));
  const [tab, setTab] = useState<WorkType>(availableTabs[0]?.type ?? "video");

  if (works.length === 0) return null;

  const items = works.filter((w) => w.type === tab);

  return (
    <div
      className="p-5 mb-6"
      style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", borderRadius: "0.75rem" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Briefcase size={18} style={{ color: "var(--theme-accent, #00a355)" }} />
        <h3 className="text-lg font-semibold" style={{ color: "var(--theme-text, #c8e6c9)" }}>{title}</h3>
      </div>
      <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.8rem", marginBottom: "1rem" }}>
        اعرض إنجازاتك ومهاراتك للإعلام والمؤسسات
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {availableTabs.map((t) => {
          const TIcon = t.icon;
          const active = tab === t.type;
          return (
            <button
              key={t.type}
              onClick={() => setTab(t.type)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                background: active ? "var(--theme-accent, #00a355)" : "transparent",
                color: active ? "#0e0e0e" : "var(--theme-text-secondary, #6aad6a)",
                border: `1px solid ${active ? "var(--theme-accent, #00a355)" : "var(--p-25)"}`,
                fontWeight: active ? 600 : 400,
              }}
            >
              <TIcon size={14} />
              <span>{t.label}</span>
              <span style={{ opacity: 0.75, fontSize: "0.72rem" }}>({works.filter((w) => w.type === t.type).length})</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "video" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((w) => {
            const vid = ytId(w.url);
            return (
              <div key={w.id}>
                {vid ? (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: "0.6rem", overflow: "hidden", background: "#000" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${vid}`}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a href={w.url} target="_blank" rel="noopener noreferrer" className="block">
                    <div
                      className="flex items-center justify-center"
                      style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: "0.6rem", background: "#161616", border: "1px solid var(--p-25)" }}
                    >
                      <Play size={22} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "var(--theme-accent, #00a355)" }} />
                    </div>
                  </a>
                )}
                <p style={{ color: "var(--theme-badge-text, #81c784)", fontSize: "0.82rem", marginTop: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === "audio" && (
        <div className="flex flex-col gap-3">
          {items.map((w) => (
            <div key={w.id} style={{ background: "#161616", border: "1px solid var(--p-25)", borderRadius: "0.5rem", padding: "0.7rem 0.9rem" }}>
              <div className="flex items-center gap-2 mb-2">
                <Mic size={14} style={{ color: "var(--theme-accent, #00a355)" }} />
                <p style={{ color: "var(--theme-badge-text, #81c784)", fontSize: "0.85rem" }}>{w.title}</p>
              </div>
              <audio controls src={w.url} style={{ width: "100%", height: "36px" }} />
            </div>
          ))}
        </div>
      )}

      {tab === "article" && (
        <div className="flex flex-col gap-2">
          {items.map((w) => (
            <a
              key={w.id}
              href={w.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg transition-colors"
              style={{ color: "var(--theme-badge-text, #81c784)", border: "1px solid var(--p-25)", textDecoration: "none", background: "#161616" }}
            >
              <ExternalLink size={14} style={{ flexShrink: 0 }} />
              <span>{w.title}</span>
            </a>
          ))}
        </div>
      )}

      {tab === "image" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((w) => (
            <a key={w.id} href={w.url} target="_blank" rel="noopener noreferrer">
              <img
                src={w.url}
                alt={w.title || "عمل"}
                style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "0.5rem", border: "1px solid var(--p-25)" }}
              />
              {w.title && (
                <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.72rem", marginTop: "0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
