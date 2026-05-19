import { useState, useEffect } from "react";
import { Search, Trophy, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { subscribeToCollection } from "../../lib/firestore";
import type { Competition } from "../../lib/types";

const typeLabel: Record<string, string> = { university: "جامعية", national: "وطنية", international: "دولية" };
const typeBg: Record<string, string> = { university: "rgba(26,82,118,0.3)", national: "rgba(0,98,51,0.3)", international: "rgba(120,66,18,0.3)" };
const typeColor: Record<string, string> = { university: "#7fb3d3", national: "var(--theme-badge-text, #81c784)", international: "#f0b27a" };

export default function Competitions() {
  const [items, setItems] = useState<Competition[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection<Competition>("competitions", (data) => {
      setItems(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const q = search.toLowerCase();
  const filtered = items.filter((c) => {
    const isVisible = c.status === "approved" || !c.status;
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.organizer.toLowerCase().includes(q);
    const matchType = typeFilter ? c.type === typeFilter : true;
    return isVisible && matchSearch && matchType;
  });

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid rgba(0,98,51,0.2)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(0,98,51,0.15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}>
              <Trophy size={20} style={{ color: "var(--theme-accent, #00a355)" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>المسابقات الإعلامية</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "var(--theme-text-secondary, #6aad6a)", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>
            مسابقات وطنية وجامعية ودولية في مجال الإعلام والصحافة
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search + filter */}
        <div className="p-5 rounded-xl mb-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid rgba(0,98,51,0.25)", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
              <input
                type="text"
                placeholder="ابحث عن مسابقة..."
                className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="select-dz px-4 py-2.5 rounded-lg text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">جميع الأنواع</option>
              <option value="university">جامعية</option>
              <option value="national">وطنية</option>
              <option value="international">دولية</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "rgba(0,98,51,0.15)", border: "1px solid rgba(0,98,51,0.3)" }}>
              <Trophy size={28} style={{ color: "var(--theme-primary, #006233)" }} />
            </div>
            <p style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>{items.length === 0 ? "لا توجد مسابقات حالياً." : "لا توجد نتائج."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c, i) => (
              <Link
                key={c.id}
                to={`/competitions/${c.id}`}
                className="group block rounded-xl overflow-hidden animate-fade-in-up card-glow"
                style={{
                  background: "linear-gradient(145deg, #141414, #101010)",
                  textDecoration: "none",
                  animationDelay: `${i * 0.07}s`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                {/* Cover image */}
                <div className="relative overflow-hidden" style={{ height: "180px" }}>
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(0,98,51,0.15), rgba(0,98,51,0.05))" }}
                    >
                      <Trophy size={48} style={{ color: "rgba(0,98,51,0.3)" }} />
                    </div>
                  )}
                  {/* Type badge over image */}
                  <span
                    className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: typeBg[c.type] || "rgba(0,98,51,0.6)", color: typeColor[c.type] || "var(--theme-badge-text, #81c784)", backdropFilter: "blur(4px)" }}
                  >
                    {typeLabel[c.type]}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3
                    className="font-bold text-base mb-2 leading-snug transition-colors group-hover:text-green-400"
                    style={{ color: "var(--theme-text, #c8e6c9)" }}
                  >
                    {c.name}
                  </h3>

                  {c.description && (
                    <p
                      className="text-sm mb-3 line-clamp-2"
                      style={{ color: "var(--theme-text-muted, #4a7a4a)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      {c.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,98,51,0.12)" }}>
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
                      <Calendar size={12} />
                      <span>{c.endDate || c.startDate || ""}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs transition-colors group-hover:text-green-400" style={{ color: "var(--theme-primary, #006233)" }}>
                      اقرأ المزيد <ArrowLeft size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
