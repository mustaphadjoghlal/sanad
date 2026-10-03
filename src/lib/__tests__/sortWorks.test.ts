import { describe, it, expect } from "vitest";
import { sortWorks } from "../works";

/**
 * The gallery's ordering, done in the client.
 *
 * Firestore can order this itself, but only with a composite index — and a
 * missing index does not degrade, it fails the whole listener. The home page
 * then showed the gallery on one load and nothing on the next, depending on
 * whether that browser held a warm cache from an earlier query that worked.
 * This is the fallback, so it has to mean exactly what the query meant.
 */
const work = (over: { id: string; featured?: boolean; likes?: number; createdAt: number }) => ({
  featured: false, likes: 0, ...over,
});

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe("featured ordering", () => {
  it("pins a starred work above an unstarred one, however old it is", () => {
    const rows = sortWorks([
      work({ id: "new-plain", createdAt: 300 }),
      work({ id: "old-starred", createdAt: 100, featured: true }),
      work({ id: "mid-plain", createdAt: 200 }),
    ], "featured");
    expect(ids(rows)).toEqual(["old-starred", "new-plain", "mid-plain"]);
  });

  it("puts the newest first among the starred", () => {
    const rows = sortWorks([
      work({ id: "a", createdAt: 100, featured: true }),
      work({ id: "b", createdAt: 300, featured: true }),
      work({ id: "c", createdAt: 200, featured: true }),
    ], "featured");
    expect(ids(rows)).toEqual(["b", "c", "a"]);
  });

  it("keeps every starred work ahead of every plain one", () => {
    const rows = sortWorks([
      work({ id: "p1", createdAt: 900 }),
      work({ id: "s1", createdAt: 100, featured: true }),
      work({ id: "p2", createdAt: 800 }),
      work({ id: "s2", createdAt: 50, featured: true }),
    ], "featured");
    expect(ids(rows).slice(0, 2)).toEqual(["s1", "s2"]);
  });
});

describe("the other orderings", () => {
  it("sorts the popular by likes, newest breaking a tie", () => {
    const rows = sortWorks([
      work({ id: "a", likes: 5, createdAt: 100 }),
      work({ id: "b", likes: 9, createdAt: 50 }),
      work({ id: "c", likes: 5, createdAt: 300 }),
    ], "popular");
    expect(ids(rows)).toEqual(["b", "c", "a"]);
  });

  it("sorts the newest by date alone — a star does not jump the queue", () => {
    const rows = sortWorks([
      work({ id: "old-starred", createdAt: 100, featured: true }),
      work({ id: "new-plain", createdAt: 300 }),
    ], "newest");
    expect(ids(rows)).toEqual(["new-plain", "old-starred"]);
  });
});

describe("it behaves", () => {
  it("does not reorder the caller's array", () => {
    const original = [work({ id: "a", createdAt: 1 }), work({ id: "b", createdAt: 2 })];
    const copy = [...original];
    sortWorks(original, "newest");
    expect(original).toEqual(copy);
  });

  it("handles an empty gallery", () => {
    expect(sortWorks([], "featured")).toEqual([]);
  });
});
