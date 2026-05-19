import { useState, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, ShoppingCart, Briefcase,
  Trophy, Mic, Settings, LogOut, Plus, Pencil, Trash2,
  X, Radio, ExternalLink, Users, Star, Check, AlertTriangle, Palette, Tv, FileText, Bell, Send, Trash,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import {
  subscribeToCollection,
  subscribeToAllProfiles,
  addCourse, updateCourse, deleteCourse,
  addJob, updateJob, deleteJob,
  addEquipment, updateEquipment, deleteEquipment,
  addCompetition, updateCompetition, deleteCompetition,
  addVoiceArtist, updateVoiceArtist, deleteVoiceArtist,
  approveItem, rejectItem, toggleFeatured,
  saveThemeSettings, subscribeToTheme,
  saveSiteContent, subscribeToSiteContent,
  getUserProfile,
  addChannel, updateChannel, deleteChannel, subscribeToChannels,
  sendNotification, subscribeToNotifications,
} from "../../../lib/firestore";
import { applyTheme } from "../../../lib/useTheme";
import { uploadImage } from "../../../lib/storage";
import type { Course, Job, Equipment, Competition, VoiceArtist, UserProfile, ThemeSettings, Channel, SiteContent, AppNotification } from "../../../lib/types";
import { DEFAULT_THEME, DEFAULT_SITE_CONTENT } from "../../../lib/types";

type Section = "overview" | "courses" | "equipment" | "jobs" | "competitions" | "voice" | "professionals" | "channels" | "appearance" | "content" | "notifications" | "settings";
type StatusFilter = "all" | "pending" | "approved";

// ── Shared styles ───────────────────────────────────────────────
const S = {
  card: {
    background: "linear-gradient(145deg, #141414, #101010)",
    border: "1px solid var(--p-25)",
    borderRadius: "0.75rem",
  } as React.CSSProperties,
  th: {
    color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.75rem", fontWeight: 500,
    padding: "0.75rem 1rem", textAlign: "right" as const,
    borderBottom: "1px solid var(--p-15)",
  },
  td: {
    color: "var(--theme-text, #c8e6c9)", fontSize: "0.875rem",
    padding: "0.85rem 1rem", textAlign: "right" as const,
    borderBottom: "1px solid var(--p-08)",
  },
  input: {
    background: "#161616", border: "1px solid var(--p-30)",
    color: "var(--theme-text, #e8f5e9)", borderRadius: "0.5rem",
    padding: "0.6rem 0.85rem", width: "100%", fontSize: "0.875rem",
  } as React.CSSProperties,
  label: { color: "var(--theme-badge-text, #81c784)", fontSize: "0.8rem", display: "block", marginBottom: "0.35rem" } as React.CSSProperties,
  badge: (color: string) => ({
    display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "9999px",
    fontSize: "0.72rem", background: color,
  }),
  statusBadge: (status: string) => ({
    display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem",
    background: status === "pending" ? "rgba(180,120,0,0.2)" : status === "approved" ? "var(--p-20)" : "rgba(198,40,40,0.1)",
    color: status === "pending" ? "#fbbf24" : status === "approved" ? "#4ade80" : "#f87171",
    border: `1px solid ${status === "pending" ? "rgba(180,120,0,0.3)" : status === "approved" ? "var(--p-30)" : "rgba(198,40,40,0.3)"}`,
  } as React.CSSProperties),
};

function statusLabel(s?: string) {
  if (s === "pending") return "قيد الانتظار";
  if (s === "rejected") return "مرفوض";
  return "مُعتمد";
}

// ── Modal wrapper ───────────────────────────────────────────────
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
          <button onClick={onClose} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} className="hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Delete confirm ──────────────────────────────────────────────
function ConfirmDelete({ label, onConfirm, onClose }: { label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal title="تأكيد الحذف" onClose={onClose}>
      <p style={{ color: "var(--theme-text-secondary, #a5d6a7)", marginBottom: "1.5rem" }}>
        هل أنت متأكد من حذف <strong style={{ color: "#ef9a9a" }}>{label}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)" }}>
          إلغاء
        </button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(198,40,40,0.2)", border: "1px solid rgba(198,40,40,0.4)", color: "#ef9a9a" }}>
          حذف
        </button>
      </div>
    </Modal>
  );
}

// ── Reject modal ────────────────────────────────────────────────
function RejectModal({ label, onConfirm, onClose }: { label: string; onConfirm: (note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState("");
  return (
    <Modal title="رفض العنصر" onClose={onClose}>
      <p style={{ color: "var(--theme-text-secondary, #a5d6a7)", marginBottom: "1rem" }}>
        سبب رفض <strong style={{ color: "#ef9a9a" }}>{label}</strong>:
      </p>
      <textarea
        style={{ ...S.input, minHeight: "80px", resize: "vertical" }}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="اذكر سبب الرفض للمستخدم..."
      />
      <div className="flex gap-3 justify-end mt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)" }}>
          إلغاء
        </button>
        <button onClick={() => onConfirm(note)} disabled={!note.trim()} className="px-4 py-2 rounded-lg text-sm disabled:opacity-50" style={{ background: "rgba(198,40,40,0.2)", border: "1px solid rgba(198,40,40,0.4)", color: "#ef9a9a" }}>
          تأكيد الرفض
        </button>
      </div>
    </Modal>
  );
}

// ── Status filter tabs ──────────────────────────────────────────
function StatusTabs({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const tabs: { v: StatusFilter; label: string }[] = [
    { v: "all", label: "الكل" },
    { v: "pending", label: "قيد الانتظار" },
    { v: "approved", label: "مُعتمد" },
  ];
  return (
    <div className="flex gap-1 mb-4">
      {tabs.map(({ v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
          style={{
            background: value === v ? (v === "pending" ? "rgba(180,120,0,0.2)" : "var(--p-20)") : "transparent",
            color: value === v ? (v === "pending" ? "#fbbf24" : "#4ade80") : "var(--theme-text-muted, #4a7a4a)",
            border: `1px solid ${value === v ? (v === "pending" ? "rgba(180,120,0,0.3)" : "var(--p-30)") : "var(--p-15)"}`,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Action buttons for items ────────────────────────────────────
function ItemActions({
  colName, id, status, featured, label,
  onEdit, onDelete,
}: {
  colName: string; id: string; status?: string; featured?: boolean; label: string;
  onEdit: () => void; onDelete: () => void;
}) {
  const [rejecting, setRejecting] = useState(false);

  return (
    <>
      <div className="flex gap-1.5 justify-end items-center flex-wrap">
        {/* Feature toggle */}
        <button
          onClick={() => toggleFeatured(colName, id, !!featured)}
          title={featured ? "إلغاء التمييز" : "تمييز"}
          className="p-1.5 rounded transition-colors"
          style={{ color: featured ? "#fbbf24" : "var(--theme-text-muted, #4a7a4a)", background: featured ? "rgba(180,120,0,0.15)" : "transparent" }}
        >
          <Star size={14} fill={featured ? "#fbbf24" : "none"} />
        </button>
        {/* Approve */}
        {(status === "pending" || status === "rejected" || !status) && (
          <button
            onClick={() => approveItem(colName, id)}
            title="موافقة"
            className="p-1.5 rounded transition-colors"
            style={{ color: "#4ade80", background: "var(--p-15)" }}
          >
            <Check size={14} />
          </button>
        )}
        {/* Reject */}
        {(status === "pending" || status === "approved" || !status) && (
          <button
            onClick={() => setRejecting(true)}
            title="رفض"
            className="p-1.5 rounded transition-colors"
            style={{ color: "#f87171", background: "rgba(198,40,40,0.1)" }}
          >
            <AlertTriangle size={14} />
          </button>
        )}
        <button onClick={onEdit} style={{ color: "var(--theme-text-secondary, #6aad6a)" }}><Pencil size={15} /></button>
        <button onClick={onDelete} style={{ color: "#ef9a9a" }}><Trash2 size={15} /></button>
      </div>
      {rejecting && (
        <RejectModal
          label={label}
          onConfirm={async (note) => { await rejectItem(colName, id, note); setRejecting(false); }}
          onClose={() => setRejecting(false)}
        />
      )}
    </>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/sanad-admin");
        return;
      }
      // Verify this is actually an admin (no regular user profile)
      const profile = await getUserProfile(user.uid);
      if (profile) {
        // Regular user — not an admin
        await signOut(auth);
        navigate("/sanad-admin");
      }
    });
    return unsub;
  }, [navigate]);

  const menuItems = [
    { id: "overview" as Section, label: "نظرة عامة", icon: LayoutDashboard },
    { id: "courses"  as Section, label: "الدورات",   icon: BookOpen },
    { id: "equipment"as Section, label: "العتاد",    icon: ShoppingCart },
    { id: "jobs"     as Section, label: "الوظائف",   icon: Briefcase },
    { id: "competitions" as Section, label: "المسابقات", icon: Trophy },
    { id: "voice"    as Section, label: "المنشطون",  icon: Mic },
    { id: "professionals" as Section, label: "المحترفون", icon: Users },
    { id: "channels"     as Section, label: "القنوات",   icon: Tv },
    { id: "appearance"   as Section, label: "المظهر",        icon: Palette },
    { id: "content"        as Section, label: "محتوى الصفحة", icon: FileText },
    { id: "notifications"  as Section, label: "الإشعارات",    icon: Bell },
    { id: "settings"       as Section, label: "الإعدادات",    icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/sanad-admin");
  };

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: "#0e0e0e" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col"
        style={{
          width: sidebarOpen ? "240px" : "64px",
          minHeight: "100vh",
          background: "linear-gradient(180deg, #131313 0%, #080808 100%)",
          borderLeft: "1px solid var(--p-20)",
          transition: "width 0.3s ease",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-4 mb-2" style={{ borderBottom: "1px solid var(--p-15)" }}>
          <div className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--theme-primary, #006233), color-mix(in srgb, var(--theme-primary, #006233) 70%, #ffffff))", boxShadow: "0 0 10px var(--p-40)" }}>
            <Radio size={16} color="#fff" />
          </div>
          {sidebarOpen && (
            <span className="font-bold" style={{ background: "linear-gradient(90deg, var(--theme-accent, #00a355), color-mix(in srgb, var(--theme-accent, #00a355) 70%, #ffffff))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              سند Admin
            </span>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              title={!sidebarOpen ? label : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
              style={{
                color: activeSection === id ? "var(--theme-accent, #00a355)" : "var(--theme-text-secondary, #6aad6a)",
                background: activeSection === id ? "var(--p-18)" : "transparent",
                justifyContent: sidebarOpen ? "flex-start" : "center",
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={{ fontSize: "0.875rem" }}>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 space-y-1" style={{ borderTop: "1px solid var(--p-15)" }}>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem", textDecoration: "none", justifyContent: sidebarOpen ? "flex-start" : "center" }}
          >
            <ExternalLink size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && "عرض الموقع"}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{ color: "#ef9a9a", fontSize: "0.875rem", justifyContent: sidebarOpen ? "flex-start" : "center" }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && "تسجيل الخروج"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center gap-4 px-6 py-4"
          style={{ borderBottom: "1px solid var(--p-15)", background: "rgba(11,15,11,0.8)", backdropFilter: "blur(8px)" }}
        >
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
            <LayoutDashboard size={20} />
          </button>
          <div>
            <h1 style={{ color: "var(--theme-text, #e8f5e9)", fontWeight: 600, fontSize: "1.1rem" }}>
              {menuItems.find((m) => m.id === activeSection)?.label}
            </h1>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {activeSection === "overview"       && <OverviewSection onNavigate={setActiveSection} />}
          {activeSection === "courses"        && <CoursesSection />}
          {activeSection === "equipment"      && <EquipmentSection />}
          {activeSection === "jobs"           && <JobsSection />}
          {activeSection === "competitions"   && <CompetitionsSection />}
          {activeSection === "voice"          && <VoiceSection />}
          {activeSection === "professionals"  && <ProfessionalsSection />}
          {activeSection === "channels"       && <ChannelsSection />}
          {activeSection === "appearance"     && <AppearanceSection />}
          {activeSection === "content"        && <SiteContentSection />}
          {activeSection === "notifications"  && <NotificationsSection />}
          {activeSection === "settings"       && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────
function OverviewSection({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const [counts, setCounts] = useState({ courses: 0, jobs: 0, equipment: 0, competitions: 0, voice: 0, profiles: 0 });
  const [pending, setPending] = useState({ courses: 0, jobs: 0, equipment: 0, competitions: 0, voice: 0, profiles: 0 });

  useEffect(() => {
    const unsubs = [
      subscribeToCollection<Course>("courses", (d) => {
        setCounts((c) => ({ ...c, courses: d.length }));
        setPending((p) => ({ ...p, courses: d.filter((x) => x.status === "pending").length }));
      }),
      subscribeToCollection<Job>("jobs", (d) => {
        setCounts((c) => ({ ...c, jobs: d.length }));
        setPending((p) => ({ ...p, jobs: d.filter((x) => x.status === "pending").length }));
      }),
      subscribeToCollection<Equipment>("equipment", (d) => {
        setCounts((c) => ({ ...c, equipment: d.length }));
        setPending((p) => ({ ...p, equipment: d.filter((x) => x.status === "pending").length }));
      }),
      subscribeToCollection<Competition>("competitions", (d) => {
        setCounts((c) => ({ ...c, competitions: d.length }));
        setPending((p) => ({ ...p, competitions: d.filter((x) => x.status === "pending").length }));
      }),
      subscribeToCollection<VoiceArtist>("voice", (d) => {
        setCounts((c) => ({ ...c, voice: d.length }));
        setPending((p) => ({ ...p, voice: d.filter((x) => x.status === "pending").length }));
      }),
      subscribeToAllProfiles((d) => {
        setCounts((c) => ({ ...c, profiles: d.length }));
        setPending((p) => ({ ...p, profiles: d.filter((x) => x.status === "pending").length }));
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const stats = [
    { label: "الدورات",     value: counts.courses,      pendingCount: pending.courses,      icon: BookOpen,      sec: "courses" as Section,      color: "var(--theme-primary, #006233)" },
    { label: "العتاد",      value: counts.equipment,    pendingCount: pending.equipment,    icon: ShoppingCart,  sec: "equipment" as Section,    color: "#1a5276" },
    { label: "الوظائف",     value: counts.jobs,         pendingCount: pending.jobs,         icon: Briefcase,     sec: "jobs" as Section,         color: "#7d3c98" },
    { label: "المسابقات",   value: counts.competitions, pendingCount: pending.competitions, icon: Trophy,        sec: "competitions" as Section, color: "#784212" },
    { label: "المنشطون",    value: counts.voice,        pendingCount: pending.voice,        icon: Mic,           sec: "voice" as Section,        color: "#1a6b47" },
    { label: "المحترفون",   value: counts.profiles,     pendingCount: pending.profiles,     icon: Users,         sec: "professionals" as Section, color: "#4a235a" },
  ];

  const totalPending = Object.values(pending).reduce((a, b) => a + b, 0);

  return (
    <div>
      {totalPending > 0 && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(180,120,0,0.1)", border: "1px solid rgba(180,120,0,0.3)" }}
        >
          <AlertTriangle size={18} style={{ color: "#fbbf24" }} />
          <span style={{ color: "#fbbf24", fontSize: "0.875rem" }}>
            يوجد <strong>{totalPending}</strong> عنصر قيد الانتظار يحتاج مراجعة
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, pendingCount, icon: Icon, sec, color }) => (
          <button
            key={label}
            onClick={() => onNavigate(sec)}
            className="p-5 rounded-xl text-right transition-all duration-200 card-glow"
            style={S.card}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${color}33`, border: `1px solid ${color}66` }}>
                <Icon size={20} style={{ color }} />
              </div>
              {pendingCount > 0 && (
                <span style={{ background: "rgba(180,120,0,0.2)", color: "#fbbf24", border: "1px solid rgba(180,120,0,0.3)", padding: "0.1rem 0.5rem", borderRadius: "9999px", fontSize: "0.7rem" }}>
                  {pendingCount} انتظار
                </span>
              )}
            </div>
            <div style={{ color: "var(--theme-text, #e8f5e9)", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 }}>{value}</div>
            <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.8rem", marginTop: "0.25rem" }}>{label}</div>
          </button>
        ))}
      </div>
      <div className="rounded-xl p-6" style={S.card}>
        <p style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>اضغط على أي بطاقة للانتقال إلى إدارة القسم.</p>
      </div>
    </div>
  );
}

// ── COURSES SECTION ─────────────────────────────────────────────
type CourseForm = Omit<Course, "id" | "createdAt" | "status" | "featured" | "submittedBy" | "rejectionNote">;
const emptyCourse: CourseForm = { title: "", type: "free", duration: "", description: "", instructor: "", link: "", price: 0, image: "", contentImages: [] };

function CoursesSection() {
  const [items, setItems] = useState<Course[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<CourseForm>(emptyCourse);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [imgUploading, setImgUploading] = useState(false);
  const [imgProgress, setImgProgress] = useState(0);
  const [contentImgUploading, setContentImgUploading] = useState(false);

  useEffect(() => subscribeToCollection<Course>("courses", setItems), []);

  const filtered = items.filter((c) => {
    if (filter === "all") return true;
    if (filter === "pending") return c.status === "pending";
    return c.status === "approved" || !c.status;
  });

  const openAdd = () => { setForm(emptyCourse); setModal("add"); };
  const openEdit = (c: Course) => { setEditId(c.id); setForm({ title: c.title, type: c.type, duration: c.duration, description: c.description, instructor: c.instructor, link: c.link || "", price: c.price || 0, image: c.image || "", contentImages: c.contentImages || [] }); setModal("edit"); };

  const handleImageUpload = async (file: File) => {
    setImgUploading(true);
    setImgProgress(0);
    try {
      const url = await uploadImage("courses", file, setImgProgress);
      setForm((f) => ({ ...f, image: url }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally { setImgUploading(false); }
  };

  const handleContentImageUpload = async (file: File) => {
    setContentImgUploading(true);
    try {
      const url = await uploadImage("courses/content", file);
      setForm((f) => ({ ...f, contentImages: [...(f.contentImages || []), url] }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally { setContentImgUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") await addCourse(form);
      else await updateCourse(editId, form);
      setModal(null);
    } finally { setSaving(false); }
  };

  const pendingCount = items.filter((c) => c.status === "pending").length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>{items.length} دورة مسجلة {pendingCount > 0 && <span style={{ color: "#fbbf24" }}>({pendingCount} انتظار)</span>}</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة دورة</span>
        </button>
      </div>
      <StatusTabs value={filter} onChange={setFilter} />

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["العنوان", "المدرب", "النوع", "الحالة", "مميز", ""].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد دورات</td></tr>
              ) : filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-green-950/20 transition-colors"
                  style={c.status === "pending" ? { borderRight: "3px solid rgba(180,120,0,0.5)" } : {}}
                >
                  <td style={S.td}>{c.title}</td>
                  <td style={S.td}>{c.instructor}</td>
                  <td style={S.td}>
                    <span style={S.badge(c.type === "free" ? "var(--p-30)" : "rgba(26,82,118,0.3)")}>
                      {c.type === "free" ? "مجانية" : `${c.price} دج`}
                    </span>
                  </td>
                  <td style={S.td}><span style={S.statusBadge(c.status || "approved")}>{statusLabel(c.status)}</span></td>
                  <td style={S.td}>{c.featured ? <Star size={14} fill="#fbbf24" color="#fbbf24" /> : "—"}</td>
                  <td style={{ ...S.td, width: "140px" }}>
                    <ItemActions colName="courses" id={c.id} status={c.status} featured={c.featured} label={c.title} onEdit={() => openEdit(c)} onDelete={() => setDeleteTarget(c)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "add" ? "إضافة دورة جديدة" : "تعديل الدورة"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label style={S.label}>عنوان الدورة *</label><input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: التصوير الصحفي الاحترافي" /></div>
            <div><label style={S.label}>اسم المدرب *</label><input style={S.input} value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={S.label}>نوع الدورة</label>
                <select style={S.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "free" | "paid" })}>
                  <option value="free">مجانية</option>
                  <option value="paid">مدفوعة</option>
                </select>
              </div>
              {form.type === "paid" && (
                <div><label style={S.label}>السعر (دج)</label><input type="number" style={S.input} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
              )}
              <div><label style={S.label}>المدة</label><input style={S.input} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="مثال: 4 أسابيع" /></div>
            </div>
            <div><label style={S.label}>وصف الدورة</label><textarea style={{ ...S.input, minHeight: "80px", resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label style={S.label}>رابط الدورة (اختياري)</label><input style={S.input} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></div>
            <div>
              <label style={S.label}>صورة الغلاف</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.image && <img src={form.image} alt="غلاف" style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "0.5rem", border: "1px solid var(--p-30)" }} />}
                <label style={{ ...S.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: imgUploading ? "var(--theme-text-secondary, #6aad6a)" : "var(--theme-badge-text, #81c784)" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} disabled={imgUploading} />
                  {imgUploading ? `جاري الرفع... ${imgProgress}%` : form.image ? "تغيير الصورة" : "اختر صورة"}
                </label>
              </div>
            </div>
            <div>
              <label style={S.label}>صور المحتوى</label>
              {form.contentImages && form.contentImages.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {form.contentImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img src={img} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "0.375rem" }} />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, contentImages: f.contentImages?.filter((_, i) => i !== idx) }))}
                        style={{ position: "absolute", top: 2, left: 2, background: "rgba(0,0,0,0.7)", color: "#ff6b6b", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <label style={{ ...S.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: contentImgUploading ? "var(--theme-text-secondary, #6aad6a)" : "var(--theme-badge-text, #81c784)" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleContentImageUpload(f); }} disabled={contentImgUploading} />
                {contentImgUploading ? "جاري الرفع..." : "+ إضافة صورة للمحتوى"}
              </label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.title} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                <span>{saving ? "جاري الحفظ..." : "حفظ"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDelete label={deleteTarget.title} onConfirm={async () => { await deleteCourse(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ── JOBS SECTION ────────────────────────────────────────────────
type JobForm = Omit<Job, "id" | "createdAt" | "status" | "featured" | "submittedBy" | "rejectionNote">;
const emptyJob: JobForm = { title: "", company: "", location: "", jobType: "", description: "", deadline: "", contact: "", source: "", companyDescription: "", image: "", contentImages: [] };

function JobsSection() {
  const [items, setItems] = useState<Job[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<JobForm>(emptyJob);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [imgUploading, setImgUploading] = useState(false);
  const [imgProgress, setImgProgress] = useState(0);
  const [contentImgUploading, setContentImgUploading] = useState(false);

  useEffect(() => subscribeToCollection<Job>("jobs", setItems), []);

  const filtered = items.filter((j) => {
    if (filter === "all") return true;
    if (filter === "pending") return j.status === "pending";
    return j.status === "approved" || !j.status;
  });

  const openAdd = () => { setForm(emptyJob); setModal("add"); };
  const openEdit = (j: Job) => { setEditId(j.id); setForm({ title: j.title, company: j.company, location: j.location, jobType: j.jobType, description: j.description, deadline: j.deadline || "", contact: j.contact, source: j.source || "", companyDescription: j.companyDescription || "", image: j.image || "", contentImages: j.contentImages || [] }); setModal("edit"); };

  const handleImageUpload = async (file: File) => {
    setImgUploading(true);
    setImgProgress(0);
    try {
      const url = await uploadImage("jobs", file, setImgProgress);
      setForm((f) => ({ ...f, image: url }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally { setImgUploading(false); }
  };

  const handleContentImageUpload = async (file: File) => {
    setContentImgUploading(true);
    try {
      const url = await uploadImage("jobs/content", file);
      setForm((f) => ({ ...f, contentImages: [...(f.contentImages || []), url] }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally { setContentImgUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") await addJob(form);
      else await updateJob(editId, form);
      setModal(null);
    } finally { setSaving(false); }
  };

  const pendingCount = items.filter((j) => j.status === "pending").length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>{items.length} عرض توظيف {pendingCount > 0 && <span style={{ color: "#fbbf24" }}>({pendingCount} انتظار)</span>}</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة وظيفة</span>
        </button>
      </div>
      <StatusTabs value={filter} onChange={setFilter} />

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["المسمى الوظيفي", "الجهة", "الموقع", "الحالة", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد عروض</td></tr>
              ) : filtered.map((j) => (
                <tr key={j.id} className="hover:bg-green-950/20 transition-colors" style={j.status === "pending" ? { borderRight: "3px solid rgba(180,120,0,0.5)" } : {}}>
                  <td style={S.td}>{j.title}</td>
                  <td style={S.td}>{j.company}</td>
                  <td style={S.td}>{j.location}</td>
                  <td style={S.td}><span style={S.statusBadge(j.status || "approved")}>{statusLabel(j.status)}</span></td>
                  <td style={{ ...S.td, width: "140px" }}>
                    <ItemActions colName="jobs" id={j.id} status={j.status} featured={j.featured} label={j.title} onEdit={() => openEdit(j)} onDelete={() => setDeleteTarget(j)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "add" ? "إضافة عرض توظيف" : "تعديل الوظيفة"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label style={S.label}>المسمى الوظيفي *</label><input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={S.label}>الجهة / المؤسسة</label><input style={S.input} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div>
                <label style={S.label}>الولاية</label>
                <select style={S.input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                  <option value="">اختر الولاية</option>
                  {["الجزائر","وهران","قسنطينة","عنابة","سطيف","تيزي وزو","البليدة","بجاية","تلمسان","باتنة"].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>نوع الوظيفة</label>
                <select style={S.input} value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
                  <option value="">اختر النوع</option>
                  <option value="صحفي">صحفي</option>
                  <option value="مقدم برامج">مقدم برامج</option>
                  <option value="محرر">محرر</option>
                  <option value="مصور">مصور</option>
                  <option value="مونتير">مونتير</option>
                </select>
              </div>
              <div><label style={S.label}>الموعد النهائي</label><input type="date" style={S.input} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            </div>
            <div><label style={S.label}>معلومات التواصل</label><input style={S.input} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="بريد / هاتف" /></div>
            <div><label style={S.label}>المصدر</label><input style={S.input} value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="مثال: وزارة الاتصال، موقع LinkedIn..." /></div>
            <div><label style={S.label}>تفاصيل الوظيفة</label><textarea style={{ ...S.input, minHeight: "80px", resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label style={S.label}>تعريف بالجهة المُوظِّفة</label><textarea style={{ ...S.input, minHeight: "70px", resize: "vertical" }} value={form.companyDescription || ""} onChange={(e) => setForm({ ...form, companyDescription: e.target.value })} placeholder="نبذة عن المؤسسة أو القناة أو الجهة..." /></div>
            <div>
              <label style={S.label}>صورة الغلاف</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.image && <img src={form.image} alt="غلاف" style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "0.5rem", border: "1px solid var(--p-30)" }} />}
                <label style={{ ...S.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: imgUploading ? "var(--theme-text-secondary, #6aad6a)" : "var(--theme-badge-text, #81c784)" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} disabled={imgUploading} />
                  {imgUploading ? `جاري الرفع... ${imgProgress}%` : form.image ? "تغيير الصورة" : "اختر صورة"}
                </label>
              </div>
            </div>
            <div>
              <label style={S.label}>صور المحتوى</label>
              {form.contentImages && form.contentImages.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {form.contentImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img src={img} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "0.375rem" }} />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, contentImages: f.contentImages?.filter((_, i) => i !== idx) }))}
                        style={{ position: "absolute", top: 2, left: 2, background: "rgba(0,0,0,0.7)", color: "#ff6b6b", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <label style={{ ...S.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: contentImgUploading ? "var(--theme-text-secondary, #6aad6a)" : "var(--theme-badge-text, #81c784)" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleContentImageUpload(f); }} disabled={contentImgUploading} />
                {contentImgUploading ? "جاري الرفع..." : "+ إضافة صورة للمحتوى"}
              </label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.title} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                <span>{saving ? "جاري الحفظ..." : "حفظ"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDelete label={deleteTarget.title} onConfirm={async () => { await deleteJob(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ── EQUIPMENT SECTION ───────────────────────────────────────────
type EquipmentForm = Omit<Equipment, "id" | "createdAt" | "status" | "featured" | "submittedBy" | "rejectionNote">;
const emptyEquip: EquipmentForm = { name: "", category: "", price: 0, seller: "", description: "", condition: "used", contact: "", image: "", contentImages: [] };

function EquipmentSection() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<EquipmentForm>(emptyEquip);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [imgUploading, setImgUploading] = useState(false);
  const [imgProgress, setImgProgress] = useState(0);
  const [contentImgUploading, setContentImgUploading] = useState(false);

  useEffect(() => subscribeToCollection<Equipment>("equipment", setItems), []);

  const filtered = items.filter((eq) => {
    if (filter === "all") return true;
    if (filter === "pending") return eq.status === "pending";
    return eq.status === "approved" || !eq.status;
  });

  const openAdd = () => { setForm(emptyEquip); setModal("add"); };
  const openEdit = (eq: Equipment) => { setEditId(eq.id); setForm({ name: eq.name, category: eq.category, price: eq.price, seller: eq.seller, description: eq.description, condition: eq.condition, contact: eq.contact, image: eq.image || "", contentImages: eq.contentImages || [] }); setModal("edit"); };

  const handleImageUpload = async (file: File) => {
    setImgUploading(true);
    setImgProgress(0);
    try {
      const url = await uploadImage("equipment", file, setImgProgress);
      setForm((f) => ({ ...f, image: url }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally { setImgUploading(false); }
  };

  const handleContentImageUpload = async (file: File) => {
    setContentImgUploading(true);
    try {
      const url = await uploadImage("equipment/content", file);
      setForm((f) => ({ ...f, contentImages: [...(f.contentImages || []), url] }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally { setContentImgUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") await addEquipment(form);
      else await updateEquipment(editId, form);
      setModal(null);
    } finally { setSaving(false); }
  };

  const pendingCount = items.filter((eq) => eq.status === "pending").length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>{items.length} منتج {pendingCount > 0 && <span style={{ color: "#fbbf24" }}>({pendingCount} انتظار)</span>}</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة منتج</span>
        </button>
      </div>
      <StatusTabs value={filter} onChange={setFilter} />

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["المنتج", "الفئة", "السعر (دج)", "الحالة الفيزيائية", "موافقة", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد منتجات</td></tr>
              ) : filtered.map((eq) => (
                <tr key={eq.id} className="hover:bg-green-950/20 transition-colors" style={eq.status === "pending" ? { borderRight: "3px solid rgba(180,120,0,0.5)" } : {}}>
                  <td style={S.td}>{eq.name}</td>
                  <td style={S.td}>{eq.category}</td>
                  <td style={S.td}>{eq.price.toLocaleString()}</td>
                  <td style={S.td}><span style={S.badge(eq.condition === "new" ? "var(--p-30)" : "rgba(120,66,18,0.3)")}>{eq.condition === "new" ? "جديد" : "مستعمل"}</span></td>
                  <td style={S.td}><span style={S.statusBadge(eq.status || "approved")}>{statusLabel(eq.status)}</span></td>
                  <td style={{ ...S.td, width: "140px" }}>
                    <ItemActions colName="equipment" id={eq.id} status={eq.status} featured={eq.featured} label={eq.name} onEdit={() => openEdit(eq)} onDelete={() => setDeleteTarget(eq)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "add" ? "إضافة منتج" : "تعديل المنتج"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label style={S.label}>اسم المنتج *</label><input style={S.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={S.label}>الفئة</label>
                <select style={S.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
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
                <select style={S.input} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as "new" | "used" })}>
                  <option value="new">جديد</option>
                  <option value="used">مستعمل</option>
                </select>
              </div>
              <div><label style={S.label}>السعر (دج)</label><input type="number" style={S.input} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
              <div><label style={S.label}>اسم البائع</label><input style={S.input} value={form.seller} onChange={(e) => setForm({ ...form, seller: e.target.value })} /></div>
            </div>
            <div><label style={S.label}>معلومات التواصل</label><input style={S.input} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div><label style={S.label}>الوصف</label><textarea style={{ ...S.input, minHeight: "70px", resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <label style={S.label}>صورة الغلاف</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.image && <img src={form.image} alt="غلاف" style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "0.5rem", border: "1px solid var(--p-30)" }} />}
                <label style={{ ...S.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: imgUploading ? "var(--theme-text-secondary, #6aad6a)" : "var(--theme-badge-text, #81c784)" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} disabled={imgUploading} />
                  {imgUploading ? `جاري الرفع... ${imgProgress}%` : form.image ? "تغيير الصورة" : "اختر صورة"}
                </label>
              </div>
            </div>
            <div>
              <label style={S.label}>صور المحتوى</label>
              {form.contentImages && form.contentImages.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {form.contentImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img src={img} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "0.375rem" }} />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, contentImages: f.contentImages?.filter((_, i) => i !== idx) }))}
                        style={{ position: "absolute", top: 2, left: 2, background: "rgba(0,0,0,0.7)", color: "#ff6b6b", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <label style={{ ...S.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: contentImgUploading ? "var(--theme-text-secondary, #6aad6a)" : "var(--theme-badge-text, #81c784)" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleContentImageUpload(f); }} disabled={contentImgUploading} />
                {contentImgUploading ? "جاري الرفع..." : "+ إضافة صورة للمحتوى"}
              </label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                <span>{saving ? "جاري الحفظ..." : "حفظ"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDelete label={deleteTarget.name} onConfirm={async () => { await deleteEquipment(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ── COMPETITIONS SECTION ────────────────────────────────────────
type CompForm = Omit<Competition, "id" | "createdAt" | "status" | "featured" | "submittedBy" | "rejectionNote">;
const emptyComp: CompForm = { name: "", type: "national", startDate: "", endDate: "", description: "", content: "", organizer: "", organizerDescription: "", targetAudience: "", source: "", image: "", contentImages: [], link: "" };

function CompetitionsSection() {
  const [items, setItems] = useState<Competition[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<CompForm>(emptyComp);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [imgUploading, setImgUploading] = useState(false);
  const [imgProgress, setImgProgress] = useState(0);
  const [contentImgUploading, setContentImgUploading] = useState(false);

  useEffect(() => subscribeToCollection<Competition>("competitions", setItems), []);

  const filtered = items.filter((c) => {
    if (filter === "all") return true;
    if (filter === "pending") return c.status === "pending";
    return c.status === "approved" || !c.status;
  });

  const openAdd = () => { setForm(emptyComp); setModal("add"); };
  const openEdit = (c: Competition) => { setEditId(c.id); setForm({ name: c.name, type: c.type, startDate: c.startDate, endDate: c.endDate, description: c.description, content: c.content || "", organizer: c.organizer, organizerDescription: c.organizerDescription || "", targetAudience: c.targetAudience || "", source: c.source || "", image: c.image || "", contentImages: c.contentImages || [], link: c.link || "" }); setModal("edit"); };

  const handleImageUpload = async (file: File) => {
    setImgUploading(true);
    setImgProgress(0);
    try {
      const url = await uploadImage("competitions", file, setImgProgress);
      setForm((f) => ({ ...f, image: url }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setImgUploading(false);
    }
  };

  const handleContentImageUpload = async (file: File) => {
    setContentImgUploading(true);
    try {
      const url = await uploadImage("competitions/content", file);
      setForm((f) => ({ ...f, contentImages: [...(f.contentImages || []), url] }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setContentImgUploading(false);
    }
  };

  const typeLabel: Record<string, string> = { university: "جامعية", national: "وطنية", international: "دولية" };
  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") await addCompetition(form);
      else await updateCompetition(editId, form);
      setModal(null);
    } finally { setSaving(false); }
  };

  const pendingCount = items.filter((c) => c.status === "pending").length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>{items.length} مسابقة {pendingCount > 0 && <span style={{ color: "#fbbf24" }}>({pendingCount} انتظار)</span>}</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة مسابقة</span>
        </button>
      </div>
      <StatusTabs value={filter} onChange={setFilter} />

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["المسابقة", "النوع", "البداية", "النهاية", "الحالة", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد مسابقات</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-green-950/20 transition-colors" style={c.status === "pending" ? { borderRight: "3px solid rgba(180,120,0,0.5)" } : {}}>
                  <td style={S.td}>{c.name}</td>
                  <td style={S.td}><span style={S.badge("var(--p-25)")}>{typeLabel[c.type]}</span></td>
                  <td style={S.td}>{c.startDate}</td>
                  <td style={S.td}>{c.endDate}</td>
                  <td style={S.td}><span style={S.statusBadge(c.status || "approved")}>{statusLabel(c.status)}</span></td>
                  <td style={{ ...S.td, width: "140px" }}>
                    <ItemActions colName="competitions" id={c.id} status={c.status} featured={c.featured} label={c.name} onEdit={() => openEdit(c)} onDelete={() => setDeleteTarget(c)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "add" ? "إضافة مسابقة" : "تعديل المسابقة"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label style={S.label}>اسم المسابقة *</label><input style={S.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={S.label}>النوع</label>
                <select style={S.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CompForm["type"] })}>
                  <option value="university">جامعية</option>
                  <option value="national">وطنية</option>
                  <option value="international">دولية</option>
                </select>
              </div>
              <div><label style={S.label}>المنظم</label><input style={S.input} value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} /></div>
              <div><label style={S.label}>تاريخ البداية</label><input type="date" style={S.input} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><label style={S.label}>تاريخ النهاية</label><input type="date" style={S.input} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div>
              <label style={S.label}>صورة الغلاف</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.image && <img src={form.image} alt="غلاف" style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "0.5rem", border: "1px solid var(--p-30)" }} />}
                <label style={{ ...S.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: imgUploading ? "var(--theme-text-secondary, #6aad6a)" : "var(--theme-badge-text, #81c784)" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} disabled={imgUploading} />
                  {imgUploading ? `جاري الرفع... ${imgProgress}%` : form.image ? "تغيير الصورة" : "اختر صورة"}
                </label>
              </div>
            </div>
            <div>
              <label style={S.label}>صور المحتوى</label>
              {form.contentImages && form.contentImages.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {form.contentImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img src={img} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "0.375rem" }} />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, contentImages: f.contentImages?.filter((_, i) => i !== idx) }))}
                        style={{ position: "absolute", top: 2, left: 2, background: "rgba(0,0,0,0.7)", color: "#ff6b6b", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <label style={{ ...S.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: contentImgUploading ? "var(--theme-text-secondary, #6aad6a)" : "var(--theme-badge-text, #81c784)" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleContentImageUpload(f); }} disabled={contentImgUploading} />
                {contentImgUploading ? "جاري الرفع..." : "+ إضافة صورة للمحتوى"}
              </label>
            </div>
            <div><label style={S.label}>مقدمة / وصف مختصر</label><textarea style={{ ...S.input, minHeight: "70px", resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label style={S.label}>محتوى المقال</label><textarea style={{ ...S.input, minHeight: "140px", resize: "vertical" }} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="اكتب تفاصيل المسابقة كاملة هنا..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={S.label}>الفئة المستهدفة</label><input style={S.input} value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} placeholder="مثال: طلبة جامعيون، صحفيون..." /></div>
              <div><label style={S.label}>المصدر</label><input style={S.input} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="مثال: وزارة الاتصال" /></div>
            </div>
            <div><label style={S.label}>تعريف الجهة المنظمة</label><textarea style={{ ...S.input, minHeight: "70px", resize: "vertical" }} value={form.organizerDescription} onChange={(e) => setForm({ ...form, organizerDescription: e.target.value })} /></div>
            <div><label style={S.label}>الرابط الرسمي (اختياري)</label><input style={S.input} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." dir="ltr" /></div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                <span>{saving ? "جاري الحفظ..." : "حفظ"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDelete label={deleteTarget.name} onConfirm={async () => { await deleteCompetition(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ── VOICE SECTION ───────────────────────────────────────────────
type VoiceForm = Omit<VoiceArtist, "id" | "createdAt" | "status" | "featured" | "submittedBy" | "rejectionNote">;
const emptyVoice: VoiceForm = { name: "", specialty: "", experience: "", description: "", contact: "" };

function VoiceSection() {
  const [items, setItems] = useState<VoiceArtist[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<VoiceForm>(emptyVoice);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VoiceArtist | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => subscribeToCollection<VoiceArtist>("voice", setItems), []);

  const filtered = items.filter((v) => {
    if (filter === "all") return true;
    if (filter === "pending") return v.status === "pending";
    return v.status === "approved" || !v.status;
  });

  const openAdd = () => { setForm(emptyVoice); setModal("add"); };
  const openEdit = (v: VoiceArtist) => { setEditId(v.id); setForm({ name: v.name, specialty: v.specialty, experience: v.experience, description: v.description, contact: v.contact }); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") await addVoiceArtist(form);
      else await updateVoiceArtist(editId, form);
      setModal(null);
    } finally { setSaving(false); }
  };

  const pendingCount = items.filter((v) => v.status === "pending").length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>{items.length} منشط {pendingCount > 0 && <span style={{ color: "#fbbf24" }}>({pendingCount} انتظار)</span>}</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة منشط</span>
        </button>
      </div>
      <StatusTabs value={filter} onChange={setFilter} />

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["الاسم", "التخصص", "الخبرة", "الحالة", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا يوجد منشطون</td></tr>
              ) : filtered.map((v) => (
                <tr key={v.id} className="hover:bg-green-950/20 transition-colors" style={v.status === "pending" ? { borderRight: "3px solid rgba(180,120,0,0.5)" } : {}}>
                  <td style={S.td}>{v.name}</td>
                  <td style={S.td}><span style={S.badge("var(--p-25)")}>{v.specialty}</span></td>
                  <td style={S.td}>{v.experience}</td>
                  <td style={S.td}><span style={S.statusBadge(v.status || "approved")}>{statusLabel(v.status)}</span></td>
                  <td style={{ ...S.td, width: "140px" }}>
                    <ItemActions colName="voice" id={v.id} status={v.status} featured={v.featured} label={v.name} onEdit={() => openEdit(v)} onDelete={() => setDeleteTarget(v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === "add" ? "إضافة منشط" : "تعديل المنشط"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label style={S.label}>الاسم الكامل *</label><input style={S.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={S.label}>التخصص</label>
                <select style={S.input} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
                  <option value="">اختر التخصص</option>
                  <option value="إذاعي">إذاعي</option>
                  <option value="تلفزيوني">تلفزيوني</option>
                  <option value="بودكاست">بودكاست</option>
                  <option value="تعليق صوتي">تعليق صوتي</option>
                </select>
              </div>
              <div><label style={S.label}>سنوات الخبرة</label><input style={S.input} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="مثال: 5 سنوات" /></div>
            </div>
            <div><label style={S.label}>معلومات التواصل</label><input style={S.input} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div><label style={S.label}>نبذة</label><textarea style={{ ...S.input, minHeight: "70px", resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                <span>{saving ? "جاري الحفظ..." : "حفظ"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDelete label={deleteTarget.name} onConfirm={async () => { await deleteVoiceArtist(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ── PROFESSIONALS SECTION ───────────────────────────────────────
function ProfessionalsSection() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => subscribeToAllProfiles(setProfiles), []);

  const filtered = profiles.filter((p) => {
    if (filter === "all") return true;
    if (filter === "pending") return p.status === "pending";
    return p.status === "approved";
  });

  const typeLabel: Record<string, string> = {
    journalist: "صحفي",
    voice: "منشط صوتي",
    vendor: "بائع عتاد",
  };

  const pendingCount = profiles.filter((p) => p.status === "pending").length;

  const [rejectTarget, setRejectTarget] = useState<UserProfile | null>(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>
          {profiles.length} محترف مسجل{pendingCount > 0 && <span style={{ color: "#fbbf24" }}> ({pendingCount} انتظار)</span>}
        </span>
      </div>
      <StatusTabs value={filter} onChange={setFilter} />

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["الاسم", "النوع", "التخصص", "الولاية", "الحالة", "مميز", "الإجراءات"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا يوجد محترفون مسجلون بعد</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-green-950/20 transition-colors" style={p.status === "pending" ? { borderRight: "3px solid rgba(180,120,0,0.5)" } : {}}>
                  <td style={S.td}>
                    <div>{p.name}</div>
                    <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>{p.email}</div>
                  </td>
                  <td style={S.td}><span style={S.badge("var(--p-20)")}>{typeLabel[p.type] || p.type}</span></td>
                  <td style={S.td}>{p.specialty || "—"}</td>
                  <td style={S.td}>{p.location || "—"}</td>
                  <td style={S.td}><span style={S.statusBadge(p.status)}>{statusLabel(p.status)}</span></td>
                  <td style={S.td}>{p.featured ? <Star size={14} fill="#fbbf24" color="#fbbf24" /> : "—"}</td>
                  <td style={{ ...S.td, width: "160px" }}>
                    <div className="flex gap-1.5 justify-end items-center flex-wrap">
                      <button
                        onClick={() => toggleFeatured("users", p.id, p.featured)}
                        title={p.featured ? "إلغاء التمييز" : "تمييز"}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: p.featured ? "#fbbf24" : "var(--theme-text-muted, #4a7a4a)", background: p.featured ? "rgba(180,120,0,0.15)" : "transparent" }}
                      >
                        <Star size={14} fill={p.featured ? "#fbbf24" : "none"} />
                      </button>
                      {p.status !== "approved" && (
                        <button
                          onClick={() => approveItem("users", p.id)}
                          title="موافقة"
                          className="p-1.5 rounded"
                          style={{ color: "#4ade80", background: "var(--p-15)" }}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {p.status !== "rejected" && (
                        <button
                          onClick={() => setRejectTarget(p)}
                          title="رفض"
                          className="p-1.5 rounded"
                          style={{ color: "#f87171", background: "rgba(198,40,40,0.1)" }}
                        >
                          <AlertTriangle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rejectTarget && (
        <RejectModal
          label={rejectTarget.name}
          onConfirm={async (note) => { await rejectItem("users", rejectTarget.id, note); setRejectTarget(null); }}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}

// ── CHANNELS SECTION ────────────────────────────────────────────
type ChForm = Omit<Channel, "id" | "createdAt">;
const emptyChannel: ChForm = { name: "", type: "tv", category: "وطنية", frequency: "", email: "", address: "", website: "", phone: "", facebook: "", youtube: "", instagram: "", twitter: "" };

function ChannelsSection() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ChForm>(emptyChannel);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "tv" | "radio">("");

  useEffect(() => {
    return subscribeToChannels(setChannels);
  }, []);

  const cf = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await updateChannel(editId, form);
      } else {
        await addChannel(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyChannel);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (ch: Channel) => {
    setForm({ name: ch.name, type: ch.type, category: ch.category, frequency: ch.frequency || "", email: ch.email || "", address: ch.address || "", website: ch.website || "", phone: ch.phone || "", facebook: ch.facebook || "", youtube: ch.youtube || "", instagram: ch.instagram || "", twitter: ch.twitter || "" });
    setEditId(ch.id);
    setShowForm(true);
  };

  const q = search.toLowerCase();
  const filtered = channels.filter((ch) => {
    const matchSearch = !q || ch.name.toLowerCase().includes(q);
    const matchType = !typeFilter || ch.type === typeFilter;
    return matchSearch && matchType;
  });

  const inputStyle = S.input;
  const labelStyle = S.label;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="بحث عن قناة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingRight: "2.5rem" }}
          />
        </div>
        <select style={{ ...inputStyle, width: "140px" }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "" | "tv" | "radio")}>
          <option value="">الكل</option>
          <option value="tv">📺 تلفزيون</option>
          <option value="radio">📻 إذاعة</option>
        </select>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyChannel); }}
          className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={15} />
          <span>إضافة قناة</span>
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
        <span>📺 {channels.filter((c) => c.type === "tv").length} قناة تلفزيونية</span>
        <span>📻 {channels.filter((c) => c.type === "radio").length} محطة إذاعية</span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={S.card}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["القناة", "النوع", "التردد", "البريد", "الإجراءات"].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>
                    {channels.length === 0 ? 'لا توجد قنوات بعد.' : "لا توجد نتائج."}
                  </td>
                </tr>
              ) : filtered.map((ch) => (
                <tr key={ch.id} className="hover:bg-green-950/10 transition-colors">
                  <td style={S.td}>
                    <div className="font-medium" style={{ color: "var(--theme-text, #c8e6c9)" }}>{ch.name}</div>
                    <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.72rem" }}>{ch.category}</div>
                  </td>
                  <td style={S.td}>
                    <span style={{ fontSize: "0.8rem", color: ch.type === "tv" ? "var(--theme-accent, #00a355)" : "#64b5f6" }}>
                      {ch.type === "tv" ? "📺 تلفزيون" : "📻 إذاعة"}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontFamily: "monospace", fontSize: "0.78rem", color: "var(--theme-badge-text, #81c784)" }} dir="ltr">
                    {ch.frequency || "—"}
                  </td>
                  <td style={{ ...S.td, fontSize: "0.78rem" }} dir="ltr">{ch.email || "—"}</td>
                  <td style={S.td}>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(ch)} style={{ color: "var(--theme-badge-text, #81c784)" }}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(ch.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal title={editId ? "تعديل القناة" : "إضافة قناة"} onClose={() => { setShowForm(false); setEditId(null); }}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label style={labelStyle}>اسم القناة *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => cf("name", e.target.value)} placeholder="مثال: الشروق تيفي" />
              </div>
              <div>
                <label style={labelStyle}>النوع</label>
                <select style={inputStyle} value={form.type} onChange={(e) => cf("type", e.target.value)}>
                  <option value="tv">📺 تلفزيون</option>
                  <option value="radio">📻 إذاعة</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>الفئة</label>
                <select style={inputStyle} value={form.category} onChange={(e) => cf("category", e.target.value)}>
                  <option value="وطنية">وطنية</option>
                  <option value="خاصة">خاصة</option>
                  <option value="محلية">محلية</option>
                  <option value="دينية">دينية</option>
                  <option value="متخصصة">متخصصة</option>
                </select>
              </div>
              <div className="col-span-2">
                <label style={labelStyle}>التردد</label>
                <input style={inputStyle} value={form.frequency} onChange={(e) => cf("frequency", e.target.value)} placeholder="مثال: Nilesat 7°W — 10853 H 27500 أو FM 106.7 الجزائر" dir="ltr" />
              </div>
              <div>
                <label style={labelStyle}>البريد الإلكتروني</label>
                <input style={inputStyle} value={form.email} onChange={(e) => cf("email", e.target.value)} dir="ltr" />
              </div>
              <div>
                <label style={labelStyle}>الهاتف</label>
                <input style={inputStyle} value={form.phone} onChange={(e) => cf("phone", e.target.value)} dir="ltr" />
              </div>
              <div className="col-span-2">
                <label style={labelStyle}>العنوان</label>
                <input style={inputStyle} value={form.address} onChange={(e) => cf("address", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label style={labelStyle}>الموقع الإلكتروني</label>
                <input style={inputStyle} value={form.website} onChange={(e) => cf("website", e.target.value)} dir="ltr" placeholder="https://..." />
              </div>
              <div>
                <label style={labelStyle}>فيسبوك</label>
                <input style={inputStyle} value={form.facebook} onChange={(e) => cf("facebook", e.target.value)} dir="ltr" placeholder="https://facebook.com/..." />
              </div>
              <div>
                <label style={labelStyle}>يوتيوب</label>
                <input style={inputStyle} value={form.youtube} onChange={(e) => cf("youtube", e.target.value)} dir="ltr" placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label style={labelStyle}>إنستغرام</label>
                <input style={inputStyle} value={form.instagram} onChange={(e) => cf("instagram", e.target.value)} dir="ltr" placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label style={labelStyle}>تويتر/X</label>
                <input style={inputStyle} value={form.twitter} onChange={(e) => cf("twitter", e.target.value)} dir="ltr" placeholder="https://x.com/..." />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                <span>{saving ? "جاري الحفظ..." : editId ? "حفظ التعديلات" : "إضافة"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmDelete
          label={channels.find((c) => c.id === deleteId)?.name || ""}
          onConfirm={async () => { await deleteChannel(deleteId); setDeleteId(null); }}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

// ── SITE CONTENT ────────────────────────────────────────────────
const CONTENT_FIELDS: { key: keyof SiteContent; label: string; multiline?: boolean }[] = [
  { key: "siteName",       label: "اسم الموقع" },
  { key: "heroBadge",      label: "نص الشارة (Hero Badge)" },
  { key: "heroTitle",      label: "بداية العنوان الرئيسي" },
  { key: "heroSubtitle",   label: "العنوان الفرعي" },
  { key: "heroDescription",label: "وصف الصفحة الرئيسية", multiline: true },
  { key: "heroCta1",       label: "زر الاستكشاف" },
  { key: "heroCta2",       label: "زر الانضمام (Hero)" },
  { key: "servicesLabel",  label: "تسمية قسم الخدمات" },
  { key: "servicesTitle",  label: "عنوان قسم الخدمات" },
  { key: "ctaTitle",       label: "عنوان قسم الانضمام" },
  { key: "ctaSubtitle",    label: "وصف قسم الانضمام", multiline: true },
  { key: "ctaButton",      label: "زر الانضمام" },
  { key: "ctaButton2",     label: "زر تصفح الدورات" },
];

const contentInputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--p-08)",
  border: "1px solid var(--p-25)",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "var(--theme-text)",
  fontSize: "0.9rem",
  outline: "none",
};

function SiteContentSection() {
  const [contentForm, setContentForm] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSiteContent((c) => setContentForm(c));
    return unsub;
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveSiteContent(contentForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, marginBottom: "1.25rem" }}>
          تعديل نصوص الصفحة الرئيسية
        </h3>
        <div className="space-y-5">
          {CONTENT_FIELDS.map(({ key, label, multiline }) => (
            <div key={key}>
              <label style={S.label}>{label}</label>
              {multiline ? (
                <textarea
                  rows={3}
                  value={contentForm[key]}
                  onChange={(e) => setContentForm({ ...contentForm, [key]: e.target.value })}
                  style={{ ...contentInputStyle, resize: "vertical" }}
                  dir="rtl"
                />
              ) : (
                <input
                  type="text"
                  value={contentForm[key]}
                  onChange={(e) => setContentForm({ ...contentForm, [key]: e.target.value })}
                  style={contentInputStyle}
                  dir="rtl"
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-dz flex-1 py-3 rounded-xl font-medium disabled:opacity-60"
        >
          <span>{saved ? "✓ تم الحفظ!" : saving ? "جاري الحفظ..." : "حفظ النصوص"}</span>
        </button>
        <button
          onClick={() => setContentForm(DEFAULT_SITE_CONTENT)}
          className="px-6 py-3 rounded-xl text-sm"
          style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary, #6aad6a)" }}
        >
          إعادة الافتراضي
        </button>
      </div>
    </div>
  );
}

// ── NOTIFICATIONS ───────────────────────────────────────────────
function NotificationsSection() {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [form, setForm] = useState({ title: "", body: "", link: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToNotifications(setNotifs);
  }, []);

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSending(true);
    await sendNotification({ title: form.title.trim(), body: form.body.trim(), link: form.link.trim() || undefined, createdAt: Date.now() });
    setForm({ title: "", body: "", link: "" });
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    setSending(false);
  };

  const inputStyle: React.CSSProperties = { width: "100%", background: "var(--p-08)", border: "1px solid var(--p-25)", borderRadius: "8px", padding: "8px 12px", color: "var(--theme-text)", fontSize: "0.9rem", outline: "none" };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Compose */}
      <div className="rounded-xl p-6" style={S.card}>
        <h3 className="font-semibold mb-5" style={{ color: "var(--theme-text)" }}>إرسال إشعار جديد</h3>
        <div className="space-y-4">
          <div>
            <label style={S.label}>عنوان الإشعار *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} dir="rtl" placeholder="مثال: دورة جديدة متاحة!" />
          </div>
          <div>
            <label style={S.label}>نص الإشعار *</label>
            <textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} dir="rtl" placeholder="اكتب تفاصيل الإشعار هنا..." />
          </div>
          <div>
            <label style={S.label}>رابط (اختياري)</label>
            <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} style={inputStyle} dir="ltr" placeholder="/courses" />
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={sending || !form.title.trim() || !form.body.trim()}
          className="btn-dz mt-5 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm disabled:opacity-50"
        >
          <Send size={15} />
          <span>{sent ? "✓ تم الإرسال!" : sending ? "جاري الإرسال..." : "إرسال للجميع"}</span>
        </button>
      </div>

      {/* History */}
      <div className="rounded-xl p-6" style={S.card}>
        <h3 className="font-semibold mb-4" style={{ color: "var(--theme-text)" }}>سجل الإشعارات ({notifs.length})</h3>
        {notifs.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--theme-text-muted)" }}>لا توجد إشعارات مرسلة بعد</p>
        ) : (
          <div className="space-y-3">
            {notifs.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 p-3 rounded-lg" style={{ background: "var(--p-05)", border: "1px solid var(--p-15)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--theme-text-muted)" }}>{n.body}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--theme-text-dim)" }}>
                    {new Date(n.createdAt).toLocaleDateString("ar-DZ", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}{n.readBy?.length ?? 0} قراءة
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setDeleting(n.id);
                    const { deleteDoc, doc } = await import("firebase/firestore");
                    const { db } = await import("../../../lib/firebase");
                    await deleteDoc(doc(db, "notifications", n.id));
                    setDeleting(null);
                  }}
                  disabled={deleting === n.id}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "#ef9a9a", border: "1px solid rgba(198,40,40,0.2)" }}
                >
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── APPEARANCE ──────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { key: "bgMain",        label: "لون الخلفية الرئيسية",    hint: "الخلفية العامة للموقع" },
  { key: "bgCard",        label: "لون خلفية البطاقات (بداية التدرج)", hint: "اللون الأساسي للبطاقات" },
  { key: "bgCardEnd",     label: "لون خلفية البطاقات (نهاية التدرج)", hint: "اتركه مساوياً للبداية للون موحد" },
  { key: "primaryGreen",  label: "اللون الرئيسي",            hint: "الحدود والأيقونات" },
  { key: "accentGreen",   label: "اللون المُضيء",            hint: "الأزرار والتمييزات" },
  { key: "textColor",     label: "لون نصوص الصفحات",        hint: "العناوين والنصوص خارج البطاقات" },
  { key: "cardTextColor", label: "لون نصوص البطاقات",        hint: "النصوص داخل البطاقات والقوائم" },
] as const;

const PRESETS: { label: string; theme: ThemeSettings }[] = [
  { label: "الجزائر الليلي 🇩🇿", theme: { bgMain: "#0e0e0e", bgCard: "#141414", bgCardEnd: "#101010", primaryGreen: "#006233", accentGreen: "#00a355", textColor: "#e8f5e9", cardTextColor: "#c8e6c9" } },
  { label: "الصحراء الداكنة 🏜️",  theme: { bgMain: "#100d08", bgCard: "#1a1510", bgCardEnd: "#130f0a", primaryGreen: "#7a4f00", accentGreen: "#c47d00", textColor: "#f5ede0", cardTextColor: "#ffe0b2" } },
  { label: "البحر المتوسط 🌊",    theme: { bgMain: "#080e14", bgCard: "#0f1a24", bgCardEnd: "#0a1520", primaryGreen: "#005f8a", accentGreen: "#0099cc", textColor: "#e0f0ff", cardTextColor: "#b3e5fc" } },
  { label: "الرمادي المحترف ⚪",  theme: { bgMain: "#0c0c0c", bgCard: "#181818", bgCardEnd: "#141414", primaryGreen: "#4a4a4a", accentGreen: "#888888", textColor: "#dddddd", cardTextColor: "#cccccc" } },
];

function AppearanceSection() {
  const [form, setForm] = useState<ThemeSettings>(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToTheme((t) => setForm(t));
    return unsub;
  }, []);

  const handleChange = (key: keyof ThemeSettings, value: string) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    applyTheme(updated); // live preview
  };

  const handlePreset = (theme: ThemeSettings) => {
    setForm(theme);
    applyTheme(theme);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveThemeSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const handleReset = () => {
    setForm(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Presets */}
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, marginBottom: "1rem" }}>ثيمات جاهزة</h3>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.theme)}
              className="flex items-center gap-3 p-3 rounded-lg text-right transition-all duration-200"
              style={{
                background: p.theme.bgMain,
                border: `2px solid ${p.theme.primaryGreen}`,
                cursor: "pointer",
              }}
            >
              <div className="flex gap-1 flex-shrink-0">
                {[p.theme.primaryGreen, p.theme.accentGreen, p.theme.bgCard].map((c) => (
                  <span key={c} className="w-4 h-4 rounded-full" style={{ background: c, border: "1px solid rgba(255,255,255,0.1)" }} />
                ))}
              </div>
              <span style={{ color: "var(--theme-text, #e8f5e9)", fontSize: "0.8rem" }}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color pickers */}
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, marginBottom: "1.25rem" }}>تخصيص الألوان</h3>
        <div className="space-y-5">
          {COLOR_OPTIONS.map(({ key, label, hint }) => {
            const colorVal = (form[key] ?? (key === "bgCardEnd" ? form.bgCard : form.textColor)) as string;
            return (
            <div key={key} className="flex items-center gap-4">
              {/* Color preview + picker */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-xl"
                  style={{ background: colorVal, border: "2px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
                  onClick={() => document.getElementById(`picker-${key}`)?.click()}
                />
                <input
                  id={`picker-${key}`}
                  type="color"
                  value={colorVal}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{ position: "absolute", opacity: 0, width: "1px", height: "1px", top: 0, left: 0 }}
                />
              </div>
              <div className="flex-1">
                <div style={{ color: "var(--theme-text, #c8e6c9)", fontSize: "0.875rem", fontWeight: 500 }}>{label}</div>
                <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>{hint}</div>
              </div>
              {/* Hex input */}
              <input
                type="text"
                value={colorVal}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) handleChange(key, v);
                }}
                style={{
                  ...S.input,
                  width: "110px",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                  textTransform: "lowercase",
                }}
              />
            </div>
          );})}
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-xl p-6 overflow-hidden relative" style={{ background: form.bgMain, border: `1px solid ${form.primaryGreen}55` }}>
        <div style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.7rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>معاينة مباشرة</div>
        <div className="rounded-lg p-4 mb-3" style={{ background: form.bgCard, border: `1px solid ${form.primaryGreen}44` }}>
          <div style={{ color: form.textColor, fontSize: "0.875rem", marginBottom: "0.5rem" }}>عنوان البطاقة — لون الخطوط</div>
          <div style={{ color: form.primaryGreen, fontSize: "0.75rem" }}>نص ثانوي بالأخضر الرئيسي</div>
        </div>
        <button
          className="px-4 py-2 rounded-lg text-sm text-white"
          style={{ background: `linear-gradient(135deg, ${form.primaryGreen}, ${form.accentGreen})` }}
        >
          زر نموذجي
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-dz flex-1 py-3 rounded-xl font-medium disabled:opacity-60"
        >
          <span>{saved ? "✓ تم الحفظ!" : saving ? "جاري الحفظ..." : "حفظ وتطبيق على الموقع"}</span>
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-3 rounded-xl text-sm"
          style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary, #6aad6a)" }}
        >
          إعادة الافتراضي
        </button>
      </div>
    </div>
  );
}

// ── SETTINGS ────────────────────────────────────────────────────
function SettingsSection() {
  const user = auth.currentUser;
  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, marginBottom: "1rem" }}>معلومات الحساب</h3>
        <div style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>
          <p>البريد الإلكتروني: <span style={{ color: "var(--theme-text-secondary, #a5d6a7)" }}>{user?.email}</span></p>
          <p className="mt-2">آخر تسجيل دخول: <span style={{ color: "var(--theme-text-secondary, #a5d6a7)" }}>{user?.metadata.lastSignInTime}</span></p>
        </div>
      </div>
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, marginBottom: "0.75rem" }}>معلومات المنصة</h3>
        <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.8rem" }}>
          البيانات محفوظة في Firebase Firestore ومزامنة في الوقت الحقيقي.
          أي تغيير تجريه يظهر فوراً للزوار.
        </p>
      </div>
    </div>
  );
}
