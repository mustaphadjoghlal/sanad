import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  LogOut, User, Package, Plus, X, ShoppingCart, Mic, BookOpen, Pencil, Check,
  AlertTriangle, ExternalLink, Award, Link as LinkIcon2, ImageIcon,
} from "lucide-react";
import { auth } from "../../../lib/firebase";
import {
  subscribeToUserProfile,
  saveUserProfile,
  resubmitProfile,
  subscribeToCollection,
  addEquipment,
} from "../../../lib/firestore";
import { uploadProfilePhoto } from "../../../lib/storage";
import type { UserProfile, Equipment, PortfolioLink } from "../../../lib/types";

const typeLabel: Record<string, string> = {
  journalist: "صحفي / مراسل",
  voice: "منشط / معلق صوتي",
  photographer: "مصور فوتوغرافي / فيديو",
  editor: "مخرج / مونتير",
  student: "طالب إعلام",
  other: "إعلامي",
  store: "متجر احترافي",
  vendor: "بائع عتاد",
};

const typeIcon: Record<string, React.ElementType> = {
  journalist: BookOpen,
  voice: Mic,
  vendor: ShoppingCart,
  store: ShoppingCart,
};

const statusStyle: Record<string, React.CSSProperties> = {
  pending: { background: "rgba(180,120,0,0.2)", color: "#fbbf24", border: "1px solid rgba(180,120,0,0.3)", padding: "0.2rem 0.7rem", borderRadius: "9999px", fontSize: "0.75rem" },
  approved: { background: "rgba(0,98,51,0.2)", color: "#4ade80", border: "1px solid rgba(0,98,51,0.3)", padding: "0.2rem 0.7rem", borderRadius: "9999px", fontSize: "0.75rem" },
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
    border: "1px solid rgba(0,98,51,0.25)",
    borderRadius: "0.75rem",
  } as React.CSSProperties,
  input: {
    background: "#161616",
    border: "1px solid rgba(0,98,51,0.3)",
    color: "#e8f5e9",
    borderRadius: "0.5rem",
    padding: "0.6rem 0.85rem",
    width: "100%",
    fontSize: "0.875rem",
  } as React.CSSProperties,
  label: { color: "#81c784", fontSize: "0.8rem", display: "block", marginBottom: "0.35rem" } as React.CSSProperties,
  th: { color: "#6aad6a", fontSize: "0.75rem", fontWeight: 500, padding: "0.75rem 1rem", textAlign: "right" as const, borderBottom: "1px solid rgba(0,98,51,0.15)" },
  td: { color: "#c8e6c9", fontSize: "0.875rem", padding: "0.85rem 1rem", textAlign: "right" as const, borderBottom: "1px solid rgba(0,98,51,0.08)" },
};

const wilayas = [
  "الجزائر", "وهران", "قسنطينة", "عنابة", "سطيف", "تيزي وزو", "البليدة", "بجاية",
  "تلمسان", "باتنة", "بسكرة", "سكيكدة", "جيجل", "برج بوعريريج", "المدية", "تبسة",
  "مستغانم", "معسكر", "سعيدة", "تيارت", "غليزان", "الشلف", "عين الدفلى", "ميلة",
];

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
};

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
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(0,98,51,0.2)" }}>
          <h3 style={{ color: "#e8f5e9", fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ color: "#4a7a4a" }}>
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
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
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Photo upload state
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Portfolio link addition state
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

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
    });
    setPhotoUrl(profile.photo || "");
    setShowAddLink(false);
    setNewLinkLabel("");
    setNewLinkUrl("");
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

  const handleSaveEdit = async () => {
    if (!uid || !profile) return;
    if (!editForm.name?.trim()) { setEditError("الاسم مطلوب"); return; }
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
        specialty: editForm.specialty || undefined,
        location: editForm.location || undefined,
        phone: editForm.phone || undefined,
        experience: editForm.experience || undefined,
        otherType: profile.otherType,
        storeStatus: profile.storeStatus,
      });
      if (profile.status === "rejected") {
        await resubmitProfile(uid);
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
        <div style={{ color: "#3a5e3a" }}>جاري التحميل...</div>
      </div>
    );
  }

  const TypeIcon = typeIcon[profile.type] || User;

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "#0e0e0e" }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(0,98,51,0.2)", background: "rgba(11,15,11,0.9)", backdropFilter: "blur(8px)" }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <span className="font-bold text-xl" style={{ background: "linear-gradient(90deg, #00a355, #4caf50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            سند
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span style={{ color: "#6aad6a", fontSize: "0.85rem" }}>{profile.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ color: "#ef9a9a", border: "1px solid rgba(198,40,40,0.25)" }}
          >
            <LogOut size={15} />
            <span>خروج</span>
          </button>
        </div>
      </div>

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
                    style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,98,51,0.4)" }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.35)" }}
                  >
                    <TypeIcon size={26} style={{ color: "#00a355" }} />
                  </div>
                )}
              </div>
            ) : null}

            {/* Info */}
            <div className="flex-1 min-w-0">
              {!editing ? (
                <>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold" style={{ color: "#e8f5e9" }}>{profile.name}</h2>
                    <span style={{
                      background: "rgba(0,98,51,0.15)", color: "#81c784",
                      border: "1px solid rgba(0,98,51,0.3)", padding: "0.15rem 0.6rem",
                      borderRadius: "9999px", fontSize: "0.75rem"
                    }}>
                      {typeLabel[profile.type] ?? profile.type}
                    </span>
                    <span style={statusStyle[profile.status]}>{statusLabel[profile.status]}</span>
                  </div>

                  {profile.specialty && <p style={{ color: "#6aad6a", fontSize: "0.875rem", marginBottom: "0.25rem" }}>{profile.specialty}</p>}
                  {profile.location && <p style={{ color: "#4a7a4a", fontSize: "0.8rem", marginBottom: "0.25rem" }}>{profile.location}</p>}
                  {profile.bio && <p style={{ color: "#4a7a4a", fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.6 }}>{profile.bio}</p>}

                  {/* Achievements */}
                  {profile.achievements && (
                    <div className="mt-4 flex items-start gap-2">
                      <Award size={16} style={{ color: "#fbbf24", flexShrink: 0, marginTop: "0.15rem" }} />
                      <div>
                        <p style={{ color: "#fbbf24", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.2rem" }}>أبرز الإنجازات</p>
                        <p style={{ color: "#c8e6c9", fontSize: "0.85rem", lineHeight: 1.6 }}>{profile.achievements}</p>
                      </div>
                    </div>
                  )}

                  {/* Portfolio */}
                  {profile.portfolio && profile.portfolio.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon2 size={14} style={{ color: "#6aad6a" }} />
                        <p style={{ color: "#6aad6a", fontSize: "0.78rem", fontWeight: 600 }}>البورتفوليو</p>
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
                              background: "rgba(0,98,51,0.12)",
                              border: "1px solid rgba(0,98,51,0.3)",
                              color: "#81c784",
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

                  <button
                    onClick={startEdit}
                    className="mt-4 flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
                    style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#81c784" }}
                  >
                    <Pencil size={14} />
                    <span>تعديل الملف</span>
                  </button>
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
                          style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,98,51,0.4)", flexShrink: 0 }}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(0,98,51,0.15)", border: "1px solid rgba(0,98,51,0.3)" }}
                        >
                          <ImageIcon size={22} style={{ color: "#4a7a4a" }} />
                        </div>
                      )}
                      <div>
                        <label
                          htmlFor="photo-upload"
                          style={{
                            cursor: uploadingPhoto ? "not-allowed" : "pointer",
                            background: "rgba(0,98,51,0.12)",
                            border: "1px solid rgba(0,98,51,0.3)",
                            color: uploadingPhoto ? "#4a7a4a" : "#81c784",
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
                        <p style={{ color: "#4a7a4a", fontSize: "0.75rem", marginTop: "0.25rem" }}>JPG أو PNG، يُرفع فوراً</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label style={S.label}>الاسم الكامل *</label>
                      <input style={S.input} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>التخصص</label>
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
                    <div>
                      <label style={S.label}>سنوات الخبرة</label>
                      <input style={S.input} value={editForm.experience} onChange={(e) => setEditForm((p) => ({ ...p, experience: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label style={S.label}>نبذة / CV</label>
                      <textarea style={{ ...S.input, minHeight: "70px", resize: "vertical" }} value={editForm.bio} onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label style={S.label}>أبرز الإنجازات</label>
                      <textarea
                        style={{ ...S.input, minHeight: "60px", resize: "vertical" }}
                        value={editForm.achievements}
                        onChange={(e) => setEditForm((p) => ({ ...p, achievements: e.target.value }))}
                        placeholder="اذكر أبرز إنجازاتك المهنية..."
                      />
                    </div>
                  </div>

                  {/* Portfolio links */}
                  <div>
                    <label style={S.label}>روابط البورتفوليو</label>
                    {editForm.portfolio.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {editForm.portfolio.map((link, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2"
                            style={{ background: "#161616", border: "1px solid rgba(0,98,51,0.25)", borderRadius: "0.5rem", padding: "0.45rem 0.75rem" }}
                          >
                            <LinkIcon2 size={13} style={{ color: "#4a7a4a", flexShrink: 0 }} />
                            <span style={{ color: "#81c784", fontSize: "0.82rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {link.label}
                            </span>
                            <span style={{ color: "#4a7a4a", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
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
                        style={{ background: "#161616", border: "1px solid rgba(0,98,51,0.3)", borderRadius: "0.5rem", padding: "0.75rem" }}
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
                            style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#6aad6a", padding: "0.35rem 0.85rem", borderRadius: "0.5rem", fontSize: "0.8rem" }}
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddLink(true)}
                        className="flex items-center gap-1.5 text-sm"
                        style={{ color: "#6aad6a", border: "1px solid rgba(0,98,51,0.3)", padding: "0.35rem 0.85rem", borderRadius: "0.5rem" }}
                      >
                        <Plus size={13} />
                        <span>إضافة رابط</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setEditing(false)}
                      style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#81c784", padding: "0.4rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}
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

        {/* Store status card */}
        {profile.type === "store" && (
          <div
            className="p-5 mb-6 animate-fade-in-up"
            style={{ ...S.card, animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={16} style={{ color: "#00a355" }} />
              <span style={{ color: "#c8e6c9", fontWeight: 600 }}>حالة المتجر</span>
              {profile.storeStatus === "trial" && (
                <span style={{ background: "rgba(180,120,0,0.2)", color: "#fbbf24", border: "1px solid rgba(180,120,0,0.3)", padding: "0.15rem 0.65rem", borderRadius: "9999px", fontSize: "0.73rem" }}>
                  تجريبي — متبقي شهر
                </span>
              )}
              {profile.storeStatus === "paid" && (
                <span style={{ background: "rgba(0,98,51,0.2)", color: "#4ade80", border: "1px solid rgba(0,98,51,0.3)", padding: "0.15rem 0.65rem", borderRadius: "9999px", fontSize: "0.73rem" }}>
                  مفعّل
                </span>
              )}
            </div>
            <p style={{ color: "#6aad6a", fontSize: "0.875rem" }}>
              للترقية إلى الباقة المدفوعة تواصل معنا
            </p>
          </div>
        )}

        {/* Equipment section — all approved users */}
        {profile.status === "approved" && (
          <div className="animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={18} style={{ color: "#00a355" }} />
                <h3 className="text-lg font-semibold" style={{ color: "#c8e6c9" }}>معداتي للبيع</h3>
                <span style={{ color: "#4a7a4a", fontSize: "0.8rem" }}>({myEquipment.length} منتج)</span>
              </div>
              <button
                onClick={() => setAddEquipModal(true)}
                className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              >
                <Plus size={15} />
                <span>إضافة معدة جديدة</span>
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
                        <td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#3a5e3a", padding: "3rem" }}>
                          لم تضف معدات بعد. اضغط "إضافة معدة جديدة" للبدء.
                        </td>
                      </tr>
                    ) : myEquipment.map((eq) => (
                      <tr key={eq.id} className="hover:bg-green-950/20 transition-colors">
                        <td style={S.td}>{eq.name}</td>
                        <td style={S.td}>{eq.category}</td>
                        <td style={S.td}>{eq.price.toLocaleString()}</td>
                        <td style={S.td}>
                          <span style={{ background: eq.condition === "new" ? "rgba(0,98,51,0.3)" : "rgba(120,66,18,0.3)", color: eq.condition === "new" ? "#81c784" : "#f0b27a", fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
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
            style={{ ...S.card, animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards", borderColor: "rgba(0,163,85,0.3)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Mic size={16} style={{ color: "#00a355" }} />
              <span style={{ color: "#c8e6c9", fontWeight: 600 }}>ملفك في قسم المنشطين</span>
            </div>
            <p style={{ color: "#6aad6a", fontSize: "0.875rem" }}>
              ملفك الشخصي معتمد ويظهر في صفحة طلبات المنشطين للعملاء.
            </p>
            <Link to="/voice-requests" style={{ color: "#00a355", fontSize: "0.85rem", textDecoration: "none", marginTop: "0.5rem", display: "inline-block" }}>
              عرض الصفحة
            </Link>
          </div>
        )}

        {/* Journalist info */}
        {profile.type === "journalist" && profile.status === "approved" && (
          <div
            className="p-5 rounded-xl animate-fade-in-up"
            style={{ ...S.card, animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards", borderColor: "rgba(0,163,85,0.3)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} style={{ color: "#00a355" }} />
              <span style={{ color: "#c8e6c9", fontWeight: 600 }}>ملفك في دليل الصحفيين</span>
            </div>
            <p style={{ color: "#6aad6a", fontSize: "0.875rem" }}>
              ملفك الشخصي معتمد ويظهر في قسم المحترفين على منصة سند.
            </p>
          </div>
        )}
      </div>

      {/* Add Equipment Modal */}
      {addEquipModal && (
        <Modal title="إضافة معدة جديدة" onClose={() => setAddEquipModal(false)}>
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
              <button onClick={() => setAddEquipModal(false)} style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#81c784", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>
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
