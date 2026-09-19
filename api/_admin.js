/**
 * Shared gate for the admin-only endpoints.
 *
 * Files whose name begins with an underscore are not served as routes, so
 * this is a module the handlers import, never something reachable over HTTP.
 */

import { GoogleAuth } from "google-auth-library";

export const ADMIN_EMAIL = "admin@sanadz.media";

let cachedAuth = null;

/**
 * The service account, scoped to account administration only. The messaging
 * scope /api/push uses cannot read or write accounts, and this one cannot
 * send pushes.
 */
export function getIdentityAuth() {
  if (cachedAuth) return cachedAuth;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  cachedAuth = new GoogleAuth({
    credentials: JSON.parse(raw),
    scopes: ["https://www.googleapis.com/auth/identitytoolkit"],
  });
  return cachedAuth;
}

/**
 * Resolves the caller's Firebase ID token through the Identity Toolkit, which
 * verifies its signature — a forged token resolves to nothing.
 */
export async function verifyCaller(req, apiKey) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!res.ok) return null;

  const user = (await res.json()).users?.[0];
  if (!user?.localId) return null;
  return { uid: user.localId, email: user.email ?? null };
}

/** A uid as Firebase mints them; anything else is rejected before any lookup. */
export function isUid(value) {
  return typeof value === "string" && /^[A-Za-z0-9]{6,128}$/.test(value);
}

/**
 * Runs every check an admin endpoint needs and either returns the pieces the
 * handler needs, or sends the response itself and returns null.
 *
 * `targetUid` is the account being acted on: it must exist, must not be the
 * caller, and must not be the admin — an endpoint that can lock the admin out
 * of their own dashboard is not one worth having.
 */
export async function requireAdmin(req, res, targetUid) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return null;
  }
  if (!isUid(targetUid)) {
    res.status(400).json({ ok: false, error: "Missing uid" });
    return null;
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  const auth = getIdentityAuth();
  if (!auth || !projectId || !apiKey) {
    res.status(503).json({ ok: false, error: "Not configured" });
    return null;
  }

  const caller = await verifyCaller(req, apiKey);
  if (!caller) {
    res.status(401).json({ ok: false, error: "Unauthenticated" });
    return null;
  }
  if (caller.email !== ADMIN_EMAIL) {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return null;
  }
  if (caller.uid === targetUid) {
    res.status(400).json({ ok: false, error: "Cannot act on your own account here" });
    return null;
  }

  const client = await auth.getClient();
  const { token: accessToken } = await client.getAccessToken();
  const base = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts`;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };

  const lookup = await fetch(`${base}:lookup`, {
    method: "POST",
    headers,
    body: JSON.stringify({ localId: [targetUid] }),
  });
  if (!lookup.ok) {
    console.error("admin gate: lookup failed", lookup.status);
    res.status(502).json({ ok: false, error: "Lookup failed" });
    return null;
  }
  const target = (await lookup.json()).users?.[0];
  if (!target) {
    res.status(404).json({ ok: false, error: "No such account" });
    return null;
  }
  if (target.email === ADMIN_EMAIL) {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return null;
  }

  return { base, headers, target };
}

/**
 * Turns a failed Identity Toolkit call into a response. A 403 is almost
 * always the service account missing the Firebase Authentication Admin role,
 * which is worth naming rather than hiding behind a generic failure.
 */
export async function reportUpstreamFailure(res, upstream, what) {
  const reason = await upstream.json().then((b) => b?.error?.message).catch(() => null);
  console.error(`admin gate: ${what} failed`, upstream.status, reason);
  return res.status(502).json({
    ok: false,
    error: upstream.status === 403 ? "Service account lacks auth admin permission" : `${what} failed`,
    code: upstream.status === 403 ? "missing-permission" : "upstream-failed",
  });
}
