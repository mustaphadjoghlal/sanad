import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Search, BookOpen, Building2, UserPlus } from "lucide-react";
import { subscribeToApprovedTrainers } from "../../lib/firestore";
import type { UserProfile } from "../../lib/types";

export default function Trainers() {
  const [trainers, setTrainers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => subscribeToApprovedTrainers(setTrainers), []);

  const filtered = trainers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.specialty?.toLowerCase().includes(q) ||
      t.location?.toLowerCase().includes(q) ||
      (t.organization ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen py-12" style={{ background: "#0e0e0e" }} dir="rtl">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <p style={{ color: "var(--theme-accent)", fontSize: "0.8rem", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>
            التدريب المهني
          </p>
          <h1 className="text-4xl font-black mb-3" style={{ color: "var(--theme-text)" }}>
            المدربون ومراكز التدريب
          </h1>
          <p style={{ color: "var(--theme-text-muted)", maxWidth: "520px", margin: "0 auto 1.5rem" }}>
            دورات تدريبية احترافية في مجال الإعلام والصحافة والإنتاج
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium btn-dz"
            style={{ textDecoration: "none" }}
          >
            <UserPlus size={16} />
            سجّل كمدرب أو مركز تدريب
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--theme-text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن مدرب أو تخصص..."
            className="input-dz w-full pr-10 pl-4 py-3 rounded-xl text-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--theme-text-muted)" }}>
            <BookOpen size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p>لا يوجد مدربون حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((trainer, i) => (
              <Link
                key={trainer.id}
                to={`/trainers/${trainer.id}`}
                className="card-glow group rounded-2xl overflow-hidden animate-fade-in-up"
                style={{
                  textDecoration: "none",
                  background: "linear-gradient(145deg,#141414,#101010)",
                  border: "1px solid var(--p-20)",
                  opacity: 0,
                  animationFillMode: "forwards",
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                {/* Photo */}
                <div style={{ height: "160px", background: "var(--p-10)", position: "relative", overflow: "hidden" }}>
                  {trainer.photo ? (
                    <img src={trainer.photo} alt={trainer.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={48} style={{ color: "var(--p-30)" }} />
                    </div>
                  )}
                  {trainer.featured && (
                    <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--theme-accent)", color: "#fff" }}>
                      مميز
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1" style={{ color: "var(--theme-text)" }}>{trainer.name}</h3>
                  {trainer.organization && (
                    <p className="text-sm mb-1 flex items-center gap-1" style={{ color: "var(--theme-accent)" }}>
                      <Building2 size={13} /> {trainer.organization}
                    </p>
                  )}
                  {trainer.specialty && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2" style={{ background: "var(--p-15)", color: "var(--theme-badge-text)" }}>
                      {trainer.specialty}
                    </span>
                  )}
                  {trainer.bio && (
                    <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--theme-text-muted)" }}>{trainer.bio}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {trainer.location && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--theme-text-dim)" }}>
                        <MapPin size={12} /> {trainer.location}
                      </span>
                    )}
                    {trainer.phone && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--theme-text-dim)" }}>
                        <Phone size={12} /> {trainer.phone}
                      </span>
                    )}
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
