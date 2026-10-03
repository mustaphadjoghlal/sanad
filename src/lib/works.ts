import type { Work, WorkType } from "./types";

export const WORK_LABEL: Record<WorkType, string> = {
  article: "مقال",
  video: "فيديو",
  audio: "تسجيل صوتي",
  image: "صورة",
};

/** The eleven-character id out of any of YouTube's URL shapes. */
export function youtubeId(url: string): string | null {
  return url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1] ?? null;
}

/**
 * What to show in the gallery grid.
 *
 * An uploaded cover wins; an image is its own cover; a video borrows
 * YouTube's thumbnail, so nobody has to upload one. An article without a
 * cover has none, and the card draws its icon instead.
 */
export function workCover(work: Work): string | null {
  if (work.cover) return work.cover;
  if (work.type === "image") return work.url;
  if (work.type === "video") {
    const id = youtubeId(work.url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  }
  return null;
}

/** Counts read at a glance: 1200 as "١٫٢ ألف". */
export function shortCount(n: number | undefined): string {
  const value = n ?? 0;
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1).replace(/\.0$/, "")} ألف`;
}


/**
 * Orders works the way each sort means, in the client.
 *
 * Firestore can do this itself, but only with a composite index — and when
 * that index is missing the whole listener fails rather than degrading. The
 * home page then showed an empty gallery on one load and a full one on the
 * next, depending on whether that browser happened to hold a warm cache from
 * an earlier query that did work. "Sometimes it appears" was never about the
 * works; it was about which browser had seen them before.
 */
export function sortWorks<T extends { featured: boolean; likes: number; createdAt: number }>(
  works: T[],
  sort: "newest" | "popular" | "featured"
): T[] {
  const ordered = [...works];
  if (sort === "popular") {
    ordered.sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);
  } else if (sort === "featured") {
    // A starred work stays pinned above the rest, newest first within each.
    ordered.sort(
      (a, b) => Number(b.featured) - Number(a.featured) || b.createdAt - a.createdAt
    );
  } else {
    ordered.sort((a, b) => b.createdAt - a.createdAt);
  }
  return ordered;
}
