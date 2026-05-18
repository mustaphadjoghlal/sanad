import { useState, useEffect } from "react";
import { Search, Mic, Phone } from "lucide-react";
import { subscribeToCollection } from "../../lib/firestore";
import type { VoiceArtist } from "../../lib/types";

export default function VoiceRequests() {
  const [items, setItems] = useState<VoiceArtist[]>([]);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToCollection<VoiceArtist>("voice", (data) => { setItems(data); setLoading(false); });
    return unsub;
  }, []);

  const filtered = items.filter((v) => {
    const matchSearch = v.name.includes(search) || v.description.includes(search);
    const matchSpec = specFilter ? v.specialty === specFilter : true;
    return matchSearch && matchSpec;
  });

  const specialties = [...new Set(items.map((v) => v.specialty).filter(Boolean))];

  return (
    <div style={{ background: "#0b0f0b", minHeight: "100vh" }}>
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #060a06 0%, #0b0f0b 100%)", borderBottom: "1px solid rgba(0,98,51,0.2)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(0,98,51,0.15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}><Mic size={20} style={{ color: "#00a355" }} /></div>
            <h1 className="text-4xl font-bold" style={{ color: "#e8f5e9" }}>طلبات المنشطين والمعلقين</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "#6aad6a", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>ابحث عن منشطين ومعلقين صوتيين محترفين لمشاريعك</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Join CTA */}
        <div className="rounded-xl p-6 mb-8 flex items-start gap-4 animate-fade-in-up" style={{ background: "linear-gradient(135deg, rgba(0,98,51,0.15), rgba(0,98,51,0.05))", border: "1px solid rgba(0,98,51,0.35)", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="p-3 rounded-xl flex-shrink-0 animate-float" style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}><Mic size={26} style={{ color: "#00a355" }} /></div>
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "#c8e6c9" }}>هل أنت منشط أو معلق صوتي؟</h3>
            <p className="mb-4 text-sm" style={{ color: "#6aad6a" }}>انضم إلى منصة سند وابدأ في استقبال العروض من العملاء</p>
            <button className="btn-dz px-6 py-2.5 rounded-lg text-sm"><span>انضم كمنشط</span></button>
          </div>
        </div>

        {/* Search */}
        <div className="p-5 rounded-xl mb-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #0f1a0f, #0b150b)", border: "1px solid rgba(0,98,51,0.25)", animationDelay: "0.25s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "#4a7a4a" }} />
              <input type="text" placeholder="ابحث عن منشط..." className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="select-dz px-4 py-2.5 rounded-lg text-sm" value={specFilter} onChange={(e) => setSpecFilter(e.target.value)}>
              <option value="">جميع التخصصات</option>
              {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16" style={{ color: "#3a5e3a" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "rgba(0,98,51,0.15)", border: "1px solid rgba(0,98,51,0.3)" }}>
              <Mic size={28} style={{ color: "#006233" }} />
            </div>
            <p style={{ color: "#4a7a4a" }}>{items.length === 0 ? "لا يوجد منشطون بعد." : "لا توجد نتائج."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((v, i) => (
              <div key={v.id} className="card-glow rounded-xl p-5 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #0f1a0f, #0b150b)", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(0,98,51,0.2)", border: "1px solid rgba(0,98,51,0.3)" }}>
                    <Mic size={18} style={{ color: "#00a355" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: "#c8e6c9" }}>{v.name}</h3>
                    {v.specialty && <span style={{ background: "rgba(0,98,51,0.25)", color: "#81c784", fontSize: "0.7rem", padding: "0.1rem 0.5rem", borderRadius: "9999px" }}>{v.specialty}</span>}
                  </div>
                </div>
                {v.experience && <p style={{ color: "#4a7a4a", fontSize: "0.8rem", marginBottom: "0.5rem" }}>الخبرة: {v.experience}</p>}
                {v.description && <p style={{ color: "#3a5e3a", fontSize: "0.8rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>{v.description}</p>}
                {v.contact && (
                  <div className="flex items-center gap-1" style={{ color: "#6aad6a", fontSize: "0.8rem" }}>
                    <Phone size={13} />{v.contact}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
