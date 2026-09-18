import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { LogOut, AlertTriangle } from "lucide-react";
import { auth } from "../../lib/firebase";

/**
 * One logout flow for all six logout buttons (header, mobile menu, the user
 * dashboard and the admin sidebar), so they cannot drift apart.
 *
 * Signing out used to happen on the first click with no warning, which is
 * easy to do by accident on a phone where the button sits beside the menu.
 */
export function useLogoutFlow() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "asking" | "leaving">("idle");
  const cancelRef = useRef<HTMLButtonElement>(null);

  const requestLogout = useCallback(() => setPhase("asking"), []);
  const cancel = useCallback(() => setPhase("idle"), []);

  const confirm = useCallback(async () => {
    setPhase("leaving");
    try {
      await signOut(auth);
    } catch {
      // Even if the sign-out call fails, the local session is gone; sending
      // the visitor home is still the right outcome.
    }
    // A beat on the farewell screen, so the change is visible rather than a
    // jarring jump straight to the landing page.
    setTimeout(() => navigate("/", { replace: true }), 1100);
  }, [navigate]);

  // Escape cancels, and the page behind must not scroll under the dialog.
  useEffect(() => {
    if (phase !== "asking") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cancel(); };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [phase, cancel]);

  const dialog =
    phase === "idle" ? null : phase === "leaving" ? (
      <div
        role="status"
        aria-live="polite"
        dir="rtl"
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4"
        style={{ background: "#0e0e0e" }}
      >
        <img src="/logo.png" alt="" width={150} height={41} className="h-10 w-auto opacity-90" />
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: "3px solid var(--p-20)", borderTopColor: "var(--theme-accent, #00a355)" }}
        />
        <p style={{ color: "var(--theme-text, #e8f5e9)", fontWeight: 600 }}>تم تسجيل الخروج</p>
        <p style={{ color: "var(--theme-text-muted, #78909c)", fontSize: "0.875rem" }}>
          جاري تحويلك إلى الصفحة الرئيسية...
        </p>
      </div>
    ) : (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) cancel(); }}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          dir="rtl"
          className="w-full max-w-sm rounded-2xl p-6 animate-fade-in-up"
          style={{
            background: "linear-gradient(145deg, #151b17, #0f130f)",
            border: "1px solid var(--p-30)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <div className="flex items-start gap-3 mb-5">
            <div
              className="p-2 rounded-xl shrink-0"
              style={{ background: "rgba(198,40,40,0.12)", border: "1px solid rgba(198,40,40,0.3)" }}
            >
              <AlertTriangle size={20} style={{ color: "#f87171" }} />
            </div>
            <div>
              <h2 id="logout-title" className="font-bold mb-1" style={{ color: "var(--theme-text, #e8f5e9)" }}>
                تسجيل الخروج؟
              </h2>
              <p className="text-sm" style={{ color: "var(--theme-text-muted, #78909c)", lineHeight: 1.8 }}>
                ستُنهى جلستك على هذا الجهاز، وستحتاج إلى إدخال بياناتك مجدداً للدخول.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirm}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "#b91c1c", color: "#fff", border: "none", cursor: "pointer" }}
            >
              <LogOut size={15} />
              تسجيل الخروج
            </button>
            <button
              ref={cancelRef}
              type="button"
              onClick={cancel}
              className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{
                background: "var(--p-15)",
                color: "var(--theme-text, #e8f5e9)",
                border: "1px solid var(--p-30)",
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );

  return { requestLogout, dialog };
}
