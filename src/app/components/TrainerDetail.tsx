import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin, Phone, MessageCircle, Globe, Building2, Calendar, Clock,
  Users, DollarSign, ArrowRight, CheckCircle, X, BookOpen,
} from "lucide-react";
import { getTrainer, subscribeToApprovedTrainerCourses, submitCourseRegistration, sendNotification } from "../../lib/firestore";
import type { UserProfile, TrainerCourse } from "../../lib/types";

const wilayas = [
  "الجزائر","وهران","قسنطينة","عنابة","سطيف","تيزي وزو","البليدة","بجاية",
  "تلمسان","باتنة","بسكرة","سكيكدة","جيجل","برج بوعريريج","المدية","تبسة",
  "مستغانم","معسكر","سعيدة","تيارت","غليزان","الشلف","عين الدفلى","ميلة",
  "خنشلة","أم البواقي","سوق أهراس","المسيلة","الوادي","ورقلة",
  "غرداية","بشار","أدرار","تمنراست","إليزي",
];

interface RegForm { name: string; phone: string; email: string; wilaya: string; note: string; }

export default function TrainerDetail() {
  const { id } = useParams<{ id: string }>();
  const [trainer, setTrainer] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<TrainerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<TrainerCourse | null>(null);
  const [form, setForm] = useState<RegForm>({ name: "", phone: "", email: "", wilaya: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [regError, setRegError] = useState("");

  useEffect(() => {
    if (!id) return;
    getTrainer(id).then((t) => { setTrainer(t); setLoading(false); });
    return subscribeToApprovedTrainerCourses(id, setCourses);
  }, [id]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !trainer) return;
    if (!form.name.trim() || !form.phone.trim()) { setRegError("الاسم والهاتف مطلوبان"); return; }
    setSubmitting(true);
    setRegError("");
    try {
      await submitCourseRegistration({
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        trainerId: trainer.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        wilaya: form.wilaya || undefined,
        note: form.note.trim() || undefined,
      });
      // Best-effort: a failed notification must not surface an error for an
      // already-successful registration.
      await sendNotification({
        title: "طلب تسجيل جديد في دورتك",
        body: `${form.name} طلب التسجيل في "${selectedCourse.title}"`,
        link: `/user/dashboard`,
        createdAt: Date.now(),
      }).catch(() => {});
      setSubmitted(true);
    } catch {
      setRegError("حدث خطأ، حاول مجدداً");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => { setSelectedCourse(null); setSubmitted(false); setForm({ name: "", phone: "", email: "", wilaya: "", note: "" }); setRegError(""); };
  const f = (key: keyof RegForm, val: string) => setForm((p) => ({ ...p, [key]: val }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e0e0e" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--theme-accent) transparent transparent transparent" }} />
    </div>
  );

  if (!trainer) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#0e0e0e", color: "var(--theme-text)" }} dir="rtl">
      <p>المدرب غير موجود</p>
      <Link to="/trainers" className="text-sm" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>← العودة للمدربين</Link>
    </div>
  );

  return (
    <div className="min-h-screen py-12" style={{ background: "#0e0e0e" }} dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back */}
        <Link to="/trainers" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>
          <ArrowRight size={14} /> العودة للمدربين
        </Link>

        {/* Profile card */}
        <div className="rounded-2xl overflow-hidden mb-8" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-20)" }}>
          {/* Cover / Photo */}
          <div style={{ height: "200px", background: "linear-gradient(135deg, var(--theme-primary), var(--theme-accent))", position: "relative" }}>
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
            {trainer.photo && (
              <img src={trainer.photo} alt={trainer.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
            )}
          </div>

          <div className="p-6 -mt-8 relative z-10">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 border-4" style={{ borderColor: "#141414", background: "var(--p-20)" }}>
              {trainer.photo
                ? <img src={trainer.photo} alt={trainer.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div className="w-full h-full flex items-center justify-center"><Building2 size={32} style={{ color: "var(--p-40)" }} /></div>
              }
            </div>

            <h1 className="text-2xl font-black mb-1" style={{ color: "var(--theme-text)" }}>{trainer.name}</h1>
            {trainer.organization && <p className="text-sm mb-2" style={{ color: "var(--theme-accent)" }}>{trainer.organization}</p>}
            {trainer.specialty && (
              <span className="inline-block text-xs px-3 py-1 rounded-full mb-4" style={{ background: "var(--p-15)", color: "var(--theme-badge-text)" }}>
                {trainer.specialty}
              </span>
            )}
            {trainer.bio && <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--theme-text-muted)" }}>{trainer.bio}</p>}

            {/* Contact */}
            <div className="flex flex-wrap gap-3">
              {trainer.location && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                  <MapPin size={14} /> {trainer.location}
                </span>
              )}
              {trainer.phone && (
                <a href={`tel:${trainer.phone}`} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg" style={{ color: "var(--theme-badge-text)", border: "1px solid var(--p-25)", textDecoration: "none" }}>
                  <Phone size={14} /> {trainer.phone}
                </a>
              )}
              {(trainer as any).whatsapp && (
                <a href={`https://wa.me/${(trainer as any).whatsapp?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg" style={{ color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)", textDecoration: "none" }}>
                  <MessageCircle size={14} /> واتساب
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Courses */}
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--theme-text)" }}>الدورات التدريبية ({courses.length})</h2>
        {courses.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-15)" }}>
            <BookOpen size={40} style={{ color: "var(--p-25)", margin: "0 auto 1rem" }} />
            <p style={{ color: "var(--theme-text-muted)" }}>لا توجد دورات معتمدة حالياً</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {courses.map((course) => (
              <div key={course.id} className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-20)" }}>
                {course.image && (
                  <div style={{ height: "200px", overflow: "hidden" }}>
                    <img src={course.image} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-lg" style={{ color: "var(--theme-text)" }}>{course.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full flex-shrink-0" style={{ background: course.type === "free" ? "var(--p-15)" : "rgba(26,82,118,0.3)", color: course.type === "free" ? "var(--theme-accent)" : "#64b5f6" }}>
                      {course.type === "free" ? "مجانية" : `${course.price?.toLocaleString()} دج`}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--theme-text-muted)" }}>{course.description}</p>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {course.duration && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                        <Clock size={14} style={{ color: "var(--theme-accent)" }} /> {course.duration}
                      </div>
                    )}
                    {course.location && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                        <MapPin size={14} style={{ color: "var(--theme-accent)" }} /> {course.location}
                      </div>
                    )}
                    {course.schedule && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                        <Calendar size={14} style={{ color: "var(--theme-accent)" }} /> {course.schedule}
                      </div>
                    )}
                    {course.startDate && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                        <Calendar size={14} style={{ color: "var(--theme-accent)" }} /> تبدأ: {new Date(course.startDate).toLocaleDateString("ar-DZ")}
                      </div>
                    )}
                    {course.seats && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                        <Users size={14} style={{ color: "var(--theme-accent)" }} /> {course.seats} مقعد
                      </div>
                    )}
                  </div>

                  {/* Content images */}
                  {course.contentImages && course.contentImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {course.contentImages.map((img, i) => (
                        <div key={i} style={{ height: "80px", borderRadius: "0.5rem", overflow: "hidden" }}>
                          <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => { setSelectedCourse(course); setSubmitted(false); }}
                    className="btn-dz w-full py-3 rounded-xl font-medium text-sm"
                  >
                    التسجيل في الدورة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-fade-in-up" style={{ background: "linear-gradient(145deg,#181818,#141414)", border: "1px solid var(--p-25)", maxHeight: "90vh", overflowY: "auto" }}>
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle size={48} style={{ color: "var(--theme-accent)", margin: "0 auto 1rem" }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--theme-text)" }}>تم إرسال طلبك!</h3>
                <p className="text-sm mb-6" style={{ color: "var(--theme-text-muted)" }}>سيتواصل معك المدرب قريباً</p>
                <button onClick={closeModal} className="btn-dz px-6 py-2.5 rounded-xl text-sm">حسناً</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg" style={{ color: "var(--theme-text)" }}>التسجيل في الدورة</h3>
                  <button onClick={closeModal} style={{ color: "var(--theme-text-muted)", background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
                </div>
                <p className="text-sm mb-5 px-3 py-2 rounded-lg" style={{ color: "var(--theme-accent)", background: "var(--p-10)", border: "1px solid var(--p-20)" }}>
                  {selectedCourse.title}
                </p>

                {regError && (
                  <p className="text-sm mb-4 text-center" style={{ color: "#f87171" }}>{regError}</p>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>الاسم الكامل *</label>
                    <input value={form.name} onChange={(e) => f("name", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm" placeholder="اسمك الكامل" required />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>رقم الهاتف *</label>
                    <input value={form.phone} onChange={(e) => f("phone", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm" placeholder="05XXXXXXXX" required />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>البريد الإلكتروني</label>
                    <input type="email" value={form.email} onChange={(e) => f("email", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm" placeholder="اختياري" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>الولاية</label>
                    <select value={form.wilaya} onChange={(e) => f("wilaya", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm">
                      <option value="">اختر الولاية</option>
                      {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: "var(--theme-badge-text)" }}>ملاحظة</label>
                    <textarea value={form.note} onChange={(e) => f("note", e.target.value)} className="input-dz w-full px-4 py-2.5 rounded-xl text-sm resize-none" rows={3} placeholder="أي معلومة إضافية (اختياري)" />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-dz w-full py-3 rounded-xl font-medium text-sm disabled:opacity-60">
                    {submitting ? "جاري الإرسال..." : "إرسال طلب التسجيل"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
