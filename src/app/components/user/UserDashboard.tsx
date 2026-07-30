import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import {
  LogOut, User, Plus, X, ShoppingCart, Mic, BookOpen, Pencil, Check,
  AlertTriangle, Award, ImageIcon, Youtube, Trash2,
  Upload, Play, Pause, FileText,
} from "lucide-react";
import { auth } from "../../../lib/firebase";
import {
  subscribeToUserProfile,
  saveUserProfile,
  resubmitProfile,
  sendNotification,
  isUsernameAvailable,
} from "../../../lib/firestore";
import { uploadProfilePhoto, uploadAudioSample, uploadImage } from "../../../lib/storage";
import type { UserProfile, PortfolioWork, WorkType, AudioSample, Gender, VoiceSampleCategory, SocialLinks } from "../../../lib/types";
import { VOICE_SAMPLE_CATEGORIES } from "../../../lib/types";
import StoreManager from "../StoreManager";
import TrainerManager from "../TrainerManager";
import WorksSection from "../WorksSection";

const typeLabel: Record<string, string> = {
  editor_news:        "محرر",
  web_digital:        "ويب ديجيتال",
  presenter_programs: "مقدم برامج",
  presenter_news:     "مقدم أخبار",
  monteur:            "مونتير",
  graphic_designer:   "جرافيك ديزاينر",
  cameraman:          "كاميرا مان",
  producer:           "منتج",
  director:           "مخرج",
  program_writer:     "معد برامج",
  voice:              "معلق صوتي",
  host_stage:         "منشط على الركح",
  student:            "طالب إعلام",
  other:              "إعلامي",
  journalist:         "صحفي / مراسل",
  photographer:       "مصور فوتوغرافي / فيديو",
  editor:             "مخرج / مونتير",
  store:              "متجر احترافي",
  vendor:             "بائع عتاد",
  trainer:            "مدرب / مركز تدريب",
};

const typeIcon: Record<string, React.ElementType> = {
  journalist: BookOpen,
  voice: Mic,
  vendor: ShoppingCart,
  store: ShoppingCart,
};

const statusStyle: Record<string, React.CSSProperties> = {
  pending: { background: "rgba(180,120,0,0.2)", color: "#fbbf24", border: "1px solid rgba(180,120,0,0.3)", padding: "0.2rem 0.7rem", borderRadius: "9999px", fontSize: "0.75rem" },
  approved: { background: "var(--p-20)", color: "#4ade80", border: "1px solid var(--p-30)", padding: "0.2rem 0.7rem", borderRadius: "9999px", fontSize: "0.75rem" },
  rejected: { background: "rgba(198,40,40,0.1)", color: "#f87171", border: "1px solid rgba(198,40,40,0.3)", padding: "0.2rem 0.7rem", borderRadius: "9999px", fontSize: "0.75rem" },
};

const statusLabel: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مُعتمد",
  rejected: "مرفوض",
};

const S = {
  card: {
    background: "linear-gradient(145deg, #141414, #101010)",
    border: "1px solid var(--p-25)",
    borderRadius: "0.75rem",
  } as React.CSSProperties,
  input: {
    background: "#161616",
    border: "1px solid var(--p-30)",
    color: "var(--theme-text, #e8f5e9)",
    borderRadius: "0.5rem",
    padding: "0.6rem 0.85rem",
    width: "100%",
    fontSize: "0.875rem",
  } as React.CSSProperties,
  label: { color: "var(--theme-badge-text, #81c784)", fontSize: "0.8rem", display: "block", marginBottom: "0.35rem" } as React.CSSProperties,
  th: { color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.75rem", fontWeight: 500, padding: "0.75rem 1rem", textAlign: "right" as const, borderBottom: "1px solid var(--p-15)" },
  td: { color: "var(--theme-text, #c8e6c9)", fontSize: "0.875rem", padding: "0.85rem 1rem", textAlign: "right" as const, borderBottom: "1px solid var(--p-08)" },
};

import { WILAYAS } from "../../../lib/wilayas";
const wilayas = WILAYAS;

type EditFormState = {
  name: string;
  bio: string;
  specialty: string;
  location: string;
  phone: string;
  experience: string;
  achievements: string;
  works: PortfolioWork[];
  username: string;
  tagline: string;
  gender: Gender | "";
  audioSamples: AudioSample[];
  socialLinks: SocialLinks;
};

const workTypeLabel: Record<WorkType, string> = {
  article: "مقال",
  video: "فيديو",
  audio: "عمل صوتي",
  image: "صورة",
};

const workTypeIcon: Record<WorkType, React.ElementType> = {
  article: FileText,
  video: Youtube,
  audio: Mic,
  image: ImageIcon,
};

function genWorkId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function encodeWAV(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numCh * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  const ab = new ArrayBuffer(bufferLength);
  const view = new DataView(ab);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);
  const channels = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up"
        style={{ ...S.card, boxShadow: "0 24px 60px rgba(0,0,0,0.6)", opacity: 0, animationFillMode: "forwards" }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--p-20)" }}>
          <h3 style={{ color: "var(--theme-text, #e8f5e9)", fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function AccountSettings({ uid }: { uid: string }) {
  const navigate = useNavigate();
  const [section, setSection] = useState<"none" | "password" | "delete">("none");
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const [delMsg, setDelMsg] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwNew.length < 8) { setPwMsg({ type: "err", text: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" }); return; }
    if (pwNew !== pwConfirm) { setPwMsg({ type: "err", text: "كلمتا المرور غير متطابقتان" }); return; }
    setPwLoading(true);
    try {
      const user = auth.currentUser!;
      const cred = EmailAuthProvider.credential(user.email!, pwCurrent);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pwNew);
      setPwMsg({ type: "ok", text: "تم تغيير كلمة المرور بنجاح" });
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setPwMsg({ type: "err", text: "كلمة المرور الحالية غير صحيحة" });
      } else {
        setPwMsg({ type: "err", text: "حدث خطأ. يرجى المحاولة مجدداً." });
      }
    } finally { setPwLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!delMsg.trim()) return;
    setDelLoading(true);
    try {
      const user = auth.currentUser!;
      const cred = EmailAuthProvider.credential(user.email!, delMsg.trim());
      await reauthenticateWithCredential(user, cred);
      const { deleteDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../../../lib/firebase");
      await deleteDoc(doc(db, "users", uid));
      await deleteUser(user);
      navigate("/");
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setDelMsg("");
        alert("كلمة المرور غير صحيحة");
      } else {
        alert("حدث خطأ. يرجى المحاولة مجدداً.");
      }
    } finally { setDelLoading(false); }
  };

  return (
    <div className="p-5 mb-6 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", borderRadius: "0.75rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>
      <div className="flex items-center gap-2 mb-4">
        <User size={16} style={{ color: "var(--theme-accent)" }} />
        <span style={{ color: "var(--theme-text)", fontWeight: 600 }}>إعدادات الحساب</span>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => setSection(section === "password" ? "none" : "password")}
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text)", background: section === "password" ? "var(--p-15)" : "transparent" }}
        >
          تغيير كلمة المرور
        </button>
        <button
          onClick={() => setSection(section === "delete" ? "none" : "delete")}
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ border: "1px solid rgba(198,40,40,0.3)", color: "#f87171", background: section === "delete" ? "rgba(198,40,40,0.08)" : "transparent" }}
        >
          حذف الحساب
        </button>
      </div>

      {section === "password" && (
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          {pwMsg && (
            <div className="p-3 rounded-lg text-sm" style={{ background: pwMsg.type === "ok" ? "rgba(0,100,50,0.15)" : "rgba(198,40,40,0.1)", border: `1px solid ${pwMsg.type === "ok" ? "rgba(0,163,85,0.3)" : "rgba(198,40,40,0.3)"}`, color: pwMsg.type === "ok" ? "#4ade80" : "#f87171" }}>
              {pwMsg.text}
            </div>
          )}
          <div>
            <label style={{ color: "var(--theme-badge-text)", fontSize: "0.8rem", display: "block", marginBottom: "0.35rem" }}>كلمة المرور الحالية</label>
            <input type="password" style={{ background: "#161616", border: "1px solid var(--p-30)", color: "var(--theme-text)", borderRadius: "0.5rem", padding: "0.6rem 0.85rem", width: "100%", fontSize: "0.875rem" }} value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} />
          </div>
          <div>
            <label style={{ color: "var(--theme-badge-text)", fontSize: "0.8rem", display: "block", marginBottom: "0.35rem" }}>كلمة المرور الجديدة</label>
            <input type="password" style={{ background: "#161616", border: "1px solid var(--p-30)", color: "var(--theme-text)", borderRadius: "0.5rem", padding: "0.6rem 0.85rem", width: "100%", fontSize: "0.875rem" }} value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="8 أحرف على الأقل" />
          </div>
          <div>
            <label style={{ color: "var(--theme-badge-text)", fontSize: "0.8rem", display: "block", marginBottom: "0.35rem" }}>تأكيد كلمة المرور</label>
            <input type="password" style={{ background: "#161616", border: "1px solid var(--p-30)", color: "var(--theme-text)", borderRadius: "0.5rem", padding: "0.6rem 0.85rem", width: "100%", fontSize: "0.875rem" }} value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50">
            {pwLoading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
          </button>
        </form>
      )}

      {section === "delete" && (
        <div className="max-w-md">
          <p className="text-sm mb-3" style={{ color: "#f87171", lineHeight: 1.6 }}>
            سيتم حذف حسابك وملفك الشخصي نهائياً ولا يمكن استرجاعه. أدخل كلمة مرورك للتأكيد.
          </p>
          <div className="flex gap-3">
            <input type="password" style={{ background: "#161616", border: "1px solid rgba(198,40,40,0.4)", color: "var(--theme-text)", borderRadius: "0.5rem", padding: "0.6rem 0.85rem", flex: 1, fontSize: "0.875rem" }} value={delMsg} onChange={(e) => setDelMsg(e.target.value)} placeholder="كلمة المرور" />
            <button onClick={handleDeleteAccount} disabled={delLoading || !delMsg.trim()} className="px-4 py-2 rounded-lg text-sm disabled:opacity-40" style={{ background: "rgba(198,40,40,0.2)", border: "1px solid rgba(198,40,40,0.4)", color: "#f87171" }}>
              {delLoading ? "..." : "حذف"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    bio: "",
    specialty: "",
    location: "",
    phone: "",
    experience: "",
    achievements: "",
    works: [],
    username: "",
    tagline: "",
    gender: "",
    audioSamples: [],
    socialLinks: {},
  });
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const showUploadToast = (msg: string) => {
    setUploadToast(msg);
    setTimeout(() => setUploadToast(null), 3000);
  };

  // Photo upload state
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Works (portfolio) addition state
  const [showAddWork, setShowAddWork] = useState(false);
  const [newWorkType, setNewWorkType] = useState<WorkType>("article");
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [newWorkUrl, setNewWorkUrl] = useState(""); // for article/video
  const [uploadingWork, setUploadingWork] = useState(false);
  const [workUploadProgress, setWorkUploadProgress] = useState(0);

  // Audio sample state
  const [showAddAudio, setShowAddAudio] = useState(false);
  const [newAudioTitle, setNewAudioTitle] = useState("");
  const [newAudioCategory, setNewAudioCategory] = useState<VoiceSampleCategory>("وثائقي");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [audioPlayingIdx, setAudioPlayingIdx] = useState<number | null>(null);
  const audioPreviewRef = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setUid(user.uid);
        setAuthLoading(false);
      }
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToUserProfile(uid, (p) => {
      if (p === null && !authLoading) {
        navigate("/login");
      }
      setProfile(p);
    });
    return unsub;
  }, [uid, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const startEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name || "",
      bio: profile.bio || "",
      specialty: profile.specialty || "",
      location: profile.location || "",
      phone: profile.phone || "",
      experience: profile.experience || "",
      achievements: profile.achievements || "",
      works: profile.works ? [...profile.works] : [],
      username: profile.username || "",
      tagline: profile.tagline || "",
      gender: profile.gender || "",
      audioSamples: profile.audioSamples ? [...profile.audioSamples] : [],
      socialLinks: profile.socialLinks ?? {},
    });
    setUsernameStatus("idle");
    setPhotoUrl(profile.photo || "");
    setShowAddWork(false);
    setNewWorkType("article");
    setNewWorkTitle("");
    setNewWorkUrl("");
    setShowAddAudio(false);
    setNewAudioTitle("");
    setNewAudioCategory("وثائقي");
    setEditing(true);
    setEditError("");
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uid || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingPhoto(true);
    try {
      const url = await uploadProfilePhoto(uid, file);
      setPhotoUrl(url);
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "خطأ غير معروف";
      setEditError(`فشل رفع الصورة: ${msg}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveWork = (id: string) => {
    setEditForm((p) => ({ ...p, works: p.works.filter((w) => w.id !== id) }));
  };

  const handleAddLinkWork = () => {
    // For article / video types — stored as a link, no upload
    if (!newWorkTitle.trim() || !newWorkUrl.trim()) return;
    setEditForm((p) => ({
      ...p,
      works: [...p.works, { id: genWorkId(), type: newWorkType, title: newWorkTitle.trim(), url: newWorkUrl.trim() }],
    }));
    setNewWorkTitle("");
    setNewWorkUrl("");
    setShowAddWork(false);
  };

  const handleWorkFileUpload = async (file: File) => {
    if (!uid) return;
    if (!newWorkTitle.trim()) {
      setEditError(newWorkType === "audio" ? "أدخل عنوان العمل الصوتي أولاً" : "أدخل عنوان العمل أولاً");
      return;
    }
    setUploadingWork(true);
    setWorkUploadProgress(0);
    setEditError("");
    try {
      if (newWorkType === "audio") {
        // Any uploaded video/audio file is converted to an audio file (wav)
        let audioFile = file;
        if (file.type.startsWith("video/")) {
          let audioBuf: AudioBuffer;
          const audioCtx = new AudioContext();
          try {
            const arrayBuf = await file.arrayBuffer();
            audioBuf = await audioCtx.decodeAudioData(arrayBuf);
          } catch {
            audioCtx.close();
            throw new Error("تعذر استخراج الصوت من هذا الفيديو. جرّب صيغة MP4 أو ارفع ملفاً صوتياً مباشرة.");
          }
          const offlineCtx = new OfflineAudioContext(audioBuf.numberOfChannels, audioBuf.length, audioBuf.sampleRate);
          const source = offlineCtx.createBufferSource();
          source.buffer = audioBuf;
          source.connect(offlineCtx.destination);
          source.start(0);
          const rendered = await offlineCtx.startRendering();
          const wavData = encodeWAV(rendered);
          audioFile = new File([wavData], file.name.replace(/\.[^.]+$/, ".wav"), { type: "audio/wav" });
          audioCtx.close();
        }
        const url = await uploadAudioSample(uid, audioFile, (p) => setWorkUploadProgress(p));
        setEditForm((p) => ({ ...p, works: [...p.works, { id: genWorkId(), type: "audio", title: newWorkTitle.trim(), url }] }));
        showUploadToast("✓ تم رفع العمل الصوتي بنجاح");
      } else if (newWorkType === "image") {
        const url = await uploadImage(`works/${uid}`, file, (p) => setWorkUploadProgress(p));
        setEditForm((p) => ({ ...p, works: [...p.works, { id: genWorkId(), type: "image", title: newWorkTitle.trim(), url }] }));
        showUploadToast("✓ تم رفع الصورة بنجاح");
      }
      setNewWorkTitle("");
      setShowAddWork(false);
    } catch (err: unknown) {
      setEditError((err as Error)?.message ?? "فشل رفع الملف");
    } finally {
      setUploadingWork(false);
    }
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setEditForm((p) => ({ ...p, username: clean }));
    if (!clean) { setUsernameStatus("idle"); return; }
    if (clean.length < 3) { setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      if (!uid) return;
      const available = await isUsernameAvailable(clean, uid);
      setUsernameStatus(available ? "available" : "taken");
    }, 600);
    return () => clearTimeout(timer);
  };

  const handleSaveEdit = async () => {
    if (!uid || !profile) return;
    if (!editForm.name?.trim()) { setEditError("الاسم مطلوب"); return; }
    if (profile.type === "store" && editForm.username && usernameStatus === "taken") {
      setEditError("هذا الاسم مستخدم، اختر اسماً آخر"); return;
    }
    if (profile.type === "store" && editForm.username && usernameStatus === "invalid") {
      setEditError("الاسم يجب أن يكون 3 أحرف على الأقل"); return;
    }
    setSaving(true);
    try {
      await saveUserProfile(uid, {
        email: profile.email,
        name: editForm.name,
        type: profile.type,
        bio: editForm.bio,
        photo: photoUrl || profile.photo,
        achievements: editForm.achievements || undefined,
        works: editForm.works.length > 0 ? editForm.works : undefined,
        tagline: editForm.tagline || undefined,
        gender: editForm.gender || undefined,
        audioSamples: editForm.audioSamples.length > 0 ? editForm.audioSamples : undefined,
        specialty: editForm.specialty || undefined,
        location: editForm.location || undefined,
        phone: editForm.phone || undefined,
        experience: editForm.experience || undefined,
        socialLinks: Object.keys(editForm.socialLinks).length > 0 ? editForm.socialLinks : undefined,
        otherType: profile.otherType,
        storeStatus: profile.storeStatus,
        username: profile.type === "store" && editForm.username ? editForm.username.toLowerCase() : undefined,
      });
      if (profile.status === "rejected") {
        await resubmitProfile(uid);
        await sendNotification({
          title: "إعادة تقديم ملف شخصي 🔄",
          body: `${editForm.name} أعاد تقديم ملفه الشخصي بعد الرفض`,
          link: "/sanad-admin",
          createdAt: Date.now(),
        }).catch(() => {});
      }
      setEditing(false);
    } catch {
      setEditError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl" style={{ background: "#0e0e0e" }}>
        <div style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</div>
      </div>
    );
  }

  const TypeIcon = typeIcon[profile.type] || User;

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "#0e0e0e" }}>
      {uploadToast && (
        <div
          className="fixed top-4 left-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm animate-fade-in-up"
          style={{ transform: "translateX(-50%)", background: "rgba(0,100,50,0.95)", border: "1px solid rgba(0,163,85,0.4)", color: "#e8f5e9", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
        >
          <Check size={15} />
          <span>{uploadToast}</span>
        </div>
      )}
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--p-20)", background: "rgba(8,11,8,0.96)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-4">
          <Link to="/" style={{ textDecoration: "none" }}>
            <span className="font-bold text-xl" style={{ background: "linear-gradient(90deg, var(--theme-accent, #00a355), color-mix(in srgb, var(--theme-accent, #00a355) 70%, #ffffff))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              سند
            </span>
          </Link>
          <span style={{ color: "var(--p-25)", fontSize: "0.75rem" }}>/</span>
          <span style={{ color: "var(--theme-text-muted)", fontSize: "0.82rem" }}>لوحة التحكم</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ color: "var(--theme-text-secondary, #6aad6a)", textDecoration: "none", border: "1px solid var(--p-20)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-35)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-20)"; }}
          >
            الرئيسية
          </Link>
          <span className="hidden sm:block text-sm" style={{ color: "var(--theme-text-muted)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ color: "#ef9a9a", border: "1px solid rgba(198,40,40,0.25)" }}
          >
            <LogOut size={15} />
            <span>خروج</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Card */}
        <div
          className="p-6 mb-6 animate-fade-in-up"
          style={{ ...S.card, opacity: 0, animationFillMode: "forwards" }}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* Avatar */}
            {!editing ? (
              <div className="flex-shrink-0">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--p-40)" }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--p-20)", border: "1px solid var(--p-35)" }}
                  >
                    <TypeIcon size={26} style={{ color: "var(--theme-accent, #00a355)" }} />
                  </div>
                )}
              </div>
            ) : null}

            {/* Info */}
            <div className="flex-1 min-w-0">
              {!editing ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>{profile.name}</h2>
                    <span style={{
                      background: "var(--p-15)", color: "var(--theme-badge-text, #81c784)",
                      border: "1px solid var(--p-30)", padding: "0.15rem 0.6rem",
                      borderRadius: "9999px", fontSize: "0.75rem"
                    }}>
                      {typeLabel[profile.type] ?? profile.type}
                    </span>
                    <span style={statusStyle[profile.status]}>{statusLabel[profile.status]}</span>
                  </div>

                  {profile.specialty && <p style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem", marginBottom: "0.25rem" }}>{profile.specialty}</p>}
                  {profile.location && <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>{profile.location}</p>}
                  {profile.bio && <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.6 }}>{profile.bio}</p>}

                  {/* Achievements */}
                  {profile.achievements && (
                    <div className="mt-4 flex items-start gap-2">
                      <Award size={16} style={{ color: "#fbbf24", flexShrink: 0, marginTop: "0.15rem" }} />
                      <div>
                        <p style={{ color: "#fbbf24", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.2rem" }}>أبرز الإنجازات</p>
                        <p style={{ color: "var(--theme-text, #c8e6c9)", fontSize: "0.85rem", lineHeight: 1.6 }}>{profile.achievements}</p>
                      </div>
                    </div>
                  )}

                  {/* Rejection note */}
                  {profile.status === "rejected" && profile.rejectionNote && (
                    <div
                      className="mt-4 p-3 rounded-lg flex items-start gap-2"
                      style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)" }}
                    >
                      <AlertTriangle size={16} style={{ color: "#f87171", flexShrink: 0, marginTop: "0.1rem" }} />
                      <div>
                        <p style={{ color: "#f87171", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>سبب الرفض:</p>
                        <p style={{ color: "#fca5a5", fontSize: "0.8rem" }}>{profile.rejectionNote}</p>
                        <button
                          onClick={startEdit}
                          className="mt-2 text-sm px-3 py-1 rounded-lg"
                          style={{ background: "rgba(198,40,40,0.2)", color: "#f87171", border: "1px solid rgba(198,40,40,0.3)" }}
                        >
                          تعديل وإعادة الإرسال
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={startEdit}
                      className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
                      style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)" }}
                    >
                      <Pencil size={14} />
                      <span>تعديل الملف</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Edit form */
                <div className="space-y-4 w-full">
                  {editError && (
                    <div className="p-2 rounded text-sm" style={{ background: "rgba(198,40,40,0.1)", color: "#f87171" }}>{editError}</div>
                  )}

                  {/* Photo upload */}
                  <div>
                    <label style={S.label}>صورة شخصية</label>
                    <div className="flex items-center gap-3">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="preview"
                          style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--p-40)", flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--p-15)", border: "1px solid var(--p-30)" }}
                        >
                          <ImageIcon size={22} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
                        </div>
                      )}
                      <div>
                        <label
                          htmlFor="photo-upload"
                          style={{
                            cursor: uploadingPhoto ? "not-allowed" : "pointer",
                            background: "var(--p-12)",
                            border: "1px solid var(--p-30)",
                            color: uploadingPhoto ? "var(--theme-text-muted, #4a7a4a)" : "var(--theme-badge-text, #81c784)",
                            padding: "0.35rem 0.85rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.8rem",
                            display: "inline-block",
                          }}
                        >
                          {uploadingPhoto ? "جاري الرفع..." : "اختر صورة"}
                        </label>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={uploadingPhoto}
                          onChange={handlePhotoChange}
                        />
                        <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem", marginTop: "0.25rem" }}>JPG أو PNG، يُرفع فوراً</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label style={S.label}>الاسم الكامل *</label>
                      <input style={S.input} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>{profile.type === "store" ? "نوع المعدات" : "التخصص"}</label>
                      <input style={S.input} value={editForm.specialty} onChange={(e) => setEditForm((p) => ({ ...p, specialty: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>الولاية</label>
                      <select style={S.input} value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}>
                        <option value="">اختر الولاية</option>
                        {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={S.label}>رقم الهاتف</label>
                      <input style={S.input} value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} dir="ltr" />
                    </div>
                    {profile.type !== "store" && (
                      <div>
                        <label style={S.label}>سنوات الخبرة</label>
                        <input style={S.input} value={editForm.experience} onChange={(e) => setEditForm((p) => ({ ...p, experience: e.target.value }))} />
                      </div>
                    )}
                    {profile.type === "store" && (
                      <div className="md:col-span-2">
                        <label style={S.label}>رابط المتجر المخصص (username)</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--theme-text-muted)", fontSize: "0.85rem", pointerEvents: "none" }}>
                            sanadz.media/stores/
                          </span>
                          <input
                            style={{ ...S.input, paddingRight: "175px" }}
                            value={editForm.username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            placeholder="mustastore"
                            dir="ltr"
                            maxLength={30}
                          />
                        </div>
                        <div style={{ fontSize: "0.75rem", marginTop: "0.3rem" }}>
                          {usernameStatus === "checking" && <span style={{ color: "var(--theme-text-dim)" }}>جاري التحقق...</span>}
                          {usernameStatus === "available" && <span style={{ color: "#4ade80" }}>✓ الاسم متاح</span>}
                          {usernameStatus === "taken" && <span style={{ color: "#f87171" }}>✗ الاسم مستخدم بالفعل</span>}
                          {usernameStatus === "invalid" && <span style={{ color: "#fbbf24" }}>3 أحرف على الأقل، أحرف لاتينية وأرقام و _</span>}
                          {usernameStatus === "idle" && editForm.username === "" && <span style={{ color: "var(--theme-text-dim)" }}>أحرف لاتينية، أرقام و _ فقط</span>}
                        </div>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label style={S.label}>{profile.type === "store" ? "وصف المتجر" : "نبذة / CV"}</label>
                      <textarea style={{ ...S.input, minHeight: "70px", resize: "vertical" }} value={editForm.bio} onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))} />
                    </div>
                    {profile.type !== "store" && (
                      <div className="md:col-span-2">
                        <label style={S.label}>أبرز الإنجازات</label>
                        <textarea
                          style={{ ...S.input, minHeight: "60px", resize: "vertical" }}
                          value={editForm.achievements}
                          onChange={(e) => setEditForm((p) => ({ ...p, achievements: e.target.value }))}
                          placeholder="اذكر أبرز إنجازاتك المهنية..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Voice-specific fields */}
                  {(profile.type === "voice" || profile.type === "host_stage") && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label style={S.label}>عبارة تعريفية (Tagline)</label>
                          <input
                            style={S.input}
                            value={editForm.tagline}
                            onChange={(e) => setEditForm((p) => ({ ...p, tagline: e.target.value }))}
                            placeholder="مثال: صوت يصنع الفرق"
                          />
                        </div>
                        <div>
                          <label style={S.label}>الجنس</label>
                          <select
                            style={S.input}
                            value={editForm.gender}
                            onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value as Gender | "" }))}
                          >
                            <option value="">اختر</option>
                            <option value="male">ذكر</option>
                            <option value="female">أنثى</option>
                          </select>
                        </div>
                      </div>

                      {/* Audio Samples */}
                      <div>
                        <label style={S.label}>العيّنات الصوتية</label>
                        {editForm.audioSamples.length > 0 && (
                          <div className="space-y-2 mb-2">
                            {editForm.audioSamples.map((sample, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2"
                                style={{ background: "#161616", border: "1px solid var(--p-25)", borderRadius: "0.5rem", padding: "0.45rem 0.75rem" }}
                              >
                                <button
                                  onClick={() => {
                                    if (audioPlayingIdx === i) {
                                      audioPreviewRef[0]?.pause();
                                      setAudioPlayingIdx(null);
                                      return;
                                    }
                                    audioPreviewRef[0]?.pause();
                                    const a = new Audio(sample.url);
                                    a.play().catch(() => {});
                                    a.onended = () => setAudioPlayingIdx(null);
                                    audioPreviewRef[1](a);
                                    setAudioPlayingIdx(i);
                                  }}
                                  style={{ color: "var(--theme-accent, #00a355)", flexShrink: 0, lineHeight: 0, background: "none", border: "none", cursor: "pointer" }}
                                >
                                  {audioPlayingIdx === i ? <Pause size={14} /> : <Play size={14} />}
                                </button>
                                <Mic size={13} style={{ color: "var(--theme-accent, #00a355)", flexShrink: 0 }} />
                                <span style={{ color: "var(--theme-badge-text, #81c784)", fontSize: "0.82rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {sample.title}
                                </span>
                                <span style={{ background: "var(--p-20)", color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                                  {sample.category}
                                </span>
                                <button
                                  onClick={() => setEditForm((p) => ({ ...p, audioSamples: p.audioSamples.filter((_, j) => j !== i) }))}
                                  style={{ color: "#f87171", flexShrink: 0, lineHeight: 0, background: "none", border: "none", cursor: "pointer" }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {showAddAudio ? (
                          <div className="space-y-3" style={{ background: "#161616", border: "1px solid var(--p-30)", borderRadius: "0.5rem", padding: "0.75rem" }}>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label style={S.label}>عنوان العيّنة</label>
                                <input style={S.input} value={newAudioTitle} onChange={(e) => setNewAudioTitle(e.target.value)} placeholder="مثال: وثائقي — الحياة البرية" />
                              </div>
                              <div>
                                <label style={S.label}>التصنيف</label>
                                <select style={S.input} value={newAudioCategory} onChange={(e) => setNewAudioCategory(e.target.value as VoiceSampleCategory)}>
                                  {VOICE_SAMPLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label style={S.label}>ملف صوتي أو فيديو (يُحوَّل تلقائياً إلى صوت) — حد أقصى 15MB</label>
                              <label
                                htmlFor="audio-upload"
                                style={{
                                  cursor: uploadingAudio ? "not-allowed" : "pointer",
                                  background: "var(--p-12)",
                                  border: "1px solid var(--p-30)",
                                  color: uploadingAudio ? "var(--theme-text-muted, #4a7a4a)" : "var(--theme-badge-text, #81c784)",
                                  padding: "0.5rem 1rem",
                                  borderRadius: "0.5rem",
                                  fontSize: "0.8rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                }}
                              >
                                <Upload size={14} />
                                {uploadingAudio ? `جاري ${audioUploadProgress > 0 ? `الرفع... ${audioUploadProgress}%` : "التحويل..."}` : "اختر ملف صوتي أو فيديو"}
                              </label>
                              <input
                                id="audio-upload"
                                type="file"
                                accept="audio/*,video/*"
                                style={{ display: "none" }}
                                disabled={uploadingAudio}
                                onChange={async (e) => {
                                  if (!uid || !e.target.files?.length) return;
                                  let file = e.target.files[0];
                                  if (file.size > 15 * 1024 * 1024) {
                                    setEditError("حجم الملف يتجاوز 15MB");
                                    return;
                                  }
                                  if (!newAudioTitle.trim()) {
                                    setEditError("أدخل عنوان العيّنة أولاً");
                                    return;
                                  }
                                  setUploadingAudio(true);
                                  setAudioUploadProgress(0);
                                  try {
                                    if (file.type.startsWith("video/")) {
                                      setEditError("");
                                      const audioCtx = new AudioContext();
                                      let audioBuf: AudioBuffer;
                                      try {
                                        const arrayBuf = await file.arrayBuffer();
                                        audioBuf = await audioCtx.decodeAudioData(arrayBuf);
                                      } catch {
                                        audioCtx.close();
                                        throw new Error("تعذر استخراج الصوت من هذا الفيديو. جرّب صيغة MP4 أو ارفع ملفاً صوتياً مباشرة.");
                                      }
                                      const offlineCtx = new OfflineAudioContext(
                                        audioBuf.numberOfChannels,
                                        audioBuf.length,
                                        audioBuf.sampleRate
                                      );
                                      const source = offlineCtx.createBufferSource();
                                      source.buffer = audioBuf;
                                      source.connect(offlineCtx.destination);
                                      source.start(0);
                                      const rendered = await offlineCtx.startRendering();
                                      const wavData = encodeWAV(rendered);
                                      file = new File([wavData], file.name.replace(/\.[^.]+$/, ".wav"), { type: "audio/wav" });
                                      audioCtx.close();
                                    }
                                    const url = await uploadAudioSample(uid, file, (p) => setAudioUploadProgress(p));
                                    setEditForm((prev) => ({
                                      ...prev,
                                      audioSamples: [...prev.audioSamples, { title: newAudioTitle.trim(), url, category: newAudioCategory }],
                                    }));
                                    setNewAudioTitle("");
                                    setNewAudioCategory("وثائقي");
                                    setShowAddAudio(false);
                                    setEditError("");
                                    showUploadToast("✓ تم رفع العيّنة الصوتية بنجاح");
                                  } catch (err: unknown) {
                                    setEditError((err as Error)?.message ?? "فشل رفع الملف");
                                  } finally {
                                    setUploadingAudio(false);
                                    e.target.value = "";
                                  }
                                }}
                              />
                              {uploadingAudio && (
                                <div style={{ marginTop: "0.5rem", background: "#0e0e0e", border: "1px solid var(--p-25)", borderRadius: "9999px", height: "6px", overflow: "hidden" }}>
                                  <div style={{ width: `${audioUploadProgress}%`, height: "100%", background: "var(--theme-accent, #00a355)", transition: "width 0.2s ease" }} />
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setShowAddAudio(false); setNewAudioTitle(""); }}
                                style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary, #6aad6a)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAddAudio(true)}
                            className="flex items-center gap-1.5 text-sm"
                            style={{ color: "var(--theme-text-secondary, #6aad6a)", border: "1px solid var(--p-30)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem" }}
                          >
                            <Plus size={13} />
                            <span>إضافة عيّنة صوتية</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Works (portfolio) — individual accounts only */}
                  {profile.type !== "store" && (
                    <div>
                      <label style={S.label}>أعمالي</label>

                      {editForm.works.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {editForm.works.map((w) => {
                            const WIcon = workTypeIcon[w.type];
                            return (
                              <div
                                key={w.id}
                                className="flex items-center gap-2"
                                style={{ background: "#161616", border: "1px solid var(--p-25)", borderRadius: "0.5rem", padding: "0.45rem 0.75rem" }}
                              >
                                <WIcon size={13} style={{ color: "var(--theme-text-muted, #4a7a4a)", flexShrink: 0 }} />
                                <span style={{ background: "var(--p-20)", color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.68rem", padding: "0.1rem 0.4rem", borderRadius: "4px", flexShrink: 0 }}>
                                  {workTypeLabel[w.type]}
                                </span>
                                <span style={{ color: "var(--theme-badge-text, #81c784)", fontSize: "0.82rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {w.title || w.url}
                                </span>
                                <button
                                  onClick={() => handleRemoveWork(w.id)}
                                  style={{ color: "#f87171", flexShrink: 0, lineHeight: 0, background: "none", border: "none", cursor: "pointer" }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {showAddWork ? (
                        <div
                          className="space-y-3"
                          style={{ background: "#161616", border: "1px solid var(--p-30)", borderRadius: "0.5rem", padding: "0.75rem" }}
                        >
                          <div>
                            <label style={S.label}>نوع العمل</label>
                            <select
                              style={S.input}
                              value={newWorkType}
                              onChange={(e) => { setNewWorkType(e.target.value as WorkType); setNewWorkUrl(""); setEditError(""); }}
                            >
                              <option value="article">مقال (رابط)</option>
                              <option value="video">فيديو (رابط يوتيوب)</option>
                              <option value="audio">عمل صوتي (رفع ملف)</option>
                              <option value="image">صورة (رفع مباشر)</option>
                            </select>
                          </div>

                          <div>
                            <label style={S.label}>عنوان العمل</label>
                            <input
                              style={S.input}
                              value={newWorkTitle}
                              onChange={(e) => setNewWorkTitle(e.target.value)}
                              placeholder="مثال: تقرير قناة النهار"
                            />
                          </div>

                          {(newWorkType === "article" || newWorkType === "video") ? (
                            <div>
                              <label style={S.label}>{newWorkType === "video" ? "رابط يوتيوب" : "الرابط"}</label>
                              <input
                                style={S.input}
                                value={newWorkUrl}
                                onChange={(e) => setNewWorkUrl(e.target.value)}
                                placeholder={newWorkType === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
                                dir="ltr"
                              />
                            </div>
                          ) : (
                            <div>
                              <label style={S.label}>
                                {newWorkType === "audio" ? "ملف صوتي أو فيديو (يُحوَّل تلقائياً إلى صوت)" : "ملف صورة"}
                              </label>
                              <label
                                htmlFor="work-upload"
                                style={{
                                  cursor: uploadingWork ? "not-allowed" : "pointer",
                                  background: "var(--p-12)",
                                  border: "1px solid var(--p-30)",
                                  color: uploadingWork ? "var(--theme-text-muted, #4a7a4a)" : "var(--theme-badge-text, #81c784)",
                                  padding: "0.5rem 1rem",
                                  borderRadius: "0.5rem",
                                  fontSize: "0.8rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                }}
                              >
                                <Upload size={14} />
                                {uploadingWork ? `جاري ${workUploadProgress > 0 ? `الرفع... ${workUploadProgress}%` : "التحويل..."}` : (newWorkType === "audio" ? "اختر ملف صوتي أو فيديو" : "اختر صورة")}
                              </label>
                              <input
                                id="work-upload"
                                type="file"
                                accept={newWorkType === "audio" ? "audio/*,video/*" : "image/*"}
                                style={{ display: "none" }}
                                disabled={uploadingWork}
                                onChange={async (e) => {
                                  if (!e.target.files?.length) return;
                                  const file = e.target.files[0];
                                  if (newWorkType === "audio" && file.size > 15 * 1024 * 1024) {
                                    setEditError("حجم الملف يتجاوز 15MB");
                                    return;
                                  }
                                  await handleWorkFileUpload(file);
                                  e.target.value = "";
                                }}
                              />
                              {uploadingWork && (
                                <div style={{ marginTop: "0.5rem", background: "#0e0e0e", border: "1px solid var(--p-25)", borderRadius: "9999px", height: "6px", overflow: "hidden" }}>
                                  <div style={{ width: `${workUploadProgress}%`, height: "100%", background: "var(--theme-accent, #00a355)", transition: "width 0.2s ease" }} />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            {(newWorkType === "article" || newWorkType === "video") && (
                              <button
                                onClick={handleAddLinkWork}
                                disabled={!newWorkTitle.trim() || !newWorkUrl.trim()}
                                className="btn-dz px-4 py-1.5 rounded-lg text-sm disabled:opacity-40 flex items-center gap-1.5"
                              >
                                <Check size={13} />
                                <span>إضافة</span>
                              </button>
                            )}
                            <button
                              onClick={() => { setShowAddWork(false); setNewWorkTitle(""); setNewWorkUrl(""); setEditError(""); }}
                              style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary, #6aad6a)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddWork(true)}
                          className="flex items-center gap-1.5 text-sm"
                          style={{ color: "var(--theme-text-secondary, #6aad6a)", border: "1px solid var(--p-30)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem" }}
                        >
                          <Plus size={13} />
                          <span>إضافة عمل جديد</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Social links */}
                  <div>
                    <label style={S.label}>روابط التواصل الاجتماعي</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(["instagram", "facebook", "linkedin", "youtube", "website", "twitter"] as (keyof SocialLinks)[]).map((key) => {
                        const placeholders: Record<string, string> = {
                          instagram: "https://instagram.com/username",
                          facebook: "https://facebook.com/username",
                          linkedin: "https://linkedin.com/in/username",
                          youtube: "https://youtube.com/@channel",
                          website: "https://monsite.com",
                          twitter: "https://twitter.com/username",
                        };
                        const labels: Record<string, string> = {
                          instagram: "Instagram", facebook: "Facebook",
                          linkedin: "LinkedIn", youtube: "YouTube",
                          website: "الموقع الشخصي", twitter: "Twitter / X",
                        };
                        return (
                          <div key={key}>
                            <label style={{ ...S.label, fontSize: "0.73rem", color: "var(--theme-text-muted)" }}>{labels[key]}</label>
                            <input
                              style={S.input}
                              value={editForm.socialLinks[key] ?? ""}
                              onChange={(e) => setEditForm((p) => ({ ...p, socialLinks: { ...p.socialLinks, [key]: e.target.value || undefined } }))}
                              placeholder={placeholders[key]}
                              dir="ltr"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setEditing(false)}
                      style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.4rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving || uploadingPhoto}
                      className="btn-dz px-5 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <Check size={14} />
                      <span>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change password + Delete account */}
        <AccountSettings uid={uid!} />

        {/* Store status card */}
        {profile.type === "store" && (
          <div
            className="p-5 mb-6 animate-fade-in-up"
            style={{ ...S.card, animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={16} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600 }}>حالة المتجر</span>
              {profile.storeStatus === "trial" && (
                <span style={{ background: "rgba(180,120,0,0.2)", color: "#fbbf24", border: "1px solid rgba(180,120,0,0.3)", padding: "0.15rem 0.65rem", borderRadius: "9999px", fontSize: "0.73rem" }}>
                  تجريبي — متبقي شهر
                </span>
              )}
              {profile.storeStatus === "paid" && (
                <span style={{ background: "var(--p-20)", color: "#4ade80", border: "1px solid var(--p-30)", padding: "0.15rem 0.65rem", borderRadius: "9999px", fontSize: "0.73rem" }}>
                  مفعّل
                </span>
              )}
            </div>
            <p style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>
              للترقية إلى الباقة المدفوعة تواصل معنا
            </p>
            {uid && profile.status === "approved" && (
              <div style={{ marginTop: "0.5rem" }}>
                <Link
                  to={`/stores/${profile.username || uid}`}
                  style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.85rem", textDecoration: "none", display: "inline-block" }}
                >
                  عرض متجري ←
                </Link>
                {profile.username && (
                  <span style={{ color: "var(--theme-text-dim)", fontSize: "0.75rem", marginRight: "0.75rem", direction: "ltr", display: "inline-block" }}>
                    sanadz.media/stores/{profile.username}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Store manager — store accounts */}
        {profile.type === "store" && profile.status === "approved" && uid && (
          <div className="animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.15s", marginBottom: "1.5rem" }}>
            <StoreManager uid={uid} profile={profile} />
          </div>
        )}

        {/* Trainer manager — trainer accounts */}
        {profile.type === "trainer" && profile.status === "approved" && uid && (
          <div className="animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.15s", marginBottom: "1.5rem" }}>
            <div className="rounded-2xl p-6" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-20)" }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--theme-text)" }}>إدارة الدورات التدريبية</h3>
              <TrainerManager trainerId={uid} />
            </div>
          </div>
        )}

        {/* Works (portfolio) section — non-store approved users */}
        {profile.status === "approved" && profile.type !== "store" && profile.works && profile.works.length > 0 && (
          <div className="animate-fade-in-up mb-8" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.12s" }}>
            <WorksSection works={profile.works} />
          </div>
        )}

        {/* Voice artist info */}
        {profile.type === "voice" && profile.status === "approved" && (
          <div
            className="p-5 rounded-xl animate-fade-in-up"
            style={{ ...S.card, animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards", borderColor: "var(--p-30)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Mic size={16} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600 }}>ملفك في قسم المنشطين</span>
            </div>
            <p style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>
              ملفك الشخصي معتمد ويظهر في قسم المحترفين على منصة سند.
            </p>
            <Link to={`/profile/${profile.id}`} style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.85rem", textDecoration: "none", marginTop: "0.5rem", display: "inline-block" }}>
              شاهد ملفك العام ←
            </Link>
          </div>
        )}

        {/* Journalist info */}
        {profile.type === "journalist" && profile.status === "approved" && (
          <div
            className="p-5 rounded-xl animate-fade-in-up"
            style={{ ...S.card, animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards", borderColor: "var(--p-30)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} style={{ color: "var(--theme-accent, #00a355)" }} />
              <span style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600 }}>ملفك في دليل الصحفيين</span>
            </div>
            <p style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>
              ملفك الشخصي معتمد ويظهر في قسم المحترفين على منصة سند.
            </p>
            <Link to={`/profile/${profile.id}`} style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.85rem", textDecoration: "none", marginTop: "0.5rem", display: "inline-block" }}>
              شاهد ملفك العام ←
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
