import { useState, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, ShoppingCart, Briefcase,
  Trophy, Mic, Settings, LogOut, Plus, Pencil, Trash2,
  X, Radio, ExternalLink,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import {
  subscribeToCollection,
  addCourse, updateCourse, deleteCourse,
  addJob, updateJob, deleteJob,
  addEquipment, updateEquipment, deleteEquipment,
  addCompetition, updateCompetition, deleteCompetition,
  addVoiceArtist, updateVoiceArtist, deleteVoiceArtist,
} from "../../../lib/firestore";
import type { Course, Job, Equipment, Competition, VoiceArtist } from "../../../lib/types";

type Section = "overview" | "courses" | "equipment" | "jobs" | "competitions" | "voice" | "settings";

// ── Shared styles ───────────────────────────────────────────────
const S = {
  card: {
    background: "linear-gradient(145deg, #0f1a0f, #0b150b)",
    border: "1px solid rgba(0,98,51,0.25)",
    borderRadius: "0.75rem",
  } as React.CSSProperties,
  th: {
    color: "#6aad6a", fontSize: "0.75rem", fontWeight: 500,
    padding: "0.75rem 1rem", textAlign: "right" as const,
    borderBottom: "1px solid rgba(0,98,51,0.15)",
  },
  td: {
    color: "#c8e6c9", fontSize: "0.875rem",
    padding: "0.85rem 1rem", textAlign: "right" as const,
    borderBottom: "1px solid rgba(0,98,51,0.08)",
  },
  input: {
    background: "#111e11", border: "1px solid rgba(0,98,51,0.3)",
    color: "#e8f5e9", borderRadius: "0.5rem",
    padding: "0.6rem 0.85rem", width: "100%", fontSize: "0.875rem",
  } as React.CSSProperties,
  label: { color: "#81c784", fontSize: "0.8rem", display: "block", marginBottom: "0.35rem" } as React.CSSProperties,
  badge: (color: string) => ({
    display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "9999px",
    fontSize: "0.72rem", background: color,
  }),
};

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
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(0,98,51,0.2)" }}>
          <h3 style={{ color: "#e8f5e9", fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ color: "#4a7a4a" }} className="hover:text-white transition-colors">
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
      <p style={{ color: "#a5d6a7", marginBottom: "1.5rem" }}>
        هل أنت متأكد من حذف <strong style={{ color: "#ef9a9a" }}>{label}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#81c784" }}>
          إلغاء
        </button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(198,40,40,0.2)", border: "1px solid rgba(198,40,40,0.4)", color: "#ef9a9a" }}>
          حذف
        </button>
      </div>
    </Modal>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) navigate("/sanad-admin");
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
    { id: "settings" as Section, label: "الإعدادات", icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/sanad-admin");
  };

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: "#0b0f0b" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col"
        style={{
          width: sidebarOpen ? "240px" : "64px",
          minHeight: "100vh",
          background: "linear-gradient(180deg, #0d1a0d 0%, #060a06 100%)",
          borderLeft: "1px solid rgba(0,98,51,0.2)",
          transition: "width 0.3s ease",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-4 mb-2" style={{ borderBottom: "1px solid rgba(0,98,51,0.15)" }}>
          <div className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #006233, #008545)", boxShadow: "0 0 10px rgba(0,98,51,0.4)" }}>
            <Radio size={16} color="#fff" />
          </div>
          {sidebarOpen && (
            <span className="font-bold" style={{ background: "linear-gradient(90deg,#00a355,#4caf50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
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
                color: activeSection === id ? "#00a355" : "#6aad6a",
                background: activeSection === id ? "rgba(0,98,51,0.18)" : "transparent",
                justifyContent: sidebarOpen ? "flex-start" : "center",
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={{ fontSize: "0.875rem" }}>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 space-y-1" style={{ borderTop: "1px solid rgba(0,98,51,0.15)" }}>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ color: "#4a7a4a", fontSize: "0.875rem", textDecoration: "none", justifyContent: sidebarOpen ? "flex-start" : "center" }}
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
          style={{ borderBottom: "1px solid rgba(0,98,51,0.15)", background: "rgba(11,15,11,0.8)", backdropFilter: "blur(8px)" }}
        >
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: "#4a7a4a" }}>
            <LayoutDashboard size={20} />
          </button>
          <div>
            <h1 style={{ color: "#e8f5e9", fontWeight: 600, fontSize: "1.1rem" }}>
              {menuItems.find((m) => m.id === activeSection)?.label}
            </h1>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {activeSection === "overview"    && <OverviewSection onNavigate={setActiveSection} />}
          {activeSection === "courses"     && <CoursesSection />}
          {activeSection === "equipment"   && <EquipmentSection />}
          {activeSection === "jobs"        && <JobsSection />}
          {activeSection === "competitions"&& <CompetitionsSection />}
          {activeSection === "voice"       && <VoiceSection />}
          {activeSection === "settings"    && <SettingsSection />}
        </div>
      </main>
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────
function OverviewSection({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const [counts, setCounts] = useState({ courses: 0, jobs: 0, equipment: 0, competitions: 0, voice: 0 });

  useEffect(() => {
    const unsubs = [
      subscribeToCollection<Course>("courses",      (d) => setCounts((c) => ({ ...c, courses: d.length }))),
      subscribeToCollection<Job>("jobs",             (d) => setCounts((c) => ({ ...c, jobs: d.length }))),
      subscribeToCollection<Equipment>("equipment",  (d) => setCounts((c) => ({ ...c, equipment: d.length }))),
      subscribeToCollection<Competition>("competitions", (d) => setCounts((c) => ({ ...c, competitions: d.length }))),
      subscribeToCollection<VoiceArtist>("voice",   (d) => setCounts((c) => ({ ...c, voice: d.length }))),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const stats = [
    { label: "الدورات",     value: counts.courses,      icon: BookOpen,      sec: "courses" as Section,      color: "#006233" },
    { label: "العتاد",      value: counts.equipment,    icon: ShoppingCart,  sec: "equipment" as Section,    color: "#1a5276" },
    { label: "الوظائف",     value: counts.jobs,         icon: Briefcase,     sec: "jobs" as Section,         color: "#7d3c98" },
    { label: "المسابقات",   value: counts.competitions, icon: Trophy,        sec: "competitions" as Section, color: "#784212" },
    { label: "المنشطون",    value: counts.voice,        icon: Mic,           sec: "voice" as Section,        color: "#1a6b47" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, sec, color }) => (
          <button
            key={label}
            onClick={() => onNavigate(sec)}
            className="p-5 rounded-xl text-right transition-all duration-200 card-glow"
            style={S.card}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${color}33`, border: `1px solid ${color}66` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div style={{ color: "#e8f5e9", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1 }}>{value}</div>
            <div style={{ color: "#4a7a4a", fontSize: "0.8rem", marginTop: "0.25rem" }}>{label}</div>
          </button>
        ))}
      </div>
      <div className="rounded-xl p-6" style={S.card}>
        <p style={{ color: "#6aad6a", fontSize: "0.875rem" }}>اضغط على أي بطاقة للانتقال إلى إدارة القسم.</p>
      </div>
    </div>
  );
}

// ── COURSES SECTION ─────────────────────────────────────────────
type CourseForm = Omit<Course, "id" | "createdAt">;
const emptyCourse: CourseForm = { title: "", type: "free", duration: "", description: "", instructor: "", link: "", price: 0 };

function CoursesSection() {
  const [items, setItems] = useState<Course[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<CourseForm>(emptyCourse);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeToCollection<Course>("courses", setItems), []);

  const openAdd = () => { setForm(emptyCourse); setModal("add"); };
  const openEdit = (c: Course) => { setEditId(c.id); setForm({ title: c.title, type: c.type, duration: c.duration, description: c.description, instructor: c.instructor, link: c.link || "", price: c.price || 0 }); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") await addCourse(form);
      else await updateCourse(editId, form);
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deleteTarget) { await deleteCourse(deleteTarget.id); setDeleteTarget(null); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <span style={{ color: "#6aad6a", fontSize: "0.875rem" }}>{items.length} دورة مسجلة</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة دورة</span>
        </button>
      </div>

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {["العنوان", "المدرب", "النوع", "المدة", ""].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#3a5e3a", padding: "3rem" }}>لا توجد دورات بعد</td></tr>
              ) : items.map((c) => (
                <tr key={c.id} className="hover:bg-green-950/20 transition-colors">
                  <td style={S.td}>{c.title}</td>
                  <td style={S.td}>{c.instructor}</td>
                  <td style={S.td}>
                    <span style={S.badge(c.type === "free" ? "rgba(0,98,51,0.3)" : "rgba(26,82,118,0.3)")}>
                      {c.type === "free" ? "مجانية" : `${c.price} دج`}
                    </span>
                  </td>
                  <td style={S.td}>{c.duration}</td>
                  <td style={{ ...S.td, width: "80px" }}>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(c)} style={{ color: "#6aad6a" }}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(c)} style={{ color: "#ef9a9a" }}><Trash2 size={15} /></button>
                    </div>
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
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#81c784", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving || !form.title} className="btn-dz px-5 py-2 rounded-lg text-sm disabled:opacity-50">
                <span>{saving ? "جاري الحفظ..." : "حفظ"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && <ConfirmDelete label={deleteTarget.title} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ── JOBS SECTION ────────────────────────────────────────────────
type JobForm = Omit<Job, "id" | "createdAt">;
const emptyJob: JobForm = { title: "", company: "", location: "", jobType: "", description: "", deadline: "", contact: "" };

function JobsSection() {
  const [items, setItems] = useState<Job[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<JobForm>(emptyJob);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeToCollection<Job>("jobs", setItems), []);

  const openAdd = () => { setForm(emptyJob); setModal("add"); };
  const openEdit = (j: Job) => { setEditId(j.id); setForm({ title: j.title, company: j.company, location: j.location, jobType: j.jobType, description: j.description, deadline: j.deadline || "", contact: j.contact }); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") await addJob(form);
      else await updateJob(editId, form);
      setModal(null);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <span style={{ color: "#6aad6a", fontSize: "0.875rem" }}>{items.length} عرض توظيف</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة وظيفة</span>
        </button>
      </div>

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["المسمى الوظيفي", "الجهة", "الموقع", "الموعد النهائي", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#3a5e3a", padding: "3rem" }}>لا توجد عروض بعد</td></tr>
              ) : items.map((j) => (
                <tr key={j.id} className="hover:bg-green-950/20 transition-colors">
                  <td style={S.td}>{j.title}</td>
                  <td style={S.td}>{j.company}</td>
                  <td style={S.td}>{j.location}</td>
                  <td style={S.td}>{j.deadline || "—"}</td>
                  <td style={{ ...S.td, width: "80px" }}>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(j)} style={{ color: "#6aad6a" }}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(j)} style={{ color: "#ef9a9a" }}><Trash2 size={15} /></button>
                    </div>
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
            <div><label style={S.label}>تفاصيل الوظيفة</label><textarea style={{ ...S.input, minHeight: "80px", resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#81c784", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
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
type EquipmentForm = Omit<Equipment, "id" | "createdAt">;
const emptyEquip: EquipmentForm = { name: "", category: "", price: 0, seller: "", description: "", condition: "used", contact: "" };

function EquipmentSection() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<EquipmentForm>(emptyEquip);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeToCollection<Equipment>("equipment", setItems), []);

  const openAdd = () => { setForm(emptyEquip); setModal("add"); };
  const openEdit = (eq: Equipment) => { setEditId(eq.id); setForm({ name: eq.name, category: eq.category, price: eq.price, seller: eq.seller, description: eq.description, condition: eq.condition, contact: eq.contact }); setModal("edit"); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") await addEquipment(form);
      else await updateEquipment(editId, form);
      setModal(null);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <span style={{ color: "#6aad6a", fontSize: "0.875rem" }}>{items.length} منتج</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة منتج</span>
        </button>
      </div>

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["المنتج", "الفئة", "السعر (دج)", "الحالة", "البائع", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#3a5e3a", padding: "3rem" }}>لا توجد منتجات بعد</td></tr>
              ) : items.map((eq) => (
                <tr key={eq.id} className="hover:bg-green-950/20 transition-colors">
                  <td style={S.td}>{eq.name}</td>
                  <td style={S.td}>{eq.category}</td>
                  <td style={S.td}>{eq.price.toLocaleString()}</td>
                  <td style={S.td}><span style={S.badge(eq.condition === "new" ? "rgba(0,98,51,0.3)" : "rgba(120,66,18,0.3)")}>{eq.condition === "new" ? "جديد" : "مستعمل"}</span></td>
                  <td style={S.td}>{eq.seller}</td>
                  <td style={{ ...S.td, width: "80px" }}>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(eq)} style={{ color: "#6aad6a" }}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(eq)} style={{ color: "#ef9a9a" }}><Trash2 size={15} /></button>
                    </div>
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
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#81c784", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
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
type CompForm = Omit<Competition, "id" | "createdAt">;
const emptyComp: CompForm = { name: "", type: "national", startDate: "", endDate: "", description: "", organizer: "", link: "" };

function CompetitionsSection() {
  const [items, setItems] = useState<Competition[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<CompForm>(emptyComp);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeToCollection<Competition>("competitions", setItems), []);

  const openAdd = () => { setForm(emptyComp); setModal("add"); };
  const openEdit = (c: Competition) => { setEditId(c.id); setForm({ name: c.name, type: c.type, startDate: c.startDate, endDate: c.endDate, description: c.description, organizer: c.organizer, link: c.link || "" }); setModal("edit"); };

  const typeLabel = { university: "جامعية", national: "وطنية", international: "دولية" };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <span style={{ color: "#6aad6a", fontSize: "0.875rem" }}>{items.length} مسابقة</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة مسابقة</span>
        </button>
      </div>

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["المسابقة", "النوع", "تاريخ البداية", "تاريخ النهاية", "المنظم", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#3a5e3a", padding: "3rem" }}>لا توجد مسابقات بعد</td></tr>
              ) : items.map((c) => (
                <tr key={c.id} className="hover:bg-green-950/20 transition-colors">
                  <td style={S.td}>{c.name}</td>
                  <td style={S.td}><span style={S.badge("rgba(0,98,51,0.25)")}>{typeLabel[c.type]}</span></td>
                  <td style={S.td}>{c.startDate}</td>
                  <td style={S.td}>{c.endDate}</td>
                  <td style={S.td}>{c.organizer}</td>
                  <td style={{ ...S.td, width: "80px" }}>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(c)} style={{ color: "#6aad6a" }}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(c)} style={{ color: "#ef9a9a" }}><Trash2 size={15} /></button>
                    </div>
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
            <div><label style={S.label}>الرابط (اختياري)</label><input style={S.input} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></div>
            <div><label style={S.label}>الوصف</label><textarea style={{ ...S.input, minHeight: "80px", resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setModal(null)} style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#81c784", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
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
type VoiceForm = Omit<VoiceArtist, "id" | "createdAt">;
const emptyVoice: VoiceForm = { name: "", specialty: "", experience: "", description: "", contact: "" };

function VoiceSection() {
  const [items, setItems] = useState<VoiceArtist[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<VoiceForm>(emptyVoice);
  const [editId, setEditId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VoiceArtist | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeToCollection<VoiceArtist>("voice", setItems), []);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <span style={{ color: "#6aad6a", fontSize: "0.875rem" }}>{items.length} منشط</span>
        <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
          <span><Plus size={16} /></span><span>إضافة منشط</span>
        </button>
      </div>

      <div style={S.card} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>{["الاسم", "التخصص", "الخبرة", "التواصل", ""].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "#3a5e3a", padding: "3rem" }}>لا يوجد منشطون بعد</td></tr>
              ) : items.map((v) => (
                <tr key={v.id} className="hover:bg-green-950/20 transition-colors">
                  <td style={S.td}>{v.name}</td>
                  <td style={S.td}><span style={S.badge("rgba(0,98,51,0.25)")}>{v.specialty}</span></td>
                  <td style={S.td}>{v.experience}</td>
                  <td style={S.td}>{v.contact}</td>
                  <td style={{ ...S.td, width: "80px" }}>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(v)} style={{ color: "#6aad6a" }}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(v)} style={{ color: "#ef9a9a" }}><Trash2 size={15} /></button>
                    </div>
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
              <button onClick={() => setModal(null)} style={{ border: "1px solid rgba(0,98,51,0.3)", color: "#81c784", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem" }}>إلغاء</button>
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

// ── SETTINGS ────────────────────────────────────────────────────
function SettingsSection() {
  const user = auth.currentUser;
  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "#c8e6c9", fontWeight: 600, marginBottom: "1rem" }}>معلومات الحساب</h3>
        <div style={{ color: "#6aad6a", fontSize: "0.875rem" }}>
          <p>البريد الإلكتروني: <span style={{ color: "#a5d6a7" }}>{user?.email}</span></p>
          <p className="mt-2">آخر تسجيل دخول: <span style={{ color: "#a5d6a7" }}>{user?.metadata.lastSignInTime}</span></p>
        </div>
      </div>
      <div className="rounded-xl p-6" style={S.card}>
        <h3 style={{ color: "#c8e6c9", fontWeight: 600, marginBottom: "0.75rem" }}>معلومات المنصة</h3>
        <p style={{ color: "#4a7a4a", fontSize: "0.8rem" }}>
          البيانات محفوظة في Firebase Firestore ومزامنة في الوقت الحقيقي.
          أي تغيير تجريه يظهر فوراً للزوار.
        </p>
      </div>
    </div>
  );
}
