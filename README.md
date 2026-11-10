# منصة سند الإعلامية — sanadz.media

المنصة الجزائرية الإعلامية الشاملة: دليل المحترفين، معرض الأعمال، الوظائف،
الدورات، المسابقات، المعدات، المتاجر، المدربون، ودليل القنوات.

## البنية

| الجزء | المكان |
| --- | --- |
| الواجهة (React + Vite + Tailwind) | `src/` |
| قاعدة البيانات والملفات والدخول | Firebase (Firestore، Storage، Auth) |
| قواعد الأمان | `firestore.rules`، `storage.rules` |
| دوال الخادم (Vercel) | `api/` — الإشعارات، إدارة الحسابات، صفحات محركات البحث، خريطة الموقع |

## التشغيل محلياً

```bash
cp .env.example .env   # ثم املأ قيم Firebase
npm ci
npm run dev
```

## الفحوص

```bash
npm run typecheck
npm run lint
npm test                # اختبارات الوحدات
npm run build

# اختبارات قواعد الأمان — تحتاج Java ومحاكي Firestore
npx firebase-tools@13.29.1 emulators:exec --only firestore \
  --project sanad-rules-test "npm run test:rules"
```

## النشر

- **الواجهة ودوال الخادم:** تُنشر على Vercel تلقائياً عند الدمج. متغيرات
  البيئة موثّقة في `.env.example`.
- **قواعد الأمان والفهارس لا تُنشر مع الموقع.** بعد أي تعديل عليها:

  ```bash
  npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
  ```

  تعديل في `firestore.rules` أو `storage.rules` لا أثر له حتى يُنفَّذ هذا الأمر.
