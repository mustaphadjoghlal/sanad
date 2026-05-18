import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { getUserProfile } from "../../../lib/firestore";
import { Lock, Mail, Radio, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Verify it's not a regular user
      const profile = await getUserProfile(cred.user.uid);
      if (profile) {
        await auth.signOut();
        setError("هذا الحساب حساب مستخدم عادي. استخدم صفحة تسجيل الدخول العادية.");
        setLoading(false);
        return;
      }
      navigate("/sanad-admin/dashboard");
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
        background: "radial-gradient(ellipse at 50% 0%, rgba(0,98,51,0.18) 0%, #080808 60%)",
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
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-float"
            style={{
              background: "linear-gradient(135deg, #006233, #008545)",
              boxShadow: "0 0 32px rgba(0,98,51,0.4)",
            }}
          >
            <Radio size={30} color="#ffffff" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#e8f5e9" }}>
            سند <span style={{ color: "#6aad6a", fontSize: "1rem" }}>Admin</span>
          </h1>
          <p style={{ color: "#4a7a4a", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            لوحة التحكم الإدارية
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(145deg, #141414, #101010)",
            border: "1px solid rgba(0,98,51,0.3)",
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
                className="block text-sm mb-2"
                style={{ color: "#81c784" }}
              >
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  size={18}
                  style={{ color: "#4a7a4a" }}
                />
                <input
                  type="email"
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
                className="block text-sm mb-2"
                style={{ color: "#81c784" }}
              >
                كلمة المرور
              </label>
              <div className="relative">
                <Lock
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  size={18}
                  style={{ color: "#4a7a4a" }}
                />
                <input
                  type="password"
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
          </form>
        </div>
      </div>
    </div>
  );
}
