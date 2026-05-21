import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { subscribeToApprovedProfessionals } from "../../lib/firestore";
import type { UserProfile, IndividualType } from "../../lib/types";
import { usePageTitle } from "../../lib/usePageTitle";

const typeLabels: Record<IndividualType, string> = {
  journalist:   "صحفي",
  voice:        "منشط صوتي",
  photographer: "مصور",
  editor:       "مونتير",
  student:      "طالب إعلام",
  other:        "أخرى",
};

const typeColors: Record<IndividualType, { bg: string; text: string }> = {
  journalist:   { bg: "rgba(0,80,40,0.3)",   text: "#66bb6a" },
  voice:        { bg: "rgba(120,60,0,0.3)",   text: "#ffa726" },
  photographer: { bg: "rgba(0,60,120,0.3)",   text: "#64b5f6" },
  editor:       { bg: "rgba(80,0,120,0.3)",   text: "#ce93d8" },
  student:      { bg: "rgba(0,100,100,0.3)",  text: "#4dd0e1" },
  other:        { bg: "var(--p-20)",           text: "var(--theme-badge-text, #81c784)" },
};

const ALL_TYPES: ("all" | IndividualType)[] = ["all", "journalist", "voice", "photographer", "editor", "student", "other"];
const typeFilterLabels: Record<string, string> = { all: "الكل", ...typeLabels };

export default function Professionals() {
  usePageTitle("دليل المحترفين", "دليل المحترفين الإعلاميين الجزائريين: صحفيون، منشطون صوتيون، مصورون، مونتيرون وطلاب إعلام");

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<"all" | IndividualType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    return subscribeToApprovedProfessionals(setProfiles);
  }, []);

  const filtered = profiles.filter((p) => {
    if (filter !== "all" && p.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.specialty?.toLowerCase().includes(q) ?? false) ||
        (p.location?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div dir="rtl" style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--theme-text, #e8f5e9)" }}>
          دليل المحترفين
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
          صحفيون، منشطون صوتيون، مصورون، مونتيرون وطلاب إعلام جزائريون
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="ابحث بالاسم، التخصص أو الولاية..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-xl text-sm outline-none"
          style={{ background: "var(--p-10)", border: "1px solid var(--p-20)", color: "var(--theme-text, #e8f5e9)" }}
        />

        {/* Type filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="px-3 py-1 rounded-full text-sm transition-all"
              style={{
                background: filter === t ? "var(--theme-accent, #00a355)" : "var(--p-10)",
                color: filter === t ? "#fff" : "var(--theme-text-dim, #3a5e3a)",
                border: "1px solid var(--p-20)",
              }}
            >
              {typeFilterLabels[t]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center py-16" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
            لا توجد نتائج
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => {
              const tColor = typeColors[p.type as IndividualType] ?? typeColors.other;
              return (
                <Link
                  key={p.id}
                  to={`/professionals/${p.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-[1.02]"
                    style={{ background: "var(--p-10)", border: "1px solid var(--p-20)" }}
                  >
                    <div className="flex items-center gap-3">
                      {p.photo ? (
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="rounded-full object-cover flex-shrink-0"
                          style={{ width: 52, height: 52, border: "2px solid var(--p-20)" }}
                        />
                      ) : (
                        <div
                          className="rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold"
                          style={{ width: 52, height: 52, background: "var(--p-20)", color: "var(--theme-accent, #00a355)" }}
                        >
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold truncate" style={{ color: "var(--theme-text, #e8f5e9)" }}>{p.name}</span>
                          {p.featured && <Star size={13} fill="currentColor" style={{ color: "#ffa726", flexShrink: 0 }} />}
                        </div>
                        {p.specialty && (
                          <span className="text-xs truncate block" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>{p.specialty}</span>
                        )}
                      </div>
                    </div>

                    <span
                      className="self-start text-xs px-2.5 py-0.5 rounded-full"
                      style={{ background: tColor.bg, color: tColor.text }}
                    >
                      {p.type === "other" && p.otherType ? p.otherType : typeLabels[p.type as IndividualType] ?? p.type}
                    </span>

                    {p.bio && (
                      <p
                        className="text-xs leading-relaxed line-clamp-2"
                        style={{ color: "var(--theme-text-secondary, #a5d6a7)" }}
                      >
                        {p.bio}
                      </p>
                    )}

                    {p.location && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: "var(--theme-text-dim, #3a5e3a)" }}>
                        <MapPin size={12} />
                        {p.location}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
