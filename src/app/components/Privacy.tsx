import { Link } from "react-router-dom";

const sections = [
  {
    title: "جمع البيانات",
    content: "نجمع المعلومات التي تقدّمها عند التسجيل (الاسم، البريد الإلكتروني، الموقع، التخصص) وكذلك الصور والملفات التي ترفعها لملفك الشخصي. لا نجمع بيانات تصفح أو نستخدم ملفات تتبع من أطراف ثالثة.",
  },
  {
    title: "استخدام البيانات",
    content: "نستخدم بياناتك لعرض ملفك الشخصي على المنصة، وإرسال إشعارات متعلقة بحسابك، وتحسين خدمات المنصة. لا نبيع بياناتك الشخصية لأي طرف ثالث.",
  },
  {
    title: "حفظ البيانات",
    content: "يتم تخزين بياناتك بشكل آمن على خوادم Firebase (Google Cloud) مع تشفير كامل. البيانات محمية بكلمة مرور لا نملك صلاحية الوصول إليها.",
  },
  {
    title: "حقوقك",
    content: "يحق لك في أي وقت: تعديل بياناتك الشخصية من لوحة التحكم، طلب حذف حسابك بالكامل، أو التواصل معنا لأي استفسار عبر contact@sanadz.media.",
  },
  {
    title: "الملفات الشخصية العامة",
    content: "عند اعتماد ملفك من قِبل الإدارة، يصبح ملفك الشخصي (الاسم، التخصص، الموقع، الصورة، البورتفوليو) مرئياً للعموم على المنصة. يمكنك طلب إخفائه أو حذفه في أي وقت.",
  },
  {
    title: "التغييرات على هذه السياسة",
    content: "قد نحدّث سياسة الخصوصية بشكل دوري. في حال وجود تغييرات جوهرية، سيتم إشعارك عبر البريد الإلكتروني المسجّل.",
  },
];

export default function Privacy() {
  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }} dir="rtl">
      <div className="relative py-12 px-4" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--theme-text)" }}>سياسة الخصوصية</h1>
          <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>آخر تحديث: يناير 2026</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title} className="rounded-xl p-6" style={{ background: "linear-gradient(145deg, #141414, #101010)", border: "1px solid var(--p-20)" }}>
              <h2 className="font-bold mb-3" style={{ color: "var(--theme-accent)" }}>{s.title}</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)", lineHeight: 1.9 }}>{s.content}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm" style={{ color: "var(--theme-text-dim)" }}>
            للاستفسار: <a href="mailto:contact@sanadz.media" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>contact@sanadz.media</a>
          </p>
          <p className="text-sm">
            <Link to="/terms" style={{ color: "var(--theme-text-muted)", textDecoration: "none" }}>شروط الاستخدام</Link>
            {" · "}
            <Link to="/about" style={{ color: "var(--theme-text-muted)", textDecoration: "none" }}>من نحن</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
