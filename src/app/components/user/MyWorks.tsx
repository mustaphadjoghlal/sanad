import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Plus, Trash2, Eye, Heart, Star, Upload, X } from "lucide-react";
import { addWork, deleteWork, subscribeToUserWorks } from "../../../lib/firestore";
import { uploadWorkImage, uploadAudioSample } from "../../../lib/storage";
import type { UserProfile, Work, WorkType } from "../../../lib/types";
import { WORK_LABEL, shortCount, youtubeId } from "../../../lib/works";
import { WORK_ICON } from "../workIcons";

const TYPES: WorkType[] = ["article", "video", "image", "audio"];

/**
 * Per member. Storage and, more to the point, monthly transfer are finite,
 * and a gallery is better for being a selection rather than an archive.
 */
const MAX_WORKS = 20;

/** article and video are links the member pastes; image and audio are files. */
const IS_LINK: Record<WorkType, boolean> = {
  article: true,
  video: true,
  image: false,
  audio: false,
};

/**
 * The member's own corner of the public gallery: what they have published,
 * how it is doing, and the form to add to it.
 *
 * Separate from the portfolio list on the profile above. That one is a set of
 * links shown to whoever opens the profile; this is a published work with its
 * own page, its own counters and a chance of being featured — which is why it
 * is its own document rather than another entry in the profile's array.
 */
export default function MyWorks({ profile }: { profile: UserProfile }) {
  const [works, setWorks] = useState<Work[]>([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<WorkType>("article");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => subscribeToUserWorks(profile.id, setWorks), [profile.id]);

  const reset = () => {
    setTitle(""); setDescription(""); setUrl(""); setError(""); setProgress(0);
  };

  /** The fields copied onto the work so the gallery renders without joins. */
  const owner = () => ({
    ownerId: profile.id,
    ownerName: profile.name,
    ownerType: profile.type,
    ownerPhoto: profile.photo,
  });

  const publishLink = async () => {
    if (!title.trim() || !url.trim()) { setError("أدخل العنوان والرابط"); return; }
    if (!/^https?:\/\//i.test(url.trim())) { setError("الرابط يجب أن يبدأ بـ http أو https"); return; }
    if (type === "video" && !youtubeId(url)) {
      setError("رابط الفيديو يجب أن يكون من يوتيوب");
      return;
    }
    setBusy(true); setError("");
    try {
      await addWork({ ...owner(), type, title: title.trim(), description: description.trim() || undefined, url: url.trim() });
      reset(); setOpen(false);
    } catch {
      setError("تعذّر النشر. تأكد أن ملفك معتمد ثم حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  };

  const publishFile = async (file: File) => {
    if (!title.trim()) { setError("أدخل عنوان العمل أولاً"); return; }
    if (type === "audio" && file.size > 20 * 1024 * 1024) {
      setError("الملف الصوتي أكبر من 20 ميغابايت. اضغطه أو اختر مقطعاً أقصر.");
      return;
    }
    setBusy(true); setError(""); setProgress(0);
    try {
      if (type === "audio") {
        const url = await uploadAudioSample(profile.id, file, setProgress);
        await addWork({ ...owner(), type, title: title.trim(), description: description.trim() || undefined, url });
      } else {
        // Compressed on the way up, with a small cover for the grid.
        const { url, cover } = await uploadWorkImage(profile.id, file, setProgress);
        await addWork({ ...owner(), type, title: title.trim(), description: description.trim() || undefined, url, cover });
      }
      reset(); setOpen(false);
    } catch (e) {
      setError((e as Error)?.message ?? "فشل الرفع");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try { await deleteWork(id); } catch { setError("تعذّر الحذف"); }
    setConfirmId(null);
  };

  const pending = profile.status !== "approved";
  const full = works.length >= MAX_WORKS;

  return (
    <div className="p-6 rounded-2xl" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: "var(--p-15)", border: "1px solid var(--p-25)" }}>
            <Sparkles size={18} style={{ color: "var(--theme-accent)" }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: "var(--theme-text)" }}>أعمالي في المعرض</h2>
        </div>
        {!pending && (
          <button
            type="button"
            onClick={() => { setOpen((v) => !v); reset(); }}
            disabled={full && !open}
            title={full ? `الحد الأقصى ${MAX_WORKS} عملاً` : undefined}
            className="btn-dz inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-50"
          >
            {open ? <X size={15} /> : <Plus size={15} />}
            {open ? "إلغاء" : "نشر عمل"}
          </button>
        )}
      </div>

      <p className="text-sm mb-5" style={{ color: "var(--theme-text-muted)", lineHeight: 1.8 }}>
        ما تنشره هنا يظهر في{" "}
        <Link to="/works" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>معرض الأعمال</Link>{" "}
        لكل زوّار المنصة، بصفحة خاصة وعدّاد مشاهدات وإعجابات.
      </p>

      {full && !pending && (
        <div className="p-3 rounded-xl text-sm mb-4" style={{ background: "rgba(180,120,0,0.08)", border: "1px solid rgba(180,120,0,0.3)", color: "#fbbf24", lineHeight: 1.8 }}>
          بلغت الحد الأقصى ({MAX_WORKS} عملاً). احذف عملاً قديماً لتنشر جديداً — المعرض أفضل حين يكون مختارات لا أرشيفاً.
        </div>
      )}

      {pending && (
        <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(180,120,0,0.08)", border: "1px solid rgba(180,120,0,0.3)", color: "#fbbf24", lineHeight: 1.8 }}>
          يمكنك النشر في المعرض بعد اعتماد ملفك من إدارة المنصة.
        </div>
      )}

      {open && !pending && (
        <div className="p-4 rounded-xl mb-5" style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}>
          <div className="flex gap-2 flex-wrap mb-4">
            {TYPES.map((t) => {
              const Icon = WORK_ICON[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setError(""); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                  style={{
                    background: type === t ? "var(--p-25)" : "transparent",
                    border: `1px solid ${type === t ? "var(--theme-accent)" : "var(--p-20)"}`,
                    color: type === t ? "var(--theme-text)" : "var(--theme-text-muted)",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={14} /> {WORK_LABEL[t]}
                </button>
              );
            })}
          </div>

          <label htmlFor="work-title" className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>
            عنوان العمل
          </label>
          <input
            id="work-title"
            className="input-dz w-full px-4 py-2.5 rounded-lg mb-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="تحقيق عن واقع الإذاعات المحلية"
          />

          <label htmlFor="work-desc" className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>
            وصف (اختياري)
          </label>
          <textarea
            id="work-desc"
            className="input-dz w-full px-4 py-2.5 rounded-lg mb-3"
            style={{ minHeight: "90px", resize: "vertical", lineHeight: 1.8 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            placeholder="عمّ يتحدث، ومتى أنجزته، وما دورك فيه."
          />

          {IS_LINK[type] ? (
            <>
              <label htmlFor="work-url" className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>
                {type === "video" ? "رابط يوتيوب" : "رابط المقال"}
              </label>
              <input
                id="work-url"
                className="input-dz w-full px-4 py-2.5 rounded-lg mb-4"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                dir="ltr"
                placeholder={type === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
              />
              <button type="button" onClick={publishLink} disabled={busy} className="btn-dz px-5 py-2.5 rounded-xl text-sm disabled:opacity-50">
                {busy ? "جاري النشر..." : "نشر"}
              </button>
            </>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={type === "audio" ? "audio/*" : "image/*"}
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) publishFile(f); e.target.value = ""; }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="btn-dz inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm disabled:opacity-50"
              >
                <Upload size={15} />
                {busy ? `جاري الرفع... ${progress}%` : type === "audio" ? "اختر ملفاً صوتياً" : "اختر صورة"}
              </button>
            </>
          )}

          {error && <p role="alert" className="text-sm mt-3" style={{ color: "#f87171" }}>{error}</p>}
        </div>
      )}

      {works.length === 0 ? (
        !pending && (
          <p className="text-sm" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
            لم تنشر أي عمل بعد.
          </p>
        )
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 13rem), 1fr))" }}>
          {works.map((w) => {
            const Icon = WORK_ICON[w.type];
            return (
              <div key={w.id} className="p-3 rounded-xl" style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}>
                <div className="flex items-start gap-2 mb-2">
                  <Icon size={14} className="shrink-0 mt-1" style={{ color: "var(--theme-text-muted)" }} />
                  <Link
                    to={`/works/${w.id}`}
                    className="text-sm font-bold flex-1 line-clamp-2"
                    style={{ color: "var(--theme-text)", textDecoration: "none", lineHeight: 1.6 }}
                  >
                    {w.title}
                  </Link>
                  {w.featured && <Star size={13} className="shrink-0 mt-1" fill="#fbbf24" style={{ color: "#fbbf24" }} />}
                </div>

                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--theme-text-muted)" }}>
                  <span className="flex items-center gap-1"><Eye size={12} /> {shortCount(w.views)}</span>
                  <span className="flex items-center gap-1"><Heart size={12} /> {shortCount(w.likes)}</span>
                  <button
                    type="button"
                    onClick={() => setConfirmId(w.id)}
                    title="حذف العمل"
                    aria-label={`حذف ${w.title}`}
                    className="mr-auto p-1 rounded"
                    style={{ color: "#f87171", background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {confirmId === w.id && (
                  <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid var(--p-15)" }}>
                    <button
                      type="button"
                      onClick={() => remove(w.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: "#b91c1c", color: "#fff", border: "none", cursor: "pointer" }}
                    >
                      حذف نهائي
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: "var(--p-15)", color: "var(--theme-text)", border: "1px solid var(--p-25)", cursor: "pointer" }}
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
