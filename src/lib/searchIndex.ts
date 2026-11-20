import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { LIST_LIMIT } from "./firestore";

export type SearchCategory =
  | "jobs" | "courses" | "competitions" | "equipment" | "news"
  | "professionals" | "trainers" | "stores" | "theses";

export interface SearchEntry {
  id: string;
  title: string;
  subtitle?: string;
  /** Everything the query is matched against, already joined. */
  text: string;
  /** Stores link by username when they have one. */
  username?: string;
}

export type SearchIndex = Record<SearchCategory, SearchEntry[]>;

export const EMPTY_INDEX: SearchIndex = {
  jobs: [], courses: [], competitions: [], equipment: [], news: [],
  professionals: [], trainers: [], stores: [], theses: [],
};

/**
 * The search page's data. Normally one small, CDN-cached request to
 * /api/search-index; if that is unreachable (local `vite` dev has no /api, or
 * the endpoint is down) the same documents are read directly, once.
 */
export async function loadSearchIndex(): Promise<SearchIndex> {
  try {
    const res = await fetch("/api/search-index");
    const data = await res.json();
    if (res.ok && data?.ok && data.index) return { ...EMPTY_INDEX, ...data.index };
  } catch {
    // fall through to the direct read
  }
  return loadDirectly();
}

type Doc = Record<string, unknown> & { id: string };
const s = (v: unknown) => (typeof v === "string" ? v : "");
const join = (...parts: unknown[]) => parts.map(s).filter(Boolean).join(" ");
const approved = (d: Doc) => !d.status || d.status === "approved";

async function newest(name: string): Promise<Doc[]> {
  const snap = await getDocs(query(collection(db, name), orderBy("createdAt", "desc"), limit(LIST_LIMIT)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function loadDirectly(): Promise<SearchIndex> {
  const [jobs, courses, comps, equip, news, theses, usersSnap] = await Promise.all([
    newest("jobs"), newest("courses"), newest("competitions"), newest("equipment"),
    newest("news"), newest("theses"),
    getDocs(query(collection(db, "users"), where("status", "==", "approved"), limit(1000))),
  ]);
  const users: Doc[] = usersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Doc)
    .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));

  return {
    jobs: jobs.filter(approved).map((d) => ({ id: d.id, title: s(d.title), subtitle: s(d.company), text: join(d.title, d.company, d.location, d.jobType) })),
    courses: courses.filter(approved).map((d) => ({ id: d.id, title: s(d.title), subtitle: s(d.instructor), text: join(d.title, d.instructor, d.description) })),
    competitions: comps.filter(approved).map((d) => ({ id: d.id, title: s(d.name), subtitle: s(d.organizer), text: join(d.name, d.organizer, d.description) })),
    equipment: equip.filter(approved).map((d) => ({ id: d.id, title: s(d.name), subtitle: s(d.category), text: join(d.name, d.category, d.description) })),
    news: news.map((d) => ({ id: d.id, title: s(d.title), subtitle: s(d.category), text: join(d.title, d.body) })),
    theses: theses.map((d) => ({ id: d.id, title: s(d.title), subtitle: s(d.author), text: join(d.title, d.author, d.university, d.specialty) })),
    professionals: users.filter((u) => u.type !== "store").map((u) => ({ id: u.id, title: s(u.name), subtitle: s(u.specialty) || s(u.location), text: join(u.name, u.specialty, u.location, u.bio) })),
    trainers: users.filter((u) => u.type === "trainer").map((u) => ({ id: u.id, title: s(u.name), subtitle: s(u.specialty) || s(u.location), text: join(u.name, u.specialty, u.location, u.organization) })),
    stores: users.filter((u) => u.type === "store").map((u) => ({ id: u.id, title: s(u.name), subtitle: s(u.location), username: s(u.username) || undefined, text: join(u.name, u.specialty, u.location) })),
  };
}
