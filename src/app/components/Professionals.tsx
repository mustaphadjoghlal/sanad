import { useState, useEffect } from "react";
import { Search, Users, MapPin, ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";
import { subscribeToApprovedProfessionals } from "../../lib/firestore";
import type { UserProfile } from "../../lib/types";

const typeLabel: Record<string, string> = {
  editor_news:        "محرر أخبار",
  web_digital:        "ويب ديجيتال",
  presenter_programs: "مقدم برامج",
  presenter_news:     "مقدم أخبار",
  monteur:            "مونتير",
  graphic_designer:   "جرافيك ديزاينر",
  cameraman:          "كاميرا مان",
  producer:           "منتج",
  director:           "مخرج",
  program_writer:     "معد برامج",
  voice:              "معلق صوتي",
  host_stage:         "منشط على الركح",
  student:            "طالب إعلام",
  journalist:         "صحفي / مراسل",
  photographer:       "مصور",
  editor:             "مخرج / مونتير",
  other:              "إعلامي",
};

const EXCLUDED_TYPES = new Set(["store", "vendor", "trainer"]);
const PAGE_SIZE = 12;

export default function Professionals() {
  const [all, setAll] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const unsub = subscribeToApprovedProfessionals((profiles) => {
      setAll(profiles.filter((p) => !EXCLUDED_TYPES.has(p.type)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const q = search.toLowerCase();
  const filtered = all.filter((p) => {
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.specialty?.toLowerCase().includes(q) || (typeLabel[p.type] ?? "").includes(q);
    const matchType = !typeFilter || p.type === typeFilter;
    const matchLoc = !locationFilter || p.location === locationFilter;
    return matchSearch && matchType && matchLoc;
  });

  const locations = [...new Set(all.map((p) => p.location).filter(Boolean))].sort();
  const types = [...new Set(all.map((p) => p.type).filter((t) => !EXCLUDED_TYPES.has(t)))];

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
              <Users size={20} style={{ color: "var(--theme-accent, #00a355)" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>دليل المحترفين</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "var(--theme-text-secondary, #6aad6a)", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>
            إعلاميون وصحفيون ومصورون ومنتجون معتمدون على منصة سند
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="p-5 rounded-xl mb-6 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--theme-text-muted)" }} />
              <input
                type="text"
                placeholder="ابحث بالاسم أو التخصص..."
                className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              />
            </div>
            <select className="select-dz px-4 py-2.5 rounded-lg text-sm" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); resetPage(); }}>
              <option value="">جميع التخصصات</option>
              {types.map((t) => <option key={t} value={t}>{typeLabel[t] ?? t}</option>)}
            </select>
            <select className="select-dz px-4 py-2.5 rounded-lg text-sm" value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value); resetPage(); }}>
              <option value="">كل الولايات</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Count */}
        {!loading && filtered.length > 0 && (
          <p className="text-sm mb-5" style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
            {filtered.length} محترف
            {totalPages > 1 && <span> — صفحة {page} من {totalPages}</span>}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-15)" }}>
                <div style={{ height: "140px", background: "#1a1a1a" }} />
                <div className="p-4 space-y-2">
                  <div style={{ height: "14px", background: "var(--p-10)", borderRadius: "4px", width: "65%" }} />
                  <div style={{ height: "11px", background: "var(--p-08)", borderRadius: "4px", width: "45%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--p-15)", border: "1px solid var(--p-30)" }}>
              <Users size={28} style={{ color: "var(--theme-primary)" }} />
            </div>
            <p style={{ color: "var(--theme-text-muted)" }}>{all.length === 0 ? "لا يوجد محترفون حالياً." : "لا توجد نتائج."}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginated.map((p, i) => (
                <Link
                  key={p.id}
                  to={`/profile/${p.id}`}
                  className="group block rounded-xl overflow-hidden card-glow animate-fade-in-up"
                  style={{ background: "linear-gradient(145deg, #141414, #101010)", textDecoration: "none", animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: "forwards" }}
                >
                  {/* Photo */}
                  <div className="relative overflow-hidden" style={{ height: "140px", background: "#1a1a1a" }}>
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={40} style={{ color: "var(--p-30)" }} />
                      </div>
                    )}
                    <span className="absolute top-2.5 right-2.5 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.65)", color: "var(--theme-accent)", backdropFilter: "blur(4px)", border: "1px solid var(--p-20)" }}>
                      {typeLabel[p.type] ?? p.type}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4" style={{ background: "#141414" }}>
                    <h3 className="font-bold text-base mb-0.5 truncate" style={{ color: "#e0e8e0" }}>{p.name}</h3>
                    {p.tagline && <p className="text-xs mb-2 truncate" style={{ color: "#00a355", fontStyle: "italic" }}>{p.tagline}</p>}
                    {p.specialty && <p className="text-xs mb-2 truncate" style={{ color: "#b0bec5" }}>{p.specialty}</p>}
                    <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid rgba(0,98,51,0.15)" }}>
                      {p.location ? (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#78909c" }}>
                          <MapPin size={10} />{p.location}
                        </span>
                      ) : <span />}
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#00a355" }}>
                        الملف <ArrowLeft size={10} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg text-sm disabled:opacity-30"
                  style={{ background: "var(--p-10)", border: "1px solid var(--p-20)", color: "var(--theme-text-secondary)", cursor: page === 1 ? "not-allowed" : "pointer" }}
                >
                  السابق
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className="w-9 h-9 rounded-lg text-sm font-medium"
                      style={{
                        background: n === page ? "var(--theme-accent)" : "var(--p-10)",
                        border: "1px solid " + (n === page ? "var(--theme-accent)" : "var(--p-20)"),
                        color: n === page ? "#fff" : "var(--theme-text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg text-sm disabled:opacity-30"
                  style={{ background: "var(--p-10)", border: "1px solid var(--p-20)", color: "var(--theme-text-secondary)", cursor: page === totalPages ? "not-allowed" : "pointer" }}
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
