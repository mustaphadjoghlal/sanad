import { useState, useEffect } from "react";
import { Search, Briefcase, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { subscribeToCollection } from "../../lib/firestore";
import type { Job } from "../../lib/types";

const employmentMap: Record<string, { label: string; bg: string; color: string }> = {
  fulltime:        { label: "دوام كلي",          bg: "rgba(0,80,40,0.35)",   color: "#66bb6a" },
  parttime:        { label: "دوام جزئي",         bg: "rgba(0,60,120,0.35)",  color: "#64b5f6" },
  internship:      { label: "تدريب",             bg: "rgba(120,60,0,0.35)",  color: "#ffa726" },
  internship_paid: { label: "تدريب مدفوع",       bg: "rgba(80,0,120,0.35)",  color: "#ce93d8" },
};

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
      {/* Hero */}
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
              <Briefcase size={20} style={{ color: "var(--theme-accent, #00a355)" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>عروض التوظيف</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "var(--theme-text-secondary, #6aad6a)", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>
            فرص عمل إعلامية وصحفية في الجزائر
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="p-5 rounded-xl mb-6 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
              <input type="text" placeholder="ابحث عن وظيفة أو شركة..." className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
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

        {/* Count */}
        {!loading && filtered.length > 0 && (
          <p className="text-sm mb-5 animate-fade-in" style={{ color: "var(--theme-text-muted, #4a7a4a)", opacity: 0, animationFillMode: "forwards" }}>
            {filtered.length} عرض متاح
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-15)" }}>
                <div style={{ height: "160px", background: "var(--p-10)" }} />
                <div className="p-4 space-y-3">
                  <div style={{ height: "16px", background: "var(--p-10)", borderRadius: "4px", width: "70%" }} />
                  <div style={{ height: "12px", background: "var(--p-08)", borderRadius: "4px", width: "50%" }} />
                  <div style={{ height: "12px", background: "var(--p-08)", borderRadius: "4px", width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "var(--p-15)", border: "1px solid var(--p-30)" }}>
              <Briefcase size={28} style={{ color: "var(--theme-primary, #006233)" }} />
            </div>
            <p style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>{items.length === 0 ? "لا توجد عروض توظيف حالياً." : "لا توجد نتائج."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((j, i) => (
              <Link
                key={j.id}
                to={`/jobs/${j.id}`}
                className="group block rounded-xl overflow-hidden card-glow animate-fade-in-up"
                style={{ background: "linear-gradient(145deg, #141414, #101010)", textDecoration: "none", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}
              >
                {/* Cover */}
                {j.image ? (
                  <div className="relative overflow-hidden" style={{ height: "160px" }}>
                    <img src={j.image} alt={j.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {j.employmentType && (() => {
                      const s = employmentMap[j.employmentType];
                      return s ? (
                        <span className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color, backdropFilter: "blur(4px)" }}>
                          {s.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="relative" style={{ height: "160px", background: "linear-gradient(135deg, var(--p-15), var(--p-05))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Briefcase size={44} style={{ color: "var(--p-30)" }} />
                    {j.employmentType && (() => {
                      const s = employmentMap[j.employmentType];
                      return s ? (
                        <span className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Content */}
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-bold text-base leading-snug" style={{ color: "var(--theme-text, #c8e6c9)" }}>{j.title}</h3>
                  <p className="text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>{j.company}</p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {j.location && (
                      <span className="flex items-center gap-1" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
                        <MapPin size={11} />{j.location}
                      </span>
                    )}
                    {j.jobType && (
                      <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--p-20)", color: "var(--theme-badge-text, #81c784)" }}>
                        {j.jobType}
                      </span>
                    )}
                  </div>

                  {j.description && (
                    <p className="text-xs leading-relaxed" style={{ color: "var(--theme-text-dim, #3a5e3a)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {j.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-1 pt-3" style={{ borderTop: "1px solid var(--p-12)" }}>
                    {j.deadline ? (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
                        <Calendar size={11} />آخر أجل: {j.deadline}
                      </span>
                    ) : <span />}
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--theme-accent, #00a355)" }}>
                      التفاصيل <ArrowLeft size={11} />
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
