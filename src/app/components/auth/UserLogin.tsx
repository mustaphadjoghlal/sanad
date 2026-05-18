import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radio, LogIn } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { getUserProfile } from "../../../lib/firestore";

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(cred.user.uid);
      if (profile) {
        navigate("/user/dashboard");
      } else {
        // Admin or no profile - redirect to admin
        setError("هذا الحساب ليس حساب مستخدم عادي. جرّب لوحة الإدارة.");
        await auth.signOut();
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (e.code === "auth/too-many-requests") {
        setError("محاولات كثيرة. يرجى الانتظار قبل المحاولة مجدداً.");
      } else {
        setError("حدث خطأ. يرجى المحاولة مجدداً.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl" style={{ background: "#0e0e0e" }}>
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,98,51,0.12) 0%, transparent 60%)" }}
      />

      <div className="w-full max-w-md relative z-10">
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
          <p className="mt-2" style={{ color: "#4a7a4a", fontSize: "0.875rem" }}>تسجيل الدخول إلى حسابك</p>
        </div>

        <div
          className="rounded-2xl p-8 animate-fade-in-up"
          style={{
            background: "linear-gradient(145deg, #141414, #101010)",
            border: "1px solid rgba(0,98,51,0.25)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            animationDelay: "0.1s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: "#e8f5e9" }}>أهلاً بعودتك</h2>

          {error && (
            <div
              className="mb-5 p-3 rounded-lg text-sm"
              style={{ background: "rgba(198,40,40,0.1)", border: "1px solid rgba(198,40,40,0.3)", color: "#f87171" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>البريد الإلكتروني</label>
              <input
                type="email"
                className="input-dz w-full px-4 py-3 rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm" style={{ color: "#81c784" }}>كلمة المرور</label>
              <input
                type="password"
                className="input-dz w-full px-4 py-3 rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة مرورك"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-dz w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn size={18} />
              <span>{loading ? "جاري الدخول..." : "تسجيل الدخول"}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid rgba(0,98,51,0.15)" }}>
            <p style={{ color: "#4a7a4a", fontSize: "0.875rem" }}>
              ليس لديك حساب؟{" "}
              <Link to="/register" style={{ color: "#00a355", textDecoration: "none" }}>
                سجّل الآن
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
