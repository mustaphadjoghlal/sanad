import { useState, useEffect } from "react";
import { Search, Trophy, Calendar, ExternalLink } from "lucide-react";
import { subscribeToCollection } from "../../lib/firestore";
import type { Competition } from "../../lib/types";

export default function Competitions() {
  const [items, setItems] = useState<Competition[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection<Competition>("competitions", (data) => { setItems(data); setLoading(false); });
    return unsub;
  }, []);

  const filtered = items.filter((c) => {
    const isVisible = c.status === "approved" || !c.status;
    const matchSearch = c.name.includes(search) || c.organizer.includes(search);
    const matchType = typeFilter ? c.type === typeFilter : true;
    return isVisible && matchSearch && matchType;
  });

  const typeLabel: Record<string, string> = { university: "جامعية", national: "وطنية", international: "دولية" };
  const typeBg: Record<string, string> = { university: "rgba(26,82,118,0.3)", national: "rgba(0,98,51,0.3)", international: "rgba(120,66,18,0.3)" };
  const typeColor: Record<string, string> = { university: "#7fb3d3", national: "#81c784", international: "#f0b27a" };

  return (
    <div style={{ background: "#0b0f0b", minHeight: "100vh" }}>
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #060a06 0%, #0b0f0b 100%)", borderBottom: "1px solid rgba(0,98,51,0.2)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(0,98,51,0.15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}><Trophy size={20} style={{ color: "#00a355" }} /></div>
            <h1 className="text-4xl font-bold" style={{ color: "#e8f5e9" }}>المسابقات الإعلامية</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "#6aad6a", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>مواعيد المسابقات الإعلامية الجامعية والوطنية</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="p-5 rounded-xl mb-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #0f1a0f, #0b150b)", border: "1px solid rgba(0,98,51,0.25)", animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "#4a7a4a" }} />
              <input type="text" placeholder="ابحث عن مسابقة..." className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="select-dz px-4 py-2.5 rounded-lg text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">جميع الأنواع</option>
              <option value="university">جامعية</option>
              <option value="national">وطنية</option>
              <option value="international">دولية</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16" style={{ color: "#3a5e3a" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "rgba(0,98,51,0.15)", border: "1px solid rgba(0,98,51,0.3)" }}>
              <Trophy size={28} style={{ color: "#006233" }} />
            </div>
            <p style={{ color: "#4a7a4a" }}>{items.length === 0 ? "لا توجد مسابقات حالياً." : "لا توجد نتائج."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((c, i) => (
              <div key={c.id} className="card-glow rounded-xl p-5 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #0f1a0f, #0b150b)", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}>
                <div className="flex items-start justify-between mb-3">
                  <span style={{ background: typeBg[c.type] || "rgba(0,98,51,0.3)", color: typeColor[c.type] || "#81c784", fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                    {typeLabel[c.type]}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1" style={{ color: "#c8e6c9" }}>{c.name}</h3>
                <p style={{ color: "#6aad6a", fontSize: "0.8rem", marginBottom: "0.75rem" }}>المنظم: {c.organizer}</p>
                <div className="flex gap-4 text-xs mb-3" style={{ color: "#4a7a4a" }}>
                  {c.startDate && <span className="flex items-center gap-1"><Calendar size={12} />البداية: {c.startDate}</span>}
                  {c.endDate && <span className="flex items-center gap-1"><Calendar size={12} />النهاية: {c.endDate}</span>}
                </div>
                {c.description && <p style={{ color: "#3a5e3a", fontSize: "0.8rem", lineHeight: 1.6 }}>{c.description}</p>}
                {c.link && (
                  <a href={c.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm" style={{ color: "#006233" }}>
                    <span>التفاصيل</span><ExternalLink size={13} />
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
