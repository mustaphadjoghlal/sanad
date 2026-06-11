import { useState, useEffect } from "react";
import { Plus, X, Trash2, Check, Clock, MapPin, Calendar, Users, DollarSign, ImageIcon, BookOpen, Inbox } from "lucide-react";
import { subscribeToTrainerCourses, addTrainerCourse, updateTrainerCourse, deleteTrainerCourse, subscribeToTrainerRegistrations } from "../../lib/firestore";
import { uploadProfilePhoto } from "../../lib/storage";
import type { TrainerCourse, CourseRegistration } from "../../lib/types";

interface Props { trainerId: string; }

const EMPTY: Omit<TrainerCourse, "id" | "createdAt" | "status" | "featured"> = {
  trainerId: "",
  title: "",
  description: "",
  type: "paid",
  price: undefined,
  duration: "",
  location: "",
  schedule: "",
  startDate: "",
  seats: undefined,
  image: "",
  contentImages: [],
};

export default function TrainerManager({ trainerId }: Props) {
  const [tab, setTab] = useState<"courses" | "registrations">("courses");
  const [courses, setCourses] = useState<TrainerCourse[]>([]);
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY, trainerId });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => subscribeToTrainerCourses(trainerId, setCourses), [trainerId]);
  useEffect(() => subscribeToTrainerRegistrations(trainerId, setRegistrations), [trainerId]);

  const f = (key: string, val: unknown) => setForm((p) => ({ ...p, [key]: val }));

  const openAdd = () => { setForm({ ...EMPTY, trainerId }); setEditId(null); setImageFile(null); setImagePreview(null); setUploadProgress(0); setError(""); setShowForm(true); };
  const openEdit = (c: TrainerCourse) => { setForm({ ...c }); setEditId(c.id); setImageFile(null); setImagePreview(c.image ?? null); setUploadProgress(0); setError(""); setShowForm(true); };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.duration.trim() || !form.location.trim() || !form.schedule.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let imageUrl = form.image ?? "";
      if (imageFile) {
        setUploadProgress(10);
        const fakeUid = `tc_${trainerId}_${Date.now()}`;
        imageUrl = await uploadProfilePhoto(imageFile, fakeUid);
        setUploadProgress(80);
      }
      const data = {
        ...form,
        image: imageUrl || undefined,
        price: form.price ? Number(form.price) : undefined,
        seats: form.seats ? Number(form.seats) : undefined,
        startDate: form.startDate || undefined,
        contentImages: form.contentImages ?? [],
      };
      if (editId) {
        await updateTrainerCourse(editId, data);
      } else {
        await addTrainerCourse(data);
      }
      setShowForm(false);
    } catch {
      setError("حدث خطأ، حاول مجدداً");
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف هذه الدورة؟")) return;
    await deleteTrainerCourse(id);
  };

  const statusColors: Record<string, React.CSSProperties> = {
    pending: { background: "rgba(180,120,0,0.2)", color: "#fbbf24", border: "1px solid rgba(180,120,0,0.3)" },
    approved: { background: "var(--p-20)", color: "#4ade80", border: "1px solid var(--p-30)" },
    rejected: { background: "rgba(198,40,40,0.1)", color: "#f87171", border: "1px solid rgba(198,40,40,0.3)" },
  };
  const statusLabel: Record<string, string> = { pending: "قيد المراجعة", approved: "معتمدة", rejected: "مرفوضة" };

  return (
    <div dir="rtl">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["courses", "registrations"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: tab === t ? "var(--p-20)" : "transparent", color: tab === t ? "var(--theme-accent)" : "var(--theme-text-muted)", border: "1px solid " + (tab === t ? "var(--p-30)" : "var(--p-15)") }}>
            {t === "courses" ? `الدورات (${courses.length})` : `التسجيلات (${registrations.length})`}
          </button>
        ))}
      </div>

      {tab === "courses" && (
        <>
          <button onClick={openAdd} className="btn-dz flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm mb-4">
            <Plus size={16} /> إضافة دورة جديدة
          </button>

          {courses.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ border: "1px dashed var(--p-20)", color: "var(--theme-text-muted)" }}>
              <BookOpen size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.3 }} />
              <p>لا توجد دورات بعد</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {courses.map((c) => (
                <div key={c.id} className="rounded-xl p-4" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold" style={{ color: "var(--theme-text)" }}>{c.title}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={statusColors[c.status] ?? statusColors.pending}>
                          {statusLabel[c.status] ?? c.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--theme-text-muted)" }}>
                        <span className="flex items-center gap-1"><Clock size={11} /> {c.duration}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {c.location}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {c.schedule}</span>
                        {c.type === "paid" && c.price && <span className="flex items-center gap-1"><DollarSign size={11} /> {c.price.toLocaleString()} دج</span>}
                        {c.type === "free" && <span style={{ color: "var(--theme-accent)" }}>مجانية</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-xs" style={{ background: "var(--p-12)", color: "var(--theme-text-muted)", border: "none", cursor: "pointer" }}>تعديل</button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg" style={{ background: "rgba(198,40,40,0.1)", color: "#f87171", border: "none", cursor: "pointer" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "registrations" && (
        <>
          {registrations.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ border: "1px dashed var(--p-20)", color: "var(--theme-text-muted)" }}>
              <Inbox size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.3 }} />
              <p>لا توجد تسجيلات بعد</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {registrations.map((r) => (
                <div key={r.id} className="rounded-xl p-4" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ color: "var(--theme-text)" }}>{r.name}</p>
                      <p className="text-xs mb-0.5" style={{ color: "var(--theme-accent)" }}>{r.courseTitle}</p>
                      <div className="flex flex-wrap gap-3 text-xs mt-1" style={{ color: "var(--theme-text-muted)" }}>
                        <span>📞 {r.phone}</span>
                        {r.email && <span>✉ {r.email}</span>}
                        {r.wilaya && <span>📍 {r.wilaya}</span>}
                      </div>
                      {r.note && <p className="text-xs mt-1 italic" style={{ color: "var(--theme-text-dim)" }}>{r.note}</p>}
                    </div>
                    <span className="text-xs" style={{ color: "var(--theme-text-dim)" }}>
                      {new Date(r.createdAt).toLocaleDateString("ar-DZ", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "linear-gradient(145deg,#181818,#141414)", border: "1px solid var(--p-25)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: "var(--theme-text)" }}>{editId ? "تعديل الدورة" : "دورة جديدة"}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--theme-text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {error && <p className="text-sm text-center mb-4" style={{ color: "#f87171" }}>{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>عنوان الدورة *</label>
                <input value={form.title} onChange={(e) => f("title", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm" placeholder="مثال: دورة التصوير الاحترافي" required />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>وصف الدورة *</label>
                <textarea value={form.description} onChange={(e) => f("description", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm resize-none" rows={4} placeholder="اشرح محتوى الدورة والمهارات التي سيكتسبها المتدرب" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>النوع</label>
                  <select value={form.type} onChange={(e) => f("type", e.target.value)} className="input-dz w-full px-3 py-2.5 rounded-xl text-sm">
                    <option value="paid">مدفوعة</option>
                    <option value="free">مجانية</option>
                  </select>
                </div>
                {form.type === "paid" && (
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>السعر (دج)</label>
                    <input type="number" value={form.price ?? ""} onChange={(e) => f("price", e.target.value)} className="input-dz w-full px-3 py-2.5 rounded-xl text-sm" placeholder="5000" min={0} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>المدة *</label>
                  <input value={form.duration} onChange={(e) => f("duration", e.target.value)} className="input-dz w-full px-3 py-2.5 rounded-xl text-sm" placeholder="3 أيام / أسبوع" required />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>عدد المقاعد</label>
                  <input type="number" value={form.seats ?? ""} onChange={(e) => f("seats", e.target.value)} className="input-dz w-full px-3 py-2.5 rounded-xl text-sm" placeholder="20" min={1} />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>مكان الدورة *</label>
                <input value={form.location} onChange={(e) => f("location", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm" placeholder="مثال: وهران — شارع ابن بادي / عن بعد (أونلاين)" required />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>الجدول الزمني *</label>
                <input value={form.schedule} onChange={(e) => f("schedule", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm" placeholder="كل جمعة 09:00 - 13:00" required />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>تاريخ البداية</label>
                <input type="date" value={form.startDate ?? ""} onChange={(e) => f("startDate", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>صورة الغلاف</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer" style={{ background: "var(--p-12)", border: "1px solid var(--p-25)", color: "var(--theme-text-muted)" }}>
                    <ImageIcon size={16} /> اختر صورة
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {imagePreview && <img src={imagePreview} alt="" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "0.5rem" }} />}
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--p-15)" }}>
                  <div style={{ width: `${uploadProgress}%`, height: "100%", background: "var(--theme-accent)", transition: "width 0.3s" }} />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-dz flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
                  {saving ? "جاري الحفظ..." : editId ? "حفظ التعديلات" : "إضافة الدورة"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm" style={{ background: "var(--p-10)", color: "var(--theme-text-muted)", border: "1px solid var(--p-20)" }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
