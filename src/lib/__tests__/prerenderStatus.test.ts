import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// @ts-expect-error — the prerenderer is plain JS served by a Vercel function.
import prerender from "../../../api/prerender.js";

/**
 * What a crawler is told about a page that is not on the site.
 *
 * Every address used to answer 200 — a deleted job, a mistyped id, a listing
 * still waiting for review. A search engine indexes what it is told exists,
 * so removed pages stayed in its results and unreviewed ones could get in.
 */

const str = (stringValue: string) => ({ stringValue });

const DOCS: Record<string, Record<string, unknown>> = {
  "equipment/live": { name: str("كاميرا"), description: str("وصف"), status: str("approved") },
  "equipment/legacy": { name: str("حامل"), description: str("وصف") },
  "equipment/waiting": { name: str("ميكروفون سرّي"), description: str("وصف"), status: str("pending") },
  "equipment/refused": { name: str("عدسة مرفوضة"), description: str("وصف"), status: str("rejected") },
  "products/onsale": { name: str("سماعة"), description: str("وصف"), status: str("active") },
  "products/hidden": { name: str("منتج موقوف"), description: str("وصف"), status: str("inactive") },
};

/** Paths that answer with a given HTTP status instead of a document. */
let failing: Record<string, number>;

beforeEach(() => {
  process.env.VITE_FIREBASE_PROJECT_ID = "p";
  process.env.VITE_FIREBASE_API_KEY = "k";
  failing = {};
  vi.stubGlobal("fetch", async (url: string) => {
    const match = url.match(/documents\/([^/]+)\/([^?]+)\?/);
    const key = match ? `${match[1]}/${match[2]}` : "";
    if (failing[key]) return { ok: false, status: failing[key], json: async () => ({}) };
    if (DOCS[key]) return { ok: true, status: 200, json: async () => ({ fields: DOCS[key] }) };
    if (match) return { ok: false, status: 404, json: async () => ({}) };
    // Listings and related-items lookups: nothing to add.
    return { ok: true, status: 200, json: async () => ({ documents: [] }) };
  });
});
afterEach(() => vi.unstubAllGlobals());

async function serve(path: string) {
  let status = 0;
  let body = "";
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (k: string, v: string) => { headers[k] = v; return res; },
    status: (s: number) => { status = s; return res; },
    send: (value: string) => { body = value; return res; },
  };
  await (prerender as (req: unknown, res: unknown) => Promise<unknown>)({ query: { path } }, res);
  return { status, body, headers };
}

describe("a page that is not on the site", () => {
  it("answers 404 for something that does not exist, and asks not to be indexed", async () => {
    const { status, headers } = await serve("/jobs/no-such-job");
    expect(status).toBe(404);
    expect(headers["X-Robots-Tag"]).toBe("noindex");
  });

  it("answers 404 for a profile the rules keep private", async () => {
    failing["users/pending-member"] = 403;
    expect((await serve("/profile/pending-member")).status).toBe(404);
  });

  it("does not hand a crawler a listing still waiting for review, or a rejected one", async () => {
    for (const id of ["waiting", "refused"]) {
      const { status, body } = await serve(`/equipment/${id}`);
      expect(status).toBe(404);
      expect(body).not.toContain("سرّي");
      expect(body).not.toContain("مرفوضة");
    }
  });

  it("does not hand a crawler a product taken off sale", async () => {
    const { status, body } = await serve("/products/hidden");
    expect(status).toBe(404);
    expect(body).not.toContain("موقوف");
  });

  it("still serves what is published — with a status, or from before there was one", async () => {
    for (const path of ["/equipment/live", "/equipment/legacy", "/products/onsale"]) {
      expect((await serve(path)).status, path).toBe(200);
    }
  });

  it("does not call a page gone because the lookup failed", async () => {
    failing["equipment/live"] = 500;
    const { status, headers } = await serve("/equipment/live");
    expect(status).toBe(200);
    expect(headers["X-Robots-Tag"]).toBeUndefined();
  });
});
