import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Why a registration never reached the admin's browser.
 *
 * The admin's device lived in one field holding one token, so enabling
 * notifications on a phone silently unregistered the laptop. And when a token
 * expired — they do — the pruning that removes a dead device skipped the admin
 * on purpose, so the dead token stayed and every push after it failed with
 * nobody told.
 */

vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    getClient() {
      return Promise.resolve({ getAccessToken: () => Promise.resolve({ token: "sa-token" }) });
    }
  },
}));

const ADMIN = "admin@sanadz.media";

interface Call { url: string; method: string; body: unknown }

/** The state the fake Firestore holds, and every call made against it. */
let adminDoc: Record<string, unknown>;
let calls: Call[];
let deadTokens: Set<string>;

function fakeFetch(url: string, init: RequestInit = {}) {
  const method = init.method ?? "GET";
  const body = init.body ? JSON.parse(init.body as string) : undefined;
  calls.push({ url, method, body });

  if (url.includes("accounts:lookup")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ users: [{ localId: "admin-uid", email: ADMIN }] }),
    });
  }

  if (url.includes("/config/adminFCM")) {
    if (method === "PATCH") {
      adminDoc = (body as { fields: Record<string, unknown> }).fields;
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ fields: adminDoc }) });
  }

  if (url.includes("messages:send")) {
    const token = (body as { message: { token: string } }).message.token;
    if (deadTokens.has(token)) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: { status: "UNREGISTERED" } }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  }

  return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
}

interface PushResult {
  status: number;
  delivered?: number;
  pruned?: number;
  targeted?: number;
  reason?: string;
  failures?: string[];
}

async function push(payload: Record<string, unknown> = {}): Promise<PushResult> {
  // @ts-expect-error — the endpoint is plain JS served by a Vercel function.
  const { default: handler } = await import("../../../api/push.js");
  let status = 0;
  let json: Record<string, unknown> = {};
  const res = {
    setHeader: () => res,
    status: (s: number) => { status = s; return res; },
    json: (value: Record<string, unknown>) => { json = value; return res; },
  };
  await (handler as (req: unknown, res: unknown) => Promise<unknown>)(
    {
      method: "POST",
      headers: { authorization: "Bearer id-token" },
      body: { title: "مستخدم جديد", body: "سجّل في المنصة", ...payload },
    },
    res
  );
  return { status, ...json } as PushResult;
}

/** The tokens the server actually sent to. */
const sentTo = () =>
  calls
    .filter((c) => c.url.includes("messages:send"))
    .map((c) => (c.body as { message: { token: string } }).message.token);

/** The device list as it was written back, if it was. */
const savedTokens = () => {
  const patch = calls.filter((c) => c.url.includes("/config/adminFCM") && c.method === "PATCH").at(-1);
  if (!patch) return null;
  const fields = (patch.body as { fields: { tokens: { arrayValue: { values?: { stringValue: string }[] } } } }).fields;
  return (fields.tokens.arrayValue.values ?? []).map((v) => v.stringValue);
};

beforeEach(() => {
  process.env.VITE_FIREBASE_PROJECT_ID = "p";
  process.env.VITE_FIREBASE_API_KEY = "k";
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({ client_email: "sa@x", private_key: "x" });
  calls = [];
  deadTokens = new Set();
  adminDoc = {};
  vi.stubGlobal("fetch", fakeFetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("a notification to the admin", () => {
  it("reaches every device the admin registered, not only the last one", async () => {
    adminDoc = { tokens: { arrayValue: { values: [{ stringValue: "phone" }, { stringValue: "laptop" }] } } };
    const result = await push();
    expect(sentTo().sort()).toEqual(["laptop", "phone"]);
    expect(result.delivered).toBe(2);
  });

  it("still reaches a device registered under the old single field", async () => {
    adminDoc = { token: { stringValue: "old-device" } };
    const result = await push();
    expect(sentTo()).toEqual(["old-device"]);
    expect(result.delivered).toBe(1);
  });

  it("does not send twice to a device listed under both shapes", async () => {
    adminDoc = {
      tokens: { arrayValue: { values: [{ stringValue: "same" }] } },
      token: { stringValue: "same" },
    };
    await push();
    expect(sentTo()).toEqual(["same"]);
  });

  it("removes a device whose token has expired, instead of failing on it forever", async () => {
    adminDoc = { tokens: { arrayValue: { values: [{ stringValue: "phone" }, { stringValue: "expired" }] } } };
    deadTokens.add("expired");

    const result = await push();
    expect(result.delivered).toBe(1);
    expect(result.pruned).toBe(1);
    expect(savedTokens()).toEqual(["phone"]);
  });

  it("clears the old single field when it writes the list back", async () => {
    adminDoc = { token: { stringValue: "expired" } };
    deadTokens.add("expired");

    await push();
    const patch = calls.filter((c) => c.url.includes("adminFCM") && c.method === "PATCH").at(-1);
    const fields = (patch!.body as { fields: Record<string, unknown> }).fields;
    expect(fields.token).toEqual({ nullValue: null });
    expect(savedTokens()).toEqual([]);
  });

  it("leaves the list alone when every device answered", async () => {
    adminDoc = { tokens: { arrayValue: { values: [{ stringValue: "phone" }] } } };
    await push();
    expect(savedTokens()).toBeNull();
  });

  it("says no device is registered rather than reporting a silent success", async () => {
    adminDoc = {};
    const result = await push();
    expect(result.delivered).toBe(0);
    expect(result.reason).toMatch(/No FCM tokens/);
  });

  it("names the failure when a send is refused for some other reason", async () => {
    adminDoc = { tokens: { arrayValue: { values: [{ stringValue: "phone" }] } } };
    vi.stubGlobal("fetch", (url: string, init: RequestInit = {}) => {
      if (url.includes("messages:send")) {
        calls.push({ url, method: "POST", body: JSON.parse(init.body as string) });
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ error: { status: "PERMISSION_DENIED" } }),
        });
      }
      return fakeFetch(url, init);
    });

    const result = await push();
    expect(result.delivered).toBe(0);
    expect(result.failures).toContain("PERMISSION_DENIED");
    // Not a dead device — it must not be thrown away over a server error.
    expect(savedTokens()).toBeNull();
  });
});
