import { Search, Store, ShoppingCart } from "lucide-react";

export default function Equipment() {
  return (
    <div style={{ background: "#0b0f0b", minHeight: "100vh" }}>
      {/* Page header */}
      <div
        className="relative py-12 px-4 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #060a06 0%, #0b0f0b 100%)",
          borderBottom: "1px solid rgba(0,98,51,0.2)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% -20%, rgba(0,98,51,0.15) 0%, transparent 60%)",
          }}
        />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div
              className="p-2 rounded-lg"
              style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}
            >
              <ShoppingCart size={20} style={{ color: "#00a355" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "#e8f5e9" }}>
              متجر عتاد الإعلام
            </h1>
          </div>
          <p
            className="animate-fade-in-up"
            style={{ color: "#6aad6a", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}
          >
            تسوق معدات الإعلام الاحترافية أو افتح متجرك الخاص
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Seller CTA */}
        <div
          className="rounded-xl p-6 mb-8 flex items-start gap-4 animate-fade-in-up"
          style={{
            background: "linear-gradient(135deg, rgba(0,98,51,0.15), rgba(0,98,51,0.05))",
            border: "1px solid rgba(0,98,51,0.35)",
            animationDelay: "0.1s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <div
            className="p-3 rounded-xl flex-shrink-0 animate-float"
            style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}
          >
            <Store size={26} style={{ color: "#00a355" }} />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "#c8e6c9" }}>
              هل أنت بائع محترف؟
            </h3>
            <p className="mb-4 text-sm" style={{ color: "#6aad6a" }}>
              افتح متجرك الخاص على منصة سند باشتراك شهري وابدأ البيع للآلاف من المحترفين
            </p>
            <button className="btn-dz px-6 py-2.5 rounded-lg text-sm">
              <span>افتح متجرك الآن</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div
          className="p-5 rounded-xl mb-8 animate-fade-in-up"
          style={{
            background: "linear-gradient(145deg, #0f1a0f, #0b150b)",
            border: "1px solid rgba(0,98,51,0.25)",
            animationDelay: "0.25s",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2"
                size={18}
                style={{ color: "#4a7a4a" }}
              />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm"
              />
            </div>
            <select className="select-dz px-4 py-2.5 rounded-lg text-sm">
              <option value="">جميع الفئات</option>
              <option value="cameras">كاميرات</option>
              <option value="microphones">ميكروفونات</option>
              <option value="lighting">إضاءة</option>
              <option value="accessories">ملحقات</option>
            </select>
          </div>
        </div>

        {/* Empty state */}
        <div
          className="empty-state rounded-xl py-20 text-center animate-fade-in"
          style={{ animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float"
            style={{ background: "rgba(0,98,51,0.15)", border: "1px solid rgba(0,98,51,0.3)" }}
          >
            <ShoppingCart size={28} style={{ color: "#006233" }} />
          </div>
          <p style={{ color: "#4a7a4a" }}>
            لا توجد منتجات متاحة حالياً. سيتم إضافة المنتجات من قبل البائعين.
          </p>
        </div>
      </div>
    </div>
  );
}
