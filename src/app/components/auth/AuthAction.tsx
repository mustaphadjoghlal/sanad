import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { usePageTitle } from "../../../lib/usePageTitle";

/**
 * Where Firebase's account emails land.
 *
 * By default those links go to `<project>.firebaseapp.com/__/auth/action`: an
 * English, unstyled Google page on a domain that says "sanad-dz-f14df" and
 * carries nothing of the platform. Someone who had just been told to check
 * their mail arrived at a page that looked like it belonged to no one, which
 * is the point at which people stop.
 *
 * Firebase Console > Authentication > Templates > Customize action URL points
 * the links here instead, and everything from the email onward stays on
 * sanadz.media, in Arabic, in the platform's own colours.
 *
 * The four modes Firebase can send are all handled; `resetPassword` is the
 * one in use today.
 */
export default function AuthAction() {
  usePageTitle("حسابك", "إدارة حسابك على منصة سند الإعلامية.", { noindex: true });

  const [params] = useSearchParams();
  const navigate = useNavigate();

  const mode = params.get("mode") ?? "";
  const oobCode = params.get("oobCode") ?? "";

  const [phase, setPhase] = useState<"checking" | "form" | "working" | "done" | "invalid">("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [headline, setHeadline] = useState("");
  const [detail, setDetail] = useState("");

  /**
   * An expired or already-used code is the common case — people open these
   * links hours later, or twice — so it gets a plain explanation and a way
   * to ask for a new one, not a raw Firebase error.
   */
  const failCode = useCallback(() => {
    setPhase("invalid");
    setHeadline("هذا الرابط لم يعد صالحاً");
    setDetail("قد يكون انتهت صلاحيته أو استُخدم من قبل. اطلب رابطاً جديداً وسنرسله لك فوراً.");
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!oobCode) return failCode();

      try {
        if (mode === "resetPassword") {
          const address = await verifyPasswordResetCode(auth, oobCode);
          if (cancelled) return;
          setEmail(address);
          setPhase("form");
          return;
        }

        if (mode === "verifyEmail") {
          await applyActionCode(auth, oobCode);
          if (cancelled) return;
          setHeadline("تم تأكيد بريدك الإلكتروني");
          setDetail("يمكنك الآن تسجيل الدخول إلى حسابك.");
          setPhase("done");
          return;
        }

        if (mode === "recoverEmail") {
          const info = await checkActionCode(auth, oobCode);
          await applyActionCode(auth, oobCode);
          if (cancelled) return;
          setEmail(info.data?.email ?? "");
          setHeadline("تمت استعادة بريدك الإلكتروني");
          setDetail("أُعيد بريد حسابك إلى عنوانه السابق. ننصحك بتغيير كلمة المرور الآن.");
          setPhase("done");
          return;
        }

        // Anything else (verifyAndChangeEmail, revertSecondFactorAddition, or
        // a hand-edited URL) has no screen here.
        failCode();
      } catch {
        if (!cancelled) failCode();
      }
    })();

    return () => { cancelled = true; };
  }, [mode, oobCode, failCode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setPhase("working");
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setHeadline("تم تغيير كلمة المرور");
      setDetail("يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.");
      setPhase("done");
      setTimeout(() => navigate("/login", { replace: true }), 3500);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/weak-password") {
        setError("كلمة المرور ضعيفة جداً، اختر كلمة أقوى");
        setPhase("form");
      } else if (code === "auth/network-request-failed") {
        setError("تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.");
        setPhase("form");
      } else {
        failCode();
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ background: "#0e0e0e" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -10%, var(--p-12) 0%, transparent 60%)" }}
      />

      <div className="w-full max-w-md relative z-10">
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
        </div>

        <div
          className="rounded-2xl p-8 animate-fade-in-up"
          style={{
            background: "linear-gradient(145deg, #141414, #101010)",
            border: "1px solid var(--p-25)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            animationDelay: "0.1s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          {phase === "checking" && (
            <div className="text-center py-6" role="status" aria-live="polite">
              <div
                className="w-9 h-9 rounded-full animate-spin mx-auto mb-4"
                style={{ border: "3px solid var(--p-20)", borderTopColor: "var(--theme-accent, #00a355)" }}
              />
              <p style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>جاري التحقق من الرابط...</p>
            </div>
          )}

          {phase === "invalid" && (
            <div className="text-center py-2">
              <div className="flex justify-center mb-4">
                <AlertTriangle size={48} style={{ color: "#f87171" }} />
              </div>
              <h1 className="text-xl font-bold mb-3" style={{ color: "var(--theme-text, #e8f5e9)" }}>{headline}</h1>
              <p className="text-sm mb-6" style={{ color: "var(--theme-text-secondary, #6aad6a)", lineHeight: 1.8 }}>
                {detail}
              </p>
              <Link
                to="/forgot-password"
                className="btn-dz inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium"
                style={{ textDecoration: "none" }}
              >
                طلب رابط جديد
              </Link>
            </div>
          )}

          {phase === "done" && (
            <div className="text-center py-2">
              <div className="flex justify-center mb-4">
                <CheckCircle size={52} style={{ color: "var(--theme-accent, #00a355)" }} />
              </div>
              <h1 className="text-xl font-bold mb-3" style={{ color: "var(--theme-text, #e8f5e9)" }}>{headline}</h1>
              <p className="text-sm mb-6" style={{ color: "var(--theme-text-secondary, #6aad6a)", lineHeight: 1.8 }}>
                {detail}
              </p>
              <Link
                to="/login"
                className="btn-dz inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium"
                style={{ textDecoration: "none" }}
              >
                تسجيل الدخول
              </Link>
            </div>
          )}

          {(phase === "form" || phase === "working") && (
            <>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>
                اختر كلمة مرور جديدة
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--theme-text-muted, #4a7a4a)", lineHeight: 1.7 }}>
                لحساب <span dir="ltr" style={{ color: "var(--theme-accent)" }}>{email}</span>
              </p>

              {error && (
                <div
                  className="mb-5 p-3 rounded-lg text-sm"
                  role="alert"
                  style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)", color: "#f87171" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label htmlFor="new-password" className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--theme-text-muted)" }} />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      className="input-dz w-full pr-10 pl-11 py-3 rounded-lg"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--theme-text-muted)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }}>
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--theme-text-muted)" }} />
                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      className="input-dz w-full pr-10 pl-4 py-3 rounded-lg"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button type="submit" disabled={phase === "working"} className="btn-dz w-full py-3 rounded-xl font-medium disabled:opacity-50">
                  {phase === "working" ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                </button>
              </form>

              <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid var(--p-15)" }}>
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
