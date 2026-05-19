import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, ArrowRight, ArrowLeft, Check, Plus, Trash2, User, Store } from "lucide-react";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { saveUserProfile } from "../../../lib/firestore";
import { uploadProfilePhoto } from "../../../lib/storage";
import type { AccountType, PortfolioLink } from "../../../lib/types";

const wilayas = [
  "الجزائر", "وهران", "قسنطينة", "عنابة", "سطيف", "تيزي وزو", "البليدة", "بجاية",
  "تلمسان", "باتنة", "بسكرة", "سكيكدة", "جيجل", "برج بوعريريج", "المدية", "تبسة",
  "مستغانم", "معسكر", "سعيدة", "تيارت", "غليزان", "الشلف", "عين الدفلى", "ميلة",
  "خنشلة", "أم البواقي", "سوق أهراس", "المسيلة", "الوادي", "ورقلة",
  "غرداية", "بشار", "أدرار", "تمنراست", "إليزي",
];

type MainType = "individual" | "store" | null;
type IndividualSubType = "student" | "journalist" | "voice" | "photographer" | "editor" | "other" | null;
type StorePlan = "trial" | "paid" | null;

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialty: string;
  location: string;
  experience: string;
  bio: string;
  phone: string;
  achievements: string;
  storeName: string;
  storeDescription: string;
  whatsapp: string;
  otherTypeText: string;
  storePlan: StorePlan;
}

interface NewLink {
  label: string;
  url: string;
}

const individualSubcategories: { type: IndividualSubType; label: string }[] = [
  { type: "student", label: "طالب إعلام" },
  { type: "journalist", label: "صحفي / مراسل" },
  { type: "voice", label: "منشط / معلق صوتي" },
  { type: "photographer", label: "مصور فوتوغرافي / فيديو" },
  { type: "editor", label: "مخرج / مونتير" },
  { type: "other", label: "أخرى" },
];

export default function Register() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mainType, setMainType] = useState<MainType>(null);
  const [individualSubType, setIndividualSubType] = useState<IndividualSubType>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState<NewLink>({ label: "", url: "" });

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    location: "",
    experience: "",
    bio: "",
    phone: "",
    achievements: "",
    storeName: "",
    storeDescription: "",
    whatsapp: "",
    otherTypeText: "",
    storePlan: null,
  });

  const f = (key: keyof FormState, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddLink = () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    setPortfolioLinks((prev) => [...prev, { label: newLink.label.trim(), url: newLink.url.trim() }]);
    setNewLink({ label: "", url: "" });
    setShowAddLink(false);
  };

  const handleDeleteLink = (idx: number) => {
    setPortfolioLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const goToStep2 = () => {
    if (!mainType) return;
    if (mainType === "individual" && !individualSubType) return;
    if (mainType === "store" && !form.storePlan) return;
    setStep(2);
  };

  const goToStep3 = () => {
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
    setStep(3);
  };

  const handleRegister = async () => {
    setError("");
    if (mainType === "store" && !form.storeName.trim()) {
      setError("يرجى إدخال اسم المتجر");
      return;
    }

    setSaving(true);
    let createdUser = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      createdUser = cred.user;
      const uid = cred.user.uid;

      // Photo upload is best-effort — don't block registration if it fails
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadProfilePhoto(uid, photoFile, setUploadProgress).catch((e) => {
          console.error("Photo upload failed:", e?.message);
          return undefined;
        });
      }

      const accountType: AccountType =
        mainType === "store" ? "store" : (individualSubType as AccountType);

      const baseProfile = {
        email: form.email,
        name: form.name,
        type: accountType,
        bio: mainType === "store" ? form.storeDescription : form.bio,
        photo: photoUrl,
        specialty: form.specialty || undefined,
        location: form.location || undefined,
        phone: form.phone || undefined,
      };

      if (mainType === "individual") {
        await saveUserProfile(uid, {
          ...baseProfile,
          achievements: form.achievements || undefined,
          portfolio: portfolioLinks.length > 0 ? portfolioLinks : undefined,
          experience: individualSubType !== "student" ? (form.experience || undefined) : undefined,
          otherType: individualSubType === "other" ? form.otherTypeText || undefined : undefined,
        });
      } else {
        await saveUserProfile(uid, {
          ...baseProfile,
          storeStatus: form.storePlan as "trial" | "paid",
          whatsapp: form.whatsapp || undefined,
        });
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/email-already-in-use") {
        setError("البريد الإلكتروني مستخدم بالفعل");
      } else if (e.code === "auth/invalid-email") {
        setError("البريد الإلكتروني غير صالح");
      } else {
        if (createdUser) {
          await deleteUser(createdUser).catch(() => {});
        }
        setError(e.message ?? "حدث خطأ. يرجى المحاولة مجدداً.");
      }
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = ["نوع الحساب", "المعلومات الأساسية", "تفاصيل الملف"];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" dir="rtl" style={{ background: "#0e0e0e" }}>
        <div
          className="w-full max-w-md text-center p-8 rounded-2xl animate-fade-in-up"
          style={{
            background: "linear-gradient(145deg, #141414, #101010)",
            border: "1px solid var(--p-35)",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--p-20)", border: "2px solid var(--p-40)" }}
          >
            <Check size={36} style={{ color: "var(--theme-accent, #00a355)" }} />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--theme-text, #e8f5e9)" }}>تم التسجيل بنجاح!</h2>
          <p style={{ color: "var(--theme-text-secondary, #6aad6a)", lineHeight: 1.7 }}>
            ملفك قيد المراجعة. سيتم إشعارك عند الموافقة.
          </p>
          <p style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.85rem", marginTop: "1rem" }}>
            سيتم تحويلك لصفحة تسجيل الدخول خلال ثوانٍ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ background: "#0e0e0e" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -10%, var(--p-12) 0%, transparent 60%)" }}
      />

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
          <Link to="/" className="inline-flex items-center gap-2" style={{ textDecoration: "none" }}>
            <div
              className="p-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg, var(--theme-primary, #006233), color-mix(in srgb, var(--theme-primary, #006233) 70%, #ffffff))", boxShadow: "0 0 16px var(--p-40)" }}
            >
              <Radio size={22} color="#fff" />
            </div>
            <span
              className="text-3xl font-bold"
              style={{
                background: "linear-gradient(90deg, var(--theme-accent, #00a355), color-mix(in srgb, var(--theme-accent, #00a355) 70%, #ffffff))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              سند
            </span>
          </Link>
          <p className="mt-2" style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem" }}>إنشاء حساب جديد</p>
        </div>

        <div
          className="rounded-2xl overflow-hidden animate-fade-in-up"
          style={{
            background: "linear-gradient(145deg, #141414, #101010)",
            border: "1px solid var(--p-25)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            animationDelay: "0.1s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          {/* Step indicators */}
          <div
            className="flex items-center gap-2 px-6 pt-6 pb-5"
            style={{ borderBottom: "1px solid var(--p-15)" }}
          >
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={{
                    background: step >= s ? "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))" : "var(--p-15)",
                    color: step >= s ? "#fff" : "var(--theme-text-dim, #3a5e3a)",
                    border: step >= s ? "none" : "1px solid var(--p-20)",
                    flexShrink: 0,
                  }}
                >
                  {step > s ? <Check size={13} /> : s}
                </div>
                <span style={{ color: step >= s ? "var(--theme-badge-text, #81c784)" : "var(--theme-text-dim, #3a5e3a)", fontSize: "0.78rem" }}>
                  {stepLabels[s - 1]}
                </span>
                {s < 3 && (
                  <div
                    className="w-6 h-px mx-1"
                    style={{ background: step > s ? "var(--theme-primary, #006233)" : "var(--p-20)", flexShrink: 0 }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="p-6">

            {/* ─── STEP 1: Account Type ─── */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: "var(--theme-text, #e8f5e9)" }}>اختر نوع حسابك</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Individual card */}
                  <button
                    onClick={() => { setMainType("individual"); setIndividualSubType(null); }}
                    className="p-5 rounded-xl text-right transition-all duration-200"
                    style={{
                      background: mainType === "individual"
                        ? "linear-gradient(145deg, var(--p-25), rgba(0,133,69,0.15))"
                        : "rgba(0,0,0,0.2)",
                      border: mainType === "individual"
                        ? "2px solid var(--p-60)"
                        : "1px solid var(--p-20)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        background: mainType === "individual" ? "rgba(0,163,85,0.25)" : "var(--p-15)",
                        border: `1px solid ${mainType === "individual" ? "var(--p-40)" : "var(--p-30)"}`,
                      }}
                    >
                      <User size={22} style={{ color: mainType === "individual" ? "var(--theme-accent, #00a355)" : "var(--theme-text-muted, #4a7a4a)" }} />
                    </div>
                    <div className="font-semibold mb-1" style={{ color: mainType === "individual" ? "var(--theme-text, #c8e6c9)" : "var(--theme-text-secondary, #6aad6a)", fontSize: "0.95rem" }}>
                      حساب فردي
                    </div>
                    <div style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.78rem" }}>صحفي، مصور، طالب، وغيرهم</div>
                  </button>

                  {/* Store card */}
                  <button
                    onClick={() => { setMainType("store"); setIndividualSubType(null); }}
                    className="p-5 rounded-xl text-right transition-all duration-200"
                    style={{
                      background: mainType === "store"
                        ? "linear-gradient(145deg, var(--p-25), rgba(0,133,69,0.15))"
                        : "rgba(0,0,0,0.2)",
                      border: mainType === "store"
                        ? "2px solid var(--p-60)"
                        : "1px solid var(--p-20)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        background: mainType === "store" ? "rgba(0,163,85,0.25)" : "var(--p-15)",
                        border: `1px solid ${mainType === "store" ? "var(--p-40)" : "var(--p-30)"}`,
                      }}
                    >
                      <Store size={22} style={{ color: mainType === "store" ? "var(--theme-accent, #00a355)" : "var(--theme-text-muted, #4a7a4a)" }} />
                    </div>
                    <div className="font-semibold mb-1" style={{ color: mainType === "store" ? "var(--theme-text, #c8e6c9)" : "var(--theme-text-secondary, #6aad6a)", fontSize: "0.95rem" }}>
                      متجر احترافي
                    </div>
                    <div style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.78rem" }}>معدات إعلام، كاميرات، صوتيات</div>
                  </button>
                </div>

                {/* Individual subcategories */}
                {mainType === "individual" && (
                  <div className="mb-6">
                    <p className="text-sm mb-3" style={{ color: "var(--theme-badge-text, #81c784)" }}>اختر تخصصك:</p>
                    <div className="flex flex-wrap gap-2">
                      {individualSubcategories.map(({ type, label }) => (
                        <button
                          key={type}
                          onClick={() => setIndividualSubType(type)}
                          className="px-4 py-1.5 rounded-full text-sm transition-all duration-200"
                          style={{
                            background: individualSubType === type
                              ? "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))"
                              : "var(--p-12)",
                            border: individualSubType === type
                              ? "1px solid var(--p-60)"
                              : "1px solid var(--p-30)",
                            color: individualSubType === type ? "#fff" : "var(--theme-text-secondary, #6aad6a)",
                            cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {individualSubType === "other" && (
                      <div className="mt-3">
                        <input
                          type="text"
                          className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                          placeholder="اذكر تخصصك"
                          value={form.otherTypeText}
                          onChange={(e) => f("otherTypeText", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Store plan options */}
                {mainType === "store" && (
                  <div className="mb-6">
                    <p className="text-sm mb-3" style={{ color: "var(--theme-badge-text, #81c784)" }}>اختر الخطة:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => setForm((p) => ({ ...p, storePlan: "trial" }))}
                        className="p-4 rounded-xl text-right transition-all duration-200"
                        style={{
                          background: form.storePlan === "trial"
                            ? "linear-gradient(145deg, var(--p-25), rgba(0,133,69,0.15))"
                            : "rgba(0,0,0,0.2)",
                          border: form.storePlan === "trial"
                            ? "2px solid var(--p-60)"
                            : "1px solid var(--p-20)",
                          cursor: "pointer",
                        }}
                      >
                        <div className="font-semibold mb-1" style={{ color: form.storePlan === "trial" ? "var(--theme-text, #c8e6c9)" : "var(--theme-text-secondary, #6aad6a)", fontSize: "0.9rem" }}>
                          تجريبي مجاني
                        </div>
                        <div style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.75rem" }}>شهر واحد</div>
                      </button>
                      <button
                        onClick={() => setForm((p) => ({ ...p, storePlan: "paid" }))}
                        className="p-4 rounded-xl text-right transition-all duration-200"
                        style={{
                          background: form.storePlan === "paid"
                            ? "linear-gradient(145deg, var(--p-25), rgba(0,133,69,0.15))"
                            : "rgba(0,0,0,0.2)",
                          border: form.storePlan === "paid"
                            ? "2px solid var(--p-60)"
                            : "1px solid var(--p-20)",
                          cursor: "pointer",
                        }}
                      >
                        <div className="font-semibold mb-1" style={{ color: form.storePlan === "paid" ? "var(--theme-text, #c8e6c9)" : "var(--theme-text-secondary, #6aad6a)", fontSize: "0.9rem" }}>
                          مدفوع
                        </div>
                        <div style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.75rem" }}>يتم التفعيل بعد التواصل معنا</div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Link to="/login" style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem", textDecoration: "none" }}>
                    لديك حساب؟ سجل دخول
                  </Link>
                  <button
                    onClick={goToStep2}
                    disabled={
                      !mainType ||
                      (mainType === "individual" && !individualSubType) ||
                      (mainType === "store" && !form.storePlan)
                    }
                    className="btn-dz px-6 py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center gap-2"
                  >
                    <span>التالي</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Basic Info ─── */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: "var(--theme-text, #e8f5e9)" }}>المعلومات الأساسية</h2>

                {error && (
                  <div
                    className="mb-4 p-3 rounded-lg text-sm"
                    style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)", color: "#f87171" }}
                  >
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>الاسم الكامل *</label>
                    <input
                      type="text"
                      className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                      value={form.name}
                      onChange={(e) => f("name", e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>البريد الإلكتروني *</label>
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
                    <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>كلمة المرور *</label>
                    <input
                      type="password"
                      className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                      value={form.password}
                      onChange={(e) => f("password", e.target.value)}
                      placeholder="6 أحرف على الأقل"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>تأكيد كلمة المرور *</label>
                    <input
                      type="password"
                      className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                      value={form.confirmPassword}
                      onChange={(e) => f("confirmPassword", e.target.value)}
                      placeholder="أعد إدخال كلمة المرور"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => { setStep(1); setError(""); }}
                    className="flex items-center gap-2"
                    style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <ArrowLeft size={15} />
                    <span>رجوع</span>
                  </button>
                  <button
                    onClick={goToStep3}
                    className="btn-dz px-6 py-2.5 rounded-xl text-sm flex items-center gap-2"
                  >
                    <span>التالي</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: Profile Details ─── */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold mb-6" style={{ color: "var(--theme-text, #e8f5e9)" }}>تفاصيل الملف الشخصي</h2>

                {error && (
                  <div
                    className="mb-4 p-3 rounded-lg text-sm"
                    style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)", color: "#f87171" }}
                  >
                    {error}
                  </div>
                )}

                {/* Individual profile fields */}
                {mainType === "individual" && (
                  <div className="space-y-4">
                    {/* Profile photo */}
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>صورة شخصية</label>
                      <div className="flex items-center gap-4">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="preview"
                            className="w-16 h-16 rounded-full object-cover"
                            style={{ border: "2px solid var(--p-40)" }}
                          />
                        ) : (
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ background: "var(--p-15)", border: "2px dashed var(--p-40)" }}
                          >
                            <User size={24} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-lg text-sm transition-all duration-200"
                          style={{
                            background: "var(--p-15)",
                            border: "1px solid var(--p-40)",
                            color: "var(--theme-text-secondary, #6aad6a)",
                            cursor: "pointer",
                          }}
                        >
                          {photoFile ? "تغيير الصورة" : "رفع صورة"}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handlePhotoChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>التخصص</label>
                        <input
                          type="text"
                          className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                          value={form.specialty}
                          onChange={(e) => f("specialty", e.target.value)}
                          placeholder="مثال: تلفزيون، إذاعة..."
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>الولاية</label>
                        <select
                          className="select-dz w-full px-4 py-2.5 rounded-lg text-sm"
                          value={form.location}
                          onChange={(e) => f("location", e.target.value)}
                        >
                          <option value="">اختر الولاية</option>
                          {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>رقم الهاتف</label>
                        <input
                          type="tel"
                          className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                          value={form.phone}
                          onChange={(e) => f("phone", e.target.value)}
                          placeholder="05xxxxxxxx"
                          dir="ltr"
                        />
                      </div>
                      {individualSubType !== "student" && (
                        <div>
                          <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>سنوات الخبرة</label>
                          <input
                            type="text"
                            className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                            value={form.experience}
                            onChange={(e) => f("experience", e.target.value)}
                            placeholder="مثال: 5 سنوات"
                          />
                        </div>
                      )}
                    </div>

                    {individualSubType === "other" && (
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>اذكر تخصصك</label>
                        <input
                          type="text"
                          className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                          value={form.otherTypeText}
                          onChange={(e) => f("otherTypeText", e.target.value)}
                          placeholder="صف تخصصك"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>نبذة / السيرة الذاتية</label>
                      <textarea
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        style={{ minHeight: "80px", resize: "vertical" }}
                        value={form.bio}
                        onChange={(e) => f("bio", e.target.value)}
                        placeholder="اكتب نبذة عنك وعن تجربتك المهنية"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>أبرز الإنجازات</label>
                      <textarea
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        style={{ minHeight: "80px", resize: "vertical" }}
                        value={form.achievements}
                        onChange={(e) => f("achievements", e.target.value)}
                        placeholder="اذكر أبرز إنجازاتك ومحطاتك المهنية"
                      />
                    </div>

                    {/* Portfolio links */}
                    <div>
                      <label className="block mb-2 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>روابط البورتفوليو</label>
                      {portfolioLinks.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {portfolioLinks.map((link, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-3 py-2 rounded-lg"
                              style={{ background: "var(--p-10)", border: "1px solid var(--p-25)" }}
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate" style={{ color: "var(--theme-text, #c8e6c9)" }}>{link.label}</span>
                                <span className="text-xs truncate" style={{ color: "var(--theme-text-muted, #4a7a4a)" }} dir="ltr">{link.url}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteLink(idx)}
                                className="mr-2 p-1 rounded transition-all duration-150"
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#6a3a3a", flexShrink: 0 }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {showAddLink ? (
                        <div
                          className="p-4 rounded-lg space-y-3"
                          style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--p-20)" }}
                        >
                          <div>
                            <label className="block mb-1 text-xs" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>التسمية</label>
                            <input
                              type="text"
                              className="input-dz w-full px-3 py-2 rounded-lg text-sm"
                              placeholder="مثال: موقعي الشخصي"
                              value={newLink.label}
                              onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>الرابط</label>
                            <input
                              type="url"
                              className="input-dz w-full px-3 py-2 rounded-lg text-sm"
                              placeholder="https://..."
                              value={newLink.url}
                              onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))}
                              dir="ltr"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleAddLink}
                              className="btn-dz px-4 py-1.5 rounded-lg text-sm"
                            >
                              إضافة
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddLink(false); setNewLink({ label: "", url: "" }); }}
                              className="px-4 py-1.5 rounded-lg text-sm"
                              style={{ background: "none", border: "1px solid var(--p-20)", color: "var(--theme-text-muted, #4a7a4a)", cursor: "pointer" }}
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddLink(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                          style={{
                            background: "var(--p-10)",
                            border: "1px dashed var(--p-40)",
                            color: "var(--theme-text-secondary, #6aad6a)",
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={15} />
                          <span>إضافة رابط</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Store profile fields */}
                {mainType === "store" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>اسم المتجر *</label>
                      <input
                        type="text"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.storeName}
                        onChange={(e) => f("storeName", e.target.value)}
                        placeholder="أدخل اسم متجرك"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>التخصص (ما تبيعه)</label>
                      <input
                        type="text"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.specialty}
                        onChange={(e) => f("specialty", e.target.value)}
                        placeholder="مثال: كاميرات، معدات صوت..."
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>الولاية</label>
                      <select
                        className="select-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.location}
                        onChange={(e) => f("location", e.target.value)}
                      >
                        <option value="">اختر الولاية</option>
                        {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>رقم الهاتف</label>
                      <input
                        type="tel"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.phone}
                        onChange={(e) => f("phone", e.target.value)}
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>واتساب</label>
                      <input
                        type="tel"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.whatsapp}
                        onChange={(e) => f("whatsapp", e.target.value)}
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>وصف المتجر</label>
                      <textarea
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        style={{ minHeight: "80px", resize: "vertical" }}
                        value={form.storeDescription}
                        onChange={(e) => f("storeDescription", e.target.value)}
                        placeholder="صف متجرك والمنتجات التي تقدمها"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => { setStep(2); setError(""); }}
                    className="flex items-center gap-2"
                    style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <ArrowLeft size={15} />
                    <span>رجوع</span>
                  </button>
                  <div className="flex flex-col items-end gap-2">
                    {saving && photoFile && uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-40">
                        <div className="flex justify-between mb-1" style={{ fontSize: "0.75rem", color: "var(--theme-badge-text, #81c784)" }}>
                          <span>رفع الصورة...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full rounded-full h-1.5" style={{ background: "var(--p-20)" }}>
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))" }}
                          />
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleRegister}
                      disabled={saving}
                      className="btn-dz px-8 py-2.5 rounded-xl text-sm disabled:opacity-50"
                    >
                      <span>{saving ? (photoFile && uploadProgress > 0 && uploadProgress < 100 ? `${uploadProgress}%` : "جاري التسجيل...") : "إنشاء الحساب"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
