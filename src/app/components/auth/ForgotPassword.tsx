import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle, MessageCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { usePageTitle } from "../../../lib/usePageTitle";

export default function ForgotPassword() {
  usePageTitle("استعادة كلمة المرور", "استعد كلمة مرور حسابك على منصة سند الإعلامية.", { noindex: true });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("يرجى إدخال بريدك الإلكتروني"); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-email") {
        setError("البريد الإلكتروني غير موجود في النظام");
      } else {
        setError("حدث خطأ. يرجى المحاولة مجدداً.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl" style={{ background: "#0e0e0e" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -10%, var(--p-12) 0%, transparent 60%)" }} />

      <div className="w-full max-w-md relative z-10">
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
          <p className="mt-2" style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem" }}>استعادة كلمة المرور</p>
        </div>

        <div className="rounded-2xl p-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>

          {sent ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <CheckCircle size={52} style={{ color: "var(--theme-accent, #00a355)" }} />
              </div>
              <h2 className="text-xl font-bold mb-3" style={{ color: "var(--theme-text, #e8f5e9)" }}>تم الإرسال بنجاح</h2>
              <p className="text-sm mb-6" style={{ color: "var(--theme-text-muted, #4a7a4a)", lineHeight: 1.7 }}>
                تم إرسال رابط إعادة تعيين كلمة المرور إلى <span style={{ color: "var(--theme-accent)" }}>{email}</span>. تحقق من صندوق البريد الوارد (أو البريد غير الهام).
              </p>
              <Link to="/login" className="btn-dz inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium" style={{ textDecoration: "none" }}>
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>نسيت كلمة المرور؟</h2>
              <p className="text-sm mb-6" style={{ color: "var(--theme-text-muted, #4a7a4a)", lineHeight: 1.6 }}>
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
              </p>

              {error && (
                <div className="mb-5 p-3 rounded-lg text-sm" style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)", color: "#f87171" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--theme-text-muted)" }} />
                    <input
                      id="reset-email"
                      type="email"
                      className="input-dz w-full pr-10 pl-4 py-3 rounded-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      dir="ltr"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-dz w-full py-3 rounded-xl font-medium disabled:opacity-50">
                  {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
                </button>
              </form>

              {/* Many members registered with an address they never read, so
                  the emailed link is a dead end for them. The admin reviews
                  every profile by hand and can issue a new password directly,
                  which is what this points them to. */}
              <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--p-15)" }}>
                <p className="text-sm mb-3" style={{ color: "var(--theme-text-muted, #4a7a4a)", lineHeight: 1.7 }}>
                  لا تستطيع الوصول إلى بريدك الإلكتروني؟ راسلنا على صفحتنا وسنعيد لك حسابك.
                </p>
                <a
                  href="https://www.facebook.com/profile.php?id=61590628561028"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm w-full justify-center"
                  style={{ background: "var(--p-12)", border: "1px solid var(--p-25)", color: "var(--theme-text-secondary, #6aad6a)", textDecoration: "none" }}
                >
                  <MessageCircle size={15} />
                  تواصل معنا عبر فيسبوك
                </a>
              </div>

              <div className="mt-5 text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)", textDecoration: "none" }}>
                  <ArrowRight size={14} />
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
