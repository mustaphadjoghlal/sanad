import { Link } from "react-router-dom";
import { usePageTitle } from "../../lib/usePageTitle";

const sections = [
  {
    title: "البيانات التي نجمعها",
    content: "عند إنشاء حساب نجمع: الاسم، البريد الإلكتروني، رقم الهاتف، الولاية، التخصص، النبذة، والصور والملفات الصوتية التي ترفعها لملفك. عند إرسال طلب شراء من متجر نجمع: الاسم واللقب، رقم الهاتف، الولاية والبلدية — دون الحاجة إلى حساب. وعند التسجيل في دورة تدريبية نجمع الاسم ورقم الهاتف والبريد الإلكتروني إن أدخلته.",
  },
  {
    title: "الملفات الشخصية العامة",
    content: "بعد اعتماد ملفك من قِبل الإدارة يصبح ملفك مرئياً للعموم، ويشمل ذلك — إضافة إلى الاسم والتخصص والولاية والصورة والأعمال — بريدك الإلكتروني ورقم هاتفك، لأن الهدف من الدليل هو تمكين المؤسسات من التواصل معك مباشرة. نطلب موافقتك الصريحة على ذلك عند التسجيل، ويمكنك في أي وقت حذف رقم هاتفك أو حسابك بالكامل من لوحة التحكم.",
  },
  {
    title: "الإشعارات",
    content: "إذا سمحت بالإشعارات، يخزَّن رمز الجهاز (FCM token) الخاص بمتصفحك لدينا لإرسال التنبيهات. هذا الرمز ليس متاحاً للعموم ولا يكشف هويتك، ويُحذف تلقائياً عند سحب الإذن أو تعطيل الإشعارات من المتصفح.",
  },
  {
    title: "استخدام البيانات",
    content: "نستخدم بياناتك لعرض ملفك على المنصة، تمكين المتاجر والمدربين من التواصل معك بخصوص طلباتك وتسجيلاتك، وإرسال إشعارات متعلقة بحسابك أو بمحتوى المنصة. لا نبيع بياناتك الشخصية لأي طرف ثالث ولا نستخدمها للإعلانات.",
  },
  {
    title: "خدمات الأطراف الثالثة",
    content: "تعمل المنصة على خدمات Firebase من Google (قاعدة البيانات، المصادقة، تخزين الملفات والإشعارات) وتُستضاف على Vercel، وتُحمّل الخطوط العربية من Google Fonts. تخضع معالجة البيانات لدى هذه الخدمات لسياسات الخصوصية الخاصة بها. لا نستخدم أي أدوات تتبع إعلانية أو تحليلات سلوكية.",
  },
  {
    title: "حفظ البيانات ومدتها",
    content: "تُخزَّن بياناتك على خوادم Google Cloud مع تشفير أثناء النقل وأثناء التخزين. كلمة المرور محفوظة لدى Firebase Authentication ولا نملك صلاحية الاطلاع عليها. تبقى بيانات حسابك ما دام الحساب قائماً؛ وتُحفظ بيانات الطلبات وتسجيلات الدورات لدى المتجر أو المدرب المعني لمتابعة الطلب.",
  },
  {
    title: "حقوقك",
    content: "يحق لك في أي وقت: الاطلاع على بياناتك وتعديلها من لوحة التحكم، إخفاء ملفك أو حذف حسابك بالكامل مع بياناتك، أو طلب نسخة من بياناتك. للاستفسار أو تقديم طلب، تواصل معنا عبر صفحتنا الرسمية على فيسبوك.",
  },
  {
    title: "الأطفال",
    content: "المنصة موجّهة للمشتغلين بالإعلام وطلبته، ولا تُنشأ حسابات لمن هم دون 16 سنة. إذا علمنا بوجود حساب لقاصر دون هذه السن، نحذفه.",
  },
  {
    title: "التغييرات على هذه السياسة",
    content: "قد نحدّث سياسة الخصوصية بشكل دوري. في حال وجود تغييرات جوهرية، سيتم إشعارك عبر البريد الإلكتروني المسجّل أو عبر إشعار داخل المنصة.",
  },
];

export default function Privacy() {
  usePageTitle("سياسة الخصوصية", "كيف تجمع منصة سند بياناتك وتستعملها وتحميها، وما هي حقوقك.");
  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }} dir="rtl">
      <div className="relative py-12 px-4" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--theme-text)" }}>سياسة الخصوصية</h1>
          <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>آخر تحديث: سبتمبر 2026</p>
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
            للاستفسار: <a href="https://www.facebook.com/profile.php?id=61590628561028" target="_blank" rel="noopener noreferrer" style={{ color: "var(--theme-accent)", textDecoration: "none" }}>صفحتنا على فيسبوك</a>
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
