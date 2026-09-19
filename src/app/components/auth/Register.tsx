import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Plus, Trash2, User, Store, GraduationCap } from "lucide-react";
import { createUserWithEmailAndPassword, deleteUser, signOut } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { saveUserProfile, sendNotification } from "../../../lib/firestore";
import { uploadProfilePhoto } from "../../../lib/storage";
import type { AccountType, PortfolioLink } from "../../../lib/types";
import { INTERESTS } from "../../../lib/types";

import { WILAYAS } from "../../../lib/wilayas";
import { usePageTitle } from "../../../lib/usePageTitle";
const wilayas = WILAYAS;

type MainType = "individual" | "store" | "trainer" | null;
type IndividualSubType = "editor_news" | "web_digital" | "presenter_programs" | "presenter_news" | "monteur" | "graphic_designer" | "cameraman" | "producer" | "director" | "program_writer" | "voice" | "host_stage" | "student" | "other" | null;
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
  organization: string;
  trainerSpecialty: string;
}

interface NewLink {
  label: string;
  url: string;
}

const individualSubcategories: { type: IndividualSubType; label: string }[] = [
  { type: "editor_news",        label: "محرر" },
  { type: "web_digital",        label: "ويب ديجيتال" },
  { type: "presenter_programs", label: "مقدم برامج" },
  { type: "presenter_news",     label: "مقدم أخبار" },
  { type: "monteur",            label: "مونتير" },
  { type: "graphic_designer",   label: "جرافيك ديزاينر" },
  { type: "cameraman",          label: "كاميرا مان" },
  { type: "producer",           label: "منتج" },
  { type: "director",           label: "مخرج" },
  { type: "program_writer",     label: "معد برامج" },
  { type: "voice",              label: "معلق صوتي" },
  { type: "host_stage",         label: "منشط على الركح" },
  { type: "student",            label: "طالب إعلام" },
  { type: "other",              label: "أخرى" },
];

export default function Register() {
  usePageTitle("إنشاء حساب", "أنشئ حسابك على منصة سند الإعلامية وانضم إلى دليل المحترفين والمتاجر ومراكز التدريب في الجزائر.", { noindex: false });
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
  const [interests, setInterests] = useState<string[]>([]);
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "taken" | "ok">("idle");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    organization: "",
    trainerSpecialty: "",
  });

  const f = (key: keyof FormState, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  useEffect(() => {
    // Format only. Whether the address is already registered is answered
    // authoritatively by createUserWithEmailAndPassword at submit time.
    setEmailStatus(/^\S+@\S+\.\S+$/.test(form.email) ? "ok" : "idle");
  }, [form.email]);

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

  const canProceedStep1 = mainType === "individual" ? !!individualSubType : mainType === "store" ? !!form.storePlan : !!mainType;

  const hasLength = form.password.length >= 8;
  const hasLettersAndNumbers = /[a-zA-Zأ-ي]/.test(form.password) && /[0-9]/.test(form.password);
  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const passwordValid = hasLength && hasLettersAndNumbers && passwordsMatch;

  const goToStep3 = () => {
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("يرجى ملء جميع الحقول الإلزامية");
      return;
    }
    if (emailStatus === "taken") {
      setError("البريد الإلكتروني مستخدم بالفعل، جرّب بريداً آخر");
      return;
    }
    if (!passwordValid) {
      setError("يرجى التحقق من شروط كلمة المرور");
      return;
    }
    setStep(3);
  };

  const handleRegister = async () => {
    setError("");
    if (!form.location) {
      setError("يرجى اختيار الولاية");
      return;
    }
    if (mainType === "store" && !form.storeName.trim()) {
      setError("يرجى إدخال اسم المتجر");
      return;
    }
    if (mainType === "trainer" && !form.name.trim()) {
      setError("يرجى إدخال اسمك أو اسم مركز التدريب");
      return;
    }
    if (!acceptedTerms) {
      setError("يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية");
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
        mainType === "store" ? "store" : mainType === "trainer" ? "trainer" : (individualSubType as AccountType);

      const baseProfile = {
        email: form.email,
        name: mainType === "store" ? form.storeName : form.name,
        type: accountType,
        bio: mainType === "store" ? form.storeDescription : form.bio,
        photo: photoUrl,
        specialty: mainType === "trainer" ? (form.trainerSpecialty || undefined) : (form.specialty || undefined),
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
          interests: interests.length > 0 ? interests : undefined,
        });
      } else if (mainType === "trainer") {
        await saveUserProfile(uid, {
          ...baseProfile,
          organization: form.organization || undefined,
          whatsapp: form.whatsapp || undefined,
        });
      } else {
        await saveUserProfile(uid, {
          ...baseProfile,
          storeStatus: form.storePlan as "trial" | "paid",
          whatsapp: form.whatsapp || undefined,
        });
      }

      // Notify admin of new registration
      const typeLabel = mainType === "store" ? "متجر عتاد" : mainType === "trainer" ? "مدرب / مركز تدريب" : "محترف إعلامي";
      await sendNotification({
        title: "مستخدم جديد 🎉",
        body: `${form.name} سجّل في المنصة كـ ${typeLabel}`,
        link: "/sanad-admin",
        createdAt: Date.now(),
      }, undefined, "admin").catch(() => {});

      // No verification email: every profile is reviewed by hand before it
      // goes live, so the address is checked by a person either way. Firebase's
      // verification page is an English page on a firebaseapp.com domain, and
      // it lands in spam often enough that it mostly served to strand people
      // who had in fact registered correctly. Nothing ever gated on
      // emailVerified, so the mail was a dead end even when it arrived.

      // createUserWithEmailAndPassword signs the new account in. Sending them
      // to /login while still authenticated left the header showing them as
      // logged in on a login page.
      await signOut(auth).catch(() => {});

      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 4000);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/email-already-in-use") {
        setError("البريد الإلكتروني مستخدم بالفعل، جرّب تسجيل الدخول أو استعادة كلمة المرور");
      } else if (e.code === "auth/invalid-email") {
        setError("البريد الإلكتروني غير صالح");
      } else if (e.code === "auth/weak-password") {
        setError("كلمة المرور ضعيفة جداً، اختر كلمة أقوى");
      } else if (e.code === "auth/network-request-failed") {
        setError("تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مجدداً.");
      } else if (e.code === "auth/too-many-requests") {
        setError("محاولات كثيرة جداً. انتظر قليلاً ثم حاول مرة أخرى.");
      } else {
        if (createdUser) {
          await deleteUser(createdUser).catch(() => {});
        }
        // Never surface the raw Firebase message — it is English and internal.
        console.error("Registration failed:", e);
        setError("حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مجدداً.");
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
            ملفك الآن قيد المراجعة، وسيتم إشعارك فور الموافقة عليه.
          </p>
          <p style={{ color: "var(--theme-text-secondary, #6aad6a)", lineHeight: 1.7, marginTop: "0.5rem" }}>
            يمكنك تسجيل الدخول إلى حسابك من الآن.
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
            <img
              src="/logo.png"
              alt="سند — المنصة الجزائرية الإعلامية الشاملة"
              width={160}
              height={44}
              className="h-11 w-auto"
            />
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

                  {/* Trainer card */}
                  <button
                    onClick={() => { setMainType("trainer"); setIndividualSubType(null); }}
                    className="p-5 rounded-xl text-right transition-all duration-200"
                    style={{
                      background: mainType === "trainer" ? "linear-gradient(145deg, var(--p-25), rgba(0,133,69,0.15))" : "rgba(0,0,0,0.2)",
                      border: mainType === "trainer" ? "2px solid var(--p-60)" : "1px solid var(--p-20)",
                      cursor: "pointer",
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: mainType === "trainer" ? "rgba(0,163,85,0.25)" : "var(--p-15)", border: `1px solid ${mainType === "trainer" ? "var(--p-40)" : "var(--p-30)"}` }}>
                      <GraduationCap size={22} style={{ color: mainType === "trainer" ? "var(--theme-accent, #00a355)" : "var(--theme-text-muted, #4a7a4a)" }} />
                    </div>
                    <div className="font-semibold mb-1" style={{ color: mainType === "trainer" ? "var(--theme-text, #c8e6c9)" : "var(--theme-text-secondary, #6aad6a)", fontSize: "0.95rem" }}>
                      مدرب / مركز تدريب
                    </div>
                    <div style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.78rem" }}>دورات تدريبية في مجال الإعلام</div>
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
                    disabled={!canProceedStep1}
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
                    <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-1-17e7c5">الاسم الكامل *</label>
                    <input id="register-1-17e7c5"
                      type="text"
                      className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                      value={form.name}
                      onChange={(e) => f("name", e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-2-efaa14">البريد الإلكتروني *</label>
                    <input id="register-2-efaa14"
                      type="email"
                      className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                      value={form.email}
                      onChange={(e) => f("email", e.target.value)}
                      placeholder="example@email.com"
                      dir="ltr"
                      style={{ borderColor: emailStatus === "taken" ? "#ef4444" : emailStatus === "ok" ? "#4ade80" : undefined }}
                    />
                    {form.email.length > 0 && emailStatus === "idle" && (
                      <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>صيغة البريد الإلكتروني غير صحيحة</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-3-c2d705">كلمة المرور *</label>
                    <input id="register-3-c2d705"
                      type="password"
                      className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                      value={form.password}
                      onChange={(e) => f("password", e.target.value)}
                      placeholder="8 أحرف على الأقل (حروف وأرقام)"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-4-8ad818">تأكيد كلمة المرور *</label>
                    <input id="register-4-8ad818"
                      type="password"
                      className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                      value={form.confirmPassword}
                      onChange={(e) => f("confirmPassword", e.target.value)}
                      placeholder="أعد إدخال كلمة المرور"
                    />
                  </div>
                </div>

                {/* Password validation checklist */}
                {form.password.length > 0 && (
                  <div className="mt-3 p-4 rounded-xl" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--p-20)" }}>
                    <p className="text-sm font-semibold mb-3" style={{ color: "var(--theme-text-secondary, #a5d6a7)" }}>يجب أن تحتوي كلمة المرور على:</p>
                    <div className="space-y-2">
                      {([
                        [hasLength, "8 أحرف على الأقل"],
                        [hasLettersAndNumbers, "أحرف وأرقام معاً"],
                        [passwordsMatch, "كلمتا المرور متطابقتان"],
                      ] as const).map(([valid, label], i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check size={16} style={{ color: valid ? "#4ade80" : "var(--theme-text-dim, #3a5e3a)", flexShrink: 0 }} />
                          <span style={{ color: valid ? "#4ade80" : "var(--theme-text-dim, #3a5e3a)", fontSize: "0.85rem" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                      <span className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>صورة شخصية</span>
                      <div className="flex items-center gap-4">
                        {photoPreview ? (
                          <img loading="lazy" decoding="async"
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
                        <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-5-b96510">التخصص</label>
                        <input id="register-5-b96510"
                          type="text"
                          className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                          value={form.specialty}
                          onChange={(e) => f("specialty", e.target.value)}
                          placeholder="مثال: تلفزيون، إذاعة..."
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-6-0ca4c7">الولاية *</label>
                        <select id="register-6-0ca4c7"
                          className="select-dz w-full px-4 py-2.5 rounded-lg text-sm"
                          value={form.location}
                          onChange={(e) => f("location", e.target.value)}
                          style={{ borderColor: !form.location ? "rgba(239,68,68,0.4)" : undefined }}
                        >
                          <option value="">اختر الولاية (إلزامي)</option>
                          {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-7-ad1f30">رقم الهاتف</label>
                        <input id="register-7-ad1f30"
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
                          <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-8-f0a06d">سنوات الخبرة</label>
                          <input id="register-8-f0a06d"
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
                        <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-9-e77f38">اذكر تخصصك</label>
                        <input id="register-9-e77f38"
                          type="text"
                          className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                          value={form.otherTypeText}
                          onChange={(e) => f("otherTypeText", e.target.value)}
                          placeholder="صف تخصصك"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-10-86bedc">نبذة / السيرة الذاتية</label>
                      <textarea id="register-10-86bedc"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        style={{ minHeight: "80px", resize: "vertical" }}
                        value={form.bio}
                        onChange={(e) => f("bio", e.target.value)}
                        placeholder="اكتب نبذة عنك وعن تجربتك المهنية"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-11-c12299">أبرز الإنجازات</label>
                      <textarea id="register-11-c12299"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        style={{ minHeight: "80px", resize: "vertical" }}
                        value={form.achievements}
                        onChange={(e) => f("achievements", e.target.value)}
                        placeholder="اذكر أبرز إنجازاتك ومحطاتك المهنية"
                      />
                    </div>

                    {/* Interests */}
                    <div>
                      <span className="block mb-2 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>الاهتمامات (يمكن تحديد أكثر من خيار)</span>
                      <div className="flex flex-wrap gap-2">
                        {INTERESTS.map((interest) => (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => setInterests((prev) => prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest])}
                            className="px-4 py-1.5 rounded-full text-sm transition-all duration-200"
                            style={{
                              background: interests.includes(interest) ? "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))" : "var(--p-12)",
                              border: interests.includes(interest) ? "1px solid var(--p-60)" : "1px solid var(--p-30)",
                              color: interests.includes(interest) ? "#fff" : "var(--theme-text-secondary, #6aad6a)",
                              cursor: "pointer",
                            }}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Portfolio links */}
                    <div>
                      <span className="block mb-2 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>روابط البورتفوليو</span>
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
                            <label className="block mb-1 text-xs" style={{ color: "var(--theme-text-secondary, #6aad6a)" }} htmlFor="register-12-bc79a7">التسمية</label>
                            <input id="register-12-bc79a7"
                              type="text"
                              className="input-dz w-full px-3 py-2 rounded-lg text-sm"
                              placeholder="مثال: موقعي الشخصي"
                              value={newLink.label}
                              onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs" style={{ color: "var(--theme-text-secondary, #6aad6a)" }} htmlFor="register-13-cab21b">الرابط</label>
                            <input id="register-13-cab21b"
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
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-14-a7bef9">اسم المتجر *</label>
                      <input id="register-14-a7bef9"
                        type="text"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.storeName}
                        onChange={(e) => f("storeName", e.target.value)}
                        placeholder="أدخل اسم متجرك"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-15-741341">نوع المعدات</label>
                      <input id="register-15-741341"
                        type="text"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.specialty}
                        onChange={(e) => f("specialty", e.target.value)}
                        placeholder="مثال: كاميرات، معدات صوت..."
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-16-94e66e">الولاية *</label>
                      <select id="register-16-94e66e"
                        className="select-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.location}
                        onChange={(e) => f("location", e.target.value)}
                        style={{ borderColor: !form.location ? "rgba(239,68,68,0.4)" : undefined }}
                      >
                        <option value="">اختر الولاية (إلزامي)</option>
                        {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-17-c1a43b">رقم الهاتف</label>
                      <input id="register-17-c1a43b"
                        type="tel"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.phone}
                        onChange={(e) => f("phone", e.target.value)}
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-18-555d56">واتساب</label>
                      <input id="register-18-555d56"
                        type="tel"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        value={form.whatsapp}
                        onChange={(e) => f("whatsapp", e.target.value)}
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-19-fb1f16">وصف المتجر</label>
                      <textarea id="register-19-fb1f16"
                        className="input-dz w-full px-4 py-2.5 rounded-lg text-sm"
                        style={{ minHeight: "80px", resize: "vertical" }}
                        value={form.storeDescription}
                        onChange={(e) => f("storeDescription", e.target.value)}
                        placeholder="صف متجرك والمنتجات التي تقدمها"
                      />
                    </div>
                  </div>
                )}

                {/* Trainer profile fields */}
                {mainType === "trainer" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-20-0bd9f0">اسمك أو اسم مركز التدريب *</label>
                      <input id="register-20-0bd9f0" type="text" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="مثال: مركز سند للتدريب" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-21-5e954a">اسم المؤسسة / المركز</label>
                      <input id="register-21-5e954a" type="text" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.organization} onChange={(e) => f("organization", e.target.value)} placeholder="إذا كنت تمثل مركز تدريب (اختياري)" />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-22-978a25">مجال التدريب</label>
                      <input id="register-22-978a25" type="text" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.trainerSpecialty} onChange={(e) => f("trainerSpecialty", e.target.value)} placeholder="مثال: تصوير، صحافة، إنتاج..." />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-23-da0a6b">الولاية *</label>
                      <select id="register-23-da0a6b" className="select-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.location} onChange={(e) => f("location", e.target.value)} style={{ borderColor: !form.location ? "rgba(239,68,68,0.4)" : undefined }}>
                        <option value="">اختر الولاية (إلزامي)</option>
                        {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-24-266756">رقم الهاتف</label>
                      <input id="register-24-266756" type="tel" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="05xxxxxxxx" dir="ltr" />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-25-409822">واتساب</label>
                      <input id="register-25-409822" type="tel" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" value={form.whatsapp} onChange={(e) => f("whatsapp", e.target.value)} placeholder="05xxxxxxxx" dir="ltr" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="register-26-efd1ca">نبذة تعريفية</label>
                      <textarea id="register-26-efd1ca" className="input-dz w-full px-4 py-2.5 rounded-lg text-sm" style={{ minHeight: "80px", resize: "vertical" }} value={form.bio} onChange={(e) => f("bio", e.target.value)} placeholder="اشرح خبرتك وما الذي تقدمه من تدريب" />
                    </div>
                  </div>
                )}

                {/* Consent. An approved profile's phone and email become
                    publicly visible in the directory — the old flow never said
                    so, and never asked for agreement to the terms at all. */}
                <label
                  className="flex items-start gap-3 mt-6 p-3 rounded-xl cursor-pointer"
                  style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${acceptedTerms ? "var(--p-35)" : "var(--p-20)"}` }}
                >
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    style={{ marginTop: "0.2rem", width: 16, height: 16, accentColor: "var(--theme-accent, #00a355)", flexShrink: 0 }}
                  />
                  <span style={{ color: "var(--theme-text-secondary, #a5d6a7)", fontSize: "0.82rem", lineHeight: 1.8 }}>
                    أوافق على{" "}
                    <Link to="/terms" target="_blank" style={{ color: "var(--theme-accent, #00a355)" }}>شروط الاستخدام</Link>
                    {" "}و{" "}
                    <Link to="/privacy" target="_blank" style={{ color: "var(--theme-accent, #00a355)" }}>سياسة الخصوصية</Link>،
                    وأعلم أنه بعد اعتماد ملفي ستظهر بياناتي — بما فيها البريد الإلكتروني ورقم الهاتف — للعموم في دليل المنصة.
                  </span>
                </label>

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
                      disabled={saving || !acceptedTerms}
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
