import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
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
import { db } from "./firebase";
import type { Course, Job, Equipment, Competition, VoiceArtist, UserProfile, ThemeSettings, Channel, SiteContent, AppNotification, NewsItem, Thesis } from "./types";
import { DEFAULT_THEME, DEFAULT_SITE_CONTENT } from "./types";

// Generic helpers
function col(name: string) {
  return collection(db, name);
}

function docRef(colName: string, id: string) {
  return doc(db, colName, id);
}

// Subscribe to a collection (real-time)
export function subscribeToCollection<T extends { id: string }>(
  colName: string,
  callback: (items: T[]) => void
) {
  const q = query(col(colName), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    callback(items);
  });
}

// Subscribe to featured items (featured === true AND status === 'approved' or no status)
export function subscribeToFeatured<T extends { id: string; createdAt?: number }>(
  colName: string,
  callback: (items: T[]) => void
): () => void {
  const q = query(col(colName), where("featured", "==", true));
  return onSnapshot(q, (snap) => {
    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as T & { status?: string })
      )
      .filter((item) => item.status === "approved" || !item.status)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    callback(items as T[]);
  });
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
  return addDoc(col("equipment"), { ...data, createdAt: Date.now(), status: "approved", featured: false });
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
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export async function saveUserProfile(
  uid: string,
  data: Omit<UserProfile, "id" | "createdAt" | "status" | "featured">
) {
  const clean = stripUndefined(data as Record<string, unknown>);
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

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): () => void {
  return onSnapshot(docRef("users", uid), (snap) => {
    if (!snap.exists()) {
      callback(null);
    } else {
      callback({ id: snap.id, ...snap.data() } as UserProfile);
    }
  });
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
export function subscribeToChannels(callback: (items: Channel[]) => void): () => void {
  const q = query(col("channels"), orderBy("name", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Channel)));
  });
}

export function subscribeToAllProfiles(
  callback: (profiles: UserProfile[]) => void
): () => void {
  const q = query(col("users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const profiles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
    callback(profiles);
  });
}

export function subscribeToApprovedProfessionals(
  callback: (profiles: UserProfile[]) => void
): () => void {
  const q = query(col("users"), where("status", "==", "approved"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const profiles = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as UserProfile))
      .filter((p) => p.type !== "store");
    callback(profiles);
  });
}

export function subscribeToApprovedStores(
  callback: (profiles: (UserProfile & { whatsapp?: string })[]) => void
): () => void {
  const q = query(col("users"), where("status", "==", "approved"), where("type", "==", "store"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const profiles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile & { whatsapp?: string }));
    callback(profiles);
  });
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

export function subscribeToTheme(callback: (theme: ThemeSettings) => void): () => void {
  return onSnapshot(THEME_DOC(), (snap) => {
    if (!snap.exists()) {
      callback(DEFAULT_THEME);
    } else {
      callback({ ...DEFAULT_THEME, ...(snap.data() as Partial<ThemeSettings>) });
    }
  });
}

// --- SITE CONTENT ---
const CONTENT_DOC = () => doc(db, "settings", "content");

export async function saveSiteContent(content: SiteContent): Promise<void> {
  await setDoc(CONTENT_DOC(), content);
}

export function subscribeToSiteContent(callback: (content: SiteContent) => void): () => void {
  return onSnapshot(CONTENT_DOC(), (snap) => {
    if (!snap.exists()) {
      callback(DEFAULT_SITE_CONTENT);
    } else {
      callback({ ...DEFAULT_SITE_CONTENT, ...(snap.data() as Partial<SiteContent>) });
    }
  });
}

// --- FCM TOKEN (admin push) ---
export async function saveAdminFCMToken(token: string): Promise<void> {
  await setDoc(doc(db, "config", "adminFCM"), { token, updatedAt: Date.now() });
}

// --- APP NOTIFICATIONS ---
export async function sendNotification(notif: Omit<AppNotification, "id" | "readBy">): Promise<void> {
  await addDoc(col("notifications"), { ...notif, readBy: [] });
  // Send real push notification via Vercel API route
  fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: notif.title, body: notif.body }),
  }).catch(() => {});
}

export function subscribeToNotifications(callback: (notifs: AppNotification[]) => void): () => void {
  const q = query(col("notifications"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
  });
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
export function subscribeToNews(callback: (items: NewsItem[]) => void): () => void {
  const q = query(col("news"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewsItem)));
  });
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
export function subscribeToTheses(callback: (items: Thesis[]) => void): () => void {
  const q = query(col("theses"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Thesis)));
  });
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
