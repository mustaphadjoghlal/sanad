import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Shown when a Firestore listener fails.
 *
 * Every list page used to call setLoading(false) only from the success
 * callback, so a denied read or a dropped connection left "جاري التحميل..."
 * on screen indefinitely with nothing explaining why.
 */
export default function LoadError({ message }: { message?: string }) {
  return (
    <div className="text-center py-16" dir="rtl">
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
        style={{ background: "rgba(198,40,40,0.12)", border: "1px solid rgba(198,40,40,0.3)" }}
      >
        <AlertTriangle size={22} style={{ color: "#f87171" }} />
      </div>
      <p style={{ color: "var(--theme-text, #e8f5e9)", marginBottom: "0.35rem" }}>
        {message ?? "تعذّر تحميل المحتوى"}
      </p>
      <p style={{ color: "var(--theme-text-muted, #78909c)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
        تحقق من اتصالك بالإنترنت ثم أعد المحاولة.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: "var(--theme-accent, #00a355)", color: "#07130b", border: "none", cursor: "pointer" }}
      >
        <RotateCcw size={15} />
        إعادة المحاولة
      </button>
    </div>
  );
}
