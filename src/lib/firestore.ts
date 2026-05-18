import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Course, Job, Equipment, Competition, VoiceArtist } from "./types";

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

// --- COURSES ---
export async function addCourse(data: Omit<Course, "id" | "createdAt">) {
  return addDoc(col("courses"), { ...data, createdAt: Date.now() });
}
export async function updateCourse(id: string, data: Partial<Omit<Course, "id">>) {
  return updateDoc(docRef("courses", id), data);
}
export async function deleteCourse(id: string) {
  return deleteDoc(docRef("courses", id));
}

// --- JOBS ---
export async function addJob(data: Omit<Job, "id" | "createdAt">) {
  return addDoc(col("jobs"), { ...data, createdAt: Date.now() });
}
export async function updateJob(id: string, data: Partial<Omit<Job, "id">>) {
  return updateDoc(docRef("jobs", id), data);
}
export async function deleteJob(id: string) {
  return deleteDoc(docRef("jobs", id));
}

// --- EQUIPMENT ---
export async function addEquipment(data: Omit<Equipment, "id" | "createdAt">) {
  return addDoc(col("equipment"), { ...data, createdAt: Date.now() });
}
export async function updateEquipment(id: string, data: Partial<Omit<Equipment, "id">>) {
  return updateDoc(docRef("equipment", id), data);
}
export async function deleteEquipment(id: string) {
  return deleteDoc(docRef("equipment", id));
}

// --- COMPETITIONS ---
export async function addCompetition(data: Omit<Competition, "id" | "createdAt">) {
  return addDoc(col("competitions"), { ...data, createdAt: Date.now() });
}
export async function updateCompetition(id: string, data: Partial<Omit<Competition, "id">>) {
  return updateDoc(docRef("competitions", id), data);
}
export async function deleteCompetition(id: string) {
  return deleteDoc(docRef("competitions", id));
}

// --- VOICE ARTISTS ---
export async function addVoiceArtist(data: Omit<VoiceArtist, "id" | "createdAt">) {
  return addDoc(col("voice"), { ...data, createdAt: Date.now() });
}
export async function updateVoiceArtist(id: string, data: Partial<Omit<VoiceArtist, "id">>) {
  return updateDoc(docRef("voice", id), data);
}
export async function deleteVoiceArtist(id: string) {
  return deleteDoc(docRef("voice", id));
}
