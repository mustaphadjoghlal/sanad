import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Who among the registered members has actually used their account.
 *
 * Firestore holds the profile but not whether anyone came back after creating
 * it; that lives in the authentication records, which no client may read. So
 * it comes through an admin-gated endpoint — and a gate is worth testing
 * precisely because it is never exercised by the happy path.
 */

vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    getClient() {
      return Promise.resolve({ getAccessToken: () => Promise.resolve({ token: "sa-token" }) });
    }
  },
}));

const ADMIN = "admin@sanadz.media";

let caller: { localId: string; email: string } | null;
let pages: Record<string, unknown>[];
let requested: string[];

function fakeFetch(url: string, init: RequestInit = {}) {
  if (url.includes("accounts:lookup") && init.method === "POST") {
    return Promise.resolve({
      ok: true,
      json: async () => ({ users: caller ? [caller] : [] }),
    });
  }
  if (url.includes(":batchGet")) {
    requested.push(url);
    return Promise.resolve({ ok: true, json: async () => pages.shift() ?? { users: [] } });
  }
  return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
}

interface Result {
  status: number;
  ok?: boolean;
  error?: string;
  accounts?: { uid: string; lastSignInAt: number | null; lastSeenAt: number | null }[];
}

async function activity(method = "POST", authorization = "Bearer id-token"): Promise<Result> {
  // @ts-expect-error — the endpoint is plain JS served by a Vercel function.
  const { default: handler } = await import("../../../api/admin-activity.js");
  let status = 0;
  let json: Record<string, unknown> = {};
  const res = {
    setHeader: () => res,
    status: (s: number) => { status = s; return res; },
    json: (value: Record<string, unknown>) => { json = value; return res; },
  };
  await (handler as (req: unknown, res: unknown) => Promise<unknown>)(
    { method, headers: { authorization } },
    res
  );
  return { status, ...json } as Result;
}

beforeEach(() => {
  process.env.VITE_FIREBASE_PROJECT_ID = "p";
  process.env.VITE_FIREBASE_API_KEY = "k";
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "sa@x", private_key: "x" });
  caller = { localId: "admin-uid", email: ADMIN };
  pages = [];
  requested = [];
  vi.stubGlobal("fetch", fakeFetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("the gate", () => {
  it("turns away someone who is not the admin", async () => {
    caller = { localId: "member-uid", email: "member@example.com" };
    const result = await activity();
    expect(result.status).toBe(403);
    expect(requested).toHaveLength(0);
  });

  it("turns away a caller with no valid token", async () => {
    caller = null;
    const result = await activity();
    expect(result.status).toBe(401);
    expect(requested).toHaveLength(0);
  });

  it("refuses a method that is not POST", async () => {
    const result = await activity("GET");
    expect(result.status).toBe(405);
    expect(requested).toHaveLength(0);
  });
});

describe("what it reports", () => {
  it("says a member never signed in rather than inventing a date", async () => {
    pages = [{ users: [{ localId: "u1", email: "a@b.c", createdAt: "1700000000000" }] }];
    const result = await activity();
    expect(result.accounts?.[0]).toMatchObject({
      uid: "u1",
      lastSignInAt: null,
      lastSeenAt: null,
    });
  });

  it("reads both the sign-in and the last session renewal", async () => {
    pages = [{
      users: [{
        localId: "u1",
        createdAt: "1700000000000",
        lastLoginAt: "1700000500000",
        lastRefreshAt: "2026-09-30T10:00:00Z",
      }],
    }];
    const result = await activity();
    expect(result.accounts?.[0].lastSignInAt).toBe(1700000500000);
    expect(result.accounts?.[0].lastSeenAt).toBe(Date.parse("2026-09-30T10:00:00Z"));
  });

  it("walks every page, so a growing platform is not cut off at the first", async () => {
    pages = [
      { users: [{ localId: "u1" }, { localId: "u2" }], nextPageToken: "page-2" },
      { users: [{ localId: "u3" }] },
    ];
    const result = await activity();
    expect(result.accounts?.map((a) => a.uid)).toEqual(["u1", "u2", "u3"]);
    expect(requested).toHaveLength(2);
    expect(requested[1]).toContain("nextPageToken=page-2");
  });
});
