/**
 * Seeds content into Firestore.
 *
 * Run with the admin credentials in the environment:
 *   SANAD_ADMIN_EMAIL=... SANAD_ADMIN_PASSWORD=... node scripts/add-content.mjs
 *
 * The script used to run unauthenticated, which meant every write was rejected
 * by firestore.rules (jobs and news are admin-only) — it could not have worked.
 * Config now comes from the environment too, rather than being hardcoded.
 */
import { initializeApp } from "firebase/app";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { readFileSync } from "node:fs";

// Load .env / .env.local without adding a dependency.
for (const file of [".env", ".env.local"]) {
  try {
    for (const line of readFileSync(new URL(`../${file}`, import.meta.url), "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Optional file.
  }
}

const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
  "SANAD_ADMIN_EMAIL",
  "SANAD_ADMIN_PASSWORD",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  console.error("See .env.example.");
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Writes to these collections require the admin account.
await signInWithEmailAndPassword(
  getAuth(app),
  process.env.SANAD_ADMIN_EMAIL,
  process.env.SANAD_ADMIN_PASSWORD
);

async function addJob(data) {
  const ref = await addDoc(collection(db, "jobs"), {
    ...data,
    createdAt: Date.now(),
    status: "approved",
    featured: false,
  });
  console.log("✅ تمت إضافة الوظيفة:", ref.id);
  return ref.id;
}

async function addNews(data) {
  const ref = await addDoc(collection(db, "news"), {
    ...data,
    createdAt: Date.now(),
  });
  console.log("✅ تمت إضافة الخبر:", ref.id);
  return ref.id;
}

// ── أضف المحتوى هنا ──────────────────────────────────────────────

await addJob({
  title: "تقني أنفوغرافيا — قسم الواب",
  company: "قناة الوطنية TV",
  jobType: "إعلام مرئي",
  location: "الجزائر",
  employmentType: "parttime",
  description: `تبحث قناة الوطنية عن تقني أنفوغرافيا لدعم فريقها في قسم الواب

الشروط:
• خبرة في تصميم الصور والفيديوهات والتركيب
• إتقان تام لبرامج: Premiere Pro، Photoshop، Illustrator، After Effects

توقيت العمل: من الرابعة مساء إلى العاشرة ليلاً

للتقديم: أرسل سيرتك الذاتية مع Portfolio على البريد:
ELWATANIA.WEB@YAHOO.COM`,
});

process.exit(0);
