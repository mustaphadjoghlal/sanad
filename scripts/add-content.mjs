import { initializeApp } from "firebase/app";
import { getFirestore, addDoc, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDagcs68MqIBVuUt_EzrbSpswWGgTAuQRM",
  authDomain: "sanad-dz-f14df.firebaseapp.com",
  projectId: "sanad-dz-f14df",
  storageBucket: "sanad-dz-f14df.firebasestorage.app",
  messagingSenderId: "856869700906",
  appId: "1:856869700906:web:3c7fa812c02f1af2484a53",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
