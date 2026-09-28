import { Link } from "react-router-dom";
import { Eye, Heart, Star, FileText } from "lucide-react";
import type { Work } from "../../lib/types";
import { accountTypeLabel } from "../../lib/types";
import { WORK_LABEL, workCover, shortCount } from "../../lib/works";
import { WORK_ICON } from "./workIcons";

/** One work in a grid — used by the gallery, a profile, and the home page. */
export default function WorkCard({ work }: { work: Work }) {
  const Icon = WORK_ICON[work.type] ?? FileText;
  const cover = workCover(work);

  return (
    <Link
      to={`/works/${work.id}`}
      className="group rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1"
      style={{ background: "var(--p-08)", border: "1px solid var(--p-15)", textDecoration: "none" }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ aspectRatio: "16 / 10", background: "var(--p-12)", overflow: "hidden" }}
      >
        {cover ? (
          <img
            src={cover}
            alt={work.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Icon size={34} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
        )}

        {work.featured && (
          <span
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[0.7rem] font-bold"
            style={{ background: "rgba(180,120,0,0.9)", color: "#fff" }}
          >
            <Star size={11} fill="#fff" /> مختار
          </span>
        )}

        <span
          className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[0.7rem]"
          style={{ background: "rgba(0,0,0,0.65)", color: "#e8f5e9" }}
        >
          <Icon size={11} /> {WORK_LABEL[work.type]}
        </span>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-bold mb-1 line-clamp-2" style={{ color: "var(--theme-text, #e8f5e9)", lineHeight: 1.6 }}>
          {work.title}
        </h3>

        <p className="text-xs mb-3" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
          {work.ownerName}
          {work.ownerType ? ` — ${accountTypeLabel(work.ownerType)}` : ""}
        </p>

        <div
          className="mt-auto flex items-center gap-3 text-xs pt-2"
          style={{ color: "var(--theme-text-muted, #4a7a4a)", borderTop: "1px solid var(--p-10)" }}
        >
          <span className="flex items-center gap-1"><Eye size={13} /> {shortCount(work.views)}</span>
          <span className="flex items-center gap-1"><Heart size={13} /> {shortCount(work.likes)}</span>
        </div>
      </div>
    </Link>
  );
}
