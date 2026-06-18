import { useState, useEffect } from "react";
import { Search, Mic, Phone, MapPin, User } from "lucide-react";
import { subscribeToAllProfiles } from "../../lib/firestore";
import type { UserProfile } from "../../lib/types";
import { Link } from "react-router-dom";

export default function VoiceRequests() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAllProfiles((data) => {
      setProfiles(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const hostProfiles = profiles.filter(
    (p) => p.type === "host_stage" && p.status === "approved"
  );

  const filtered = hostProfiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.bio || "").toLowerCase().includes(q) ||
      (p.specialty || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div className="relative py-12 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-3 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="p-2 rounded-lg" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
              <Mic size={20} style={{ color: "var(--theme-accent, #00a355)" }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "var(--theme-text, #e8f5e9)" }}>المنشطون على الركح</h1>
          </div>
          <p className="animate-fade-in-up" style={{ color: "var(--theme-text-secondary, #6aad6a)", paddingRight: "3.25rem", animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>
            منشطون محترفون لتنشيط فعالياتكم ومهرجاناتكم
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Join CTA */}
        <div className="rounded-xl p-5 mb-8 flex items-center gap-4 animate-fade-in-up" style={{ background: "linear-gradient(135deg, var(--p-15), var(--p-05))", border: "1px solid var(--p-35)", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="p-3 rounded-xl flex-shrink-0 animate-float" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
            <Mic size={24} style={{ color: "var(--theme-accent, #00a355)" }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1" style={{ color: "var(--theme-text, #c8e6c9)" }}>هل أنت منشط على الركح؟</h3>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>سجّل في المنصة واستقبل عروض التنشيط</p>
          </div>
          <Link to="/register" className="btn-dz px-5 py-2.5 rounded-lg text-sm flex-shrink-0" style={{ textDecoration: "none" }}>انضم الآن</Link>
        </div>

        {/* Search */}
        <div className="p-5 rounded-xl mb-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", animationDelay: "0.25s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
            <input type="text" placeholder="ابحث عن منشط..." className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state rounded-xl py-20 text-center animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float" style={{ background: "var(--p-15)", border: "1px solid var(--p-30)" }}>
              <Mic size={28} style={{ color: "var(--theme-primary, #006233)" }} />
            </div>
            <p style={{ color: "var(--theme-text-muted, #4a7a4a)" }}>
              {hostProfiles.length === 0 ? "لا يوجد منشطون بعد." : "لا توجد نتائج."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p, i) => (
              <div key={p.id} className="card-glow rounded-2xl p-5 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", animationDelay: `${i * 0.07}s`, opacity: 0, animationFillMode: "forwards" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--p-20)", border: "2px solid var(--p-30)" }}>
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={22} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: "var(--theme-text, #c8e6c9)" }}>{p.name}</h3>
                    {p.specialty && <span style={{ background: "var(--p-25)", color: "var(--theme-badge-text, #81c784)", fontSize: "0.72rem", padding: "0.1rem 0.5rem", borderRadius: "9999px" }}>{p.specialty}</span>}
                  </div>
                </div>
                {p.experience && <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>الخبرة: {p.experience}</p>}
                {p.bio && <p style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.82rem", lineHeight: 1.6, marginBottom: "0.75rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.bio}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-2 pt-2" style={{ borderTop: "1px solid var(--p-15)" }}>
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="flex items-center gap-1 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)", textDecoration: "none" }}>
                      <Phone size={13} />{p.phone}
                    </a>
                  )}
                  {p.location && (
                    <span className="flex items-center gap-1" style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.78rem" }}>
                      <MapPin size={12} />{p.location}
                    </span>
                  )}
                  <Link to={`/profile/${p.id}`} className="mr-auto text-sm" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none", fontWeight: 500 }}>
                    الملف الكامل ←
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
