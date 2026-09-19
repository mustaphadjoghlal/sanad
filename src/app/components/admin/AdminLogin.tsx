import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { auth, ADMIN_EMAIL } from "../../../lib/firebase";
import { Lock, Mail, AlertCircle } from "lucide-react";
import { usePageTitle } from "../../../lib/usePageTitle";

export default function AdminLogin() {
  usePageTitle("لوحة التحكم", undefined, { noindex: true });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!email.trim()) {
      setError("أدخل بريدك الإلكتروني أولاً ثم اضغط نسيت كلمة المرور");
      return;
    }
    setResetLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch {
      setError("تعذّر إرسال رسالة الاستعادة. تحقق من البريد الإلكتروني.");
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.email === ADMIN_EMAIL) {
        navigate("/sanad-admin/dashboard", { replace: true });
      }
    });
    return unsub;
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (cred.user.email !== ADMIN_EMAIL) {
        await auth.signOut();
        setError("هذا الحساب ليس حساب أدمن.");
        setLoading(false);
        return;
      }
      navigate("/sanad-admin/dashboard", { replace: true });
    } catch {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir="rtl"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, var(--p-18) 0%, #080808 60%)",
        backgroundColor: "#0e0e0e",
      }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 bg-grid-pattern"
        style={{ opacity: 0.3, pointerEvents: "none" }}
      />

      <div
        className="w-full max-w-md relative z-10 animate-fade-in-up"
        style={{ opacity: 0, animationFillMode: "forwards" }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="سند"
            width={150}
            height={41}
            className="h-10 w-auto mx-auto mb-4"
          />
          <h1 className="text-xl font-bold" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>
            Admin
          </h1>
          <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            لوحة التحكم الإدارية
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(145deg, #141414, #101010)",
            border: "1px solid var(--p-30)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg mb-6 animate-fade-in"
              style={{
                background: "rgba(198,40,40,0.1)",
                border: "1px solid rgba(198,40,40,0.3)",
                color: "#ef9a9a",
                fontSize: "0.875rem",
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm mb-2"
                style={{ color: "var(--theme-badge-text, #81c784)" }}
              >
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  size={18}
                  style={{ color: "var(--theme-text-muted, #4a7a4a)" }}
                />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dz w-full pr-10 pl-4 py-3 rounded-xl text-sm"
                  placeholder="admin@sanad.dz"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm mb-2"
                style={{ color: "var(--theme-badge-text, #81c784)" }}
              >
                كلمة المرور
              </label>
              <div className="relative">
                <Lock
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  size={18}
                  style={{ color: "var(--theme-text-muted, #4a7a4a)" }}
                />
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dz w-full pr-10 pl-4 py-3 rounded-xl text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-dz w-full py-3 rounded-xl font-medium mt-2 disabled:opacity-60"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              <span>{loading ? "جاري التحقق..." : "تسجيل الدخول"}</span>
            </button>

            {resetSent ? (
              <p style={{ color: "#4ade80", fontSize: "0.8rem", textAlign: "center", marginTop: "0.75rem" }}>
                ✓ تم إرسال رابط الاستعادة إلى بريدك الإلكتروني
              </p>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                disabled={resetLoading}
                className="w-full mt-3 text-sm disabled:opacity-50"
                style={{ color: "#4a7a4a", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#81c784"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4a7a4a"; }}
              >
                {resetLoading ? "جاري الإرسال..." : "نسيت كلمة المرور؟"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
