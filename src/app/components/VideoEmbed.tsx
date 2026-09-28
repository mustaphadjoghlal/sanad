import { useState } from "react";
import { Play } from "lucide-react";

/**
 * A YouTube video that looks like part of this site until it is played.
 *
 * Embedding the iframe directly costs every visitor most of a megabyte of
 * YouTube's player before they have decided to watch anything, on a page
 * whose own bundle is a fraction of that. So the still is shown first — the
 * platform's own cover where there is one, YouTube's thumbnail where there
 * is not — under this site's play button, and the iframe is created only on
 * the click that asks for it.
 *
 * What cannot be changed is the player itself once it starts: YouTube's
 * terms require their branding to stay, and the modestbranding parameter
 * that used to soften it was withdrawn in 2023. The video does at least play
 * here rather than sending the visitor away.
 */
export default function VideoEmbed({
  videoId,
  title,
  poster,
}: {
  videoId: string;
  title: string;
  poster?: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const still = poster || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    return (
      <div style={{ aspectRatio: "16 / 9", background: "#000" }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&iv_load_policy=3&playsinline=1&color=white`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`تشغيل: ${title}`}
      className="group relative w-full"
      style={{ aspectRatio: "16 / 9", background: "#000", border: "none", padding: 0, cursor: "pointer", display: "block", overflow: "hidden" }}
    >
      <img
        src={still}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* A wash, so the button reads over a bright frame. */}
      <span
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)" }}
      />

      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <span
          className="flex items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
          style={{
            width: "4.5rem",
            height: "4.5rem",
            background: "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          <Play size={28} fill="#fff" style={{ color: "#fff", marginRight: "-3px" }} />
        </span>
      </span>
    </button>
  );
}
