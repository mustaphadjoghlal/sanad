import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { subscribeToApprovedStores } from "../../lib/firestore";
import type { UserProfile } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

type StoreProfile = UserProfile & { whatsapp?: string };

export default function Stores() {
  usePageTitle("دليل متاجر العتاد الإعلامي", "دليل متاجر بيع وشراء المعدات الإعلامية في الجزائر: كاميرات، إضاءة، صوتيات وأكثر");

  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    return subscribeToApprovedStores(setStores);
  }, []);

  const filtered = stores.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.specialty?.toLowerCase().includes(q) ?? false) ||
      (s.location?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>
          سوق المعدات
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
          متاجر بيع وشراء المعدات الإعلامية في الجزائر
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="ابحث باسم المتجر، نوع المعدات أو الولاية..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-8 px-4 py-2 rounded-xl text-sm outline-none"
          style={{ background: "var(--p-10)", border: "1px solid var(--p-20)", color: "var(--theme-text, #e8f5e9)" }}
        />

        {filtered.length === 0 ? (
          <p className="text-center py-16" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
            لا توجد متاجر
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s) => (
              <Link
                key={s.id}
                to={`/stores/${s.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.02]"
                  style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}
                >
                  <div className="flex items-center gap-3">
                    {s.photo ? (
                      <img
                        src={s.photo}
                        alt={s.name}
                        className="rounded-xl object-cover flex-shrink-0"
                        style={{ width: 52, height: 52, border: "1px solid var(--p-20)" }}
                      />
                    ) : (
                      <div
                        className="rounded-xl flex-shrink-0 flex items-center justify-center text-xl font-bold"
                        style={{ width: 52, height: 52, background: "var(--p-20)", color: "var(--theme-accent, #00a355)" }}
                      >
                        🏪
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold truncate block" style={{ color: "var(--theme-text, #e8f5e9)" }}>{s.name}</span>
                      {s.specialty && (
                        <span className="text-xs truncate block" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>{s.specialty}</span>
                      )}
                    </div>
                  </div>

                  {s.storeStatus === "paid" && (
                    <span
                      className="self-start text-xs px-2.5 py-0.5 rounded-full"
                      style={{ background: "rgba(0,80,40,0.3)", color: "#66bb6a" }}
                    >
                      متجر موثّق
                    </span>
                  )}

                  {s.bio && (
                    <p
                      className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: "var(--theme-text-secondary, #a5d6a7)" }}
                    >
                      {s.bio}
                    </p>
                  )}

                  {s.location && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
                      <MapPin size={12} />
                      {s.location}
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
