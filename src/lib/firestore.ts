import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  arrayUnion,
} from "firebase/firestore";
import type { FirestoreError, UpdateData, DocumentData } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { Course, Job, Equipment, Competition, VoiceArtist, UserProfile, ThemeSettings, Channel, SiteContent, AppNotification, NewsItem, Thesis, Product, Order, TrainerCourse, CourseRegistration } from "./types";
import { DEFAULT_THEME, DEFAULT_SITE_CONTENT } from "./types";

// Generic helpers
function col(name: string) {
  return collection(db, name);
}

function docRef(colName: string, id: string) {
  return doc(db, colName, id);
}

/**
 * A listener that fails silently leaves the UI spinning forever, so every
 * subscription routes its error here: it is logged for debugging and handed
 * to the caller, which is expected to stop its loading state and say so.
 */
export function reportError(
  source: string,
  error: FirestoreError | Error,
  onError?: (error: Error) => void
) {
  console.error(`[firestore:${source}]`, error);
  onError?.(error as Error);
}

/**
 * Upper bound on every unbounded list subscription. Without it each visitor
 * downloads — and the project pays for — the entire collection on every page
 * view, and that cost grows with the archive forever.
 */
export const LIST_LIMIT = 200;

// Subscribe to a collection (real-time)
export function subscribeToCollection<T extends { id: string }>(
  colName: string,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void,
  max: number = LIST_LIMIT
) {
  const q = query(col(colName), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))),
    (error) => reportError(colName, error, onError)
  );
}

// Subscribe to featured items (featured === true AND status === 'approved' or no status)
export function subscribeToFeatured<T extends { id: string; createdAt?: number }>(
  colName: string,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col(colName), where("featured", "==", true), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as T & { status?: string }))
        .filter((item) => item.status === "approved" || !item.status)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      callback(items as T[]);
    },
    (error) => reportError(`${colName}:featured`, error, onError)
  );
}

// --- COURSES ---
export async function addCourse(data: Omit<Course, "id" | "createdAt">) {
  return addDoc(col("courses"), { ...data, createdAt: Date.now(), status: "approved", featured: false });
}
export async function updateCourse(id: string, data: Partial<Omit<Course, "id">>) {
  return updateDoc(docRef("courses", id), data);
}
export async function deleteCourse(id: string) {
  return deleteDoc(docRef("courses", id));
}

// --- JOBS ---
export async function addJob(data: Omit<Job, "id" | "createdAt">) {
  return addDoc(col("jobs"), { ...data, createdAt: Date.now(), status: "approved", featured: false });
}
export async function updateJob(id: string, data: Partial<Omit<Job, "id">>) {
  return updateDoc(docRef("jobs", id), data);
}
export async function deleteJob(id: string) {
  return deleteDoc(docRef("jobs", id));
}

// --- EQUIPMENT ---
export async function addEquipment(data: Omit<Equipment, "id" | "createdAt">) {
  // Default to approved (admin adds) but let callers pass status: "pending"
  // for user submissions that await admin approval.
  return addDoc(col("equipment"), { status: "approved", featured: false, ...data, createdAt: Date.now() });
}
export async function updateEquipment(id: string, data: Partial<Omit<Equipment, "id">>) {
  return updateDoc(docRef("equipment", id), data);
}
export async function deleteEquipment(id: string) {
  return deleteDoc(docRef("equipment", id));
}

// --- COMPETITIONS ---
export async function addCompetition(data: Omit<Competition, "id" | "createdAt">) {
  return addDoc(col("competitions"), { ...data, createdAt: Date.now(), status: "approved", featured: false });
}
export async function updateCompetition(id: string, data: Partial<Omit<Competition, "id">>) {
  return updateDoc(docRef("competitions", id), data);
}
export async function deleteCompetition(id: string) {
  return deleteDoc(docRef("competitions", id));
}

// --- VOICE ARTISTS ---
export async function addVoiceArtist(data: Omit<VoiceArtist, "id" | "createdAt">) {
  return addDoc(col("voice"), { ...data, createdAt: Date.now(), status: "approved", featured: false });
}
export async function updateVoiceArtist(id: string, data: Partial<Omit<VoiceArtist, "id">>) {
  return updateDoc(docRef("voice", id), data);
}
export async function deleteVoiceArtist(id: string) {
  return deleteDoc(docRef("voice", id));
}

// --- APPROVAL / REJECTION / FEATURED ---
export async function approveItem(colName: string, id: string) {
  return updateDoc(docRef(colName, id), { status: "approved", rejectionNote: "" });
}

export async function rejectItem(colName: string, id: string, note: string) {
  return updateDoc(docRef(colName, id), { status: "rejected", rejectionNote: note });
}

export async function toggleFeatured(colName: string, id: string, current: boolean) {
  return updateDoc(docRef(colName, id), { featured: !current });
}

// --- USER PROFILES ---
// Firestore rejects an explicit `undefined`, so optional fields the form left
// blank are dropped rather than sent. The return type is what updateDoc and
// setDoc accept for a partial write.
function stripUndefined<T extends object>(obj: T): UpdateData<DocumentData> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export async function saveUserProfile(
  uid: string,
  data: Omit<UserProfile, "id" | "createdAt" | "status" | "featured">
) {
  const clean = stripUndefined(data);
  const ref = docRef("users", uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return updateDoc(ref, clean);
  } else {
    return setDoc(ref, {
      ...clean,
      id: uid,
      status: "pending",
      featured: false,
      createdAt: Date.now(),
    });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(docRef("users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserProfile;
}

export async function getStoreByUsername(username: string): Promise<UserProfile | null> {
  // status filter is required by security rules: only approved profiles are
  // publicly readable, and Firestore rejects list queries that could match more
  const q = query(
    col("users"),
    where("username", "==", username.toLowerCase()),
    where("type", "==", "store"),
    where("status", "==", "approved")
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile;
}

export async function isUsernameAvailable(username: string, currentUid: string): Promise<boolean> {
  // Rules only allow querying approved profiles, so the check can't see
  // usernames of pending accounts — advisory only, like before.
  const q = query(col("users"), where("username", "==", username.toLowerCase()), where("status", "==", "approved"));
  const snap = await getDocs(q);
  return snap.docs.every((d) => d.id === currentUid);
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    docRef("users", uid),
    (snap) => callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null),
    (error) => reportError("users:self", error, onError)
  );
}

/**
 * Deletes the account's data. The privacy policy promises this, and the
 * button that offered it was wired to nothing.
 *
 * The auth user itself is removed by the caller, which needs the live
 * credential; here we clear what the account owns in Firestore.
 */
export async function deleteAccountData(uid: string): Promise<void> {
  await deleteDoc(doc(db, "fcmTokens", uid)).catch(() => {});
  await deleteDoc(doc(db, "users", uid));
}

export async function resubmitProfile(uid: string): Promise<void> {
  return updateDoc(doc(db, "users", uid), { status: "pending", rejectionNote: "" });
}

// --- CHANNELS ---
export async function addChannel(data: Omit<Channel, "id" | "createdAt">) {
  return addDoc(col("channels"), { ...data, createdAt: Date.now() });
}
export async function updateChannel(id: string, data: Partial<Omit<Channel, "id">>) {
  return updateDoc(docRef("channels", id), data);
}
export async function deleteChannel(id: string) {
  return deleteDoc(docRef("channels", id));
}
export function subscribeToChannels(
  callback: (items: Channel[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("channels"), orderBy("name", "asc"), limit(500));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Channel))),
    (error) => reportError("channels", error, onError)
  );
}

export function subscribeToAllProfiles(
  callback: (profiles: UserProfile[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("users"), orderBy("createdAt", "desc"), limit(1000));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile))),
    (error) => reportError("users:all", error, onError)
  );
}

export function subscribeToApprovedProfessionals(
  callback: (profiles: UserProfile[]) => void,
  onError?: (error: Error) => void
): () => void {
  // No orderBy to avoid composite index requirement — sort client-side
  const q = query(col("users"), where("status", "==", "approved"), limit(500));
  return onSnapshot(
    q,
    (snap) => {
      const profiles = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as UserProfile))
        .filter((p) => p.type !== "store")
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      callback(profiles);
    },
    (error) => reportError("users:professionals", error, onError)
  );
}

export function subscribeToApprovedStores(
  callback: (profiles: (UserProfile & { whatsapp?: string })[]) => void,
  onError?: (error: Error) => void
): () => void {
  // status filter must be in the query (not client-side): rules deny list
  // queries that could return non-approved profiles. Sort client-side to
  // avoid a composite index.
  const q = query(col("users"), where("type", "==", "store"), where("status", "==", "approved"), limit(300));
  return onSnapshot(
    q,
    (snap) => {
      const profiles = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as UserProfile & { whatsapp?: string }))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      callback(profiles);
    },
    (error) => reportError("users:stores", error, onError)
  );
}

export async function getLatestProducts(n = 4): Promise<Product[]> {
  const q = query(col("products"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

// --- THEME SETTINGS ---
const THEME_DOC = () => doc(db, "settings", "theme");

export async function saveThemeSettings(settings: ThemeSettings): Promise<void> {
  await setDoc(THEME_DOC(), settings);
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  const snap = await getDoc(THEME_DOC());
  if (!snap.exists()) return DEFAULT_THEME;
  return { ...DEFAULT_THEME, ...(snap.data() as Partial<ThemeSettings>) };
}

export function subscribeToTheme(
  callback: (theme: ThemeSettings) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    THEME_DOC(),
    (snap) => callback(snap.exists() ? { ...DEFAULT_THEME, ...(snap.data() as Partial<ThemeSettings>) } : DEFAULT_THEME),
    (error) => {
      // Fall back to the built-in theme so the site still renders.
      callback(DEFAULT_THEME);
      reportError("settings:theme", error, onError);
    }
  );
}

// --- SITE CONTENT ---
const CONTENT_DOC = () => doc(db, "settings", "content");

export async function saveSiteContent(content: SiteContent): Promise<void> {
  await setDoc(CONTENT_DOC(), content);
}

export function subscribeToSiteContent(
  callback: (content: SiteContent) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    CONTENT_DOC(),
    (snap) => callback(snap.exists() ? { ...DEFAULT_SITE_CONTENT, ...(snap.data() as Partial<SiteContent>) } : DEFAULT_SITE_CONTENT),
    (error) => {
      callback(DEFAULT_SITE_CONTENT);
      reportError("settings:content", error, onError);
    }
  );
}

// --- FCM TOKENS ---
// Admin token lives in config/adminFCM (admin-only read/write per rules).
export async function saveAdminFCMToken(token: string): Promise<void> {
  await setDoc(doc(db, "config", "adminFCM"), { token, updatedAt: Date.now() }, { merge: true });
}

// A push token is not public data, so it lives in /fcmTokens/{uid} — readable
// only by its owner, the admin, and /api/push via its service account. The
// user profile doc is world-readable once approved and must never hold one.
export async function saveUserFCMToken(uid: string, token: string): Promise<void> {
  await setDoc(doc(db, "fcmTokens", uid), { token, updatedAt: Date.now() }, { merge: true });
  // Self-healing migration: strip the token older builds wrote onto the
  // public profile. Ignore failures — the token above is what matters.
  await updateDoc(doc(db, "users", uid), { fcmToken: deleteField() }).catch(() => {});
}

// --- APP NOTIFICATIONS ---
export interface NotificationResult {
  /** The in-app notification document was written. */
  stored: boolean;
  /** A device push was actually delivered through /api/push. */
  pushed: boolean;
  reason?: string;
}

/**
 * Writes the in-app notification, then asks /api/push to deliver it to
 * devices. The push endpoint requires a signed-in caller and only lets the
 * admin target an audience, so an anonymous visitor's action (a course
 * sign-up) still records the notification for the admin without a push.
 *
 * Throws only for admin broadcasts (`targetType` set), where the admin needs
 * to know delivery failed.
 */
export async function sendNotification(
  notif: Omit<AppNotification, "id" | "readBy" | "audience">,
  targetType?: string,
  audience: "all" | "admin" = "all"
): Promise<NotificationResult> {
  await addDoc(col("notifications"), { ...notif, audience, readBy: [] });

  const user = auth.currentUser;
  if (!user) {
    const reason = "Push skipped: no signed-in user";
    if (targetType) throw new Error(reason);
    return { stored: true, pushed: false, reason };
  }

  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ title: notif.title, body: notif.body, targetType }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.ok) {
      throw new Error(result.reason || result.error || `FCM delivery failed (${res.status})`);
    }
    return { stored: true, pushed: true };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "FCM delivery failed";
    if (targetType) throw new Error(reason);
    return { stored: true, pushed: false, reason };
  }
}

/** Shared shape of a call to one of the admin-only endpoints. */
async function callAdminEndpoint(
  path: string,
  uid: string
): Promise<Record<string, unknown>> {
  const user = auth.currentUser;
  if (!user) throw new Error("يجب تسجيل الدخول كمسؤول");

  const idToken = await user.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ uid }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.ok) {
    throw new Error(
      result.code === "missing-permission"
        ? "حساب الخدمة لا يملك صلاحية إدارة الحسابات. أضف دور Firebase Authentication Admin إليه في Google Cloud."
        : res.status === 404
        ? "لا يوجد حساب بهذا المعرّف"
        : res.status === 403
        ? "هذه العملية للمسؤول فقط"
        : res.status === 503
        ? "الخدمة غير مهيّأة على الخادم"
        : "تعذّرت العملية. حاول مجدداً."
    );
  }
  return result;
}

/** What a member deletion actually managed to remove. */
export interface MemberDeletionReport {
  profileDeleted: boolean;
  authAccountDeleted: boolean;
  removed: { products: number; courses: number; registrations: number; orders: number };
  /** Arabic descriptions of anything that did not go through. */
  problems: string[];
}

/** Deletes every document a query returns, and says how many that was. */
async function deleteWhere(
  collectionName: string,
  field: string,
  value: string
): Promise<number> {
  const snapshot = await getDocs(query(col(collectionName), where(field, "==", value)));
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  return snapshot.size;
}

/**
 * Removes a member and everything that belonged to them.
 *
 * Deleting only the profile document is not enough, and leaves the site in a
 * worse state than before: a deleted store's products stay on the shelves
 * linking to a profile that no longer exists, a deleted trainer's courses
 * stay open for registration, and the orders and course registrations hold
 * other people's names and phone numbers with nobody left to act on them.
 *
 * Editorial content the admin approved into the main catalogue — jobs, news,
 * courses, equipment listings — is deliberately left alone: it was curated,
 * it stands on its own, and it is not tied to a profile page.
 *
 * Nothing here throws. Each step is attempted, and the report says exactly
 * what happened, because a delete that half-succeeds in silence is the worst
 * outcome of all.
 */
export async function adminDeleteMember(uid: string): Promise<MemberDeletionReport> {
  const report: MemberDeletionReport = {
    profileDeleted: false,
    authAccountDeleted: false,
    removed: { products: 0, courses: 0, registrations: 0, orders: 0 },
    problems: [],
  };

  const sweep = async (
    key: keyof MemberDeletionReport["removed"],
    collectionName: string,
    field: string,
    label: string
  ) => {
    try {
      report.removed[key] = await deleteWhere(collectionName, field, uid);
    } catch {
      report.problems.push(`تعذّر حذف ${label}`);
    }
  };

  await sweep("products", "products", "storeId", "منتجات المتجر");
  await sweep("orders", "orders", "storeId", "طلبات المتجر");
  await sweep("courses", "trainerCourses", "trainerId", "دورات المدرب");
  await sweep("registrations", "courseRegistrations", "trainerId", "تسجيلات الدورات");

  await deleteDoc(doc(db, "fcmTokens", uid)).catch(() => {});

  try {
    await deleteDoc(doc(db, "users", uid));
    // Read it back: a delete that reports success but leaves the document in
    // place is exactly the failure this whole function exists to rule out.
    const stillThere = await getDoc(doc(db, "users", uid));
    report.profileDeleted = !stillThere.exists();
    if (!report.profileDeleted) report.problems.push("الملف الشخصي ما زال موجوداً في قاعدة البيانات");
  } catch (e) {
    report.problems.push(
      e instanceof Error && e.message.includes("permission")
        ? "قاعدة البيانات رفضت حذف الملف الشخصي — تأكد أنك داخل بحساب الأدمن"
        : "تعذّر حذف الملف الشخصي من قاعدة البيانات"
    );
  }

  try {
    await callAdminEndpoint("/api/admin-delete-account", uid);
    report.authAccountDeleted = true;
  } catch (e) {
    report.problems.push(
      (e instanceof Error ? e.message : "تعذّر حذف حساب الدخول") +
        " (حساب الدخول فقط — لم يتأثر ما حُذف أعلاه)"
    );
  }

  return report;
}

/**
 * Leaves a remark on a member's profile, shown to them on their dashboard.
 *
 * Unlike a rejection this does not take the profile offline, so it can be
 * used to ask an approved member for a better photo without hiding them from
 * the directory meanwhile. An empty note clears it.
 */
export async function setAdminNote(uid: string, note: string): Promise<void> {
  const trimmed = note.trim();
  await updateDoc(
    doc(db, "users", uid),
    trimmed
      ? { adminNote: trimmed, adminNoteAt: Date.now() }
      : { adminNote: deleteField(), adminNoteAt: deleteField() }
  );
}

/**
 * Asks /api/admin-reset-password for a fresh password for a member's account.
 *
 * Members who never read their email cannot use the reset link, so the admin
 * — who reviews every profile by hand anyway — hands them a new password
 * directly. The endpoint refuses anyone who is not the admin.
 *
 * The returned password is shown once and never stored anywhere.
 */
export async function adminResetPassword(
  uid: string
): Promise<{ password: string; email: string | null }> {
  const result = await callAdminEndpoint("/api/admin-reset-password", uid);
  if (!result.password) throw new Error("تعذّر إنشاء كلمة مرور جديدة. حاول مجدداً.");
  return { password: result.password as string, email: (result.email as string) ?? null };
}

export function subscribeToNotifications(
  isAdmin: boolean,
  callback: (notifs: AppNotification[]) => void,
  onError?: (error: Error) => void
): () => void {
  // Admin-only notifications (new registrations, resubmissions, ...) carry
  // real names and must never reach regular users. The filter has to live in
  // the query, not in the callback: security rules reject a list query that
  // could return documents the caller may not read.
  const q = isAdmin
    ? query(col("notifications"), orderBy("createdAt", "desc"), limit(100))
    : query(col("notifications"), where("audience", "==", "all"), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification))),
    (error) => reportError("notifications", error, onError)
  );
}

export async function markNotificationRead(notifId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "notifications", notifId), { readBy: arrayUnion(uid) });
}

export async function markAllNotificationsRead(notifIds: string[], uid: string): Promise<void> {
  await Promise.all(
    notifIds.map((id) => updateDoc(doc(db, "notifications", id), { readBy: arrayUnion(uid) }))
  );
}

// --- NEWS ---
export async function addNews(data: Omit<NewsItem, "id" | "createdAt">) {
  return addDoc(col("news"), { ...data, createdAt: Date.now() });
}
export async function updateNews(id: string, data: Partial<Omit<NewsItem, "id">>) {
  return updateDoc(docRef("news", id), data);
}
export async function deleteNews(id: string) {
  return deleteDoc(docRef("news", id));
}
export function subscribeToNews(
  callback: (items: NewsItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("news"), orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem))),
    (error) => reportError("news", error, onError)
  );
}
export async function getLatestNews(n = 3): Promise<NewsItem[]> {
  const q = query(col("news"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem));
}

// --- THESES ---
export async function addThesis(data: Omit<Thesis, "id" | "createdAt">) {
  return addDoc(col("theses"), { ...data, createdAt: Date.now() });
}
export async function updateThesis(id: string, data: Partial<Omit<Thesis, "id">>) {
  return updateDoc(docRef("theses", id), data);
}
export async function deleteThesis(id: string) {
  return deleteDoc(docRef("theses", id));
}
export function subscribeToTheses(
  callback: (items: Thesis[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("theses"), orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Thesis))),
    (error) => reportError("theses", error, onError)
  );
}
export async function getThesis(id: string): Promise<Thesis | null> {
  const snap = await getDoc(docRef("theses", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Thesis;
}
export async function getNewsItem(id: string): Promise<NewsItem | null> {
  const snap = await getDoc(docRef("news", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as NewsItem;
}
export async function getChannel(id: string): Promise<import("./types").Channel | null> {
  const snap = await getDoc(docRef("channels", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as import("./types").Channel;
}

// --- PRODUCTS ---
export async function addProduct(data: Omit<Product, "id" | "createdAt">) {
  return addDoc(col("products"), { ...data, createdAt: Date.now() });
}
export async function updateProduct(id: string, data: Partial<Omit<Product, "id">>) {
  return updateDoc(docRef("products", id), data);
}
export async function deleteProduct(id: string) {
  return deleteDoc(docRef("products", id));
}
export function subscribeToStoreProducts(
  storeId: string,
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("products"), where("storeId", "==", storeId), orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))),
    (error) => reportError("products:store", error, onError)
  );
}
export function subscribeToActiveStoreProducts(
  storeId: string,
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("products"), where("storeId", "==", storeId), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))),
    (error) => reportError("products:active", error, onError)
  );
}
export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(docRef("products", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

// --- ORDERS ---
export async function addOrder(data: Omit<Order, "id" | "createdAt">) {
  return addDoc(col("orders"), { ...data, createdAt: Date.now() });
}
export async function updateOrder(id: string, data: Partial<Omit<Order, "id">>) {
  return updateDoc(docRef("orders", id), data);
}
export function subscribeToStoreOrders(
  storeId: string,
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("orders"), where("storeId", "==", storeId), orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))),
    (error) => reportError("orders", error, onError)
  );
}

// --- TRAINER COURSES ---
// `status` and `featured` are set here, never by the caller: a trainer must
// not be able to publish or feature their own course. The security rules
// enforce the same thing server-side.
export async function addTrainerCourse(
  data: Omit<TrainerCourse, "id" | "createdAt" | "status" | "featured">
) {
  return addDoc(col("trainerCourses"), { ...data, createdAt: Date.now(), status: "pending", featured: false });
}
export async function updateTrainerCourse(id: string, data: Partial<Omit<TrainerCourse, "id">>) {
  return updateDoc(docRef("trainerCourses", id), data);
}
export async function deleteTrainerCourse(id: string) {
  return deleteDoc(docRef("trainerCourses", id));
}
export function subscribeToTrainerCourses(
  trainerId: string,
  callback: (courses: TrainerCourse[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("trainerCourses"), where("trainerId", "==", trainerId), orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainerCourse))),
    (error) => reportError("trainerCourses:own", error, onError)
  );
}
export function subscribeToApprovedTrainerCourses(
  trainerId: string,
  callback: (courses: TrainerCourse[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("trainerCourses"), where("trainerId", "==", trainerId), where("status", "==", "approved"), orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainerCourse))),
    (error) => reportError("trainerCourses:approved", error, onError)
  );
}
export function subscribeToAllTrainerCourses(
  callback: (courses: TrainerCourse[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("trainerCourses"), orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainerCourse))),
    (error) => reportError("trainerCourses:all", error, onError)
  );
}
export function subscribeToApprovedTrainers(
  callback: (trainers: UserProfile[]) => void,
  onError?: (error: Error) => void
): () => void {
  // status filter must be in the query — see subscribeToApprovedStores
  const q = query(col("users"), where("type", "==", "trainer"), where("status", "==", "approved"), limit(300));
  return onSnapshot(
    q,
    (snap) => {
      const trainers = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as UserProfile))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      callback(trainers);
    },
    (error) => reportError("users:trainers", error, onError)
  );
}
export async function getTrainer(id: string): Promise<UserProfile | null> {
  const snap = await getDoc(docRef("users", id));
  if (!snap.exists()) return null;
  const profile = { id: snap.id, ...snap.data() } as UserProfile;
  if (profile.type !== "trainer") return null;
  return profile;
}

// --- COURSE REGISTRATIONS ---
export async function submitCourseRegistration(data: Omit<CourseRegistration, "id" | "createdAt">) {
  return addDoc(col("courseRegistrations"), { ...data, createdAt: Date.now() });
}
export function subscribeToTrainerRegistrations(
  trainerId: string,
  callback: (regs: CourseRegistration[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(col("courseRegistrations"), where("trainerId", "==", trainerId), orderBy("createdAt", "desc"), limit(LIST_LIMIT));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseRegistration))),
    (error) => reportError("courseRegistrations", error, onError)
  );
}
