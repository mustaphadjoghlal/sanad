import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Mic, ShoppingCart, Radio, ArrowRight, Check } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { saveUserProfile } from "../../../lib/firestore";

type UserType = "journalist" | "voice" | "vendor";

const wilayas = [
  "الجزائر", "وهران", "قسنطينة", "عنابة", "سطيف", "تيزي وزو", "البليدة", "بجاية",
  "تلمسان", "باتنة", "بسكرة", "سكيكدة", "جيجل", "برج بوعريريج", "المدية", "تبسة",
  "مستغانم", "معسكر", "سعيدة", "تيارت", "غليزان", "الشلف", "عين الدفلى", "ميلة",
  "خنشلة", "أم البواقي", "سوق أهراس", "المسيلة", "المسيلة", "الوادي", "ورقلة",
  "غرداية", "بشار", "أدرار", "تمنراست", "إليزي",
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    location: "",
    experience: "",
    bio: "",
    phone: "",
  });

  const f = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const typeCards = [
    { type: "journalist" as UserType, label: "صحفي / إعلامي", icon: BookOpen, desc: "تقرير، مراسل، محرر، مذيع" },
    { type: "voice" as UserType, label: "منشط صوتي", icon: Mic, desc: "تعليق، إذاعة، بودكاست، دبلجة" },
    { type: "vendor" as UserType, label: "بائع عتاد", icon: ShoppingCart, desc: "معدات إعلام، كاميرات، صوتيات" },
  ];

  const handleRegister = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("يرجى ملء جميع الحقول الإلزامية");
      return;
    }
    if (form.password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }
    if (!userType) return;

    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await saveUserProfile(cred.user.uid, {
        email: form.email,
        name: form.name,
        type: userType,
        bio: form.bio,
        specialty: form.specialty || undefined,
        location: form.location || undefined,
        phone: form.phone || undefined,
        experience: form.experience || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/email-already-in-use") {
        setError("البريد الإلكتروني مستخدم بالفعل");
      } else if (e.code === "auth/invalid-email") {
        setError("البريد الإلكتروني غير صالح");
      } else {
        setError("حدث خطأ. يرجى المحاولة مجدداً.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" dir="rtl" style={{ background: "#0b0f0b" }}>
        <div
          className="w-full max-w-md text-center p-8 rounded-2xl animate-fade-in-up"
          style={{
            background: "linear-gradient(145deg, #0f1a0f, #0b150b)",
            border: "1px solid rgba(0,163,85,0.35)",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,98,51,0.2)", border: "2px solid rgba(0,163,85,0.5)" }}
          >
            <Check size={36} style={{ color: "#00a355" }} />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#e8f5e9" }}>تم التسجيل بنجاح!</h2>
          <p style={{ color: "#6aad6a", lineHeight: 1.7 }}>
            ملفك قيد المراجعة. سيتم إشعارك عند الموافقة.
          </p>
          <p style={{ color: "#3a5e3a", fontSize: "0.85rem", marginTop: "1rem" }}>
            سيتم تحويلك لصفحة تسجيل الدخول خلال ثوانٍ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ background: "#0b0f0b" }}>
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,98,51,0.12) 0%, transparent 60%)" }}
      />

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <Link to="/" className="inline-flex items-center gap-2" style={{ textDecoration: "none" }}>
            <div
              className="p-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg, #006233, #008545)", boxShadow: "0 0 16px rgba(0,98,51,0.4)" }}
            >
              <Radio size={22} color="#fff" />
            </div>
            <span
              className="text-3xl font-bold"
              style={{
                background: "linear-gradient(90deg, #00a355, #4caf50)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              سند
            </span>
          </Link>
          <p className="mt-2" style={{ color: "#4a7a4a", fontSize: "0.875rem" }}>إنشاء حساب جديد</p>
        </div>

        <div
          className="rounded-2xl overflow-hidden animate-fade-in-up"
          style={{
            background: "linear-gradient(145deg, #0f1a0f, #0b150b)",
            border: "1px solid rgba(0,98,51,0.25)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            animationDelay: "0.1s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          {/* Step indicators */}
          <div
            className="flex items-center gap-4 px-6 pt-6 pb-5"
            style={{ borderBottom: "1px solid rgba(0,98,51,0.15)" }}
          >
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={{
                    background: step >= s ? "linear-gradient(135deg, #006233, #00a355)" : "rgba(0,98,51,0.15)",
                    color: step >= s ? "#fff" : "#3a5e3a",
                    border: step >= s ? "none" : "1px solid rgba(0,98,51,0.2)",
                  }}
                >
                  {step > s ? <Check size={14} /> : s}
                </div>
                <span style={{ color: step >= s ? "#81c784" : "#3a5e3a", fontSize: "0.8rem" }}>
                  {s === 1 ? "نوع الحساب" : "البيانات الشخصية"}
                </span>
                {s < 2 && <div className="w-8 h-px mx-1" style={{ background: step > s ? "#006233" : "rgba(0,98,51,0.2)" }} />}
              </div>
            ))}
          </div>

          <div className="p-6">
            {/* STEP 1: Choose user type */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: "#e8f5e9" }}>
                  اختر نوع حسابك
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {typeCards.map(({ type, label, icon: Icon, desc }) => (
                    <button
                      key={type}
                      onClick={() => setUserType(type)}
                      className="p-5 rounded-xl text-right transition-all duration-200"
                      style={{
                        background: userType === type
                          ? "linear-gradient(145deg, rgba(0,98,51,0.25), rgba(0,133,69,0.15))"
                          : "rgba(0,0,0,0.2)",
                        border: userType === type
                          ? "2px solid rgba(0,163,85,0.6)"
                          : "1px solid rgba(0,98,51,0.2)",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-200"
                        style={{
                          background: userType === type ? "rgba(0,163,85,0.25)" : "rgba(0,98,51,0.15)",
                          border: `1px solid ${userType === type ? "rgba(0,163,85,0.5)" : "rgba(0,98,51,0.3)"}`,
                        }}
                      >
                        <Icon size={22} style={{ color: userType === type ? "#00a355" : "#4a7a4a" }} />
                      </div>
                      <div className="font-semibold mb-1" style={{ color: userType === type ? "#c8e6c9" : "#6aad6a", fontSize: "0.95rem" }}>
                        {label}
                      </div>
                      <div style={{ color: "#3a5e3a", fontSize: "0.75rem" }}>{desc}</div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <Link to="/login" style={{ color: "#4a7a4a", fontSize: "0.875rem", textDecoration: "none" }}>
                    لديك حساب؟ سجل دخول
                  </Link>
                  <button
                    onClick={() => userType && setStep(2)}
                    disabled={!userType}
                    className="btn-dz px-6 py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center gap-2"
                  >
                    <span>التالي</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Fill profile data */}
            {step === 2 && userType && (
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: "#e8f5e9" }}>البيانات الشخصية</h2>

                {error && (
                  <div
                    className="mb-4 p-3 rounded-lg text-sm"
                    style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)", color: "#f87171" }}
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Common fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>الاسم الكامل *</label>
                      <input
                        type="text"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.name}
                        onChange={(e) => f("name", e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>البريد الإلكتروني *</label>
                      <input
                        type="email"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.email}
                        onChange={(e) => f("email", e.target.value)}
                        placeholder="example@email.com"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>كلمة المرور *</label>
                      <input
                        type="password"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.password}
                        onChange={(e) => f("password", e.target.value)}
                        placeholder="6 أحرف على الأقل"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>تأكيد كلمة المرور *</label>
                      <input
                        type="password"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.confirmPassword}
                        onChange={(e) => f("confirmPassword", e.target.value)}
                        placeholder="أعد إدخال كلمة المرور"
                      />
                    </div>
                  </div>

                  {/* Journalist-specific */}
                  {userType === "journalist" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>التخصص</label>
                        <select className="select-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.specialty} onChange={(e) => f("specialty", e.target.value)}>
                          <option value="">اختر التخصص</option>
                          <option value="تلفزيون">تلفزيون</option>
                          <option value="إذاعة">إذاعة</option>
                          <option value="صحافة مكتوبة">صحافة مكتوبة</option>
                          <option value="رقمي">رقمي</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>الولاية</label>
                        <select className="select-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.location} onChange={(e) => f("location", e.target.value)}>
                          <option value="">اختر الولاية</option>
                          {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>سنوات الخبرة</label>
                        <input type="text" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.experience} onChange={(e) => f("experience", e.target.value)} placeholder="مثال: 5 سنوات" />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>رقم الهاتف</label>
                        <input type="tel" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="05xxxxxxxx" dir="ltr" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>نبذة مختصرة</label>
                        <textarea className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" style={{ minHeight: "80px", resize: "vertical" }} value={form.bio} onChange={(e) => f("bio", e.target.value)} placeholder="اكتب نبذة عنك وعن تجربتك المهنية" />
                      </div>
                    </div>
                  )}

                  {/* Voice-specific */}
                  {userType === "voice" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>التخصص</label>
                        <select className="select-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.specialty} onChange={(e) => f("specialty", e.target.value)}>
                          <option value="">اختر التخصص</option>
                          <option value="إذاعي">إذاعي</option>
                          <option value="تلفزيوني">تلفزيوني</option>
                          <option value="بودكاست">بودكاست</option>
                          <option value="تعليق صوتي">تعليق صوتي</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>الولاية</label>
                        <select className="select-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.location} onChange={(e) => f("location", e.target.value)}>
                          <option value="">اختر الولاية</option>
                          {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>سنوات الخبرة</label>
                        <input type="text" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.experience} onChange={(e) => f("experience", e.target.value)} placeholder="مثال: 3 سنوات" />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>رقم الهاتف</label>
                        <input type="tel" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="05xxxxxxxx" dir="ltr" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>نبذة</label>
                        <textarea className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" style={{ minHeight: "80px", resize: "vertical" }} value={form.bio} onChange={(e) => f("bio", e.target.value)} placeholder="صف صوتك وخبراتك الصوتية" />
                      </div>
                    </div>
                  )}

                  {/* Vendor-specific */}
                  {userType === "vendor" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>اسم المتجر *</label>
                        <input type="text" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.bio} onChange={(e) => f("bio", e.target.value)} placeholder="اسم متجرك" />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>الولاية</label>
                        <select className="select-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.location} onChange={(e) => f("location", e.target.value)}>
                          <option value="">اختر الولاية</option>
                          {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>رقم الهاتف</label>
                        <input type="tel" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="05xxxxxxxx" dir="ltr" />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>وصف المتجر</label>
                        <input type="text" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.specialty} onChange={(e) => f("specialty", e.target.value)} placeholder="ما الذي تبيعه؟" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => { setStep(1); setError(""); }}
                    style={{ color: "#4a7a4a", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer" }}
                  >
                    رجوع
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={saving}
                    className="btn-dz px-8 py-2.5 rounded-xl text-sm disabled:opacity-50"
                  >
                    <span>{saving ? "جاري التسجيل..." : "إنشاء الحساب"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
