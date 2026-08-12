import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight, Award, BadgeCheck, BriefcaseBusiness, CalendarClock, CheckCircle2,
  Clock3, ExternalLink, Globe, Languages, Linkedin, Mail, MapPin, Mic2, Phone,
  Play, Share2, Sparkles, Twitter, User, Youtube, Instagram, Facebook,
} from "lucide-react";
import { getUserProfile } from "../../lib/firestore";
import type { UserProfile } from "../../lib/types";
import WorksSection from "./WorksSection";

const typeLabel: Record<string, string> = {
  editor_news: "محرر أخبار", web_digital: "ويب ديجيتال", presenter_programs: "مقدم برامج",
  presenter_news: "مقدم أخبار", monteur: "مونتير", graphic_designer: "جرافيك ديزاينر",
  cameraman: "كاميرا مان", producer: "منتج", director: "مخرج", program_writer: "معد برامج",
  voice: "معلق صوتي", host_stage: "منشط على الركح", student: "طالب إعلام",
  journalist: "صحفي / مراسل", photographer: "مصور", editor: "مخرج / مونتير",
  store: "متجر عتاد", trainer: "مدرب", other: "إعلامي",
};

const workLabels: Record<string, string> = {
  article: "مقالات", video: "فيديوهات", audio: "أعمال صوتية", image: "صور",
};

function safeTags(values?: string[]) {
  return (values ?? []).map((v) => v.trim()).filter(Boolean);
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors"
      style={{ color: "var(--theme-text)", background: "var(--p-10)", border: "1px solid var(--p-25)" }}
    >
      <Share2 size={15} />
      {copied ? "تم نسخ الرابط" : "مشاركة الملف"}
    </button>
  );
}

function SocialLinks({ profile }: { profile: UserProfile }) {
  const links = profile.socialLinks;
  if (!links || !Object.values(links).some(Boolean)) return null;
  const items = [
    { key: "instagram", label: "Instagram", icon: Instagram, color: "#e1306c" },
    { key: "facebook", label: "Facebook", icon: Facebook, color: "#1877f2" },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0a66c2" },
    { key: "youtube", label: "YouTube", icon: Youtube, color: "#ff4d4d" },
    { key: "twitter", label: "X", icon: Twitter, color: "#d6e5d6" },
    { key: "website", label: "الموقع", icon: Globe, color: "var(--theme-accent)" },
  ] as const;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label, icon: Icon, color }) => {
        const href = links[key];
        if (!href) return null;
        return (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs" style={{ color, border: "1px solid var(--p-25)", textDecoration: "none", background: "var(--p-06)" }}>
            <Icon size={13} /> {label}
          </a>
        );
      })}
    </div>
  );
}

function EmptyShowcase({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl p-6 text-center" style={{ border: "1px dashed var(--p-30)", background: "var(--p-06)" }}>
      <Sparkles size={22} className="mx-auto mb-2" style={{ color: "var(--theme-accent)" }} />
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--theme-text)" }}>{label}</p>
      <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>{text}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getUserProfile(id).then((p) => { setProfile(p); setLoading(false); }).catch(() => { setProfile(null); setLoading(false); });
  }, [id]);

  const languages = useMemo(() => safeTags(profile?.languages), [profile?.languages]);
  const voiceStyles = useMemo(() => safeTags(profile?.voiceStyles), [profile?.voiceStyles]);
  const services = useMemo(() => safeTags(profile?.services), [profile?.services]);
  const sampleCount = (profile?.audioSamples?.length ?? 0) + (profile?.works?.filter((w) => w.type === "audio").length ?? 0);
  const workCount = profile?.works?.length ?? 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e0e0e" }}>
      <div className="w-9 h-9 rounded-full border-2 animate-spin" style={{ borderColor: "var(--theme-accent) transparent transparent transparent" }} />
    </div>
  );

  if (!profile || profile.status !== "approved") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#0e0e0e", color: "var(--theme-text)" }} dir="rtl">
      <User size={42} style={{ color: "var(--p-35)" }} />
      <p>الملف الشخصي غير موجود أو لم يعتمد بعد</p>
      <Link to="/professionals" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>العودة إلى دليل المحترفين</Link>
    </div>
  );

  const displayType = typeLabel[profile.type] ?? profile.type;
  const portfolioLinks = [...(profile.portfolio ?? []), ...(profile.portfolioVideos ?? []).map((v) => ({ label: v.title, url: v.url }))];
  const hasProfessionalDetails = Boolean(profile.specialty || profile.experience || profile.achievements || profile.organization || profile.availability);

  return (
    <div className="min-h-screen py-8 md:py-12" style={{ background: "radial-gradient(circle at 50% 0%, var(--p-10), transparent 32%), #0e0e0e" }} dir="rtl">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to="/professionals" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--theme-text-muted)", textDecoration: "none" }}>
            <ArrowRight size={15} /> دليل المحترفين
          </Link>
          <ShareButton />
        </div>

        <section className="overflow-hidden rounded-3xl mb-6" style={{ background: "linear-gradient(145deg,#151b17,#0f130f)", border: "1px solid var(--p-25)", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
          <div className="relative h-36 md:h-48 overflow-hidden" style={{ background: "linear-gradient(115deg, var(--theme-primary), #073a25 52%, #07140d)" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 78% 20%, rgba(0,163,85,.45), transparent 35%), linear-gradient(90deg, rgba(0,0,0,.15), rgba(0,0,0,.55))" }} />
            <div className="absolute left-6 top-5 hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs" style={{ background: "rgba(0,0,0,.28)", color: "#d8f5de", border: "1px solid rgba(255,255,255,.12)" }}>
              <BadgeCheck size={14} style={{ color: "#7ee8a2" }} /> ملف موثق على سند
            </div>
          </div>

          <div className="px-5 pb-6 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-14 relative">
              <div className="h-28 w-28 md:h-32 md:w-32 shrink-0 rounded-3xl overflow-hidden" style={{ border: "5px solid #151b17", background: "#1a241c", boxShadow: "0 12px 28px rgba(0,0,0,.35)" }}>
                {profile.photo ? <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={45} style={{ color: "var(--p-40)" }} /></div>}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-black" style={{ color: "var(--theme-text)" }}>{profile.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ color: "#91e6aa", background: "rgba(0,163,85,.14)", border: "1px solid rgba(0,163,85,.28)" }}><CheckCircle2 size={13} /> معتمد</span>
                </div>
                {profile.tagline && <p className="text-base mb-2" style={{ color: "var(--theme-accent)" }}>{profile.tagline}</p>}
                <div className="flex flex-wrap gap-2 text-xs" style={{ color: "var(--theme-text-muted)" }}>
                  <span className="rounded-full px-3 py-1.5" style={{ background: "var(--p-12)", color: "var(--theme-badge-text)" }}>{displayType}</span>
                  {profile.location && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>}
                  {profile.organization && <span>• {profile.organization}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                {profile.phone && <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--theme-accent)", color: "#07130b", textDecoration: "none" }}><Phone size={15} /> اتصل الآن</a>}
                {profile.email && <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ border: "1px solid var(--p-30)", color: "var(--theme-text)", textDecoration: "none" }}><Mail size={15} /> مراسلة</a>}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "التخصص", value: profile.specialty || displayType, icon: BriefcaseBusiness },
            { label: "الخبرة", value: profile.experience || "غير محددة", icon: Award },
            { label: "عينات صوتية", value: String(sampleCount), icon: Mic2 },
            { label: "أعمال منشورة", value: String(workCount), icon: Play },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: "linear-gradient(145deg,#141914,#101410)", border: "1px solid var(--p-20)" }}>
              <Icon size={17} style={{ color: "var(--theme-accent)", marginBottom: "0.7rem" }} />
              <p className="text-xs mb-1" style={{ color: "var(--theme-text-muted)" }}>{label}</p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--theme-text)" }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          <main className="space-y-6">
            <section className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(145deg,#141914,#101410)", border: "1px solid var(--p-20)" }}>
              <div className="flex items-center gap-2 mb-4"><Sparkles size={18} style={{ color: "var(--theme-accent)" }} /><h2 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>نبذة مهنية</h2></div>
              {profile.bio ? <p className="text-sm leading-8 whitespace-pre-line" style={{ color: "var(--theme-text-muted)" }}>{profile.bio}</p> : <EmptyShowcase label="لم تتم إضافة النبذة بعد" text="سيظهر هنا التعريف المهني والخدمات التي يقدمها صاحب الملف." />}
            </section>

            {hasProfessionalDetails && (
              <section className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(145deg,#141914,#101410)", border: "1px solid var(--p-20)" }}>
                <div className="flex items-center gap-2 mb-5"><BriefcaseBusiness size={18} style={{ color: "var(--theme-accent)" }} /><h2 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>الملف المهني</h2></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.specialty && <div><p className="text-xs mb-1" style={{ color: "var(--theme-accent)" }}>التخصص الرئيسي</p><p className="text-sm" style={{ color: "var(--theme-text)" }}>{profile.specialty}</p></div>}
                  {profile.experience && <div><p className="text-xs mb-1" style={{ color: "var(--theme-accent)" }}>سنوات الخبرة</p><p className="text-sm" style={{ color: "var(--theme-text)" }}>{profile.experience}</p></div>}
                  {profile.organization && <div><p className="text-xs mb-1" style={{ color: "var(--theme-accent)" }}>الجهة / المؤسسة</p><p className="text-sm" style={{ color: "var(--theme-text)" }}>{profile.organization}</p></div>}
                  {profile.availability && <div><p className="text-xs mb-1" style={{ color: "var(--theme-accent)" }}>الحالة</p><p className="inline-flex items-center gap-1.5 text-sm" style={{ color: profile.availability === "available" ? "#7ee8a2" : "#fbbf24" }}><Clock3 size={14} />{profile.availability === "available" ? "متاح للعمل" : "مشغول حالياً"}</p></div>}
                </div>
                {profile.achievements && <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--p-15)" }}><p className="text-xs mb-2" style={{ color: "#fbbf24" }}>أبرز الإنجازات</p><p className="text-sm leading-7 whitespace-pre-line" style={{ color: "var(--theme-text-muted)" }}>{profile.achievements}</p></div>}
              </section>
            )}

            {services.length > 0 && <section className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(145deg,#141914,#101410)", border: "1px solid var(--p-20)" }}><div className="flex items-center gap-2 mb-4"><CheckCircle2 size={18} style={{ color: "var(--theme-accent)" }} /><h2 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>الخدمات</h2></div><div className="flex flex-wrap gap-2">{services.map((v) => <span key={v} className="rounded-full px-3 py-2 text-xs" style={{ color: "var(--theme-badge-text)", background: "var(--p-12)", border: "1px solid var(--p-20)" }}>{v}</span>)}</div></section>}

            {profile.audioSamples && profile.audioSamples.length > 0 ? (
              <section className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(145deg,#141914,#101410)", border: "1px solid var(--p-20)" }}>
                <div className="flex items-center justify-between gap-3 mb-5"><div className="flex items-center gap-2"><Mic2 size={19} style={{ color: "var(--theme-accent)" }} /><h2 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>عينات الأداء الصوتي</h2></div><span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>{profile.audioSamples.length} عينات</span></div>
                <div className="space-y-3">
                  {profile.audioSamples.map((sample, i) => <div key={`${sample.url}-${i}`} className="rounded-2xl p-4" style={{ background: "#0d120e", border: "1px solid var(--p-15)" }}><div className="flex items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2 min-w-0"><div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--p-15)", color: "var(--theme-accent)" }}><Play size={14} /></div><span className="text-sm font-semibold truncate" style={{ color: "var(--theme-text)" }}>{sample.title}</span></div><span className="rounded-full px-2.5 py-1 text-[11px] shrink-0" style={{ color: "var(--theme-accent)", background: "var(--p-12)" }}>{sample.category}</span></div><audio controls preload="metadata" src={sample.url} style={{ width: "100%", height: "38px" }} /></div>)}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(145deg,#141914,#101410)", border: "1px solid var(--p-20)" }}><div className="flex items-center gap-2 mb-4"><Mic2 size={18} style={{ color: "var(--theme-accent)" }} /><h2 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>عينات الأداء الصوتي</h2></div><EmptyShowcase label="لا توجد عينات صوتية بعد" text="يمكن لصاحب الملف إضافة عينات دوبلاج أو إعلانات أو وثائقيات من لوحة التحكم." /></section>
            )}

            {profile.works && profile.works.length > 0 ? <WorksSection works={profile.works} title="الأعمال والمعرض" /> : <section className="rounded-2xl p-5 md:p-6" style={{ background: "linear-gradient(145deg,#141914,#101410)", border: "1px solid var(--p-20)" }}><div className="flex items-center gap-2 mb-4"><BriefcaseBusiness size={18} style={{ color: "var(--theme-accent)" }} /><h2 className="text-lg font-bold" style={{ color: "var(--theme-text)" }}>الأعمال والمعرض</h2></div><EmptyShowcase label="المعرض فارغ حالياً" text="أضف فيديوهات أو صوراً أو روابط أعمالك ليشاهدها العملاء والمؤسسات." /></section>}
          </main>

          <aside className="space-y-6">
            {(languages.length > 0 || voiceStyles.length > 0) && <section className="rounded-2xl p-5" style={{ background: "linear-gradient(145deg,#141914,#101410)", border: "1px solid var(--p-20)" }}><div className="flex items-center gap-2 mb-5"><Languages size={18} style={{ color: "var(--theme-accent)" }} /><h2 className="text-base font-bold" style={{ color: "var(--theme-text)" }}>المهارات الصوتية</h2></div>{languages.length > 0 && <div className="mb-5"><p className="text-xs mb-2" style={{ color: "var(--theme-text-muted)" }}>اللغات واللهجات</p><div className="flex flex-wrap gap-2">{languages.map((v) => <span key={v} className="rounded-full px-2.5 py-1 text-xs" style={{ color: "var(--theme-badge-text)", background: "var(--p-12)", border: "1px solid var(--p-20)" }}>{v}</span>)}</div></div>}{voiceStyles.length > 0 && <div><p className="text-xs mb-2" style={{ color: "var(--theme-text-muted)" }}>الأساليب الصوتية</p><div className="flex flex-wrap gap-2">{voiceStyles.map((v) => <span key={v} className="rounded-full px-2.5 py-1 text-xs" style={{ color: "var(--theme-badge-text)", background: "var(--p-12)", border: "1px solid var(--p-20)" }}>{v}</span>)}</div></div>}</section>}

            {portfolioLinks.length > 0 && <section className="rounded-2xl p-5" style={{ background: "linear-gradient(145deg,#141914,#101410)", border: "1px solid var(--p-20)" }}><div className="flex items-center gap-2 mb-4"><ExternalLink size={17} style={{ color: "var(--theme-accent)" }} /><h2 className="text-base font-bold" style={{ color: "var(--theme-text)" }}>روابط خارجية</h2></div><div className="space-y-2">{portfolioLinks.map((link, i) => <a key={`${link.url}-${i}`} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm" style={{ color: "var(--theme-badge-text)", background: "var(--p-08)", border: "1px solid var(--p-15)", textDecoration: "none" }}><span className="truncate">{link.label || link.url}</span><ExternalLink size={13} /></a>)}</div></section>}

            <section className="rounded-2xl p-5" style={{ background: "linear-gradient(145deg, rgba(0,98,51,.22), rgba(15,20,15,.9))", border: "1px solid rgba(0,163,85,.28)" }}><div className="flex items-center gap-2 mb-3"><CalendarClock size={18} style={{ color: "var(--theme-accent)" }} /><h2 className="text-base font-bold" style={{ color: "var(--theme-text)" }}>هل تريد التعاون؟</h2></div><p className="text-sm leading-7 mb-4" style={{ color: "var(--theme-text-muted)" }}>تواصل مباشرة مع {profile.name} عبر بيانات الاتصال المتاحة في هذا الملف.</p><div className="flex flex-col gap-2">{profile.phone && <a href={`tel:${profile.phone}`} className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold" style={{ color: "#07130b", background: "var(--theme-accent)", textDecoration: "none" }}><Phone size={15} /> اتصال مباشر</a>}{profile.email && <a href={`mailto:${profile.email}`} className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm" style={{ color: "var(--theme-text)", border: "1px solid var(--p-25)", textDecoration: "none" }}><Mail size={15} /> إرسال بريد إلكتروني</a>}</div></section>

            <SocialLinks profile={profile} />
          </aside>
        </div>

        <div className="text-center py-8"><Link to="/professionals" style={{ color: "var(--theme-text-muted)", fontSize: "0.8rem", textDecoration: "none" }}>منصة <span style={{ color: "var(--theme-accent)" }}>سند</span> — دليل المواهب الإعلامية الجزائرية</Link></div>
      </div>
    </div>
  );
}
