/**
 * Security-rule tests. These assert the holes the audit found stay closed,
 * and — just as important — that the app's own flows still work.
 *
 * Run: npm run test:rules   (needs the Firestore emulator)
 */
import { readFileSync } from "node:fs";
import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteDoc, deleteField, addDoc, collection, getDocs, query, where } from "firebase/firestore";

const ADMIN = "admin@sanadz.media";
let env;

const admin = () => env.authenticatedContext("admin-uid", { email: ADMIN }).firestore();
const user = (uid = "user1") => env.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore();
const guest = () => env.unauthenticatedContext().firestore();

const profile = (over = {}) => ({
  id: "user1", email: "user1@example.com", name: "مستخدم", type: "journalist",
  bio: "", status: "pending", featured: false, createdAt: Date.now(), ...over,
});

const order = (over = {}) => ({
  productId: "p1", productName: "كاميرا", storeId: "store1",
  buyerFirstName: "أمين", buyerLastName: "بن علي", buyerPhone: "0551234567",
  wilaya: "الجزائر", city: "باب الوادي", quantity: 1,
  status: "pending", createdAt: Date.now(), ...over,
});

const notification = (over = {}) => ({
  title: "عنوان", body: "نص", createdAt: Date.now(), readBy: [], audience: "admin", ...over,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "sanad-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

afterAll(() => env?.cleanup());
beforeEach(() => env.clearFirestore());

async function seed(fn) {
  await env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}

describe("users — self-approval", () => {
  beforeEach(() => seed((db) => setDoc(doc(db, "users/user1"), profile())));

  it("BLOCKS a user approving their own profile", async () => {
    await assertFails(updateDoc(doc(user(), "users/user1"), { status: "approved" }));
  });

  it("BLOCKS a user featuring themselves on the homepage", async () => {
    await assertFails(updateDoc(doc(user(), "users/user1"), { featured: true }));
  });

  it("BLOCKS changing account type to bypass a review queue", async () => {
    await assertFails(updateDoc(doc(user(), "users/user1"), { type: "store" }));
  });

  it("ALLOWS editing ordinary profile fields", async () => {
    await assertSucceeds(updateDoc(doc(user(), "users/user1"), { bio: "نبذة جديدة", phone: "0551234567" }));
  });

  it("ALLOWS the admin to approve", async () => {
    await assertSucceeds(updateDoc(doc(admin(), "users/user1"), { status: "approved" }));
  });

  it("ALLOWS a rejected profile to be resubmitted by its owner", async () => {
    await seed((db) => setDoc(doc(db, "users/user1"), profile({ status: "rejected" })));
    await assertSucceeds(updateDoc(doc(user(), "users/user1"), { status: "pending", rejectionNote: "" }));
  });

  it("BLOCKS jumping straight from rejected to approved", async () => {
    await seed((db) => setDoc(doc(db, "users/user1"), profile({ status: "rejected" })));
    await assertFails(updateDoc(doc(user(), "users/user1"), { status: "approved" }));
  });

  it("BLOCKS creating an already-approved account", async () => {
    await assertFails(setDoc(doc(user("user2"), "users/user2"), profile({ id: "user2", status: "approved" })));
  });

  it("ALLOWS creating a pending account", async () => {
    await assertSucceeds(setDoc(doc(user("user2"), "users/user2"), profile({ id: "user2" })));
  });
});

describe("users — the admin's note", () => {
  beforeEach(() => seed((db) => setDoc(doc(db, "users/user1"), profile({ adminNote: "حسّن صورتك" }))));

  it("ALLOWS the admin to leave a note", async () => {
    await assertSucceeds(
      updateDoc(doc(admin(), "users/user1"), { adminNote: "رقم هاتفك لا يعمل", adminNoteAt: Date.now() })
    );
  });

  it("ALLOWS the admin to clear it", async () => {
    await assertSucceeds(
      updateDoc(doc(admin(), "users/user1"), { adminNote: deleteField(), adminNoteAt: deleteField() })
    );
  });

  it("BLOCKS the member writing their own note", async () => {
    await assertFails(updateDoc(doc(user(), "users/user1"), { adminNote: "كل شيء ممتاز" }));
  });

  it("BLOCKS the member deleting the note", async () => {
    await assertFails(updateDoc(doc(user(), "users/user1"), { adminNote: deleteField() }));
  });

  it("BLOCKS erasing the note while resubmitting", async () => {
    await seed((db) => setDoc(doc(db, "users/user1"), profile({ status: "rejected", adminNote: "حسّن صورتك" })));
    await assertFails(
      updateDoc(doc(user(), "users/user1"), { status: "pending", rejectionNote: "", adminNote: "" })
    );
  });

  it("ALLOWS a resubmission that leaves the note alone", async () => {
    await seed((db) => setDoc(doc(db, "users/user1"), profile({ status: "rejected", adminNote: "حسّن صورتك" })));
    await assertSucceeds(updateDoc(doc(user(), "users/user1"), { status: "pending", rejectionNote: "" }));
  });

  it("ALLOWS the member to keep editing their profile while a note stands", async () => {
    await assertSucceeds(updateDoc(doc(user(), "users/user1"), { bio: "نبذة محدّثة" }));
  });
});

describe("users — deletion", () => {
  // A store with something to leave behind: its own products, the orders
  // placed against them, and a push token.
  beforeEach(() => seed(async (db) => {
    await setDoc(doc(db, "users/user1"), profile({ type: "store", status: "approved" }));
    await setDoc(doc(db, "fcmTokens/user1"), { token: "t", updatedAt: Date.now() });
    await setDoc(doc(db, "products/prod1"), { storeId: "user1", name: "ميكروفون", price: 100 });
    await setDoc(doc(db, "products/prod2"), { storeId: "user1", name: "سماعة", price: 50 });
    await setDoc(doc(db, "products/other"), { storeId: "user2", name: "كاميرا", price: 900 });
    await setDoc(doc(db, "orders/order1"), order({ storeId: "user1" }));
    await setDoc(doc(db, "orders/other"), order({ storeId: "user2" }));
    await setDoc(doc(db, "trainerCourses/c1"), { trainerId: "user1", title: "دورة", status: "approved", featured: false });
    await setDoc(doc(db, "courseRegistrations/r1"), { trainerId: "user1", courseId: "c1", name: "طالب", phone: "0551234567", createdAt: Date.now() });
  }));

  it("ALLOWS the admin to delete a member's profile, and it is really gone", async () => {
    await assertSucceeds(deleteDoc(doc(admin(), "users/user1")));
    const after = await getDoc(doc(admin(), "users/user1"));
    expect(after.exists()).toBe(false);
  });

  it("ALLOWS the admin to delete their push token too", async () => {
    await assertSucceeds(deleteDoc(doc(admin(), "fcmTokens/user1")));
  });

  it("BLOCKS one member deleting another", async () => {
    await assertFails(deleteDoc(doc(user("user2"), "users/user1")));
  });

  it("ALLOWS the admin to sweep the member's products, orders, courses and registrations", async () => {
    for (const path of ["products/prod1", "products/prod2", "orders/order1", "trainerCourses/c1", "courseRegistrations/r1"]) {
      await assertSucceeds(deleteDoc(doc(admin(), path)));
    }
  });

  it("ALLOWS the admin to find exactly that member's content, and nobody else's", async () => {
    const db = admin();
    const products = await getDocs(query(collection(db, "products"), where("storeId", "==", "user1")));
    const orders = await getDocs(query(collection(db, "orders"), where("storeId", "==", "user1")));
    expect(products.size).toBe(2);
    expect(orders.size).toBe(1); // the other store's order is left alone
  });

  it("leaves another store's products untouched after the sweep", async () => {
    const db = admin();
    const mine = await getDocs(query(collection(db, "products"), where("storeId", "==", "user1")));
    await Promise.all(mine.docs.map((d) => deleteDoc(d.ref)));
    const survivor = await getDoc(doc(db, "products/other"));
    expect(survivor.exists()).toBe(true);
  });
});

describe("push tokens", () => {
  it("BLOCKS reading another user's push token", async () => {
    await seed((db) => setDoc(doc(db, "fcmTokens/user1"), { token: "secret" }));
    await assertFails(getDoc(doc(user("user2"), "fcmTokens/user1")));
    await assertFails(getDoc(doc(guest(), "fcmTokens/user1")));
  });

  it("ALLOWS a user to write their own", async () => {
    await assertSucceeds(setDoc(doc(user(), "fcmTokens/user1"), { token: "t", updatedAt: Date.now() }));
  });

  it("BLOCKS planting a token on the public profile", async () => {
    await seed((db) => setDoc(doc(db, "users/user1"), profile()));
    await assertFails(updateDoc(doc(user(), "users/user1"), { fcmToken: "planted" }));
  });
});

describe("notifications", () => {
  it("BLOCKS a visitor broadcasting to every user", async () => {
    await assertFails(addDoc(collection(guest(), "notifications"), notification({ audience: "all" })));
    await assertFails(addDoc(collection(user(), "notifications"), notification({ audience: "all" })));
  });

  it("ALLOWS the admin to broadcast", async () => {
    await assertSucceeds(addDoc(collection(admin(), "notifications"), notification({ audience: "all" })));
  });

  it("ALLOWS a user action to raise an admin-only alert", async () => {
    await assertSucceeds(addDoc(collection(guest(), "notifications"), notification({ audience: "admin" })));
  });

  it("BLOCKS an external link in a notification", async () => {
    await assertFails(addDoc(collection(guest(), "notifications"), notification({ link: "https://evil.example" })));
  });

  it("ALLOWS an internal link", async () => {
    await assertSucceeds(addDoc(collection(guest(), "notifications"), notification({ link: "/jobs" })));
  });

  it("BLOCKS a user reading admin-audience notifications", async () => {
    await seed((db) => setDoc(doc(db, "notifications/n1"), notification({ audience: "admin" })));
    await assertFails(getDoc(doc(user(), "notifications/n1")));
  });

  it("ALLOWS the query the app actually runs for a normal user", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "notifications/n1"), notification({ audience: "all" }));
      await setDoc(doc(db, "notifications/n2"), notification({ audience: "admin" }));
    });
    const snap = await assertSucceeds(
      getDocs(query(collection(user(), "notifications"), where("audience", "==", "all")))
    );
    expect(snap.size).toBe(1);
  });

  it("BLOCKS marking someone else as having read a notification", async () => {
    await seed((db) => setDoc(doc(db, "notifications/n1"), notification({ audience: "all" })));
    await assertFails(updateDoc(doc(user(), "notifications/n1"), { readBy: ["someone-else"] }));
  });

  it("ALLOWS marking it read for yourself", async () => {
    await seed((db) => setDoc(doc(db, "notifications/n1"), notification({ audience: "all" })));
    await assertSucceeds(updateDoc(doc(user(), "notifications/n1"), { readBy: ["user1"] }));
  });
});

describe("orders", () => {
  it("ALLOWS a guest to place a well-formed order", async () => {
    await assertSucceeds(addDoc(collection(guest(), "orders"), order()));
  });

  it("BLOCKS an order with no phone number", async () => {
    const { buyerPhone, ...withoutPhone } = order();
    await assertFails(addDoc(collection(guest(), "orders"), withoutPhone));
  });

  it("BLOCKS a malformed phone number", async () => {
    await assertFails(addDoc(collection(guest(), "orders"), order({ buyerPhone: "not-a-phone" })));
  });

  it("BLOCKS arbitrary junk fields", async () => {
    await assertFails(addDoc(collection(guest(), "orders"), order({ payload: "x".repeat(50) })));
  });

  it("BLOCKS an oversized note", async () => {
    await assertFails(addDoc(collection(guest(), "orders"), order({ note: "x".repeat(2000) })));
  });

  it("BLOCKS a rival store reading someone else's orders", async () => {
    await seed((db) => setDoc(doc(db, "orders/o1"), order()));
    await assertFails(getDoc(doc(user("store2"), "orders/o1")));
  });

  it("ALLOWS the owning store to read and advance its order", async () => {
    await seed((db) => setDoc(doc(db, "orders/o1"), order()));
    await assertSucceeds(getDoc(doc(user("store1"), "orders/o1")));
    await assertSucceeds(updateDoc(doc(user("store1"), "orders/o1"), { status: "in_delivery" }));
  });

  it("BLOCKS a store rewriting the buyer's details", async () => {
    await seed((db) => setDoc(doc(db, "orders/o1"), order()));
    await assertFails(updateDoc(doc(user("store1"), "orders/o1"), { buyerPhone: "0000000000" }));
  });
});

describe("products", () => {
  it("BLOCKS a non-store account from publishing", async () => {
    await seed((db) => setDoc(doc(db, "users/user1"), profile({ status: "approved", type: "journalist" })));
    await assertFails(addDoc(collection(user(), "products"), { storeId: "user1", name: "x", price: 1, quantity: 1, status: "active", createdAt: Date.now(), description: "", category: "أخرى" }));
  });

  it("BLOCKS an unapproved store from publishing", async () => {
    await seed((db) => setDoc(doc(db, "users/user1"), profile({ status: "pending", type: "store" })));
    await assertFails(addDoc(collection(user(), "products"), { storeId: "user1", name: "x", price: 1, quantity: 1, status: "active", createdAt: Date.now(), description: "", category: "أخرى" }));
  });

  it("ALLOWS an approved store", async () => {
    await seed((db) => setDoc(doc(db, "users/user1"), profile({ status: "approved", type: "store" })));
    await assertSucceeds(addDoc(collection(user(), "products"), { storeId: "user1", name: "x", price: 1, quantity: 1, status: "active", createdAt: Date.now(), description: "", category: "أخرى" }));
  });
});

describe("trainer courses", () => {
  it("BLOCKS a trainer self-publishing an approved course", async () => {
    await assertFails(addDoc(collection(user("t1"), "trainerCourses"), { trainerId: "t1", title: "د", status: "approved", featured: false, createdAt: Date.now(), description: "", type: "free", duration: "", location: "", schedule: "" }));
  });

  it("BLOCKS a trainer approving their own pending course", async () => {
    await seed((db) => setDoc(doc(db, "trainerCourses/c1"), { trainerId: "t1", title: "د", status: "pending", featured: false, createdAt: Date.now() }));
    await assertFails(updateDoc(doc(user("t1"), "trainerCourses/c1"), { status: "approved" }));
  });

  it("ALLOWS a trainer to submit and edit their own pending course", async () => {
    await assertSucceeds(addDoc(collection(user("t1"), "trainerCourses"), { trainerId: "t1", title: "د", status: "pending", featured: false, createdAt: Date.now(), description: "", type: "free", duration: "", location: "", schedule: "" }));
    await seed((db) => setDoc(doc(db, "trainerCourses/c1"), { trainerId: "t1", title: "د", status: "pending", featured: false, createdAt: Date.now() }));
    await assertSucceeds(updateDoc(doc(user("t1"), "trainerCourses/c1"), { title: "عنوان محدّث" }));
  });
});

describe("course registrations", () => {
  const reg = (over = {}) => ({ courseId: "c1", courseTitle: "دورة", trainerId: "t1", name: "سارة", phone: "0551234567", createdAt: Date.now(), ...over });

  it("ALLOWS a guest to sign up", async () => {
    await assertSucceeds(addDoc(collection(guest(), "courseRegistrations"), reg()));
  });

  it("BLOCKS junk fields and bad phone numbers", async () => {
    await assertFails(addDoc(collection(guest(), "courseRegistrations"), reg({ phone: "abc" })));
    await assertFails(addDoc(collection(guest(), "courseRegistrations"), reg({ junk: "x" })));
  });

  it("BLOCKS reading another trainer's registrants (PII)", async () => {
    await seed((db) => setDoc(doc(db, "courseRegistrations/r1"), reg()));
    await assertFails(getDoc(doc(user("t2"), "courseRegistrations/r1")));
    await assertFails(getDoc(doc(guest(), "courseRegistrations/r1")));
  });

  it("ALLOWS the owning trainer to read them", async () => {
    await seed((db) => setDoc(doc(db, "courseRegistrations/r1"), reg()));
    await assertSucceeds(getDoc(doc(user("t1"), "courseRegistrations/r1")));
  });
});

describe("admin config", () => {
  it("BLOCKS the public reading the admin's push token", async () => {
    await seed((db) => setDoc(doc(db, "config/adminFCM"), { token: "admin-token" }));
    await assertFails(getDoc(doc(guest(), "config/adminFCM")));
    await assertFails(getDoc(doc(user(), "config/adminFCM")));
  });

  it("ALLOWS the admin", async () => {
    await seed((db) => setDoc(doc(db, "config/adminFCM"), { token: "admin-token" }));
    await assertSucceeds(getDoc(doc(admin(), "config/adminFCM")));
  });
});

describe("public content stays public and admin-only stays admin-only", () => {
  it("lets a visitor read published content", async () => {
    await seed((db) => setDoc(doc(db, "jobs/j1"), { title: "وظيفة", createdAt: Date.now() }));
    await assertSucceeds(getDoc(doc(guest(), "jobs/j1")));
  });

  it("stops a visitor writing content", async () => {
    await assertFails(addDoc(collection(guest(), "jobs"), { title: "spam", createdAt: Date.now() }));
    await assertFails(addDoc(collection(user(), "news"), { title: "spam", createdAt: Date.now() }));
  });

  it("lets the admin write content", async () => {
    await assertSucceeds(addDoc(collection(admin(), "jobs"), { title: "وظيفة", createdAt: Date.now() }));
  });

  it("lets a visitor read an approved profile but not a pending one", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "users/ok"), profile({ id: "ok", status: "approved" }));
      await setDoc(doc(db, "users/pending"), profile({ id: "pending", status: "pending" }));
    });
    await assertSucceeds(getDoc(doc(guest(), "users/ok")));
    await assertFails(getDoc(doc(guest(), "users/pending")));
  });

  it("lets a user submit equipment for review but not pre-approved", async () => {
    await assertSucceeds(addDoc(collection(user(), "equipment"), { name: "كاميرا", submittedBy: "user1", status: "pending", featured: false, createdAt: Date.now() }));
    await assertFails(addDoc(collection(user(), "equipment"), { name: "كاميرا", submittedBy: "user1", status: "approved", featured: false, createdAt: Date.now() }));
  });
});

describe("the app's real write payloads", () => {
  // These mirror exactly what the client sends, so a rules change that looks
  // fine in isolation cannot quietly break a screen.

  it("accepts the full profile payload the user dashboard sends", async () => {
    await seed((db) => setDoc(doc(db, "users/user1"), profile({ status: "approved", type: "journalist" })));
    // Note it re-sends `type` and `storeStatus` unchanged — Firestore's diff()
    // only reports keys whose value actually changed, so this must pass.
    await assertSucceeds(updateDoc(doc(user(), "users/user1"), {
      name: "اسم محدّث",
      type: "journalist",
      bio: "نبذة",
      photo: "https://example.com/p.jpg",
      specialty: "مونتاج",
      location: "الجزائر",
      phone: "0551234567",
      tagline: "سطر تعريفي",
      languages: ["العربية", "الفرنسية"],
      works: [{ id: "w1", type: "article", title: "مقال", url: "https://example.com" }],
      socialLinks: { facebook: "https://facebook.com/x" },
      availability: "available",
    }));
  });

  it("accepts the profile the registration form creates", async () => {
    await assertSucceeds(setDoc(doc(user("newbie"), "users/newbie"), {
      id: "newbie",
      email: "newbie@example.com",
      name: "مستخدم جديد",
      type: "store",
      bio: "وصف المتجر",
      status: "pending",
      featured: false,
      createdAt: Date.now(),
      location: "وهران",
      phone: "0551234567",
      whatsapp: "0551234567",
      storeStatus: "trial",
    }));
  });

  it("accepts the exact order the product page sends", async () => {
    await assertSucceeds(addDoc(collection(guest(), "orders"), {
      productId: "p1",
      productName: "كاميرا Sony",
      storeId: "store1",
      buyerFirstName: "أمين",
      buyerLastName: "بن علي",
      buyerPhone: "0551234567",
      wilaya: "الجزائر",
      city: "باب الوادي",
      quantity: 2,
      note: "أرجو الاتصال مساءً",
      status: "pending",
      createdAt: Date.now(),
    }));
  });

  it("accepts an order with the optional note omitted", async () => {
    const { note, ...withoutNote } = order();
    await assertSucceeds(addDoc(collection(guest(), "orders"), withoutNote));
  });

  it("accepts the notification the registration flow raises", async () => {
    await assertSucceeds(addDoc(collection(user("newbie"), "notifications"), {
      title: "مستخدم جديد 🎉",
      body: "فلان سجّل في المنصة كـ محترف إعلامي",
      link: "/sanad-admin",
      createdAt: Date.now(),
      readBy: [],
      audience: "admin",
    }));
  });

  it("accepts the notification a guest course sign-up raises", async () => {
    await assertSucceeds(addDoc(collection(guest(), "notifications"), {
      title: "طلب تسجيل جديد في دورتك",
      body: 'سارة طلبت التسجيل في "دورة المونتاج"',
      link: "/user/dashboard",
      createdAt: Date.now(),
      readBy: [],
      audience: "admin",
    }));
  });

  it("accepts the admin broadcast the dashboard sends", async () => {
    await assertSucceeds(addDoc(collection(admin(), "notifications"), {
      title: "وظيفة جديدة: مصور",
      body: "قناة الشروق — الجزائر",
      link: "/jobs",
      createdAt: Date.now(),
      readBy: [],
      audience: "all",
    }));
  });

  it("accepts the course registration the trainer page sends", async () => {
    await assertSucceeds(addDoc(collection(guest(), "courseRegistrations"), {
      courseId: "c1",
      courseTitle: "دورة المونتاج",
      trainerId: "t1",
      name: "سارة بن يوسف",
      phone: "0551234567",
      email: "sara@example.com",
      wilaya: "قسنطينة",
      note: "مبتدئة",
      createdAt: Date.now(),
    }));
  });

  it("accepts the token write the FCM registration performs", async () => {
    await assertSucceeds(setDoc(doc(user(), "fcmTokens/user1"), { token: "abc123", updatedAt: Date.now() }, { merge: true }));
  });
});

describe("legacy fcmToken migration", () => {
  // Profiles written by older builds still carry a token on the public doc.
  // saveUserFCMToken strips it on the next sign-in, so removal must be allowed
  // — and a profile that still has one must stay editable in the meantime,
  // otherwise a user who never re-grants notifications is locked out of their
  // own profile forever.
  beforeEach(() => seed((db) => setDoc(doc(db, "users/user1"), profile({ fcmToken: "legacy-token" }))));

  it("ALLOWS removing the legacy token", async () => {
    await assertSucceeds(updateDoc(doc(user(), "users/user1"), { fcmToken: deleteField() }));
  });

  it("ALLOWS editing a profile that still carries one", async () => {
    await assertSucceeds(updateDoc(doc(user(), "users/user1"), { bio: "نبذة" }));
  });

  it("BLOCKS replacing it with a new token", async () => {
    await assertFails(updateDoc(doc(user(), "users/user1"), { fcmToken: "new-token" }));
  });
});
