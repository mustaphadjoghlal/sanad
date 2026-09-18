import { GoogleAuth } from "google-auth-library";

const ADMIN_EMAIL = "admin@sanadz.media";

// Audiences a caller may target. "admin" pushes to the admin's own device and
// is what user-triggered events (registration, course sign-up) are allowed to
// use; everything else is a broadcast and requires the admin.
const MEDIA_TYPES = new Set([
  "journalist", "voice", "photographer", "editor", "student",
  "editor_news", "web_digital", "presenter_programs", "presenter_news",
  "monteur", "graphic_designer", "cameraman", "producer", "director",
  "program_writer", "host_stage", "other",
]);

let cachedAuth = null;
function getAuth() {
  if (cachedAuth) return cachedAuth;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  const credentials = JSON.parse(raw);
  cachedAuth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  return cachedAuth;
}

// Resolves the caller's Firebase ID token to an account via the Identity
// Toolkit. A forged token fails signature verification there, so this is the
// gate that keeps /api/push from being an open broadcast endpoint.
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

  const data = await res.json();
  const user = data.users?.[0];
  if (!user?.localId) return null;
  return { uid: user.localId, email: user.email ?? null };
}

// Firestore caps a runQuery page; walk the collection with a cursor so a
// broadcast is not silently truncated once the platform passes 500 users.
async function fetchAllUsers(baseUrl, accessToken) {
  const PAGE_SIZE = 300;
  const docs = [];
  let cursor = null;

  for (let page = 0; page < 200; page++) {
    const structuredQuery = {
      from: [{ collectionId: "users" }],
      orderBy: [{ field: { fieldPath: "__name__" }, direction: "ASCENDING" }],
      limit: PAGE_SIZE,
    };
    if (cursor) {
      structuredQuery.startAt = { values: [{ referenceValue: cursor }], before: false };
    }

    const res = await fetch(`${baseUrl}:runQuery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ structuredQuery }),
    });
    if (!res.ok) break;

    const rows = await res.json();
    const batch = (Array.isArray(rows) ? rows : []).map((r) => r.document).filter(Boolean);
    if (batch.length === 0) break;

    docs.push(...batch);
    cursor = batch[batch.length - 1].name;
    if (batch.length < PAGE_SIZE) break;
  }

  return docs;
}

// Push tokens live in /fcmTokens/{uid}, keyed by the same uid as the profile.
async function fetchTokenMap(baseUrl, accessToken) {
  const res = await fetch(`${baseUrl}/fcmTokens?pageSize=1000`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return new Map();

  const data = await res.json();
  const map = new Map();
  for (const doc of data.documents ?? []) {
    const uid = doc.name.split("/").pop();
    const token = doc.fields?.token?.stringValue;
    if (uid && token) map.set(uid, token);
  }
  return map;
}

// A token the device has revoked keeps failing forever unless it is removed.
async function deleteToken(baseUrl, accessToken, uid) {
  await fetch(`${baseUrl}/fcmTokens/${uid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {});
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { title, body, targetType } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ ok: false, error: "Missing title" });
  }
  if (title.length > 150 || (body != null && String(body).length > 500)) {
    return res.status(400).json({ ok: false, error: "Payload too long" });
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  const auth = getAuth();

  if (!auth || !projectId || !apiKey) {
    return res.status(503).json({ ok: false, reason: "FCM not configured" });
  }

  // Every caller must present a valid Firebase ID token, and only the admin
  // may reach anyone other than the admin.
  const caller = await verifyCaller(req, apiKey);
  if (!caller) {
    return res.status(401).json({ ok: false, reason: "Unauthenticated" });
  }
  const isAdmin = caller.email === ADMIN_EMAIL;
  if (targetType && !isAdmin) {
    return res.status(403).json({ ok: false, reason: "Broadcast requires admin" });
  }

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  try {
    const client = await auth.getClient();
    const { token: accessToken } = await client.getAccessToken();

    // uid -> token, so a rejected token can be traced back and deleted.
    let targets = [];
    let checkedCount = 0;

    if (targetType) {
      const [docs, tokenMap] = await Promise.all([
        fetchAllUsers(baseUrl, accessToken),
        fetchTokenMap(baseUrl, accessToken),
      ]);
      checkedCount = docs.length;

      for (const doc of docs) {
        const uid = doc.name.split("/").pop();
        const type = doc.fields?.type?.stringValue;
        const token = tokenMap.get(uid);
        if (!token) continue;
        if (targetType === "all") targets.push({ uid, token });
        else if (targetType === "journalist") {
          if (MEDIA_TYPES.has(type)) targets.push({ uid, token });
        } else if (type === targetType) targets.push({ uid, token });
      }
    } else {
      const fsRes = await fetch(`${baseUrl}/config/adminFCM`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (fsRes.ok) {
        const data = await fsRes.json();
        const token = data.fields?.token?.stringValue;
        if (token) targets = [{ uid: "adminFCM", token }];
      }
    }

    // De-duplicate: the same device may be registered under several accounts.
    const seen = new Set();
    targets = targets.filter((t) => (seen.has(t.token) ? false : seen.add(t.token)));

    if (targets.length === 0) {
      return res.status(200).json({
        ok: true,
        delivered: 0,
        reason: "No FCM tokens registered yet",
        checkedCount,
      });
    }

    const results = await Promise.all(
      targets.map(async ({ uid, token }) => {
        const fcmRes = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body: body ?? "" },
                webpush: { notification: { icon: "/icon-192.png" }, fcm_options: {} },
                android: { priority: "high" },
                apns: { payload: { aps: { sound: "default" } } },
              },
            }),
          }
        );

        if (fcmRes.ok) return { ok: true };

        const err = await fcmRes.json().catch(() => ({}));
        const status = err?.error?.status;
        // UNREGISTERED / INVALID_ARGUMENT means the device is gone for good.
        if (uid !== "adminFCM" && (status === "NOT_FOUND" || status === "UNREGISTERED" || status === "INVALID_ARGUMENT")) {
          await deleteToken(baseUrl, accessToken, uid);
          return { ok: false, pruned: true };
        }
        return { ok: false };
      })
    );

    const delivered = results.filter((r) => r.ok).length;
    const pruned = results.filter((r) => r.pruned).length;

    return res.status(200).json({ ok: true, delivered, pruned, targeted: targets.length, checkedCount });
  } catch (e) {
    console.error("FCM operation failed:", e);
    return res.status(502).json({ ok: false, reason: "FCM operation failed" });
  }
}
