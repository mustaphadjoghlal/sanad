import { useState, useEffect } from "react";
import { Search, Filter, BookOpen, ExternalLink } from "lucide-react";
import { subscribeToCollection } from "../../lib/firestore";
import type { Course } from "../../lib/types";

export default function Courses() {
  const [items, setItems] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection<Course>("courses", (data) => {
      setItems(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = items.filter((c) => {
    const isVisible = c.status === "approved" || !c.status;
    const matchSearch = c.title.includes(search) || c.instructor.includes(search) || c.description.includes(search);
    const matchType = typeFilter ? c.type === typeFilter : true;
    return isVisible && matchSearch && matchType;
  });

  return (
    <div style={{ background: "#0b0f0b", minHeight: "100vh" }}>
      {/* Page header */}
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #060a06 0%, #0b0f0b 100%)", borderBottom: "1px solid rgba(0,98,51,0.2)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(0,98,51,0.15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}>
              <BookOpen size={20} style={{ color: "#00a355" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "#e8f5e9" }}>الدورات التدريبية</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "#6aad6a", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>
            اكتشف دورات تدريبية مجانية ومدفوعة في مجال الإعلام
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="p-5 rounded-xl mb-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #0f1a0f, #0b150b)", border: "1px solid rgba(0,98,51,0.25)", animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "#4a7a4a" }} />
              <input type="text" placeholder="ابحث عن دورة..." className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <select className="select-dz px-4 py-2.5 rounded-lg text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">جميع الدورات</option>
                <option value="free">مجانية</option>
                <option value="paid">مدفوعة</option>
              </select>
              <button onClick={() => { setSearch(""); setTypeFilter(""); }} className="btn-dz px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
                <span><Filter size={15} /></span><span>إعادة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16" style={{ color: "#3a5e3a" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center animate-fade-in" style={{ animationDelay: "0.35s", opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "rgba(0,98,51,0.15)", border: "1px solid rgba(0,98,51,0.3)" }}>
              <BookOpen size={28} style={{ color: "#006233" }} />
            </div>
            <p style={{ color: "#4a7a4a" }}>
              {items.length === 0 ? "لا توجد دورات متاحة حالياً. سيتم إضافة الدورات عبر لوحة التحكم." : "لا توجد نتائج لبحثك."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c, i) => (
              <div key={c.id} className="card-glow rounded-xl p-5 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #0f1a0f, #0b150b)", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}>
                <div className="flex items-start justify-between mb-3">
                  <span style={{ background: c.type === "free" ? "rgba(0,98,51,0.3)" : "rgba(26,82,118,0.35)", color: c.type === "free" ? "#81c784" : "#7fb3d3", fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                    {c.type === "free" ? "مجانية" : `${c.price?.toLocaleString()} دج`}
                  </span>
                  {c.duration && <span style={{ color: "#4a7a4a", fontSize: "0.78rem" }}>{c.duration}</span>}
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "#c8e6c9", fontSize: "1rem" }}>{c.title}</h3>
                <p style={{ color: "#4a7a4a", fontSize: "0.8rem", marginBottom: "0.5rem" }}>المدرب: {c.instructor}</p>
                {c.description && <p style={{ color: "#3a5e3a", fontSize: "0.8rem", lineHeight: 1.6 }}>{c.description}</p>}
                {c.link && (
                  <a href={c.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm transition-colors" style={{ color: "#006233" }}>
                    <span>سجّل الآن</span><ExternalLink size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
