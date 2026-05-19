import { useState, useEffect } from "react";
import { Search, Store, ShoppingCart, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { subscribeToCollection } from "../../lib/firestore";
import type { Equipment } from "../../lib/types";

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection<Equipment>("equipment", (data) => { setItems(data); setLoading(false); });
    return unsub;
  }, []);

  const filtered = items.filter((eq) => {
    const isVisible = eq.status === "approved" || !eq.status;
    const q = search.toLowerCase();
    const matchSearch = eq.name.toLowerCase().includes(q) || eq.description.toLowerCase().includes(q);
    const matchCat = catFilter ? eq.category === catFilter : true;
    return isVisible && matchSearch && matchCat;
  });

  const categories = [...new Set(items.map((eq) => eq.category).filter(Boolean))];

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid rgba(0,98,51,0.2)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(0,98,51,0.15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}><ShoppingCart size={20} style={{ color: "#00a355" }} /></div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>متجر عتاد الإعلام</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "#6aad6a", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>تسوق معدات الإعلام الاحترافية أو افتح متجرك الخاص</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Seller CTA */}
        <div className="rounded-xl p-6 mb-8 flex items-start gap-4 animate-fade-in-up" style={{ background: "linear-gradient(135deg, rgba(0,98,51,0.15), rgba(0,98,51,0.05))", border: "1px solid rgba(0,98,51,0.35)", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="p-3 rounded-xl flex-shrink-0 animate-float" style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}>
            <Store size={26} style={{ color: "#00a355" }} />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--theme-text, #c8e6c9)" }}>هل أنت بائع محترف؟</h3>
            <p className="mb-4 text-sm" style={{ color: "#6aad6a" }}>افتح متجرك الخاص على منصة سند وابدأ البيع للآلاف من المحترفين</p>
            <Link to="/register" className="btn-dz px-6 py-2.5 rounded-lg text-sm inline-block" style={{ textDecoration: "none" }}><span>افتح متجرك الآن</span></Link>
          </div>
        </div>

        {/* Search */}
        <div className="p-5 rounded-xl mb-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid rgba(0,98,51,0.25)", animationDelay: "0.25s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "#4a7a4a" }} />
              <input type="text" placeholder="ابحث عن منتج..." className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="select-dz px-4 py-2.5 rounded-lg text-sm" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">جميع الفئات</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16" style={{ color: "#3a5e3a" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "rgba(0,98,51,0.15)", border: "1px solid rgba(0,98,51,0.3)" }}>
              <ShoppingCart size={28} style={{ color: "#006233" }} />
            </div>
            <p style={{ color: "#4a7a4a" }}>{items.length === 0 ? "لا توجد منتجات بعد." : "لا توجد نتائج."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((eq, i) => (
              <div key={eq.id} className="card-glow rounded-xl p-5 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}>
                <div className="flex items-start justify-between mb-3">
                  <span style={{ background: eq.condition === "new" ? "rgba(0,98,51,0.3)" : "rgba(120,66,18,0.3)", color: eq.condition === "new" ? "#81c784" : "#f0b27a", fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                    {eq.condition === "new" ? "جديد" : "مستعمل"}
                  </span>
                  <span style={{ color: "#00a355", fontWeight: 700, fontSize: "1rem" }}>{eq.price.toLocaleString()} دج</span>
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--theme-text, #c8e6c9)" }}>{eq.name}</h3>
                {eq.category && <p style={{ color: "#4a7a4a", fontSize: "0.8rem", marginBottom: "0.5rem" }}>{eq.category}</p>}
                {eq.description && <p style={{ color: "#3a5e3a", fontSize: "0.8rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>{eq.description}</p>}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(0,98,51,0.1)" }}>
                  <span style={{ color: "#6aad6a", fontSize: "0.8rem" }}>{eq.seller}</span>
                  {eq.contact && (
                    <span className="flex items-center gap-1" style={{ color: "#4a7a4a", fontSize: "0.78rem" }}>
                      <Phone size={12} />{eq.contact}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
