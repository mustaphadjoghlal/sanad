import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import {
  LogOut, User, Package, Plus, X, ShoppingCart, Mic, BookOpen, Pencil, Check,
  AlertTriangle, ExternalLink, Award, Link as LinkIcon2, ImageIcon, Youtube, Trash2,
  Upload, Play, Pause,
} from "lucide-react";
import { auth } from "../../../lib/firebase";
import {
  subscribeToUserProfile,
  saveUserProfile,
  resubmitProfile,
  subscribeToCollection,
  addEquipment,
  sendNotification,
  isUsernameAvailable,
} from "../../../lib/firestore";
import { uploadProfilePhoto, uploadAudioSample } from "../../../lib/storage";
import type { UserProfile, Equipment, PortfolioLink, PortfolioVideo, AudioSample, Gender, VoiceSampleCategory, SocialLinks } from "../../../lib/types";
import { VOICE_SAMPLE_CATEGORIES } from "../../../lib/types";
import StoreManager from "../StoreManager";
import TrainerManager from "../TrainerManager";
import CVMaker from "../CVMaker";

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

function ytId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

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

type EquipForm = {
  name: string;
  category: string;
  price: number;
  seller: string;
  description: string;
  condition: "new" | "used";
  contact: string;
};

const emptyEquip: EquipForm = { name: "", category: "", price: 0, seller: "", description: "", condition: "used", contact: "" };

type EditFormState = {
  name: string;
  bio: string;
  specialty: string;
  location: string;
  phone: string;
  experience: string;
  achievements: string;
  portfolio: PortfolioLink[];
  portfolioVideos: PortfolioVideo[];
  username: string;
  tagline: string;
  gender: Gender | "";
  audioSamples: AudioSample[];
  socialLinks: SocialLinks;
};

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
    portfolio: [],
    portfolioVideos: [],
    username: "",
    tagline: "",
    gender: "",
    audioSamples: [],
    socialLinks: {},
  });
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Photo upload state
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Portfolio link addition state
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Portfolio videos state
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  // Audio sample state
  const [showAddAudio, setShowAddAudio] = useState(false);
  const [newAudioTitle, setNewAudioTitle] = useState("");
  const [newAudioCategory, setNewAudioCategory] = useState<VoiceSampleCategory>("وثائقي");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [audioPlayingIdx, setAudioPlayingIdx] = useState<number | null>(null);
  const audioPreviewRef = useState<HTMLAudioElement | null>(null);

  // Equipment
  const [myEquipment, setMyEquipment] = useState<Equipment[]>([]);
  const [addEquipModal, setAddEquipModal] = useState(false);
  const [equipForm, setEquipForm] = useState<EquipForm>(emptyEquip);
  const [addingEquip, setAddingEquip] = useState(false);

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

  // Equipment visible to all approved users
  useEffect(() => {
    if (!uid || !profile || profile.status !== "approved") return;
    const unsub = subscribeToCollection<Equipment>("equipment", (items) => {
      setMyEquipment(items.filter((eq) => eq.submittedBy === uid));
    });
    return unsub;
  }, [uid, profile?.status]);

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
      portfolio: profile.portfolio ? [...profile.portfolio] : [],
      portfolioVideos: profile.portfolioVideos ? [...profile.portfolioVideos] : [],
      username: profile.username || "",
      tagline: profile.tagline || "",
      gender: profile.gender || "",
      audioSamples: profile.audioSamples ? [...profile.audioSamples] : [],
      socialLinks: profile.socialLinks ?? {},
    });
    setUsernameStatus("idle");
    setPhotoUrl(profile.photo || "");
    setShowAddLink(false);
    setNewLinkLabel("");
    setNewLinkUrl("");
    setShowAddVideo(false);
    setNewVideoTitle("");
    setNewVideoUrl("");
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

  const handleAddPortfolioLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    setEditForm((p) => ({
      ...p,
      portfolio: [...p.portfolio, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }],
    }));
    setNewLinkLabel("");
    setNewLinkUrl("");
    setShowAddLink(false);
  };

  const handleRemovePortfolioLink = (index: number) => {
    setEditForm((p) => ({
      ...p,
      portfolio: p.portfolio.filter((_, i) => i !== index),
    }));
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
        portfolio: editForm.portfolio.length > 0 ? editForm.portfolio : undefined,
        portfolioVideos: editForm.portfolioVideos.length > 0 ? editForm.portfolioVideos : undefined,
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

  const handleAddEquipment = async () => {
    if (!uid || !profile) return;
    if (!equipForm.name) return;
    setAddingEquip(true);
    try {
      await addEquipment({
        ...equipForm,
        status: "pending",
        submittedBy: uid,
        seller: profile.name,
      } as Omit<Equipment, "id" | "createdAt">);
      await sendNotification({
        title: "طلب نشر عتاد جديد ⚙️",
        body: `${profile.name} أضاف "${equipForm.name}" وينتظر الموافقة`,
        link: "/sanad-admin",
        createdAt: Date.now(),
      }).catch(() => {});
      setAddEquipModal(false);
      setEquipForm(emptyEquip);
    } finally {
      setAddingEquip(false);
    }
  };

  const ef = (key: string, val: string | number) => setEquipForm((p) => ({ ...p, [key]: val }));

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

                  {/* Portfolio */}
                  {profile.portfolio && profile.portfolio.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon2 size={14} style={{ color: "var(--theme-text-secondary, #6aad6a)" }} />
                        <p style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.78rem", fontWeight: 600 }}>البورتفوليو</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.portfolio.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 transition-colors"
                            style={{
                              background: "var(--p-12)",
                              border: "1px solid var(--p-30)",
                              color: "var(--theme-badge-text, #81c784)",
                              padding: "0.2rem 0.65rem",
                              borderRadius: "9999px",
                              fontSize: "0.8rem",
                              textDecoration: "none",
                            }}
                          >
                            <ExternalLink size={11} />
                            <span>{link.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio videos */}
                  {profile.portfolioVideos && profile.portfolioVideos.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Youtube size={14} style={{ color: "#f87171" }} />
                        <p style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.78rem", fontWeight: 600 }}>أعمال مرئية</p>
                      </div>
                      <div className="flex flex-col gap-4">
                        {profile.portfolioVideos.map((v, i) => {
                          const vid = ytId(v.url);
                          return (
                            <div key={i}>
                              {v.title && <p style={{ color: "var(--theme-badge-text, #81c784)", fontSize: "0.82rem", marginBottom: "0.4rem" }}>{v.title}</p>}
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
                                <a href={v.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm" style={{ color: "#f87171", textDecoration: "none" }}>
                                  <Youtube size={13} /> {v.url}
                                </a>
                              )}
                            </div>
                          );
                        })}
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
                    {profile.status === "approved" && uid && (
                      <CVMaker profile={profile} uid={uid} />
                    )}
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
                                      const arrayBuf = await file.arrayBuffer();
                                      const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
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
                                  } catch (err: unknown) {
                                    setEditError((err as Error)?.message ?? "فشل رفع الملف");
                                  } finally {
                                    setUploadingAudio(false);
                                    e.target.value = "";
                                  }
                                }}
                              />
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

                  {/* Portfolio links — individual accounts only */}
                  {profile.type !== "store" && <div>
                    <label style={S.label}>روابط البورتفوليو</label>
                    {editForm.portfolio.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {editForm.portfolio.map((link, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2"
                            style={{ background: "#161616", border: "1px solid var(--p-25)", borderRadius: "0.5rem", padding: "0.45rem 0.75rem" }}
                          >
                            <LinkIcon2 size={13} style={{ color: "var(--theme-text-muted, #4a7a4a)", flexShrink: 0 }} />
                            <span style={{ color: "var(--theme-badge-text, #81c784)", fontSize: "0.82rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {link.label}
                            </span>
                            <span style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                              {link.url}
                            </span>
                            <button
                              onClick={() => handleRemovePortfolioLink(i)}
                              style={{ color: "#f87171", flexShrink: 0, lineHeight: 0 }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddLink ? (
                      <div
                        className="space-y-2"
                        style={{ background: "#161616", border: "1px solid var(--p-30)", borderRadius: "0.5rem", padding: "0.75rem" }}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label style={S.label}>التسمية</label>
                            <input
                              style={S.input}
                              value={newLinkLabel}
                              onChange={(e) => setNewLinkLabel(e.target.value)}
                              placeholder="مثال: موقع شخصي"
                            />
                          </div>
                          <div>
                            <label style={S.label}>الرابط</label>
                            <input
                              style={S.input}
                              value={newLinkUrl}
                              onChange={(e) => setNewLinkUrl(e.target.value)}
                              placeholder="https://..."
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddPortfolioLink}
                            disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                            className="btn-dz px-4 py-1.5 rounded-lg text-sm disabled:opacity-40 flex items-center gap-1.5"
                          >
                            <Check size={13} />
                            <span>إضافة</span>
                          </button>
                          <button
                            onClick={() => { setShowAddLink(false); setNewLinkLabel(""); setNewLinkUrl(""); }}
                            style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary, #6aad6a)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddLink(true)}
                        className="flex items-center gap-1.5 text-sm"
                        style={{ color: "var(--theme-text-secondary, #6aad6a)", border: "1px solid var(--p-30)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem" }}
                      >
                        <Plus size={13} />
                        <span>إضافة رابط</span>
                      </button>
                    )}
                  </div>}

                  {/* Portfolio videos — non-store accounts */}
                  {profile.type !== "store" && (
                    <div>
                      <label style={S.label}>أعمالي — فيديو (يوتيوب)</label>
                      {editForm.portfolioVideos.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {editForm.portfolioVideos.map((v, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2"
                              style={{ background: "#161616", border: "1px solid var(--p-25)", borderRadius: "0.5rem", padding: "0.45rem 0.75rem" }}
                            >
                              <Youtube size={13} style={{ color: "#f87171", flexShrink: 0 }} />
                              <span style={{ color: "var(--theme-badge-text, #81c784)", fontSize: "0.82rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {v.title || v.url}
                              </span>
                              <button
                                onClick={() => setEditForm((p) => ({ ...p, portfolioVideos: p.portfolioVideos.filter((_, j) => j !== i) }))}
                                style={{ color: "#f87171", flexShrink: 0, lineHeight: 0 }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {showAddVideo ? (
                        <div
                          className="space-y-2"
                          style={{ background: "#161616", border: "1px solid var(--p-30)", borderRadius: "0.5rem", padding: "0.75rem" }}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label style={S.label}>عنوان الفيديو</label>
                              <input
                                style={S.input}
                                value={newVideoTitle}
                                onChange={(e) => setNewVideoTitle(e.target.value)}
                                placeholder="مثال: تقرير قناة النهار"
                              />
                            </div>
                            <div>
                              <label style={S.label}>رابط يوتيوب</label>
                              <input
                                style={S.input}
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                dir="ltr"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (!newVideoUrl.trim()) return;
                                setEditForm((p) => ({ ...p, portfolioVideos: [...p.portfolioVideos, { title: newVideoTitle.trim(), url: newVideoUrl.trim() }] }));
                                setNewVideoTitle(""); setNewVideoUrl(""); setShowAddVideo(false);
                              }}
                              disabled={!newVideoUrl.trim()}
                              className="btn-dz px-4 py-1.5 rounded-lg text-sm disabled:opacity-40 flex items-center gap-1.5"
                            >
                              <Check size={13} />
                              <span>إضافة</span>
                            </button>
                            <button
                              onClick={() => { setShowAddVideo(false); setNewVideoTitle(""); setNewVideoUrl(""); }}
                              style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary, #6aad6a)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddVideo(true)}
                          className="flex items-center gap-1.5 text-sm"
                          style={{ color: "var(--theme-text-secondary, #6aad6a)", border: "1px solid var(--p-30)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem" }}
                        >
                          <Plus size={13} />
                          <span>إضافة فيديو</span>
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

        {/* Equipment section — non-store approved users */}
        {profile.status === "approved" && profile.type !== "store" && (
          <div className="animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={18} style={{ color: "var(--theme-accent, #00a355)" }} />
                <h3 className="text-lg font-semibold" style={{ color: "var(--theme-text, #c8e6c9)" }}>معداتي الإعلامية</h3>
                <span style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.8rem" }}>({myEquipment.length} منتج)</span>
              </div>
              <button
                onClick={() => setAddEquipModal(true)}
                className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              >
                <Plus size={15} />
                <span>إضافة عتاد جديد</span>
              </button>
            </div>

            <div style={S.card} className="overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {["المنتج", "الفئة", "السعر (دج)", "الحالة", "الموافقة"].map((h) => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myEquipment.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>
                          لم تضف أي عتاد بعد. اضغط "إضافة عتاد جديد" للبدء.
                        </td>
                      </tr>
                    ) : myEquipment.map((eq) => (
                      <tr key={eq.id} className="hover:bg-green-950/20 transition-colors">
                        <td style={S.td}>{eq.name}</td>
                        <td style={S.td}>{eq.category}</td>
                        <td style={S.td}>{eq.price.toLocaleString()}</td>
                        <td style={S.td}>
                          <span style={{ background: eq.condition === "new" ? "var(--p-30)" : "rgba(120,66,18,0.3)", color: eq.condition === "new" ? "var(--theme-badge-text, #81c784)" : "#f0b27a", fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                            {eq.condition === "new" ? "جديد" : "مستعمل"}
                          </span>
                        </td>
                        <td style={S.td}>
                          <span style={statusStyle[eq.status || "pending"]}>
                            {statusLabel[eq.status || "pending"]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

      {/* Add Equipment Modal */}
      {addEquipModal && (
        <Modal title="إضافة عتاد جديد" onClose={() => setAddEquipModal(false)}>
          <div className="space-y-4">
            <div>
              <label style={S.label}>اسم المنتج *</label>
              <input style={S.input} value={equipForm.name} onChange={(e) => ef("name", e.target.value)} placeholder="مثال: كاميرا Sony A7III" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={S.label}>الفئة</label>
                <select style={S.input} value={equipForm.category} onChange={(e) => ef("category", e.target.value)}>
                  <option value="">اختر الفئة</option>
                  <option value="كاميرات">كاميرات</option>
                  <option value="ميكروفونات">ميكروفونات</option>
                  <option value="إضاءة">إضاءة</option>
                  <option value="ملحقات">ملحقات</option>
                  <option value="أجهزة">أجهزة</option>
                </select>
              </div>
              <div>
                <label style={S.label}>الحالة</label>
                <select style={S.input} value={equipForm.condition} onChange={(e) => ef("condition", e.target.value)}>
                  <option value="new">جديد</option>
                  <option value="used">مستعمل</option>
                </select>
              </div>
              <div>
                <label style={S.label}>السعر (دج)</label>
                <input type="number" style={S.input} value={equipForm.price} onChange={(e) => ef("price", +e.target.value)} />
              </div>
              <div>
                <label style={S.label}>معلومات التواصل</label>
                <input style={S.input} value={equipForm.contact} onChange={(e) => ef("contact", e.target.value)} placeholder="هاتف أو بريد" />
              </div>
            </div>
            <div>
              <label style={S.label}>الوصف</label>
              <textarea style={{ ...S.input, minHeight: "70px", resize: "vertical" }} value={equipForm.description} onChange={(e) => ef("description", e.target.value)} />
            </div>
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: "rgba(180,120,0,0.1)", border: "1px solid rgba(180,120,0,0.25)", color: "#fbbf24" }}
            >
              سيتم مراجعة إعلانك من قِبل الإدارة قبل نشره.
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setAddEquipModal(false)} style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>
                إلغاء
              </button>
              <button onClick={handleAddEquipment} disabled={addingEquip || !equipForm.name} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                <span>{addingEquip ? "جاري الإرسال..." : "إرسال للمراجعة"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
