import { useState, useEffect } from "react";
import { Search, Briefcase, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { subscribeToCollection } from "../../lib/firestore";
import type { Job } from "../../lib/types";

export default function Jobs() {
  const [items, setItems] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection<Job>("jobs", (data) => { setItems(data); setLoading(false); });
    return unsub;
  }, []);

  const filtered = items.filter((j) => {
    const isVisible = j.status === "approved" || !j.status;
    const q = search.toLowerCase();
    const matchSearch = j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    const matchLoc = locationFilter ? j.location === locationFilter : true;
    const matchType = typeFilter ? j.jobType === typeFilter : true;
    return isVisible && matchSearch && matchLoc && matchType;
  });

  const wilayas = [...new Set(items.map((j) => j.location).filter(Boolean))];
  const types = [...new Set(items.map((j) => j.jobType).filter(Boolean))];

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}><Briefcase size={20} style={{ color: "var(--theme-accent, #00a355)" }} /></div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>عروض التوظيف</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "var(--theme-text-secondary, #6aad6a)", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>فرص عمل إعلامية وصحفية في الجزائر</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="p-5 rounded-xl mb-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
              <input type="text" placeholder="ابحث عن وظيفة..." className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select className="select-dz px-4 py-2.5 rounded-lg text-sm" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value="">كل الولايات</option>
                {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
              <select className="select-dz px-4 py-2.5 rounded-lg text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">كل التخصصات</option>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "var(--p-15)", border: "1px solid var(--p-30)" }}>
              <Briefcase size={28} style={{ color: "var(--theme-primary, #006233)" }} />
            </div>
            <p style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>{items.length === 0 ? "لا توجد عروض توظيف حالياً." : "لا توجد نتائج."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((j, i) => (
              <Link
                key={j.id}
                to={`/jobs/${j.id}`}
                className="card-glow rounded-xl overflow-hidden animate-fade-in-up flex"
                style={{ background: "linear-gradient(145deg, #141414, #101010)", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards", textDecoration: "none", display: "flex" }}
              >
                {/* Thumbnail */}
                {j.image ? (
                  <div style={{ width: "96px", minWidth: "96px", flexShrink: 0, overflow: "hidden" }}><img src={j.image} alt={j.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                ) : (
                  <div style={{ width: "96px", minWidth: "96px", background: "linear-gradient(135deg, var(--p-15), var(--p-05))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase size={28} style={{ color: "var(--p-40)" }} />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1" style={{ color: "var(--theme-text, #c8e6c9)" }}>{j.title}</h3>
                    <p style={{ color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>{j.company}</p>
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
                      {j.location && <span className="flex items-center gap-1"><MapPin size={12} />{j.location}</span>}
                      {j.jobType && <span style={{ background: "var(--p-20)", padding: "0.15rem 0.5rem", borderRadius: "9999px", color: "var(--theme-badge-text, #81c784)" }}>{j.jobType}</span>}
                      {j.employmentType && (() => {
                        const map: Record<string, { label: string; bg: string; color: string }> = {
                          fulltime:        { label: "دوام كلي",          bg: "rgba(0,80,40,0.3)",   color: "#66bb6a" },
                          parttime:        { label: "دوام جزئي",         bg: "rgba(0,60,120,0.3)",  color: "#64b5f6" },
                          internship:      { label: "تدريب (غير مدفوع)", bg: "rgba(120,60,0,0.3)",  color: "#ffa726" },
                          internship_paid: { label: "تدريب مدفوع",       bg: "rgba(80,0,120,0.3)",  color: "#ce93d8" },
                        };
                        const s = map[j.employmentType];
                        return s ? <span style={{ background: s.bg, padding: "0.15rem 0.5rem", borderRadius: "9999px", color: s.color }}>{s.label}</span> : null;
                      })()}
                      {j.deadline && <span className="flex items-center gap-1"><Calendar size={12} />آخر أجل: {j.deadline}</span>}
                    </div>
                    {j.description && <p style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.8rem", marginTop: "0.75rem", lineHeight: 1.6 }}>{j.description.slice(0, 120)}{j.description.length > 120 ? "..." : ""}</p>}
                  </div>
                  {j.contact && (
                    <div style={{ border: "1px solid var(--p-30)", borderRadius: "0.5rem", padding: "0.5rem 1rem", color: "var(--theme-text-secondary, #6aad6a)", fontSize: "0.8rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {j.contact}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
