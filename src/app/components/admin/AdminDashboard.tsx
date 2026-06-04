import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  LayoutDashboard, BookOpen, ShoppingCart, Briefcase,
  Trophy, Mic, Settings, LogOut, Plus, Pencil, Trash2,
  X, Menu, Radio, ExternalLink, Users, Star, Check, AlertTriangle, Palette, Tv, FileText, Bell, Send, Trash, Globe, Newspaper, GraduationCap,
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
  addNews, updateNews, deleteNews, subscribeToNews,
  addThesis, updateThesis, deleteThesis, subscribeToTheses,
} from "../../../lib/firestore";
import { applyTheme } from "../../../lib/useTheme";
import { uploadImage } from "../../../lib/storage";
import { WILAYAS } from "../../../lib/algeria";
import type { Course, Job, Equipment, Competition, VoiceArtist, UserProfile, ThemeSettings, Channel, SiteContent, AppNotification, NewsItem, NewsCategory, Thesis, ThesisSpecialty } from "../../../lib/types";
import { DEFAULT_THEME, DEFAULT_SITE_CONTENT } from "../../../lib/types";

// ── Quill toolbar config (shared) ──────────────────────────────
const QUILL_MODULES = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
  ],
};

// ── Quill dark-mode override (injected once) ───────────────────
const quillStyle = `
  .ql-toolbar { background: #1a1a1a !important; border-color: var(--p-30) !important; border-radius: 0.5rem 0.5rem 0 0 !important; }
  .ql-container { background: #161616 !important; border-color: var(--p-30) !important; border-radius: 0 0 0.5rem 0.5rem !important; color: #e8f5e9 !important; font-size: 0.875rem !important; min-height: 90px; }
  .ql-editor { direction: rtl; text-align: right; }
  .ql-editor.ql-blank::before { color: #4a7a4a !important; font-style: normal !important; right: 12px; left: unset; }
  .ql-stroke { stroke: #81c784 !important; }
  .ql-fill { fill: #81c784 !important; }
  .ql-picker-label { color: #81c784 !important; }
  .ql-toolbar button:hover .ql-stroke { stroke: #4ade80 !important; }
  .ql-toolbar button.ql-active .ql-stroke { stroke: #4ade80 !important; }
`;

if (typeof document !== "undefined" && !document.getElementById("quill-dark-style")) {
  const tag = document.createElement("style");
  tag.id = "quill-dark-style";
  tag.textContent = quillStyle;
  document.head.appendChild(tag);
}

type Section = "overview" | "courses" | "equipment" | "jobs" | "competitions" | "voice" | "professionals" | "channels" | "news" | "theses" | "appearance" | "content" | "notifications" | "settings";
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

// ── Mobile detection ─────────────────────────────────────────────
function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

// ── Shared mobile card ───────────────────────────────────────────
function MobileCard({
  title, subtitle, badges, status, featured,
  colName, id, label, onEdit, onDelete,
}: {
  title: string; subtitle?: string; badges?: React.ReactNode;
  status?: string; featured?: boolean;
  colName: string; id: string; label: string;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div style={{
      padding: "0.875rem 1rem", borderRadius: "0.75rem", marginBottom: "0.5rem",
      background: status === "pending" ? "rgba(180,120,0,0.07)" : "var(--p-08)",
      border: status === "pending" ? "1px solid rgba(180,120,0,0.35)" : "1px solid var(--p-15)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "var(--theme-text, #e8f5e9)", fontSize: "0.95rem", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.8rem", marginBottom: "0.35rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {subtitle}
            </div>
          )}
          {badges && <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>{badges}</div>}
        </div>
        <div style={{ flexShrink: 0 }}>
          <ItemActions colName={colName} id={id} status={status} featured={featured} label={label} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
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
      <div className="flex flex-col gap-1.5 justify-end items-end">
        <button
          onClick={() => toggleFeatured(colName, id, !!featured)}
          title={featured ? "إلغاء التمييز" : "تمييز"}
          className="p-2 rounded transition-colors"
          style={{ color: featured ? "#fbbf24" : "var(--theme-text-muted, #4a7a4a)", background: featured ? "rgba(180,120,0,0.15)" : "transparent" }}
        >
          <Star size={14} fill={featured ? "#fbbf24" : "none"} />
        </button>
        {(status === "pending" || status === "rejected" || !status) && (
          <button
            onClick={() => approveItem(colName, id)}
            title="موافقة"
            className="p-2 rounded transition-colors"
            style={{ color: "#4ade80", background: "var(--p-15)" }}
          >
            <Check size={14} />
          </button>
        )}
        {(status === "pending" || status === "approved" || !status) && (
          <button
            onClick={() => setRejecting(true)}
            title="رفض"
            className="p-2 rounded transition-colors"
            style={{ color: "#f87171", background: "rgba(198,40,40,0.1)" }}
          >
            <AlertTriangle size={14} />
          </button>
        )}
        <button onClick={onEdit} className="p-2 rounded" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}><Pencil size={16} /></button>
        <button onClick={onDelete} className="p-2 rounded" style={{ color: "#ef9a9a" }}><Trash2 size={16} /></button>
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
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/sanad-admin");
        return;
      }
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (adminEmail && user.email !== adminEmail) {
        await signOut(auth);
        navigate("/sanad-admin");
        return;
      }
      const profile = await getUserProfile(user.uid);
      if (profile) {
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
    { id: "news"         as Section, label: "الأخبار",   icon: Newspaper },
    { id: "theses"       as Section, label: "المذكرات",  icon: GraduationCap },
    { id: "appearance"   as Section, label: "المظهر",        icon: Palette },
    { id: "content"        as Section, label: "محتوى الصفحة", icon: FileText },
    { id: "notifications"  as Section, label: "الإشعارات",    icon: Bell },
    { id: "settings"       as Section, label: "الإعدادات",    icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/sanad-admin");
  };

  const handleNavClick = (id: Section) => {
    setActiveSection(id);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: "#0e0e0e", position: "relative", overflow: "hidden" }}>

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 40, backdropFilter: "blur(2px)",
          }}
        />
      )}

      <aside
        className="flex flex-col"
        style={{
          width: isMobile ? "260px" : sidebarOpen ? "240px" : "64px",
          minHeight: "100vh",
          background: "linear-gradient(180deg, #131313 0%, #080808 100%)",
          borderLeft: "1px solid var(--p-20)",
          transition: "transform 0.3s ease, width 0.3s ease",
          flexShrink: 0,
          ...(isMobile ? {
            position: "fixed",
            top: 0,
            right: 0,
            height: "100%",
            zIndex: 50,
            transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
          } : {}),
        }}
      >
        <div className="flex items-center gap-2 p-4 mb-2" style={{ borderBottom: "1px solid var(--p-15)" }}>
          <div className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--theme-primary, #006233), color-mix(in srgb, var(--theme-primary, #006233) 70%, #ffffff))", boxShadow: "0 0 10px var(--p-40)" }}>
            <Radio size={16} color="#fff" />
          </div>
          {(sidebarOpen || isMobile) && (
            <span className="font-bold" style={{ background: "linear-gradient(90deg, var(--theme-accent, #00a355), color-mix(in srgb, var(--theme-accent, #00a355) 70%, #ffffff))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              سند Admin
            </span>
          )}
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="mr-auto" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              title={!sidebarOpen && !isMobile ? label : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
              style={{
                color: activeSection === id ? "var(--theme-accent, #00a355)" : "var(--theme-text-secondary, #6aad6a)",
                background: activeSection === id ? "var(--p-18)" : "transparent",
                justifyContent: (sidebarOpen || isMobile) ? "flex-start" : "center",
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {(sidebarOpen || isMobile) && <span style={{ fontSize: "0.875rem" }}>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 space-y-1" style={{ borderTop: "1px solid var(--p-15)" }}>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem", textDecoration: "none", justifyContent: (sidebarOpen || isMobile) ? "flex-start" : "center" }}
          >
            <ExternalLink size={18} style={{ flexShrink: 0 }} />
            {(sidebarOpen || isMobile) && "عرض الموقع"}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{ col
