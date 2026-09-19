import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth, ADMIN_EMAIL } from "../../../lib/firebase";
import { getUserProfile } from "../../../lib/firestore";
import { usePageTitle } from "../../../lib/usePageTitle";

export default function UserLogin() {
  usePageTitle("تسجيل الدخول", "سجّل دخولك إلى حسابك على منصة سند الإعلامية.", { noindex: true });
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Firebase restores the session asynchronously, so on first paint we do not
  // yet know whether anyone is signed in. Rendering the form during that gap
  // is what showed a signed-in visitor the login page when they pressed back.
  const [checking, setChecking] = useState(true);

  // A sign-in happening right now is handled by handleLogin, which still has
  // to check the profile exists before letting the visitor through. The guard
  // below must not race ahead of that check.
  const signingIn = useRef(false);

  /**
   * Someone who is already signed in has no business on the login page —
   * whether they typed the URL, opened a bookmark, or walked back into it
   * through history. Send them where they were going instead.
   */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (signingIn.current) return;
      if (user) {
        navigate(user.email === ADMIN_EMAIL ? "/sanad-admin/dashboard" : "/user/dashboard", {
          replace: true,
        });
      } else {
        setChecking(false);
      }
    });
    return unsub;
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    signingIn.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // replace, not push: otherwise the login page stays one step back from
      // the dashboard and the browser's back button returns to it.
      if (cred.user.email === ADMIN_EMAIL) {
        navigate("/sanad-admin/dashboard", { replace: true });
        return;
      }
      const profile = await getUserProfile(cred.user.uid);
      if (profile) {
        navigate("/user/dashboard", { replace: true });
      } else {
        setError("لم يكتمل تسجيل حسابك. يرجى التسجيل مجدداً بنفس البريد الإلكتروني.");
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
      signingIn.current = false;
    }
  };

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0e0e0e" }}
        role="status"
        aria-label="جاري التحقق"
      >
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid var(--p-20)", borderTopColor: "var(--theme-accent, #00a355)" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl" style={{ background: "#0e0e0e" }}>
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% -10%, var(--p-12) 0%, transparent 60%)" }}
      />

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
          <p className="mt-2" style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem" }}>تسجيل الدخول إلى حسابك</p>
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
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--theme-text, #e8f5e9)" }}>أهلاً بعودتك</h2>

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
              <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="userlogin-1-06a9ea">البريد الإلكتروني</label>
              <input id="userlogin-1-06a9ea"
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
              <label className="block mb-1.5 text-sm" style={{ color: "var(--theme-badge-text, #81c784)" }} htmlFor="userlogin-2-a48112">كلمة المرور</label>
              <input id="userlogin-2-a48112"
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

          <div className="mt-6 pt-5 space-y-3" style={{ borderTop: "1px solid var(--p-15)" }}>
            <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.875rem", textAlign: "center" }}>
              ليس لديك حساب؟{" "}
              <Link to="/register" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none" }}>
                سجّل الآن
              </Link>
            </p>
            <p style={{ textAlign: "center" }}>
              <Link to="/forgot-password" style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.85rem", textDecoration: "none" }}>
                نسيت كلمة المرور؟
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
