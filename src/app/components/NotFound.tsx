import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center" dir="rtl">
        <h1 className="text-6xl mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">الصفحة غير موجودة</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Home size={20} />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
