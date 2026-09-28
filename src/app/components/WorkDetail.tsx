import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowRight, Eye, Heart, Star, ExternalLink, User } from "lucide-react";
import { auth } from "../../lib/firebase";
import { getWork, countWorkView, toggleWorkLike, subscribeToUserWorks } from "../../lib/firestore";
import type { Work } from "../../lib/types";
import { accountTypeLabel } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";
import { useStructuredData, breadcrumbs } from "../../lib/structuredData";
import { WORK_LABEL, shortCount, youtubeId } from "../../lib/works";
import WorkCard from "./WorkCard";
import { WORK_ICON } from "./workIcons";

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState("");
  const [more, setMore] = useState<Work[]>([]);

  usePageTitle(
    work?.title ?? "",
    work ? `${work.title} — ${work.ownerName} · عمل منشور على منصة سند الإعلامية` : undefined,
    { type: "article" }
  );

  useEffect(() => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)), []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getWork(id).then((data) => {
      if (cancelled) return;
      setWork(data);
      setLoading(false);
      // Counted once per work per session, inside the helper.
      if (data) countWorkView(data.id);
    });
    return () => { cancelled = true; };
  }, [id]);

  // More from the same member, so a visitor has somewhere to go next.
  useEffect(() => {
    if (!work?.ownerId) return;
    return subscribeToUserWorks(work.ownerId, (all) =>
      setMore(all.filter((w) => w.id !== work.id).slice(0, 4))
    );
  }, [work?.ownerId, work?.id]);

  useStructuredData(
    work
      ? [
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: work.title,
            description: work.description || undefined,
            author: { "@type": "Person", name: work.ownerName },
            datePublished: new Date(work.createdAt).toISOString(),
            inLanguage: "ar",
            interactionStatistic: [
              { "@type": "InteractionCounter", interactionType: "https://schema.org/ViewAction", userInteractionCount: work.views },
              { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: work.likes },
            ],
            url: `https://sanadz.media/works/${work.id}`,
          },
          breadcrumbs([
            { name: "معرض الأعمال", path: "/works" },
            { name: work.title, path: `/works/${work.id}` },
          ]),
        ]
      : null
  );

  const liked = !!uid && !!work?.likedBy?.includes(uid);

  const like = async () => {
    if (!work || !uid || liking) return;
    setLiking(true);
    setLikeError("");
    // Moved locally first so the button answers immediately; put back if the
    // write is refused.
    const optimistic = {
      ...work,
      likes: work.likes + (liked ? -1 : 1),
      likedBy: liked ? work.likedBy.filter((u) => u !== uid) : [...(work.likedBy ?? []), uid],
    };
    setWork(optimistic);
    try {
      await toggleWorkLike(work, uid);
    } catch {
      setWork(work);
      setLikeError("تعذّر تسجيل الإعجاب. حاول مجدداً.");
    } finally {
      setLiking(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</span>
      </div>
    );
  }

  if (!work) {
    return (
      <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <span style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "1.25rem" }}>هذا العمل غير موجود</span>
        <Link to="/works" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>← العودة إلى المعرض</Link>
      </div>
    );
  }

  const Icon = WORK_ICON[work.type];
  const videoId = work.type === "video" ? youtubeId(work.url) : null;

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: "52rem" }}>
        <Link to="/works" className="inline-flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--theme-text-secondary, #6aad6a)", textDecoration: "none" }}>
          <ArrowRight size={15} /> معرض الأعمال
        </Link>

        <div className="flex flex-col gap-5">
          {/* The work itself */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
            {videoId ? (
              <div style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title={work.title}
                  allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              </div>
            ) : work.type === "image" ? (
              <img src={work.url} alt={work.title} className="w-full" style={{ display: "block" }} />
            ) : work.type === "audio" ? (
              <div className="p-6">
                <audio controls src={work.url} style={{ width: "100%" }}>
                  متصفحك لا يدعم تشغيل الصوت.
                </audio>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center gap-4">
                {work.cover && <img src={work.cover} alt={work.title} className="w-full rounded-xl" />}
                <a
                  href={work.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-dz inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
                  style={{ textDecoration: "none" }}
                >
                  <ExternalLink size={15} /> قراءة المقال
                </a>
              </div>
            )}
          </div>

          {/* Title, counters and the like button */}
          <div className="rounded-2xl p-6" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
            <div className="flex items-start gap-3 mb-3 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs shrink-0" style={{ background: "var(--p-15)", color: "var(--theme-badge-text, #81c784)" }}>
                <Icon size={12} /> {WORK_LABEL[work.type]}
              </span>
              {work.featured && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs shrink-0" style={{ background: "rgba(180,120,0,0.18)", color: "#fbbf24", border: "1px solid rgba(180,120,0,0.4)" }}>
                  <Star size={12} fill="#fbbf24" /> اختيار المنصة
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--theme-text, #e8f5e9)", lineHeight: 1.6 }}>
              {work.title}
            </h1>

            {work.description && (
              <div className="mb-5">
                {work.description.split(/\n+/).map((line, i) => (
                  <p key={i} className="text-sm mb-2" style={{ color: "var(--theme-text-secondary, #a5d6a7)", lineHeight: 1.9 }}>
                    {line}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 flex-wrap pt-4" style={{ borderTop: "1px solid var(--p-15)" }}>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
                <Eye size={16} /> {shortCount(work.views)} مشاهدة
              </span>

              <button
                type="button"
                onClick={like}
                disabled={!uid || liking}
                title={uid ? (liked ? "إلغاء الإعجاب" : "أعجبني") : "سجّل الدخول للإعجاب"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors disabled:opacity-60"
                style={{
                  background: liked ? "rgba(198,40,40,0.15)" : "var(--p-12)",
                  border: `1px solid ${liked ? "rgba(198,40,40,0.4)" : "var(--p-20)"}`,
                  color: liked ? "#f87171" : "var(--theme-text-secondary, #6aad6a)",
                  cursor: uid ? "pointer" : "not-allowed",
                }}
              >
                <Heart size={15} fill={liked ? "#f87171" : "none"} />
                {shortCount(work.likes)}
              </button>

              {!uid && (
                <Link to="/login" className="text-xs" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>
                  سجّل الدخول للإعجاب
                </Link>
              )}
            </div>

            {likeError && (
              <p role="alert" className="text-xs mt-3" style={{ color: "#f87171" }}>{likeError}</p>
            )}
          </div>

          {/* Its author */}
          <Link
            to={`/profile/${work.ownerId}`}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "var(--p-08)", border: "1px solid var(--p-15)", textDecoration: "none" }}
          >
            {work.ownerPhoto ? (
              <img src={work.ownerPhoto} alt="" className="rounded-full object-cover" style={{ width: "3rem", height: "3rem" }} />
            ) : (
              <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: "3rem", height: "3rem", background: "var(--p-15)" }}>
                <User size={20} style={{ color: "var(--theme-text-muted)" }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-sm" style={{ color: "var(--theme-text, #e8f5e9)" }}>{work.ownerName}</p>
              <p className="text-xs" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
                {work.ownerType ? accountTypeLabel(work.ownerType) : "عضو في المنصة"}
              </p>
            </div>
            <ArrowRight size={16} className="mr-auto shrink-0" style={{ color: "var(--theme-text-muted)" }} />
          </Link>

          {more.length > 0 && (
            <div>
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--theme-badge-text, #81c784)" }}>
                أعمال أخرى لـ {work.ownerName}
              </h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 12rem), 1fr))" }}>
                {more.map((w) => <WorkCard key={w.id} work={w} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
