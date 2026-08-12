import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  LogOut, Pencil, User, MapPin, Briefcase, Award, AlertTriangle, 
  CheckCircle, ExternalLink, ImageIcon, Upload, Trash2, Plus, Play, Pause, Mic, Check
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, storage } from "../../lib/firebase";
import { 
  subscribeToUserProfile, saveUserProfile, isUsernameAvailable, resubmitProfile, sendNotification
} from "../../lib/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import type { UserProfile, PortfolioWork, WorkType, VoiceSampleCategory, Gender, AudioSample, SocialLinks } from "../../lib/types";
import WorksSection from "../WorksSection";

const typeLabel: Record<string, string> = {
  editor_news: "محرر أخبار",
  web_digital: "ويب ديجيتال",
  presenter_programs: "مقدم برامج",
  presenter_news: "مقدم أخبار",
  monteur: "مونتير",
  graphic_designer: "جرافيك ديزاينر",
  cameraman: "كاميرا مان",
  producer: "منتج",
  director: "مخرج",
  program_writer: "معد برامج",
  voice: "معلق صوتي",
  host_stage: "منشط على الركح",
  student: "طالب إعلام",
  journalist: "صحفي / مراسل",
  photographer: "مصور",
  editor: "مخرج / مونتير",
  store: "متجر عتاد",
  trainer: "مدرب",
  other: "إعلامي",
};

const statusLabel: Record<string, string> = {
  pending: "قيد الانتظار",
  approved: "معتمد",
  rejected: "مرفوض",
};

const statusStyle: Record<string, React.CSSProperties> = {
  pending: { background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.3)" },
  approved: { background: "rgba(0, 163, 85, 0.15)", color: "#00a355", border: "1px solid rgba(0, 163, 85, 0.3)" },
  rejected: { background: "rgba(198, 40, 40, 0.15)", color: "#f87171", border: "1px solid rgba(198, 40, 40, 0.3)" },
};

const typeIcon: Record<string, React.ElementType> = {
  voice: Mic,
  journalist: Briefcase,
  photographer: ImageIcon,
  store: Briefcase,
};

const VOICE_SAMPLE_CATEGORIES: VoiceSampleCategory[] = ["وثائقي", "إعلاني", "دوبلاج", "كتب صوتية", "رد آلي", "أخرى"];

const workTypeLabel: Record<WorkType, string> = {
  article: "مقال",
  video: "فيديو",
  audio: "صوت",
  image: "صورة",
};

const workTypeIcon: Record<WorkType, React.ElementType> = {
  article: ExternalLink,
  video: Play,
  audio: Mic,
  image: ImageIcon,
};

const wilayas = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
  "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة",
  "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة",
  "وهران", "البيض", "إليزي", "برج بوعريريج", "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة", "سوق أهراس",
  "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", "تيميمون", "برج باجي مختار",
  "أولاد جلال", "بني عباس", "عين صالح", "عين قزام", "تقرت", "جانت", "المغير", "المنيعة"
];

const S = {
  card: { background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", borderRadius: "1rem" },
  label: { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--theme-text-muted)", marginBottom: "0.4rem" },
  input: {
    width: "100%", background: "#080808", border: "1px solid var(--p-20)", borderRadius: "0.5rem",
    padding: "0.6rem 0.8rem", color: "#e8f5e9", fontSize: "0.85rem", outline: "none", transition: "border-color 0.2s"
  },
};

async function uploadImage(path: string, file: File, onProgress?: (p: number) => void): Promise<string> {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    uploadTask.on("state_changed",
      (snap) => { if (onProgress) onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)); },
      (err) => reject(err),
      async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
    );
  });
}

async function uploadAudioSample(uid: string, file: File, onProgress?: (p: number) => void): Promise<string> {
  return uploadImage(`audio-samples/${uid}/${Date.now()}_${file.name}`, file, onProgress);
}

async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  return uploadImage(`profile-photos/${uid}`, file);
}

const genWorkId = () => Math.random().toString(36).substring(2, 9);

function encodeWAV(samples: AudioBuffer) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 32 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, samples.sampleRate, true);
  view.setUint32(28, samples.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);
  const data = samples.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < data.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

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
  languages: string;
  voiceStyles: string;
  services: string;
  availability: "available" | "busy" | "";
};

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
    languages: "",
    voiceStyles: "",
    services: "",
    availability: "",
  });
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const showUploadToast = (msg: string) => {
    setUploadToast(msg);
    setTimeout(() => setUploadToast(null), 3000);
  };

  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showAddWork, setShowAddWork] = useState(false);
  const [newWorkType, setNewWorkType] = useState<WorkType>("article");
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [newWorkUrl, setNewWorkUrl] = useState("");
  const [uploadingWork, setUploadingWork] = useState(false);
  const [workUploadProgress, setWorkUploadProgress] = useState(0);
  const [showAddAudio, setShowAddAudio] = useState(false);
  const [newAudioTitle, setNewAudioTitle] = useState("");
  const [newAudioCategory, setNewAudioCategory] = useState<VoiceSampleCategory>("وثائقي");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [audioPlayingIdx, setAudioPlayingIdx] = useState<number | null>(null);
  const audioPreviewRef = useState<HTMLAudioElement | null>(null);

  const csvToTags = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean).slice(0, 20);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setAuthLoading(false);
      } else {
        setTimeout(() => { if (!auth.currentUser) navigate("/login"); }, 800);
      }
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToUserProfile(uid, (p) => {
      if (p === null && !authLoading) navigate("/login");
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
      languages: (profile.languages ?? []).join(", "),
      voiceStyles: (profile.voiceStyles ?? []).join(", "),
      services: (profile.services ?? []).join(", "),
      availability: profile.availability ?? "",
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
      setEditError(`فشل رفع الصورة: ${(err as Error)?.message ?? "خطأ غير معروف"}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemoveWork = (id: string) => {
    setEditForm((p) => ({ ...p, works: p.works.filter((w) => w.id !== id) }));
  };

  const handleAddLinkWork = () => {
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
        let audioFile = file;
        if (file.type.startsWith("video/")) {
          const audioCtx = new AudioContext();
          try {
            const arrayBuf = await file.arrayBuffer();
            const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
            const offlineCtx = new OfflineAudioContext(audioBuf.numberOfChannels, audioBuf.length, audioBuf.sampleRate);
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuf;
            source.connect(offlineCtx.destination);
            source.start(0);
            const rendered = await offlineCtx.startRendering();
            const wavData = encodeWAV(rendered);
            audioFile = new File([wavData], file.name.replace(/\.[^.]+$/, ".wav"), { type: "audio/wav" });
          } finally { audioCtx.close(); }
        }
        const url = await uploadAudioSample(uid, audioFile, (p) => setWorkUploadProgress(p));
        setEditForm((p) => ({ ...p, works: [...p.works, { id: genWorkId(), type: "audio", title: newWorkTitle.trim(), url }] }));
      } else if (newWorkType === "image") {
        const url = await uploadImage(`works/${uid}/${Date.now()}_${file.name}`, file, (p) => setWorkUploadProgress(p));
        setEditForm((p) => ({ ...p, works: [...p.works, { id: genWorkId(), type: "image", title: newWorkTitle.trim(), url }] }));
      }
      setNewWorkTitle("");
      setShowAddWork(false);
      showUploadToast("✓ تم الرفع بنجاح");
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
    if (profile.type === "store" && editForm.username && (usernameStatus === "taken" || usernameStatus === "invalid")) {
      setEditError(usernameStatus === "taken" ? "هذا الاسم مستخدم، اختر اسماً آخر" : "الاسم يجب أن يكون 3 أحرف على الأقل");
      return;
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
        languages: csvToTags(editForm.languages).length > 0 ? csvToTags(editForm.languages) : undefined,
        voiceStyles: csvToTags(editForm.voiceStyles).length > 0 ? csvToTags(editForm.voiceStyles) : undefined,
        services: csvToTags(editForm.services).length > 0 ? csvToTags(editForm.services) : undefined,
        availability: editForm.availability || undefined,
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
        }, undefined, "admin").catch(() => {});
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
          <Link to="/" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors" style={{ color: "var(--theme-text-secondary, #6aad6a)", textDecoration: "none", border: "1px solid var(--p-20)" }}>الرئيسية</Link>
          <span className="hidden sm:block text-sm" style={{ color: "var(--theme-text-muted)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.name}</span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors" style={{ color: "#ef9a9a", border: "1px solid rgba(198,40,40,0.25)" }}>
            <LogOut size={15} /> <span>خروج</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Showcase Card (VoxDub Style) */}
        {!editing ? (
          <div
            className="overflow-hidden rounded-2xl mb-8 animate-fade-in-up shadow-2xl"
            style={{ background: "linear-gradient(145deg, #151b17, #0f130f)", border: "1px solid var(--p-25)", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="relative h-24 md:h-32" style={{ background: "linear-gradient(115deg, var(--theme-primary), #073a25 52%, #07140d)" }}>
              <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 78% 20%, var(--theme-accent), transparent 35%)" }} />
              <div className="absolute top-4 right-4">
                <span style={{ ...statusStyle[profile.status], fontSize: "0.7rem", padding: "0.2rem 0.6rem", backdropFilter: "blur(8px)" }}>{statusLabel[profile.status]}</span>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-10 relative">
                <div className="h-24 w-24 shrink-0 rounded-2xl overflow-hidden shadow-xl" style={{ border: "4px solid #151b17", background: "#1a241c" }}>
                  {profile.photo ? <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={40} style={{ color: "var(--p-40)" }} /></div>}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-xl md:text-2xl font-black" style={{ color: "var(--theme-text)" }}>{profile.name}</h2>
                    {profile.status === "approved" && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7ee8a2", background: "rgba(0,163,85,0.15)", border: "1px solid rgba(0,163,85,0.3)" }}>
                        <CheckCircle size={10} /> معتمد
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: "var(--theme-text-muted)" }}>
                    <span style={{ color: "var(--theme-accent)" }}>{typeLabel[profile.type] ?? profile.type}</span>
                    {profile.specialty && <span>• {profile.specialty}</span>}
                    {profile.location && <span className="flex items-center gap-1"><MapPin size={10} /> {profile.location}</span>}
                  </div>
                </div>
                <div className="flex gap-2 pb-1">
                  <button onClick={startEdit} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-bold transition-all" style={{ background: "var(--p-15)", color: "var(--theme-text)", border: "1px solid var(--p-30)" }}>
                    <Pencil size={13} /> تعديل
                  </button>
                  {profile.status === "approved" && (
                    <Link to={`/profile/${profile.id}`} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-bold transition-all" style={{ background: "var(--theme-accent)", color: "#07130b", textDecoration: "none" }}>
                      <ExternalLink size={13} /> معاينة الملف
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 pt-5" style={{ borderTop: "1px solid var(--p-15)" }}>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold mb-1" style={{ color: "var(--theme-text-muted)", letterSpacing: "0.05em" }}>الأعمال</p>
                  <p className="text-lg font-black" style={{ color: "var(--theme-text)" }}>{profile.works?.length || 0}</p>
                </div>
                <div className="text-center" style={{ borderLeft: "1px solid var(--p-10)", borderRight: "1px solid var(--p-10)" }}>
                  <p className="text-[10px] uppercase font-bold mb-1" style={{ color: "var(--theme-text-muted)", letterSpacing: "0.05em" }}>الصوتيات</p>
                  <p className="text-lg font-black" style={{ color: "var(--theme-text)" }}>{profile.audioSamples?.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold mb-1" style={{ color: "var(--theme-text-muted)", letterSpacing: "0.05em" }}>الخبرة</p>
                  <p className="text-lg font-black truncate px-1" style={{ color: "var(--theme-text)" }}>{profile.experience || "-"}</p>
                </div>
              </div>
              {profile.status === "rejected" && profile.rejectionNote && (
                <div className="mt-5 p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(198,40,40,0.08)", border: "1px solid rgba(198,40,40,0.2)" }}>
                  <AlertTriangle size={18} className="shrink-0" style={{ color: "#f87171" }} />
                  <div>
                    <p className="text-xs font-black mb-1" style={{ color: "#f87171" }}>يحتاج ملفك لتعديلات:</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#fca5a5" }}>{profile.rejectionNote}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 mb-8 rounded-2xl animate-fade-in-up" style={{ ...S.card, opacity: 0, animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{ background: "var(--p-15)", border: "1px solid var(--p-25)" }}>
                <Pencil size={20} style={{ color: "var(--theme-accent)" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--theme-text)" }}>تعديل الملف المهني</h2>
                <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>قم بتحديث بياناتك لتظهر بشكل احترافي للعملاء</p>
              </div>
            </div>
            <div className="space-y-4 w-full">
              {editError && <div className="p-2 rounded text-sm" style={{ background: "rgba(198,40,40,0.1)", color: "#f87171" }}>{editError}</div>}
              <div>
                <label style={S.label}>صورة شخصية</label>
                <div className="flex items-center gap-3">
                  {photoUrl ? <img src={photoUrl} alt="preview" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--p-40)", flexShrink: 0 }} /> : <div className="flex items-center justify-center flex-shrink-0" style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--p-15)", border: "1px solid var(--p-30)" }}><ImageIcon size={22} style={{ color: "var(--theme-text-muted)" }} /></div>}
                  <div>
                    <label htmlFor="photo-upload" style={{ cursor: uploadingPhoto ? "not-allowed" : "pointer", background: "var(--p-12)", border: "1px solid var(--p-30)", color: uploadingPhoto ? "var(--theme-text-muted)" : "var(--theme-badge-text)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem", fontSize: "0.8rem", display: "inline-block" }}>{uploadingPhoto ? "جاري الرفع..." : "اختر صورة"}</label>
                    <input id="photo-upload" type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingPhoto} onChange={handlePhotoChange} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label style={S.label}>الاسم الكامل *</label><input style={S.input} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div><label style={S.label}>{profile.type === "store" ? "نوع المعدات" : "التخصص"}</label><input style={S.input} value={editForm.specialty} onChange={(e) => setEditForm((p) => ({ ...p, specialty: e.target.value }))} /></div>
                <div><label style={S.label}>الولاية</label><select style={S.input} value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}><option value="">اختر الولاية</option>{wilayas.map((w) => <option key={w} value={w}>{w}</option>)}</select></div>
                <div><label style={S.label}>رقم الهاتف</label><input style={S.input} value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} dir="ltr" /></div>
                {profile.type !== "store" && <div><label style={S.label}>سنوات الخبرة</label><input style={S.input} value={editForm.experience} onChange={(e) => setEditForm((p) => ({ ...p, experience: e.target.value }))} /></div>}
                <div className="md:col-span-2"><label style={S.label}>{profile.type === "store" ? "وصف المتجر" : "نبذة / CV"}</label><textarea style={{ ...S.input, minHeight: "70px", resize: "vertical" }} value={editForm.bio} onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))} /></div>
              </div>
              {profile.type !== "store" && (
                <div className="space-y-3" style={{ background: "#121812", border: "1px solid var(--p-20)", borderRadius: "0.6rem", padding: "0.85rem" }}>
                  <div><p style={{ color: "var(--theme-text)", fontSize: "0.86rem", fontWeight: 600 }}>معلومات الظهور الاحترافي</p><p style={{ color: "var(--theme-text-muted)", fontSize: "0.73rem", marginTop: "0.2rem" }}>افصل بين العناصر بفاصلة، وستظهر كوسوم في صفحتك العامة.</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label style={S.label}>اللغات واللهجات</label><input style={S.input} value={editForm.languages} onChange={(e) => setEditForm((p) => ({ ...p, languages: e.target.value }))} placeholder="العربية، الجزائرية، الفرنسية" /></div>
                    <div><label style={S.label}>الأساليب الصوتية</label><input style={S.input} value={editForm.voiceStyles} onChange={(e) => setEditForm((p) => ({ ...p, voiceStyles: e.target.value }))} placeholder="وثائقي، إعلاني، دوبلاج" /></div>
                    <div><label style={S.label}>الخدمات</label><input style={S.input} value={editForm.services} onChange={(e) => setEditForm((p) => ({ ...p, services: e.target.value }))} placeholder="تعليق صوتي، تسجيل إعلانات" /></div>
                    <div><label style={S.label}>حالة التوفر</label><select style={S.input} value={editForm.availability} onChange={(e) => setEditForm((p) => ({ ...p, availability: e.target.value as "available" | "busy" | "" }))}><option value="">لم أحدد</option><option value="available">متاح للعمل</option><option value="busy">مشغول حالياً</option></select></div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold" style={{ background: "var(--theme-accent)", color: "#07130b" }}>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
                <button onClick={() => setEditing(false)} className="px-6 py-2.5 rounded-xl font-bold" style={{ background: "var(--p-15)", color: "var(--theme-text)", border: "1px solid var(--p-30)" }}>إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {/* User Stats/Shortcuts - for individual accounts */}
        {profile.type !== "store" && !editing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-5 rounded-2xl" style={{ ...S.card }}>
              <div className="flex items-center gap-2 mb-4"><Mic size={18} style={{ color: "var(--theme-accent)" }} /><h3 className="text-sm font-bold" style={{ color: "var(--theme-text)" }}>إدارة العينات الصوتية</h3></div>
              <p className="text-xs mb-4" style={{ color: "var(--theme-text-muted)" }}>أضف عينات صوتية جديدة لتعريف العملاء بقدراتك.</p>
              <button onClick={startEdit} className="text-xs font-bold" style={{ color: "var(--theme-accent)", background: "none", border: "none", cursor: "pointer" }}>انتقل للتعديل وإضافة عينات ←</button>
            </div>
            <div className="p-5 rounded-2xl" style={{ ...S.card }}>
              <div className="flex items-center gap-2 mb-4"><ImageIcon size={18} style={{ color: "var(--theme-accent)" }} /><h3 className="text-sm font-bold" style={{ color: "var(--theme-text)" }}>معرض الأعمال</h3></div>
              <p className="text-xs mb-4" style={{ color: "var(--theme-text-muted)" }}>روابط فيديوهات يوتيوب أو صور لأعمالك المنشورة.</p>
              <button onClick={startEdit} className="text-xs font-bold" style={{ color: "var(--theme-accent)", background: "none", border: "none", cursor: "pointer" }}>تحديث معرض الأعمال ←</button>
            </div>
          </div>
        )}

        {/* Works Section - Preview in Dashboard */}
        {profile.status === "approved" && profile.type !== "store" && !editing && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>معاينة أعمالي</h3>
              <Link to={`/profile/${profile.id}`} style={{ color: "var(--theme-accent)", fontSize: "0.8rem", textDecoration: "none" }}>عرض الملف العام</Link>
            </div>
            <WorksSection works={profile.works || []} />
          </div>
        )}

        {/* Account Settings */}
        <div className="p-6 rounded-2xl mt-8" style={{ ...S.card }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg" style={{ background: "var(--p-15)", border: "1px solid var(--p-25)" }}>
              <User size={18} style={{ color: "var(--theme-accent)" }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>إعدادات الحساب</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="px-5 py-2 rounded-xl text-sm" style={{ border: "1px solid var(--p-25)", color: "var(--theme-text)" }}>تغيير كلمة المرور</button>
            <button className="px-5 py-2 rounded-xl text-sm" style={{ border: "1px solid rgba(198,40,40,0.2)", color: "#f87171" }}>حذف الحساب</button>
          </div>
        </div>
      </div>
    </div>
  );
}
