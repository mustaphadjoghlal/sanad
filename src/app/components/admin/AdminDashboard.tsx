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
import { auth, ADMIN_EMAIL } from "../../../lib/firebase";
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
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        if (user) signOut(auth);
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
            style={{ color: "#ef9a9a", fontSize: "0.875rem", justifyContent: (sidebarOpen || isMobile) ? "flex-start" : "center" }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {(sidebarOpen || isMobile) && "تسجيل الخروج"}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0" style={{ minHeight: "100vh" }}>
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--p-15)", background: "rgba(11,15,11,0.9)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 30 }}
        >
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: "var(--theme-text-muted, #4a7a4a)", flexShrink: 0 }}>
            <Menu size={22} />
          </button>
          <h1 style={{ color: "var(--theme-text, #e8f5e9)", fontWeight: 600, fontSize: "1rem" }}>
            {menuItems.find((m) => m.id === activeSection)?.label}
          </h1>
        </div>

        <div className="flex-1 p-3 md:p-6 overflow-auto">
          {activeSection === "overview"       && <OverviewSection onNavigate={setActiveSection} />}
          {activeSection === "courses"        && <CoursesSection />}
          {activeSection === "equipment"      && <EquipmentSection />}
          {activeSection === "jobs"           && <JobsSection />}
          {activeSection === "competitions"   && <CompetitionsSection />}
          {activeSection === "voice"          && <VoiceSection />}
          {activeSection === "professionals"  && <ProfessionalsSection />}
          {activeSection === "channels"       && <ChannelsSection />}
          {activeSection === "news"           && <NewsSection />}
          {activeSection === "theses"         && <ThesesSection />}
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
  const [newUsers, setNewUsers] = useState<UserProfile[]>([]);

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
        const voiceUsers = d.filter((x) => x.type === "voice");
        setCounts((c) => ({ ...c, profiles: d.length, voice: c.voice + voiceUsers.length }));
        setPending((p) => ({ ...p, profiles: d.filter((x) => x.status === "pending").length, voice: p.voice + voiceUsers.filter((x) => x.status === "pending").length }));
        const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setNewUsers(d.filter((x) => x.createdAt > week).slice(0, 10));
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
      {newUsers.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={S.card}>
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--p-15)" }}>
            <span style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, fontSize: "0.9rem" }}>
              مسجلون جدد (آخر 7 أيام)
            </span>
            <button onClick={() => onNavigate("professionals")} style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer" }}>
              عرض الكل ←
            </button>
          </div>
          <div>
            {newUsers.map((u) => {
              const typeLabels: Record<string, string> = { journalist: "صحفي", voice: "منشط صوتي", photographer: "مصور", editor: "مونتير", student: "طالب", other: "أخرى", store: "متجر" };
              const statusColors: Record<string, string> = { pending: "#fbbf24", approved: "#4ade80", rejected: "#f87171" };
              const statusLabels: Record<string, string> = { pending: "قيد المراجعة", approved: "معتمد", rejected: "مرفوض" };
              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3 transition-colors" style={{ borderBottom: "1px solid var(--p-08)" }}>
                  {u.photo ? (
                    <img src={u.photo} alt={u.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--p-20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--theme-accent, #00a355)", fontWeight: 700 }}>
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--theme-text, #c8e6c9)", fontSize: "0.875rem", fontWeight: 500 }}>{u.name}</div>
                    <div style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.75rem" }}>{typeLabels[u.type] ?? u.type}{u.location ? ` — ${u.location}` : ""}</div>
                  </div>
                  <span style={{ color: statusColors[u.status] ?? "#6aad6a", fontSize: "0.72rem", background: "var(--p-10)", border: `1px solid ${statusColors[u.status] ?? "#4a7a4a"}44`, padding: "0.15rem 0.55rem", borderRadius: "9999px", flexShrink: 0 }}>
                    {statusLabels[u.status] ?? u.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── COURSES SECTION ─────────────────────────────────────────────
type CourseForm = Omit<Course, "id" | "createdAt" | "status" | "featured" | "submittedBy" | "rejectionNote">;
const emptyCourse: CourseForm = { title: "", type: "free", duration: "", description: "", instructor: "", link: "", price: 0, image: "", contentImages: [] };

function CoursesSection() {
  const isMobile = useIsMobile();
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

      {isMobile ? (
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد دورات</div>
          ) : filtered.map((c) => (
            <MobileCard
              key={c.id}
              title={c.title}
              subtitle={c.instructor}
              badges={<>
                <span style={S.badge(c.type === "free" ? "var(--p-30)" : "rgba(26,82,118,0.3)")}>{c.type === "free" ? "مجانية" : `${c.price} دج`}</span>
                <span style={S.statusBadge(c.status || "approved")}>{statusLabel(c.status)}</span>
              </>}
              status={c.status} featured={c.featured}
              colName="courses" id={c.id} label={c.title}
              onEdit={() => openEdit(c)} onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      ) : (
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
      )}

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
const emptyJob: JobForm = { title: "", company: "", location: "", jobType: "", employmentType: undefined, description: "", deadline: "", contact: "", source: "", companyDescription: "", image: "", contentImages: [], portfolioLinks: [] };

function JobsSection() {
  const isMobile = useIsMobile();
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
  const openEdit = (j: Job) => { setEditId(j.id); setForm({ title: j.title, company: j.company, location: j.location, jobType: j.jobType, employmentType: j.employmentType, description: j.description, deadline: j.deadline || "", contact: j.contact, source: j.source || "", companyDescription: j.companyDescription || "", image: j.image || "", contentImages: j.contentImages || [], portfolioLinks: j.portfolioLinks || [] }); setModal("edit"); };

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
      if (modal === "add") {
        await addJob(form);
        sendNotification({ title: `وظيفة جديدة: ${form.title}`, body: `${form.company} — ${form.location}`, link: "/jobs", createdAt: Date.now() }, "journalist").catch(() => {});
      } else {
        await updateJob(editId, form);
      }
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

      {isMobile ? (
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد عروض</div>
          ) : filtered.map((j) => (
            <MobileCard
              key={j.id}
              title={j.title}
              subtitle={`${j.company} · ${j.location}`}
              badges={<span style={S.statusBadge(j.status || "approved")}>{statusLabel(j.status)}</span>}
              status={j.status} featured={j.featured}
              colName="jobs" id={j.id} label={j.title}
              onEdit={() => openEdit(j)} onDelete={() => setDeleteTarget(j)}
            />
          ))}
        </div>
      ) : (
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
      )}

      {modal && (
        <Modal title={modal === "add" ? "إضافة عرض توظيف" : "تعديل الوظيفة"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label style={S.label}>المسمى الوظيفي *</label><input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={S.label}>الجهة / المؤسسة</label><input style={S.input} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div className="md:col-span-2">
                <label style={S.label}>الولاية (يمكن اختيار أكثر من ولاية)</label>
                <div style={{ ...S.input, padding: "0.5rem", maxHeight: "130px", overflowY: "auto", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {["عن بعد", "كل الجزائر", ...WILAYAS].map((w) => {
                    const selected = form.location.split(",").map(s => s.trim()).includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          const current = form.location ? form.location.split(",").map(s => s.trim()).filter(Boolean) : [];
                          const next = selected ? current.filter(v => v !== w) : [...current, w];
                          setForm({ ...form, location: next.join(", ") });
                        }}
                        style={{
                          padding: "0.15rem 0.55rem",
                          borderRadius: "9999px",
                          fontSize: "0.72rem",
                          border: selected ? "1px solid rgba(0,163,85,0.5)" : "1px solid var(--p-25)",
                          background: selected ? "rgba(0,163,85,0.2)" : "var(--p-10)",
                          color: selected ? "var(--theme-accent, #00a355)" : "var(--theme-text-muted, #4a7a4a)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
                {form.location && (
                  <p style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.72rem", marginTop: "0.25rem" }}>
                    المختار: {form.location}
                  </p>
                )}
              </div>
              <div>
                <label style={S.label}>نوع الوظيفة</label>
                <select style={S.input} value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
                  <option value="">اختر التخصص</option>
                  <option value="صحفي">صحفي</option>
                  <option value="مقدم برامج">مقدم برامج</option>
                  <option value="محرر">محرر</option>
                  <option value="مصور">مصور</option>
                  <option value="مونتير">مونتير</option>
                  <option value="منشط">منشط</option>
                  <option value="معلق صوتي">معلق صوتي</option>
                  <option value="مراسل">مراسل</option>
                  <option value="مخرج">مخرج</option>
                  <option value="ميكانيكيين صوت">ميكانيكيين صوت</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div>
                <label style={S.label}>طبيعة العمل</label>
                <select style={S.input} value={form.employmentType ?? ""} onChange={(e) => setForm({ ...form, employmentType: (e.target.value as Job["employmentType"]) || undefined })}>
                  <option value="">اختر الطبيعة</option>
                  <option value="fulltime">دوام كلي</option>
                  <option value="parttime">دوام جزئي</option>
                  <option value="internship">تدريب (غير مدفوع)</option>
                  <option value="internship_paid">تدريب مدفوع</option>
                </select>
              </div>
              <div><label style={S.label}>الموعد النهائي</label><input type="date" style={S.input} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            </div>
            <div><label style={S.label}>معلومات التواصل</label><input style={S.input} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="بريد / هاتف" /></div>
            <div><label style={S.label}>المصدر</label><input style={S.input} value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="مثال: وزارة الاتصال، موقع LinkedIn..." /></div>

            {/* ✅ حقل تفاصيل الوظيفة — Rich Text Editor */}
            <div>
              <label style={S.label}>تفاصيل الوظيفة</label>
              <ReactQuill
                theme="snow"
                value={form.description}
                onChange={(val) => setForm({ ...form, description: val })}
                modules={QUILL_MODULES}
                placeholder="اكتب تفاصيل الوظيفة هنا..."
              />
            </div>

            {/* ✅ حقل تعريف بالجهة المُوظِّفة — Rich Text Editor */}
            <div>
              <label style={S.label}>تعريف بالجهة المُوظِّفة</label>
              <ReactQuill
                theme="snow"
                value={form.companyDescription || ""}
                onChange={(val) => setForm({ ...form, companyDescription: val })}
                modules={QUILL_MODULES}
                placeholder="نبذة عن المؤسسة أو القناة أو الجهة..."
              />
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

            {/* روابط الأعمال */}
            <div>
              <label style={S.label}>روابط الأعمال (اختياري)</label>
              <p style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.75rem", marginBottom: "0.5rem" }}>يوتيوب، ساوندكلاود، إنستغرام، موقع شخصي...</p>
              {(form.portfolioLinks || []).map((link, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <input
                    style={{ ...S.input, flex: 1, marginBottom: 0 }}
                    value={link}
                    onChange={(e) => setForm((f) => ({ ...f, portfolioLinks: (f.portfolioLinks || []).map((l, i) => i === idx ? e.target.value : l) }))}
                    placeholder="https://..."
                    dir="ltr"
                  />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, portfolioLinks: (f.portfolioLinks || []).filter((_, i) => i !== idx) }))}
                    style={{ padding: "0.25rem 0.6rem", background: "rgba(198,40,40,0.15)", border: "1px solid rgba(198,40,40,0.3)", borderRadius: "0.375rem", color: "#f87171", cursor: "pointer", fontSize: "0.8rem" }}>×</button>
                </div>
              ))}
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, portfolioLinks: [...(f.portfolioLinks || []), ""] }))}
                style={{ ...S.input, width: "100%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--theme-badge-text, #81c784)" }}>
                + إضافة رابط عمل
              </button>
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
  const isMobile = useIsMobile();
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

      {isMobile ? (
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد منتجات</div>
          ) : filtered.map((eq) => (
            <MobileCard
              key={eq.id}
              title={eq.name}
              subtitle={`${eq.category} · ${eq.price.toLocaleString()} دج`}
              badges={<>
                <span style={S.badge(eq.condition === "new" ? "var(--p-30)" : "rgba(120,66,18,0.3)")}>{eq.condition === "new" ? "جديد" : "مستعمل"}</span>
                <span style={S.statusBadge(eq.status || "approved")}>{statusLabel(eq.status)}</span>
              </>}
              status={eq.status} featured={eq.featured}
              colName="equipment" id={eq.id} label={eq.name}
              onEdit={() => openEdit(eq)} onDelete={() => setDeleteTarget(eq)}
            />
          ))}
        </div>
      ) : (
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
      )}

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
  const isMobile = useIsMobile();
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
    } finally { setImgUploading(false); }
  };

  const handleContentImageUpload = async (file: File) => {
    setContentImgUploading(true);
    try {
      const url = await uploadImage("competitions/content", file);
      setForm((f) => ({ ...f, contentImages: [...(f.contentImages || []), url] }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally { setContentImgUploading(false); }
  };

  const typeLabel: Record<string, string> = { university: "جامعية", national: "وطنية", international: "دولية" };
  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") {
        await addCompetition(form);
        sendNotification({ title: `مسابقة جديدة: ${form.name}`, body: `${form.organizer} — ${form.type === "university" ? "جامعية" : form.type === "national" ? "وطنية" : "دولية"}`, link: "/competitions", createdAt: Date.now() }, "journalist").catch(() => {});
      } else {
        await updateCompetition(editId, form);
      }
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

      {isMobile ? (
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد مسابقات</div>
          ) : filtered.map((c) => (
            <MobileCard
              key={c.id}
              title={c.name}
              subtitle={c.organizer}
              badges={<>
                <span style={S.badge("var(--p-25)")}>{typeLabel[c.type]}</span>
                <span style={S.statusBadge(c.status || "approved")}>{statusLabel(c.status)}</span>
              </>}
              status={c.status} featured={c.featured}
              colName="competitions" id={c.id} label={c.name}
              onEdit={() => openEdit(c)} onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      ) : (
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
      )}

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
  const isMobile = useIsMobile();
  const [items, setItems] = useState<VoiceArtist[]>([]);
  const [voiceUsers, setVoiceUsers] = useState<UserProfile[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<VoiceForm>(emptyVoice);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VoiceArtist | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => subscribeToCollection<VoiceArtist>("voice", setItems), []);
  useEffect(() => subscribeToAllProfiles((d) => setVoiceUsers(d.filter((x) => x.type === "voice"))), []);

  // Merge both sources — registered users shown as voice entries
  const allVoice: VoiceArtist[] = [
    ...items,
    ...voiceUsers.map((u) => ({
      id: u.id, name: u.name, specialty: u.specialty ?? "", experience: u.experience ?? "",
      description: u.bio, contact: u.phone ?? u.email, createdAt: u.createdAt,
      status: u.status, featured: u.featured,
    })),
  ];

  const filtered = allVoice.filter((v) => {
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

      {isMobile ? (
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا يوجد منشطون</div>
          ) : filtered.map((v) => (
            <MobileCard
              key={v.id}
              title={v.name}
              subtitle={`${v.specialty} · ${v.experience}`}
              badges={<span style={S.statusBadge(v.status || "approved")}>{statusLabel(v.status)}</span>}
              status={v.status} featured={v.featured}
              colName="voice" id={v.id} label={v.name}
              onEdit={() => openEdit(v)} onDelete={() => setDeleteTarget(v)}
            />
          ))}
        </div>
      ) : (
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
      )}

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
  const isMobile = useIsMobile();
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

      {isMobile ? (
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا يوجد محترفون مسجلون بعد</div>
          ) : filtered.map((p) => (
            <div key={p.id} style={{
              padding: "0.875rem 1rem", borderRadius: "0.75rem", marginBottom: "0.5rem",
              background: p.status === "pending" ? "rgba(180,120,0,0.07)" : "var(--p-08)",
              border: p.status === "pending" ? "1px solid rgba(180,120,0,0.35)" : "1px solid var(--p-15)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--theme-text, #e8f5e9)", fontSize: "0.95rem", marginBottom: "0.2rem" }}>{p.name}</div>
                  <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem", marginBottom: "0.35rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</div>
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={S.badge("var(--p-20)")}>{typeLabel[p.type] || p.type}</span>
                    {p.specialty && <span style={S.badge("var(--p-15)")}>{p.specialty}</span>}
                    {p.location && <span style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.75rem" }}>{p.location}</span>}
                    <span style={S.statusBadge(p.status)}>{statusLabel(p.status)}</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <div className="flex flex-col gap-1.5 justify-end items-end">
                    <button onClick={() => toggleFeatured("users", p.id, p.featured)} title={p.featured ? "إلغاء التمييز" : "تمييز"} className="p-2 rounded transition-colors" style={{ color: p.featured ? "#fbbf24" : "var(--theme-text-muted, #4a7a4a)", background: p.featured ? "rgba(180,120,0,0.15)" : "transparent" }}>
                      <Star size={14} fill={p.featured ? "#fbbf24" : "none"} />
                    </button>
                    {p.status !== "approved" && (
                      <button onClick={() => approveItem("users", p.id)} title="موافقة" className="p-2 rounded" style={{ color: "#4ade80", background: "var(--p-15)" }}>
                        <Check size={14} />
                      </button>
                    )}
                    {p.status !== "rejected" && (
                      <button onClick={() => setRejectTarget(p)} title="رفض" className="p-2 rounded" style={{ color: "#f87171", background: "rgba(198,40,40,0.1)" }}>
                        <AlertTriangle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                      <div className="flex flex-col gap-1.5 justify-end items-end">
                        <button onClick={() => toggleFeatured("users", p.id, p.featured)} title={p.featured ? "إلغاء التمييز" : "تمييز"} className="p-1.5 rounded transition-colors" style={{ color: p.featured ? "#fbbf24" : "var(--theme-text-muted, #4a7a4a)", background: p.featured ? "rgba(180,120,0,0.15)" : "transparent" }}>
                          <Star size={14} fill={p.featured ? "#fbbf24" : "none"} />
                        </button>
                        {p.status !== "approved" && (
                          <button onClick={() => approveItem("users", p.id)} title="موافقة" className="p-1.5 rounded" style={{ color: "#4ade80", background: "var(--p-15)" }}>
                            <Check size={14} />
                          </button>
                        )}
                        {p.status !== "rejected" && (
                          <button onClick={() => setRejectTarget(p)} title="رفض" className="p-1.5 rounded" style={{ color: "#f87171", background: "rgba(198,40,40,0.1)" }}>
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
      )}

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

const SEED_CHANNELS: Omit<Channel, "id" | "createdAt">[] = [
  { name: "التلفزيون الجزائري - القناة الأولى", type: "tv", category: "وطنية", website: "https://www.entv.dz", youtube: "https://www.youtube.com/@EntVDZ" },
  { name: "Canal Algérie", type: "tv", category: "وطنية", website: "https://www.entv.dz/canal-algerie" },
  { name: "قناة A3 الجزائرية", type: "tv", category: "وطنية", website: "https://www.entv.dz/a3" },
  { name: "قناة الأمازيغية (TV4)", type: "tv", category: "وطنية", website: "https://www.entv.dz/tamazight" },
  { name: "القناة الثقافية (TV5)", type: "tv", category: "وطنية", website: "https://www.entv.dz" },
  { name: "قناة القرآن الكريم التلفزيونية", type: "tv", category: "دينية", website: "https://www.entv.dz/coran" },
  { name: "قناة الشروق TV", type: "tv", category: "خاصة", website: "https://www.echoroukonline.com", facebook: "https://www.facebook.com/echoroukTV", youtube: "https://www.youtube.com/@EchoroukonlineTv" },
  { name: "قناة النهار TV", type: "tv", category: "خاصة", website: "https://www.ennaharonline.com", facebook: "https://www.facebook.com/ennahar.tv", youtube: "https://www.youtube.com/@ENNAHARTV1" },
  { name: "قناة الجزائرية", type: "tv", category: "خاصة", website: "https://www.aljazairia.tv" },
  { name: "قناة Dzair TV", type: "tv", category: "خاصة", website: "https://www.dzairtv.com", facebook: "https://www.facebook.com/DzairTV", youtube: "https://www.youtube.com/@DzairTV" },
  { name: "قناة Numidia News", type: "tv", category: "خاصة", website: "https://www.numidianews.com", youtube: "https://www.youtube.com/@NumidiaNews" },
  { name: "قناة الأطلس", type: "tv", category: "خاصة", website: "https://www.atlas-tv.net" },
  { name: "قناة Beur TV", type: "tv", category: "خاصة", website: "https://www.beurtv.com", facebook: "https://www.facebook.com/beurtvdotcom" },
  { name: "قناة الفجر", type: "tv", category: "خاصة", website: "https://www.alfadjtv.com", facebook: "https://www.facebook.com/AlFajrTV" },
  { name: "قناة El Djazairia One", type: "tv", category: "خاصة", website: "https://www.eldjazairiaone.com", youtube: "https://www.youtube.com/@ElDjazairiaOne" },
  { name: "قناة Samira TV", type: "tv", category: "متخصصة", website: "https://www.samiratv.com", facebook: "https://www.facebook.com/SamiraTV", youtube: "https://www.youtube.com/@SamiraTV" },
  { name: "الإذاعة الجزائرية - الإذاعة الوطنية", type: "radio", category: "وطنية", frequency: "89.7 FM", website: "https://www.radioalgerie.dz" },
  { name: "الإذاعة الجزائرية - القناة الثانية (أمازيغية)", type: "radio", category: "وطنية", frequency: "100.4 FM", website: "https://www.radioalgerie.dz" },
  { name: "الإذاعة الجزائرية - القناة الثالثة (فرنسية)", type: "radio", category: "وطنية", frequency: "98.1 FM", website: "https://www.radioalgerie.dz" },
  { name: "إذاعة القرآن الكريم", type: "radio", category: "دينية", frequency: "100.5 FM", website: "https://www.radioalgerie.dz/coran" },
  { name: "الشروق أون لاين", type: "website", category: "إخبارية", website: "https://www.echoroukonline.com", facebook: "https://www.facebook.com/echorouk.online" },
  { name: "النهار أون لاين", type: "website", category: "إخبارية", website: "https://www.ennaharonline.com", facebook: "https://www.facebook.com/EnnaharOnlineDZ" },
  { name: "الخبر أون لاين", type: "website", category: "إخبارية", website: "https://www.elkhabar.com", facebook: "https://www.facebook.com/elkhabar.algeria" },
  { name: "وكالة الأنباء الجزائرية (APS)", type: "website", category: "إخبارية", website: "https://www.aps.dz", facebook: "https://www.facebook.com/APSalgerie" },
  { name: "TSA Algérie", type: "website", category: "إخبارية", website: "https://www.tsa-algerie.com", facebook: "https://www.facebook.com/TSAAlgerie" },
];

const SEED_WEBSITES = SEED_CHANNELS.filter((c) => c.type === "website");

async function seedWebsites(setCb: (v: boolean) => void) {
  setCb(true);
  for (const ch of SEED_WEBSITES) {
    try { await addChannel(ch); } catch { /* skip */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  setCb(false);
}

function ChannelsSection() {
  const isMobile = useIsMobile();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ChForm>(emptyChannel);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<"tv" | "electronic" | "radio" | "news" | "club">("tv");

  useEffect(() => {
    return subscribeToChannels((data) => {
      setChannels(data);
      const seen = new Map<string, boolean>();
      const toDelete: string[] = [];
      for (const ch of data) {
        const key = `${ch.name.trim().toLowerCase()}__${ch.type}`;
        if (seen.has(key)) { toDelete.push(ch.id); } else { seen.set(key, true); }
      }
      if (toDelete.length > 0) toDelete.forEach((id) => deleteChannel(id));
      const hasWebsites = data.some((c) => c.type !== "tv" && c.type !== "radio");
      if (!hasWebsites && !localStorage.getItem("sanad-websites-seeded")) {
        localStorage.setItem("sanad-websites-seeded", "1");
        seedWebsites(() => {});
      }
    });
  }, []);

  const cf = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) { await updateChannel(editId, form); } else { await addChannel(form); }
      setShowForm(false); setEditId(null); setForm(emptyChannel);
    } finally { setSaving(false); }
  };

  const startEdit = (ch: Channel) => {
    setForm({ name: ch.name, type: ch.type, category: ch.category, frequency: ch.frequency || "", email: ch.email || "", address: ch.address || "", website: ch.website || "", phone: ch.phone || "", facebook: ch.facebook || "", youtube: ch.youtube || "", instagram: ch.instagram || "", twitter: ch.twitter || "" });
    setEditId(ch.id); setShowForm(true);
  };

  const chTabFn: Record<string, (c: Channel) => boolean> = {
    tv:         (c) => c.type === "tv",
    electronic: (c) => c.category === "قنوات الكترونية",
    radio:      (c) => c.type === "radio",
    news:       (c) => (c.type === "website" || (c.type !== "tv" && c.type !== "radio")) && c.category !== "قنوات الكترونية" && c.category !== "نوادي إعلامية",
    club:       (c) => c.category === "نوادي إعلامية",
  };
  const chTabs: { key: string; label: string; icon: string }[] = [
    { key: "tv",         label: "قنوات تلفزيونية", icon: "📺" },
    { key: "electronic", label: "قنوات الكترونية",  icon: "📡" },
    { key: "radio",      label: "محطات إذاعية",    icon: "📻" },
    { key: "news",       label: "مواقع إخبارية",   icon: "🌐" },
    { key: "club",       label: "نوادي إعلامية",   icon: "🎙️" },
  ];

  const q = search.toLowerCase();
  const filtered = channels.filter((ch) => chTabFn[tabFilter](ch) && (!q || ch.name.toLowerCase().includes(q)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {chTabs.map((t) => (
          <button key={t.key} onClick={() => { setTabFilter(t.key); setSearch(""); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: tabFilter === t.key ? "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))" : "var(--p-10)", color: tabFilter === t.key ? "#fff" : "var(--theme-text-secondary, #6aad6a)", border: tabFilter === t.key ? "none" : "1px solid var(--p-20)" }}>
            <span>{t.icon}</span><span>{t.label}</span>
            <span style={{ opacity: 0.7, fontSize: "0.75rem" }}>({channels.filter(chTabFn[t.key]).length})</span>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...S.input, flex: 1 }} />
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyChannel); }} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm flex-shrink-0">
          <Plus size={15} /><span>إضافة</span>
        </button>
      </div>

      {isMobile ? (
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>{channels.length === 0 ? "لا توجد قنوات بعد." : "لا توجد نتائج."}</div>
          ) : filtered.map((ch) => (
            <div key={ch.id} style={{ padding: "0.875rem 1rem", borderRadius: "0.75rem", marginBottom: "0.5rem", background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--theme-text, #e8f5e9)", fontSize: "0.95rem", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.name}</div>
                  <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>{ch.category}</div>
                </div>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                  <button onClick={() => startEdit(ch)} className="p-2 rounded" style={{ color: "var(--theme-badge-text, #81c784)" }}><Pencil size={16} /></button>
                  <button onClick={() => setDeleteId(ch.id)} className="p-2 rounded" style={{ color: "#f87171" }}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={S.card}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>{["القناة", "النوع", "التردد", "البريد", "الإجراءات"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>{channels.length === 0 ? "لا توجد قنوات بعد." : "لا توجد نتائج."}</td></tr>
                ) : filtered.map((ch) => (
                  <tr key={ch.id} className="hover:bg-green-950/10 transition-colors">
                    <td style={S.td}><div className="font-medium" style={{ color: "var(--theme-text, #c8e6c9)" }}>{ch.name}</div><div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.72rem" }}>{ch.category}</div></td>
                    <td style={S.td}><span style={{ fontSize: "0.8rem", color: ch.type === "tv" ? "var(--theme-accent, #00a355)" : ch.type === "radio" ? "#64b5f6" : "#ffb74d" }}>{ch.type === "tv" ? "📺 تلفزيون" : ch.type === "radio" ? "📻 إذاعة" : "🌐 موقع إلكتروني"}</span></td>
                    <td style={{ ...S.td, fontFamily: "monospace", fontSize: "0.78rem", color: "var(--theme-badge-text, #81c784)" }} dir="ltr">{ch.frequency || "—"}</td>
                    <td style={{ ...S.td, fontSize: "0.78rem" }} dir="ltr">{ch.email || "—"}</td>
                    <td style={S.td}><div className="flex gap-2"><button onClick={() => startEdit(ch)} style={{ color: "var(--theme-badge-text, #81c784)" }}><Pencil size={15} /></button><button onClick={() => setDeleteId(ch.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title={editId ? "تعديل القناة" : "إضافة قناة"} onClose={() => { setShowForm(false); setEditId(null); }}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label style={S.label}>اسم القناة *</label><input style={S.input} value={form.name} onChange={(e) => cf("name", e.target.value)} placeholder="مثال: الشروق تيفي" /></div>
              <div>
                <label style={S.label}>التصنيف الرئيسي</label>
                <select style={S.input} value={form.category === "قنوات الكترونية" ? "electronic" : form.category === "نوادي إعلامية" ? "club" : form.type === "tv" ? "tv" : form.type === "radio" ? "radio" : "news"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "tv") setForm((f) => ({ ...f, type: "tv", category: "وطنية" }));
                    else if (v === "radio") setForm((f) => ({ ...f, type: "radio", category: "وطنية" }));
                    else if (v === "news") setForm((f) => ({ ...f, type: "website", category: "إخبارية" }));
                    else if (v === "electronic") setForm((f) => ({ ...f, type: "website", category: "قنوات الكترونية" }));
                    else if (v === "club") setForm((f) => ({ ...f, type: "website", category: "نوادي إعلامية" }));
                  }}>
                  <option value="tv">📺 قنوات تلفزيونية</option>
                  <option value="electronic">📡 قنوات الكترونية</option>
                  <option value="radio">📻 محطات إذاعية</option>
                  <option value="news">🌐 مواقع إخبارية</option>
                  <option value="club">🎙️ نوادي إعلامية</option>
                </select>
              </div>
              {(form.type === "tv" || form.type === "radio") && (
                <div>
                  <label style={S.label}>الفئة الفرعية</label>
                  <select style={S.input} value={form.category} onChange={(e) => cf("category", e.target.value)}>
                    <option value="وطنية">وطنية</option><option value="خاصة">خاصة</option><option value="محلية">محلية</option>
                    <option value="دينية">دينية</option><option value="متخصصة">متخصصة</option><option value="رياضية">رياضية</option><option value="ثقافية">ثقافية</option>
                  </select>
                </div>
              )}
              {form.type === "website" && form.category !== "قنوات الكترونية" && form.category !== "نوادي إعلامية" && (
                <div>
                  <label style={S.label}>الفئة الفرعية</label>
                  <select style={S.input} value={form.category} onChange={(e) => cf("category", e.target.value)}>
                    <option value="إخبارية">إخبارية</option><option value="رياضية">رياضية</option><option value="ثقافية">ثقافية</option><option value="متخصصة">متخصصة</option>
                  </select>
                </div>
              )}
              <div className="col-span-2"><label style={S.label}>التردد</label><input style={S.input} value={form.frequency} onChange={(e) => cf("frequency", e.target.value)} dir="ltr" /></div>
              <div><label style={S.label}>البريد الإلكتروني</label><input style={S.input} value={form.email} onChange={(e) => cf("email", e.target.value)} dir="ltr" /></div>
              <div><label style={S.label}>الهاتف</label><input style={S.input} value={form.phone} onChange={(e) => cf("phone", e.target.value)} dir="ltr" /></div>
              <div className="col-span-2"><label style={S.label}>العنوان</label><input style={S.input} value={form.address} onChange={(e) => cf("address", e.target.value)} /></div>
              <div className="col-span-2"><label style={S.label}>الموقع الإلكتروني</label><input style={S.input} value={form.website} onChange={(e) => cf("website", e.target.value)} dir="ltr" placeholder="https://..." /></div>
              <div><label style={S.label}>فيسبوك</label><input style={S.input} value={form.facebook} onChange={(e) => cf("facebook", e.target.value)} dir="ltr" /></div>
              <div><label style={S.label}>يوتيوب</label><input style={S.input} value={form.youtube} onChange={(e) => cf("youtube", e.target.value)} dir="ltr" /></div>
              <div><label style={S.label}>إنستغرام</label><input style={S.input} value={form.instagram} onChange={(e) => cf("instagram", e.target.value)} dir="ltr" /></div>
              <div><label style={S.label}>تويتر/X</label><input style={S.input} value={form.twitter} onChange={(e) => cf("twitter", e.target.value)} dir="ltr" /></div>
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
      {deleteId && <ConfirmDelete label={channels.find((c) => c.id === deleteId)?.name || ""} onConfirm={async () => { await deleteChannel(deleteId); setDeleteId(null); }} onClose={() => setDeleteId(null)} />}
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
  width: "100%", background: "var(--p-08)", border: "1px solid var(--p-25)",
  borderRadius: "8px", padding: "8px 12px", color: "var(--theme-text)", fontSize: "0.9rem", outline: "none",
};

const CAROUSEL_PLACEHOLDERS: { key: "carouselPlaceholderProducts" | "carouselPlaceholderNews" | "carouselPlaceholderJobs"; label: string }[] = [
  { key: "carouselPlaceholderProducts", label: "صورة سوق المعدات (عند الفراغ)" },
  { key: "carouselPlaceholderNews",     label: "صورة آخر الأخبار (عند الفراغ)" },
  { key: "carouselPlaceholderJobs",     label: "صورة فرص التوظيف (عند الفراغ)" },
];

function SiteContentSection() {
  const [contentForm, setContentForm] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => { const unsub = subscribeToSiteContent((c) => setContentForm(c)); return unsub; }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveSiteContent(contentForm);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const handlePlaceholderUpload = async (key: keyof SiteContent, file: File) => {
    setUploading(key as string);
    try {
      const url = await uploadImage(`carousel-placeholders/${key}`, file);
      setContentForm((prev) => ({ ...prev, [key]: url }));
    } finally { setUploading(null); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, marginBottom: "1.25rem" }}>تعديل نصوص الصفحة الرئيسية</h3>
        <div className="space-y-5">
          {CONTENT_FIELDS.map(({ key, label, multiline }) => (
            <div key={key}>
              <label style={S.label}>{label}</label>
              {multiline ? (
                <textarea rows={3} value={contentForm[key] as string} onChange={(e) => setContentForm({ ...contentForm, [key]: e.target.value })} style={{ ...contentInputStyle, resize: "vertical" }} dir="rtl" />
              ) : (
                <input type="text" value={contentForm[key] as string} onChange={(e) => setContentForm({ ...contentForm, [key]: e.target.value })} style={contentInputStyle} dir="rtl" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, marginBottom: "1.25rem" }}>صور الكاروسيل</h3>
        <div className="space-y-5">
          {CAROUSEL_PLACEHOLDERS.map(({ key, label }) => (
            <div key={key}>
              <label style={S.label}>{label}</label>
              <div className="flex gap-3 items-center flex-wrap">
                {contentForm[key] && <img src={contentForm[key] as string} alt={label} style={{ height: 64, width: 100, objectFit: "cover", borderRadius: "0.5rem", border: "1px solid var(--p-25)" }} />}
                <label className="cursor-pointer px-4 py-2 rounded-lg text-sm" style={{ background: "var(--p-15)", color: "var(--theme-text)", border: "1px solid var(--p-25)" }}>
                  {uploading === key ? "جاري الرفع..." : "رفع صورة"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading !== null} onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePlaceholderUpload(key, f); }} />
                </label>
                {contentForm[key] && <button onClick={() => setContentForm((prev) => ({ ...prev, [key]: "" }))} className="text-xs px-3 py-2 rounded-lg" style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>حذف</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-dz flex-1 py-3 rounded-xl font-medium disabled:opacity-60">
          <span>{saved ? "✓ تم الحفظ!" : saving ? "جاري الحفظ..." : "حفظ النصوص"}</span>
        </button>
        <button onClick={() => setContentForm(DEFAULT_SITE_CONTENT)} className="px-6 py-3 rounded-xl text-sm" style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary, #6aad6a)" }}>إعادة الافتراضي</button>
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

  useEffect(() => { return subscribeToNotifications(setNotifs); }, []);

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSending(true);
    await sendNotification({ title: form.title.trim(), body: form.body.trim(), link: form.link.trim() || undefined, createdAt: Date.now() });
    setForm({ title: "", body: "", link: "" });
    setSent(true); setTimeout(() => setSent(false), 2500);
    setSending(false);
  };

  const inputStyle: React.CSSProperties = { width: "100%", background: "var(--p-08)", border: "1px solid var(--p-25)", borderRadius: "8px", padding: "8px 12px", color: "var(--theme-text)", fontSize: "0.9rem", outline: "none" };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl p-6" style={S.card}>
        <h3 className="font-semibold mb-5" style={{ color: "var(--theme-text)" }}>إرسال إشعار جديد</h3>
        <div className="space-y-4">
          <div><label style={S.label}>عنوان الإشعار *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} dir="rtl" placeholder="مثال: دورة جديدة متاحة!" /></div>
          <div><label style={S.label}>نص الإشعار *</label><textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} dir="rtl" /></div>
          <div><label style={S.label}>رابط (اختياري)</label><input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} style={inputStyle} dir="ltr" placeholder="/courses" /></div>
        </div>
        <button onClick={handleSend} disabled={sending || !form.title.trim() || !form.body.trim()} className="btn-dz mt-5 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm disabled:opacity-50">
          <Send size={15} /><span>{sent ? "✓ تم الإرسال!" : sending ? "جاري الإرسال..." : "إرسال للجميع"}</span>
        </button>
      </div>
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
                  <p className="text-xs mt-1" style={{ color: "var(--theme-text-dim)" }}>{new Date(n.createdAt).toLocaleDateString("ar-DZ", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} · {n.readBy?.length ?? 0} قراءة</p>
                </div>
                <button onClick={async () => { setDeleting(n.id); const { deleteDoc, doc } = await import("firebase/firestore"); const { db } = await import("../../../lib/firebase"); await deleteDoc(doc(db, "notifications", n.id)); setDeleting(null); }} disabled={deleting === n.id} className="p-1.5 rounded-lg transition-colors" style={{ color: "#ef9a9a", border: "1px solid rgba(198,40,40,0.2)" }}>
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

  useEffect(() => { const unsub = subscribeToTheme((t) => setForm(t)); return unsub; }, []);

  const handleChange = (key: keyof ThemeSettings, value: string) => { const updated = { ...form, [key]: value }; setForm(updated); applyTheme(updated); };
  const handlePreset = (theme: ThemeSettings) => { setForm(theme); applyTheme(theme); };
  const handleSave = async () => { setSaving(true); await saveThemeSettings(form); setSaved(true); setTimeout(() => setSaved(false), 2500); setSaving(false); };
  const handleReset = () => { setForm(DEFAULT_THEME); applyTheme(DEFAULT_THEME); };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, marginBottom: "1rem" }}>ثيمات جاهزة</h3>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => handlePreset(p.theme)} className="flex items-center gap-3 p-3 rounded-lg text-right transition-all duration-200" style={{ background: p.theme.bgMain, border: `2px solid ${p.theme.primaryGreen}`, cursor: "pointer" }}>
              <div className="flex gap-1 flex-shrink-0">{[p.theme.primaryGreen, p.theme.accentGreen, p.theme.bgCard].map((c) => (<span key={c} className="w-4 h-4 rounded-full" style={{ background: c, border: "1px solid rgba(255,255,255,0.1)" }} />))}</div>
              <span style={{ color: "var(--theme-text, #e8f5e9)", fontSize: "0.8rem" }}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "var(--theme-text, #c8e6c9)", fontWeight: 600, marginBottom: "1.25rem" }}>تخصيص الألوان</h3>
        <div className="space-y-5">
          {COLOR_OPTIONS.map(({ key, label, hint }) => {
            const colorVal = (form[key] ?? (key === "bgCardEnd" ? form.bgCard : form.textColor)) as string;
            return (
              <div key={key} className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl" style={{ background: colorVal, border: "2px solid rgba(255,255,255,0.1)", cursor: "pointer" }} onClick={() => document.getElementById(`picker-${key}`)?.click()} />
                  <input id={`picker-${key}`} type="color" value={colorVal} onChange={(e) => handleChange(key, e.target.value)} style={{ position: "absolute", opacity: 0, width: "1px", height: "1px", top: 0, left: 0 }} />
                </div>
                <div className="flex-1">
                  <div style={{ color: "var(--theme-text, #c8e6c9)", fontSize: "0.875rem", fontWeight: 500 }}>{label}</div>
                  <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>{hint}</div>
                </div>
                <input type="text" value={colorVal} onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) handleChange(key, v); }} style={{ ...S.input, width: "110px", fontFamily: "monospace", fontSize: "0.8rem", textTransform: "lowercase" }} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl p-6 overflow-hidden relative" style={{ background: form.bgMain, border: `1px solid ${form.primaryGreen}55` }}>
        <div style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.7rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>معاينة مباشرة</div>
        <div className="rounded-lg p-4 mb-3" style={{ background: form.bgCard, border: `1px solid ${form.primaryGreen}44` }}>
          <div style={{ color: form.textColor, fontSize: "0.875rem", marginBottom: "0.5rem" }}>عنوان البطاقة — لون الخطوط</div>
          <div style={{ color: form.primaryGreen, fontSize: "0.75rem" }}>نص ثانوي بالأخضر الرئيسي</div>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: `linear-gradient(135deg, ${form.primaryGreen}, ${form.accentGreen})` }}>زر نموذجي</button>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-dz flex-1 py-3 rounded-xl font-medium disabled:opacity-60">
          <span>{saved ? "✓ تم الحفظ!" : saving ? "جاري الحفظ..." : "حفظ وتطبيق على الموقع"}</span>
        </button>
        <button onClick={handleReset} className="px-6 py-3 rounded-xl text-sm" style={{ border: "1px solid var(--p-30)", color: "var(--theme-text-secondary, #6aad6a)" }}>إعادة الافتراضي</button>
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
        <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.8rem" }}>البيانات محفوظة في Firebase Firestore ومزامنة في الوقت الحقيقي.</p>
      </div>
    </div>
  );
}

// ── NEWS SECTION ────────────────────────────────────────────────
type NewsForm = Omit<NewsItem, "id" | "createdAt">;
const emptyNews: NewsForm = { title: "", body: "", date: new Date().toISOString().slice(0, 10), category: "عام", image: "", imageAlt: "", contentImages: [], link: "" };
const NEWS_CATS: NewsCategory[] = ["قناة جديدة", "مسابقة", "توظيف", "عام"];

function NewsSection() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<NewsForm>(emptyNews);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [contentImgUploading, setContentImgUploading] = useState(false);
  const [pendingAlt, setPendingAlt] = useState("");

  useEffect(() => subscribeToNews(setItems), []);

  const openAdd = () => { setForm({ ...emptyNews, date: new Date().toISOString().slice(0, 10) }); setPendingAlt(""); setModal("add"); };
  const openEdit = (n: NewsItem) => { setEditId(n.id); setForm({ title: n.title, body: n.body, date: n.date, category: n.category, image: n.image || "", imageAlt: n.imageAlt || "", contentImages: n.contentImages || [], link: n.link || "" }); setPendingAlt(""); setModal("edit"); };

  const handleCoverUpload = async (file: File) => {
    setImgUploading(true);
    try { const url = await uploadImage("news", file); setForm((f) => ({ ...f, image: url })); } catch (e: unknown) { alert(e instanceof Error ? e.message : "فشل رفع الصورة"); } finally { setImgUploading(false); }
  };

  const handleContentImgUpload = async (file: File) => {
    setContentImgUploading(true);
    try { const url = await uploadImage("news/content", file); setForm((f) => ({ ...f, contentImages: [...(f.contentImages || []), { url, alt: pendingAlt }] })); setPendingAlt(""); } catch (e: unknown) { alert(e instanceof Error ? e.message : "فشل رفع الصورة"); } finally { setContentImgUploading(false); }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try { if (modal === "add") await addNews(form); else await updateNews(editId, form); setModal(null); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>{items.length} خبر</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm"><Plus size={16} /><span>إضافة خبر</span></button>
      </div>

      {isMobile ? (
        <div>
          {items.length === 0 ? <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد أخبار</div>
          : items.map((n) => (
            <div key={n.id} style={{ padding: "0.875rem 1rem", borderRadius: "0.75rem", marginBottom: "0.5rem", background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--theme-text, #e8f5e9)", fontSize: "0.95rem", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</div>
                  <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>{n.category} · {n.date}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(n)} className="p-2 rounded" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}><Pencil size={16} /></button>
                  <button onClick={() => setDeleteTarget(n)} className="p-2 rounded" style={{ color: "#ef9a9a" }}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={S.card} className="overflow-hidden">
          <table className="w-full">
            <thead><tr>{["العنوان", "الفئة", "التاريخ", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={4} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد أخبار</td></tr>
              : items.map((n) => (
                <tr key={n.id} className="hover:bg-green-950/20 transition-colors">
                  <td style={S.td}>{n.title}</td>
                  <td style={S.td}><span style={S.badge("var(--p-20)")}>{n.category}</span></td>
                  <td style={S.td}>{n.date}</td>
                  <td style={{ ...S.td, width: "80px" }}><div className="flex gap-1 justify-end"><button onClick={() => openEdit(n)} className="p-2 rounded" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}><Pencil size={16} /></button><button onClick={() => setDeleteTarget(n)} className="p-2 rounded" style={{ color: "#ef9a9a" }}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === "add" ? "إضافة خبر جديد" : "تعديل الخبر"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label style={S.label}>العنوان *</label><input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={S.label}>الفئة</label><select style={S.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as NewsCategory })}>{NEWS_CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label style={S.label}>التاريخ</label><input type="date" style={S.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div><label style={S.label}>محتوى الخبر *</label><textarea style={{ ...S.input, minHeight: "120px", resize: "vertical" }} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            <div><label style={S.label}>رابط المصدر</label><input style={S.input} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></div>
            <div>
              <label style={S.label}>صورة الغلاف</label>
              {form.image && <img src={form.image} alt="" style={{ width: "100%", maxHeight: "150px", objectFit: "cover", borderRadius: "0.5rem", marginBottom: "0.5rem", border: "1px solid var(--p-30)" }} />}
              <label style={{ ...S.input, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: imgUploading ? "var(--theme-text-secondary, #6aad6a)" : "var(--theme-badge-text, #81c784)" }}>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} disabled={imgUploading} />
                {imgUploading ? "جاري الرفع..." : form.image ? "تغيير الصورة" : "اختر صورة"}
              </label>
              {form.image && <input style={{ ...S.input, marginTop: "0.4rem" }} value={form.imageAlt || ""} onChange={(e) => setForm({ ...form, imageAlt: e.target.value })} placeholder="alt text (للـ SEO)" />}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50"><span>{saving ? "جاري الحفظ..." : "حفظ"}</span></button>
            </div>
          </div>
        </Modal>
      )}
      {deleteTarget && <ConfirmDelete label={deleteTarget.title} onConfirm={async () => { await deleteNews(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ── THESES SECTION ──────────────────────────────────────────────
type ThesisForm = Omit<Thesis, "id" | "createdAt">;
const emptyThesis: ThesisForm = { title: "", author: "", year: new Date().getFullYear(), specialty: "إعلام واتصال", university: "", abstract: "", supervisor: "", pdfUrl: "", keywords: [] };
const THESIS_SPECS: ThesisSpecialty[] = ["إعلام واتصال", "صحافة", "سمعي بصري", "إعلام آلي"];

function ThesesSection() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<Thesis[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<ThesisForm>(emptyThesis);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Thesis | null>(null);
  const [saving, setSaving] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState("");

  useEffect(() => subscribeToTheses(setItems), []);

  const openAdd = () => { setForm(emptyThesis); setKeywordsInput(""); setModal("add"); };
  const openEdit = (t: Thesis) => { setEditId(t.id); setForm({ title: t.title, author: t.author, year: t.year, specialty: t.specialty, university: t.university, abstract: t.abstract, supervisor: t.supervisor || "", pdfUrl: t.pdfUrl || "", keywords: t.keywords || [] }); setKeywordsInput((t.keywords || []).join("، ")); setModal("edit"); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.author.trim()) return;
    const keywords = keywordsInput.split(/[،,]/).map((k) => k.trim()).filter(Boolean);
    setSaving(true);
    try { const data = { ...form, keywords }; if (modal === "add") await addThesis(data); else await updateThesis(editId, data); setModal(null); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem" }}>{items.length} مذكرة</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm"><Plus size={16} /><span>إضافة مذكرة</span></button>
      </div>

      {isMobile ? (
        <div>
          {items.length === 0 ? <div style={{ textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد مذكرات</div>
          : items.map((t) => (
            <div key={t.id} style={{ padding: "0.875rem 1rem", borderRadius: "0.75rem", marginBottom: "0.5rem", background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--theme-text, #e8f5e9)", fontSize: "0.9rem", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  <div style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.78rem" }}>{t.author} · {t.year}</div>
                  <div style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.72rem" }}>{t.specialty} · {t.university}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(t)} className="p-2 rounded" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}><Pencil size={16} /></button>
                  <button onClick={() => setDeleteTarget(t)} className="p-2 rounded" style={{ color: "#ef9a9a" }}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={S.card} className="overflow-hidden">
          <table className="w-full">
            <thead><tr>{["العنوان", "المؤلف", "التخصص", "الجامعة", "السنة", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {items.length === 0 ? <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "var(--theme-text-dim, #3a5e3a)", padding: "3rem" }}>لا توجد مذكرات</td></tr>
              : items.map((t) => (
                <tr key={t.id} className="hover:bg-green-950/20 transition-colors">
                  <td style={{ ...S.td, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</td>
                  <td style={S.td}>{t.author}</td>
                  <td style={S.td}><span style={S.badge("var(--p-20)")}>{t.specialty}</span></td>
                  <td style={S.td}>{t.university}</td>
                  <td style={S.td}>{t.year}</td>
                  <td style={{ ...S.td, width: "80px" }}><div className="flex gap-1 justify-end"><button onClick={() => openEdit(t)} className="p-2 rounded" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}><Pencil size={16} /></button><button onClick={() => setDeleteTarget(t)} className="p-2 rounded" style={{ color: "#ef9a9a" }}><Trash2 size={16} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal === "add" ? "إضافة مذكرة جديدة" : "تعديل المذكرة"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div><label style={S.label}>عنوان المذكرة *</label><input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={S.label}>اسم المؤلف *</label><input style={S.input} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
              <div><label style={S.label}>سنة المناقشة</label><input type="number" style={S.input} value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} min={1990} max={2030} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label style={S.label}>التخصص</label><select style={S.input} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value as ThesisSpecialty })}>{THESIS_SPECS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label style={S.label}>الجامعة</label><input style={S.input} value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} /></div>
            </div>
            <div><label style={S.label}>المشرف</label><input style={S.input} value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} /></div>
            <div><label style={S.label}>ملخص المذكرة</label><textarea style={{ ...S.input, minHeight: "100px", resize: "vertical" }} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} /></div>
            <div><label style={S.label}>الكلمات المفتاحية (مفصولة بفاصلة)</label><input style={S.input} value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)} placeholder="إعلام، صحافة، جزائر" /></div>
            <div><label style={S.label}>رابط PDF</label><input style={S.input} value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} placeholder="https://..." /></div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid var(--p-30)", color: "var(--theme-badge-text, #81c784)", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.author.trim()} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50"><span>{saving ? "جاري الحفظ..." : "حفظ"}</span></button>
            </div>
          </div>
        </Modal>
      )}
      {deleteTarget && <ConfirmDelete label={deleteTarget.title} onConfirm={async () => { await deleteThesis(deleteTarget.id); setDeleteTarget(null); }} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}
