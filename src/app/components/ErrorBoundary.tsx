import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

function ErrorScreen({ title, detail, onRetry }: { title: string; detail?: string; onRetry?: () => void }) {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0e0e0e" }}
    >
      <div
        className="w-full max-w-md text-center rounded-2xl p-8"
        style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25, rgba(0,98,51,0.25))" }}
      >
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
          style={{ background: "rgba(198,40,40,0.12)", border: "1px solid rgba(198,40,40,0.3)" }}
        >
          <AlertTriangle size={26} style={{ color: "#f87171" }} />
        </div>

        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>
          {title}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--theme-text-muted, #78909c)", lineHeight: 1.9 }}>
          {detail ?? "حدث خطأ غير متوقع. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية."}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetry ?? (() => window.location.reload())}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--theme-accent, #00a355)", color: "#07130b", border: "none", cursor: "pointer" }}
          >
            <RotateCcw size={16} />
            إعادة المحاولة
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
            style={{ color: "var(--theme-text, #e8f5e9)", border: "1px solid var(--p-30, rgba(0,98,51,0.3))", textDecoration: "none" }}
          >
            <Home size={16} />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Router-level handler. Without an `errorElement` React Router falls back to
 * its own English, unstyled crash page — or a blank screen in production.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorScreen
        title={error.status === 404 ? "الصفحة غير موجودة" : `خطأ ${error.status}`}
        detail={error.status === 404 ? "الرابط الذي فتحته غير صحيح أو تم حذف محتواه." : error.statusText}
      />
    );
  }

  console.error("Route error:", error);
  return <ErrorScreen title="تعذّر عرض هذه الصفحة" />;
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time crashes anywhere in the tree. Previously a single
 * component throwing took the whole site down to a white screen with nothing
 * on it and no way back.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen title="حدث خطأ في التطبيق" onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
