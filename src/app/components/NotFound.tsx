import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { usePageTitle } from "../../lib/usePageTitle";

export default function NotFound() {
  // Unknown paths are served the SPA shell with a 200, so without this tag
  // search engines index them as real (empty) pages.
  usePageTitle("الصفحة غير موجودة", "الرابط الذي فتحته غير صحيح أو تم حذف محتواه.", { noindex: true });

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
      <div className="text-center">
        <p className="text-6xl font-black mb-4" style={{ color: "var(--theme-accent, #00a355)" }}>404</p>
        <h1 className="text-xl mb-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>الصفحة غير موجودة</h1>
        <p className="text-sm mb-8" style={{ color: "var(--theme-text-muted, #78909c)" }}>
          الرابط الذي فتحته غير صحيح أو تم حذف محتواه.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--theme-accent, #00a355)", color: "#07130b", textDecoration: "none" }}
          >
            <Home size={16} />
            العودة للرئيسية
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
            style={{ color: "var(--theme-text, #e8f5e9)", border: "1px solid var(--p-30)", textDecoration: "none" }}
          >
            <Search size={16} />
            ابحث في الموقع
          </Link>
        </div>
      </div>
    </div>
  );
}
