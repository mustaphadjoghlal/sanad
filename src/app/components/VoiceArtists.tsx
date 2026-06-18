import { useState, useEffect, useRef } from "react";
import { Search, Mic, Phone, MapPin, Play, Pause, User, Youtube } from "lucide-react";
import { subscribeToAllProfiles } from "../../lib/firestore";
import type { UserProfile, AudioSample, VoiceSampleCategory } from "../../lib/types";
import { VOICE_SAMPLE_CATEGORIES } from "../../lib/types";
import { Link } from "react-router-dom";

type Tab = "voice" | "host";

function ytId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

export default function VoiceArtists() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [tab, setTab] = useState<Tab>("voice");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [categoryFilter, setCategoryFilter] = useState<VoiceSampleCategory | "">("");
  const [loading, setLoading] = useState(true);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllProfiles((data) => {
      setProfiles(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const voiceProfiles = profiles.filter((p) => p.type === "voice" && p.status === "approved");
  const hostProfiles = profiles.filter((p) => p.type === "host_stage" && p.status === "approved");

  const currentProfiles = tab === "voice" ? voiceProfiles : hostProfiles;

  const filtered = currentProfiles.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      (p.bio || "").toLowerCase().includes(q) ||
      (p.tagline || "").toLowerCase().includes(q) ||
      (p.specialty || "").toLowerCase().includes(q);
    if (tab === "voice") {
      const matchGender = genderFilter === "all" || p.gender === genderFilter;
      const matchCategory = !categoryFilter || p.audioSamples?.some((s) => s.category === categoryFilter);
      return matchSearch && matchGender && matchCategory;
    }
    return matchSearch;
  });

  const usedCategories = [
    ...new Set(voiceProfiles.flatMap((p) => p.audioSamples?.map((s) => s.category) ?? [])),
  ];

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  const togglePlay = (key: string, url: string) => {
    if (playingKey === key) {
      audioRef.current?.pause();
      setPlayingKey(null);
      setProgress(0);
      setDuration(0);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.addEventListener("timeupdate", () => setProgress(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.onended = () => { setPlayingKey(null); setProgress(0); setDuration(0); };
    audioRef.current = audio;
    setPlayingKey(key);
    setProgress(0);
    setDuration(0);
  };

  const handleTabChange = (t: Tab) => {
    audioRef.current?.pause();
    setPlayingKey(null);
    setProgress(0);
    setDuration(0);
    setTab(t);
    setSearch("");
    setGenderFilter("all");
    setCategoryFilter("");
  };

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="relative py-14 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 animate-fade-in-up" style={{ background: "var(--p-15)", border: "1px solid var(--p-30)", opacity: 0, animationFillMode: "forwards" }}>
            <Mic size={16} style={{ color: "var(--theme-accent, #00a355)" }} />
            <span style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.85rem", fontWeight: 600 }}>أصوات احترافية</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 animate-fade-in-up" style={{ color: "var(--theme-text, #e8f5e9)", opacity: 0, animationFillMode: "forwards", animationDelay: "0.1s" }}>
            منشطون / معلقون صوتيون
          </h1>
          <p className="text-lg animate-fade-in-up" style={{ color: "var(--theme-text-secondary, #6aad6a)", opacity: 0, animationFillMode: "forwards", animationDelay: "0.2s" }}>
            اختر الصوت الذي يناسب مشروعك — أصوات عديدة ومتنوعة
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex justify-center mb-8 animate-fade-in-up" style={{ opacity: 0, animationFillMode: "forwards", animationDelay: "0.15s" }}>
          <div className="inline-flex rounded-xl overflow-hidden" style={{ background: "var(--p-10)", border: "1px solid var(--p-25)", padding: "4px" }}>
            {([
              ["voice", "المعلقون الصوتيون", voiceProfiles.length],
              ["host", "المنشطون", hostProfiles.length],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => handleTabChange(key as Tab)}
                className="px-6 py-3 text-sm font-bold transition-all rounded-lg flex items-center gap-2"
                style={{
                  background: tab === key ? "var(--theme-accent, #00a355)" : "transparent",
                  color: tab === key ? "#fff" : "var(--theme-text-secondary, #a5d6a7)",
                  border: "none",
                  cursor: "pointer",
                  minWidth: "160px",
                  justifyContent: "center",
                }}
              >
                {label}
                <span style={{
                  background: tab === key ? "rgba(255,255,255,0.2)" : "var(--p-20)",
                  color: tab === key ? "#fff" : "var(--theme-text-muted, #4a7a4a)",
                  fontSize: "0.7rem",
                  padding: "0.1rem 0.45rem",
                  borderRadius: "9999px",
                }}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Join CTA */}
        <div className="rounded-xl p-5 mb-8 flex items-center gap-4 animate-fade-in-up" style={{ background: "linear-gradient(135deg, var(--p-15), var(--p-05))", border: "1px solid var(--p-35)", animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="p-3 rounded-xl flex-shrink-0 animate-float" style={{ background: "var(--p-20)", border: "1px solid var(--p-30)" }}>
            <Mic size={24} style={{ color: "var(--theme-accent, #00a355)" }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1" style={{ color: "var(--theme-text, #c8e6c9)" }}>
              {tab === "voice" ? "هل أنت معلق صوتي؟" : "هل أنت منشط على الركح؟"}
            </h3>
            <p className="text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)" }}>
              {tab === "voice" ? "سجّل في المنصة وأضف عيّناتك الصوتية" : "سجّل في المنصة واستقبل عروض التنشيط"}
            </p>
          </div>
          <Link to="/register" className="btn-dz px-5 py-2.5 rounded-lg text-sm flex-shrink-0" style={{ textDecoration: "none" }}>انضم الآن</Link>
        </div>

        {/* Filters */}
        <div className="p-5 rounded-xl mb-8 animate-fade-in-up" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-25)", animationDelay: "0.25s", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
              <input
                type="text"
                placeholder={tab === "voice" ? "ابحث باسم المعلق..." : "ابحث باسم المنشط..."}
                className="input-dz w-full pr-10 pl-4 py-2.5 rounded-lg text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {tab === "voice" && (
              <>
                <div className="flex gap-2">
                  {([["all", "الكل"], ["male", "ذكر"], ["female", "أنثى"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setGenderFilter(val)}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: genderFilter === val ? "var(--theme-accent, #00a355)" : "var(--p-15)",
                        color: genderFilter === val ? "#fff" : "var(--theme-text-secondary, #a5d6a7)",
                        border: `1px solid ${genderFilter === val ? "var(--theme-accent, #00a355)" : "var(--p-30)"}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {usedCategories.length > 0 && (
                  <select
                    className="select-dz px-4 py-2.5 rounded-lg text-sm"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as VoiceSampleCategory | "")}
                  >
                    <option value="">جميع التصنيفات</option>
                    {VOICE_SAMPLE_CATEGORIES.filter((c) => usedCategories.includes(c)).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </>
            )}
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
              {currentProfiles.length === 0
                ? (tab === "voice" ? "لا يوجد معلقون بعد." : "لا يوجد منشطون بعد.")
                : "لا توجد نتائج."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, i) =>
              tab === "voice" ? (
                <VoiceCard
                  key={p.id}
                  profile={p}
                  index={i}
                  playingKey={playingKey}
                  progress={pct}
                  progressTime={progress}
                  duration={duration}
                  formatTime={formatTime}
                  onTogglePlay={togglePlay}
                  categoryFilter={categoryFilter}
                />
              ) : (
                <HostCard key={p.id} profile={p} index={i} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Host Card (المنشطون) ─────────────────────────────────────────── */

function HostCard({ profile, index }: { profile: UserProfile; index: number }) {
  const videos = profile.portfolioVideos ?? [];
  const firstVideo = videos.length > 0 ? videos[0] : null;
  const thumbId = firstVideo ? ytId(firstVideo.url) : null;

  return (
    <div
      className="card-glow rounded-2xl overflow-hidden animate-fade-in-up"
      style={{
        background: "linear-gradient(145deg, #141414, #101010)",
        border: "1px solid var(--p-25)",
        animationDelay: `${index * 0.07}s`,
        opacity: 0,
        animationFillMode: "forwards",
      }}
    >
      {/* Video thumbnail */}
      {thumbId && (
        <a
          href={firstVideo!.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative"
          style={{ aspectRatio: "16/9", overflow: "hidden" }}
        >
          <img
            src={`https://img.youtube.com/vi/${thumbId}/mqdefault.jpg`}
            alt={firstVideo!.title || "فيديو"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,0,0,0.85)" }}
            >
              <Play size={20} color="#fff" style={{ marginRight: "-2px" }} />
            </div>
          </div>
          {firstVideo!.title && (
            <div className="absolute bottom-0 right-0 left-0 px-3 py-2" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
              <p style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 500 }}>{firstVideo!.title}</p>
            </div>
          )}
        </a>
      )}

      {/* Profile info */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--p-20)", border: "2px solid var(--p-30)" }}>
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={22} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg" style={{ color: "var(--theme-text, #c8e6c9)" }}>{profile.name}</h3>
            {profile.tagline && (
              <p style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.8rem", fontWeight: 500 }}>{profile.tagline}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.specialty && (
            <span style={{ background: "var(--p-20)", color: "var(--theme-badge-text, #81c784)", fontSize: "0.72rem", padding: "0.15rem 0.55rem", borderRadius: "9999px" }}>
              {profile.specialty}
            </span>
          )}
          {profile.experience && (
            <span style={{ background: "rgba(180,120,0,0.1)", color: "#fbbf24", fontSize: "0.72rem", padding: "0.15rem 0.55rem", borderRadius: "9999px", border: "1px solid rgba(180,120,0,0.2)" }}>
              خبرة: {profile.experience}
            </span>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.82rem", lineHeight: 1.7, marginBottom: "0.5rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {profile.bio}
          </p>
        )}

        {/* More videos count */}
        {videos.length > 1 && (
          <div className="flex items-center gap-1.5 mb-2" style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.75rem" }}>
            <Youtube size={13} />
            <span>{videos.length} مقطع فيديو</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex flex-wrap items-center gap-3" style={{ borderTop: "1px solid var(--p-15)" }}>
        {profile.phone && (
          <a href={`tel:${profile.phone}`} className="flex items-center gap-1 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)", textDecoration: "none" }}>
            <Phone size={13} />{profile.phone}
          </a>
        )}
        {profile.location && (
          <span className="flex items-center gap-1" style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.78rem" }}>
            <MapPin size={12} />{profile.location}
          </span>
        )}
        <Link to={`/profile/${profile.id}`} className="mr-auto text-sm" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none", fontWeight: 500 }}>
          الملف الكامل ←
        </Link>
      </div>
    </div>
  );
}

/* ─── Voice Card (المعلقون الصوتيون) ──────────────────────────────── */

function VoiceCard({
  profile, index, playingKey, progress, progressTime, duration, formatTime, onTogglePlay, categoryFilter,
}: {
  profile: UserProfile; index: number; playingKey: string | null;
  progress: number; progressTime: number; duration: number;
  formatTime: (s: number) => string; onTogglePlay: (key: string, url: string) => void;
  categoryFilter: string;
}) {
  const samples: AudioSample[] = categoryFilter
    ? (profile.audioSamples ?? []).filter((s) => s.category === categoryFilter)
    : profile.audioSamples ?? [];

  const isAnyPlaying = samples.some((_, i) => playingKey === `${profile.id}-${i}`);

  return (
    <div
      className="card-glow rounded-2xl overflow-hidden animate-fade-in-up"
      style={{
        background: "linear-gradient(145deg, #141414, #101010)",
        border: isAnyPlaying ? "1px solid var(--theme-accent, #00a355)" : "1px solid var(--p-25)",
        animationDelay: `${index * 0.07}s`,
        opacity: 0,
        animationFillMode: "forwards",
        transition: "border-color 0.3s",
      }}
    >
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--p-20)", border: "2px solid var(--p-30)" }}>
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={24} style={{ color: "var(--theme-text-muted, #4a7a4a)" }} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg" style={{ color: "var(--theme-text, #c8e6c9)" }}>{profile.name}</h3>
            {profile.tagline && (
              <p style={{ color: "var(--theme-accent, #00a355)", fontSize: "0.8rem", fontWeight: 500 }}>{profile.tagline}</p>
            )}
          </div>
          {profile.gender && (
            <span style={{ background: "var(--p-15)", color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.7rem", padding: "0.2rem 0.6rem", borderRadius: "9999px", border: "1px solid var(--p-25)" }}>
              {profile.gender === "male" ? "ذكر" : "أنثى"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {profile.specialty && (
            <span style={{ background: "var(--p-20)", color: "var(--theme-badge-text, #81c784)", fontSize: "0.72rem", padding: "0.15rem 0.55rem", borderRadius: "9999px" }}>
              {profile.specialty}
            </span>
          )}
          {profile.experience && (
            <span style={{ background: "rgba(180,120,0,0.1)", color: "#fbbf24", fontSize: "0.72rem", padding: "0.15rem 0.55rem", borderRadius: "9999px", border: "1px solid rgba(180,120,0,0.2)" }}>
              خبرة: {profile.experience}
            </span>
          )}
        </div>

        {profile.bio && (
          <p style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.82rem", lineHeight: 1.7, marginBottom: "0.5rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {profile.bio}
          </p>
        )}
      </div>

      {samples.length > 0 && (
        <div style={{ borderTop: "1px solid var(--p-15)", padding: "0.75rem 1.25rem", background: "var(--p-05)" }}>
          <p style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            عيّنات صوتية ({samples.length})
          </p>
          <div className="flex flex-col gap-2">
            {samples.map((sample, i) => {
              const key = `${profile.id}-${profile.audioSamples?.indexOf(sample) ?? i}`;
              const isPlaying = playingKey === key;
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all" style={{ background: isPlaying ? "var(--p-20)" : "var(--p-10)", border: isPlaying ? "1px solid var(--p-40)" : "1px solid var(--p-20)" }}>
                  <button
                    onClick={() => onTogglePlay(key, sample.url)}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: isPlaying ? "var(--theme-accent, #00a355)" : "var(--p-25)", border: "none", cursor: "pointer" }}
                  >
                    {isPlaying ? <Pause size={14} color="#fff" /> : <Play size={14} color="var(--theme-accent, #00a355)" style={{ marginRight: "-1px" }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ color: isPlaying ? "var(--theme-accent, #00a355)" : "var(--theme-text, #c8e6c9)", fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sample.title}
                      </span>
                      <span style={{ background: "var(--p-20)", color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "4px", flexShrink: 0 }}>
                        {sample.category}
                      </span>
                    </div>
                    {isPlaying && (
                      <div className="mt-1.5">
                        <div style={{ width: "100%", height: "4px", background: "var(--p-20)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${progress}%`, height: "100%", background: "var(--theme-accent, #00a355)", borderRadius: "2px", transition: "width 0.2s" }} />
                        </div>
                        <div className="flex justify-between mt-0.5" style={{ color: "var(--theme-text-dim, #3a5e3a)", fontSize: "0.65rem" }}>
                          <span>{formatTime(progressTime)}</span>
                          {duration > 0 && <span>{formatTime(duration)}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-5 py-3 flex flex-wrap items-center gap-3" style={{ borderTop: "1px solid var(--p-15)" }}>
        {profile.phone && (
          <a href={`tel:${profile.phone}`} className="flex items-center gap-1 text-sm" style={{ color: "var(--theme-text-secondary, #6aad6a)", textDecoration: "none" }}>
            <Phone size={13} />{profile.phone}
          </a>
        )}
        {profile.location && (
          <span className="flex items-center gap-1" style={{ color: "var(--theme-text-muted, #4a7a4a)", fontSize: "0.78rem" }}>
            <MapPin size={12} />{profile.location}
          </span>
        )}
        <Link to={`/profile/${profile.id}`} className="mr-auto text-sm" style={{ color: "var(--theme-accent, #00a355)", textDecoration: "none", fontWeight: 500 }}>
          الملف الكامل ←
        </Link>
      </div>
    </div>
  );
}
