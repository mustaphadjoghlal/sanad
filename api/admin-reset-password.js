/**
 * Sets a new password for a member's account, on the admin's request.
 *
 * Why this exists: the platform's members are Algerian media professionals,
 * and a large share of them do not read the email address they signed up
 * with — it goes to spam, or they simply never open that inbox. For those
 * people `sendPasswordResetEmail` is a dead end: the only way back into the
 * account is a link they will never see, so a lost password means a lost
 * account and a lost store.
 *
 * Every profile here is already reviewed by hand before it goes live, so the
 * admin is the natural fallback. They press the button beside the member,
 * this endpoint mints a fresh password, and the admin passes it on over
 * WhatsApp — the channel those members actually use.
 *
 * The service account credential this needs (FIREBASE_SERVICE_ACCOUNT_KEY) is
 * already configured for push notifications.
 */

import { GoogleAuth } from "google-auth-library";

const ADMIN_EMAIL = "admin@sanadz.media";

let cachedAuth = null;
function getAuth() {
  if (cachedAuth) return cachedAuth;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  cachedAuth = new GoogleAuth({
    credentials: JSON.parse(raw),
    // The narrow scope for account administration; the messaging scope used
    // by /api/push is not enough to write a password.
    scopes: ["https://www.googleapis.com/auth/identitytoolkit"],
  });
  return cachedAuth;
}

/**
 * Same gate as /api/push: the Identity Toolkit verifies the token's
 * signature, so a forged one resolves to nothing.
 */
async function verifyCaller(req, apiKey) {
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

/**
 * The admin reads this aloud or pastes it into a chat, so 0/O and 1/l/I are
 * left out — a password that cannot be transcribed is no better than none.
 * Three groups of four from a 54-character alphabet is ~69 bits of entropy.
 */
async function generatePassword() {
  const { randomInt } = await import("node:crypto");
  const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () => ALPHABET[randomInt(ALPHABET.length)];
  const group = () => Array.from({ length: 4 }, pick).join("");
  return `${group()}-${group()}-${group()}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const uid = req.body?.uid;
  if (typeof uid !== "string" || !/^[A-Za-z0-9]{6,128}$/.test(uid)) {
    return res.status(400).json({ ok: false, error: "Missing uid" });
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  const auth = getAuth();
  if (!auth || !projectId || !apiKey) {
    return res.status(503).json({ ok: false, error: "Not configured" });
  }

  const caller = await verifyCaller(req, apiKey);
  if (!caller) {
    return res.status(401).json({ ok: false, error: "Unauthenticated" });
  }
  // Only the admin, and never against the admin's own account — locking
  // yourself out of the dashboard from inside the dashboard is not a feature.
  if (caller.email !== ADMIN_EMAIL) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }
  if (caller.uid === uid) {
    return res.status(400).json({ ok: false, error: "Cannot reset your own password here" });
  }

  try {
    const client = await auth.getClient();
    const { token: accessToken } = await client.getAccessToken();
    const base = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    // Confirm the account exists first, so a stale profile row reports "no
    // such account" rather than a bare 500.
    const lookup = await fetch(`${base}:lookup`, {
      method: "POST",
      headers,
      body: JSON.stringify({ localId: [uid] }),
    });
    if (!lookup.ok) {
      console.error("admin-reset-password: lookup failed", lookup.status);
      return res.status(502).json({ ok: false, error: "Lookup failed" });
    }
    const target = (await lookup.json()).users?.[0];
    if (!target) {
      return res.status(404).json({ ok: false, error: "No such account" });
    }
    if (target.email === ADMIN_EMAIL) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }

    const password = await generatePassword();
    const update = await fetch(`${base}:update`, {
      method: "POST",
      headers,
      // validSince moves forward on a password change, which signs the
      // account out of every device it was left logged in on.
      body: JSON.stringify({ localId: uid, password }),
    });
    if (!update.ok) {
      // Log the upstream reason only — never the request body, which holds
      // the new password.
      const reason = await update
        .json()
        .then((b) => b?.error?.message)
        .catch(() => null);
      console.error("admin-reset-password: update failed", update.status, reason);
      // A 403 here is almost always the service account missing the
      // Firebase Authentication Admin role, which is worth saying plainly
      // rather than hiding behind a generic failure.
      return res.status(502).json({
        ok: false,
        error: update.status === 403 ? "Service account lacks auth admin permission" : "Update failed",
        code: update.status === 403 ? "missing-permission" : "update-failed",
      });
    }

    // No caching layer should ever hold this.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      password,
      email: target.email ?? null,
    });
  } catch (e) {
    console.error("admin-reset-password: unexpected failure", e?.message);
    return res.status(500).json({ ok: false, error: "Unexpected failure" });
  }
}
