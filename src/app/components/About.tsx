import { Link } from "react-router-dom";
import { Radio, Mail, Facebook, Users, Briefcase, BookOpen, Trophy } from "lucide-react";

export default function About() {
  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }} dir="rtl">
      {/* Hero */}
      <div className="relative py-16 px-4 overflow-hidden" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -20%, var(--p-15) 0%, transparent 60%)" }} />
        <div className="container mx-auto relative z-10 max-w-3xl text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, var(--theme-primary, #006233), var(--theme-accent, #00a355))", boxShadow: "0 0 40px rgba(0,163,85,0.2)" }}>
              <Radio size={36} color="#fff" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: "var(--theme-text)" }}>
            منصة <span style={{ color: "var(--theme-accent)" }}>سند</span>
          </h1>
          <p className="text-lg" style={{ color: "var(--theme-text-secondary)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" }}>
            المنصة الجزائرية الشاملة لمجال الإعلام والصحافة — تجمع المحترفين، الفرص، والموارد في مكان واحد.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Mission */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-20)" }}>
          <h2 className="text-2xl font-black mb-4" style={{ color: "var(--theme-text)" }}>من نحن؟</h2>
          <p className="leading-relaxed mb-4" style={{ color: "var(--theme-text-muted)", lineHeight: 1.9 }}>
            سند هي منصة رقمية جزائرية أُسِّست لتكون مرجعاً شاملاً للقطاع الإعلامي في الجزائر. نهدف إلى تمكين الإعلاميين والصحفيين والمنتجين والمصورين من بناء حضورهم الرقمي، والوصول إلى فرص العمل، والدورات التدريبية، والمسابقات المتخصصة.
          </p>
          <p className="leading-relaxed" style={{ color: "var(--theme-text-muted)", lineHeight: 1.9 }}>
            نؤمن بأن الإعلام الجزائري يستحق بنية تحتية رقمية قوية تربط أصحاب المواهب بالفرص، وتتيح للمؤسسات الإعلامية الوصول إلى الكفاءات في كل ولايات الوطن.
          </p>
        </div>

        {/* Services */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-20)" }}>
          <h2 className="text-2xl font-black mb-6" style={{ color: "var(--theme-text)" }}>خدماتنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Users, title: "دليل المحترفين", desc: "ملفات شخصية معتمدة لإعلاميي الجزائر" },
              { icon: Briefcase, title: "عروض التوظيف", desc: "فرص عمل إعلامية في جميع أنحاء الجزائر" },
              { icon: BookOpen, title: "الدورات التدريبية", desc: "برامج تدريبية في الإعلام والصحافة" },
              { icon: Trophy, title: "المسابقات", desc: "مسابقات وطنية ودولية في مجال الإعلام" },
            ].map((s) => (
              <div key={s.title} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)" }}>
                <div className="p-2 rounded-lg" style={{ background: "var(--p-20)" }}>
                  <s.icon size={16} style={{ color: "var(--theme-accent)" }} />
                </div>
                <div>
                  <p className="font-bold text-sm mb-0.5" style={{ color: "var(--theme-text)" }}>{s.title}</p>
                  <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl p-8 mb-8" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-20)" }}>
          <h2 className="text-2xl font-black mb-6" style={{ color: "var(--theme-text)" }}>تواصل معنا</h2>
          <div className="space-y-4">
            <a href="mailto:contact@sanadz.media" className="flex items-center gap-3 p-4 rounded-xl transition-colors" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-25)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-15)"; }}>
              <Mail size={18} style={{ color: "var(--theme-accent)" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>البريد الإلكتروني</p>
                <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>contact@sanadz.media</p>
              </div>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61590628561028" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl transition-colors" style={{ background: "var(--p-08)", border: "1px solid var(--p-15)", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-25)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--p-15)"; }}>
              <Facebook size={18} style={{ color: "#1877f2" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>صفحة فيسبوك</p>
                <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>منصة سند الرسمية</p>
              </div>
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/register" className="btn-dz inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-base" style={{ textDecoration: "none" }}>
            سجّل في المنصة مجاناً
          </Link>
          <p className="mt-3 text-sm" style={{ color: "var(--theme-text-dim)" }}>
            <Link to="/privacy" style={{ color: "var(--theme-text-muted)", textDecoration: "none" }}>سياسة الخصوصية</Link>
            {" · "}
            <Link to="/terms" style={{ color: "var(--theme-text-muted)", textDecoration: "none" }}>شروط الاستخدام</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
