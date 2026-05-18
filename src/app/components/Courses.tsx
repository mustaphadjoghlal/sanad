import { Search, Filter, BookOpen } from "lucide-react";

export default function Courses() {
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
              <BookOpen size={20} style={{ color: "#00a355" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "#e8f5e9" }}>
              الدورات التدريبية
            </h1>
          </div>
          <p
            className="animate-fade-in-up"
            style={{ color: "#6aad6a", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}
          >
            اكتشف دورات تدريبية مجانية ومدفوعة في مجال الإعلام
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search & filter bar */}
        <div
          className="p-5 rounded-xl mb-8 animate-fade-in-up"
          style={{
            background: "linear-gradient(145deg, #0f1a0f, #0b150b)",
            border: "1px solid rgba(0,98,51,0.25)",
            animationDelay: "0.2s",
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
                placeholder="ابحث عن دورة..."
                className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-3">
              <select className="select-dz px-4 py-2.5 rounded-lg text-sm">
                <option value="">نوع الدورة</option>
                <option value="free">مجانية</option>
                <option value="paid">مدفوعة</option>
              </select>
              <button
                className="btn-dz px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
              >
                <span>
                  <Filter size={16} />
                </span>
                <span>تصفية</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div
          className="empty-state rounded-xl py-20 text-center animate-fade-in"
          style={{ animationDelay: "0.35s", opacity: 0, animationFillMode: "forwards" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float"
            style={{ background: "rgba(0,98,51,0.15)", border: "1px solid rgba(0,98,51,0.3)" }}
          >
            <BookOpen size={28} style={{ color: "#006233" }} />
          </div>
          <p style={{ color: "#4a7a4a" }}>
            لا توجد دورات متاحة حالياً. سيتم إضافة الدورات عبر لوحة التحكم.
          </p>
        </div>
      </div>
    </div>
  );
}
