import { Link } from "react-router-dom";

const sections = [
  {
    title: "قبول الشروط",
    content: "باستخدامك لمنصة سند أو التسجيل فيها، فإنك توافق على هذه الشروط. إذا كنت لا توافق، يرجى عدم استخدام المنصة.",
  },
  {
    title: "الحساب والمسؤولية",
    content: "أنت مسؤول عن صحة المعلومات التي تُدخلها في ملفك الشخصي. يُمنع استخدام بيانات مزيّفة أو انتحال شخصية الآخرين. يحق لنا تعليق أو حذف أي حساب ينتهك هذه الشروط.",
  },
  {
    title: "المحتوى المنشور",
    content: "يجب أن يكون المحتوى الذي تنشره (ملفك الشخصي، أعمالك، روابطك) أصيلاً ولا ينتهك حقوق الملكية الفكرية للآخرين. المنصة غير مسؤولة عن المحتوى الذي ينشره المستخدمون.",
  },
  {
    title: "الاعتماد والمراجعة",
    content: "يخضع كل ملف شخصي لمراجعة من قِبل فريق سند قبل الاعتماد والنشر. نحتفظ بالحق في رفض أو تعديل أو حذف أي محتوى لا يتوافق مع معايير المنصة.",
  },
  {
    title: "عروض التوظيف والمسابقات",
    content: "المعلومات المنشورة بشأن عروض التوظيف والمسابقات يقدّمها أطراف خارجية. منصة سند غير مسؤولة عن صحة هذه المعلومات أو نتائج التواصل مع أصحاب العروض.",
  },
  {
    title: "تعديل الشروط",
    content: "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم الإشعار بالتغييرات الجوهرية عبر البريد الإلكتروني أو المنصة. استمرار استخدامك يعني قبول الشروط المحدّثة.",
  },
  {
    title: "القانون المطبّق",
    content: "تخضع هذه الشروط للقوانين الجزائرية المعمول بها. أي نزاع يُحلّ أمام المحاكم المختصة في الجزائر العاصمة.",
  },
];

export default function Terms() {
  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }} dir="rtl">
      <div className="relative py-12 px-4" style={{ background: "linear-gradient(180deg, #080808 0%, #0e0e0e 100%)", borderBottom: "1px solid var(--p-20)" }}>
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--theme-text)" }}>شروط الاستخدام</h1>
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
            <Link to="/privacy" style={{ color: "var(--theme-text-muted)", textDecoration: "none" }}>سياسة الخصوصية</Link>
            {" · "}
            <Link to="/about" style={{ color: "var(--theme-text-muted)", textDecoration: "none" }}>من نحن</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
