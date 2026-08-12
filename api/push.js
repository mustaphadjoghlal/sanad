import { GoogleAuth } from "google-auth-library";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, body, targetType } = req.body ?? {};
  if (!title) return res.status(400).json({ error: "Missing title" });

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey    = process.env.VITE_FIREBASE_API_KEY;
  const auth      = getAuth();

  if (!auth || !projectId || !apiKey) {
    return res.status(200).json({
      ok: false,
      reason: "FCM not configured",
      hasServiceAccount: !!auth,
      projectId: !!projectId,
      apiKey: !!apiKey,
    });
  }

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // Non-store media professional types
  const MEDIA_TYPES = new Set([
    "journalist", "voice", "photographer", "editor", "student",
    "editor_news", "web_digital", "presenter_programs", "presenter_news",
    "monteur", "graphic_designer", "cameraman", "producer", "director",
    "program_writer", "host_stage", "other",
  ]);

  let tokens = [];

  try {
    const client = await auth.getClient();
    const { token: accessToken } = await client.getAccessToken();

    if (targetType) {
      // Use the access token to bypass security rules and fetch all users
      // regardless of status.
      const fsRes = await fetch(`${baseUrl}:runQuery`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "users" }],
            // Removed status == 'approved' filter so all users get the notification
            limit: 500,
          },
        }),
      });
      if (fsRes.ok) {
        const rows = await fsRes.json();
        const docs = (Array.isArray(rows) ? rows : []).map((r) => r.document).filter(Boolean);
        tokens = docs
          .filter((d) => {
            const type  = d.fields?.type?.stringValue;
            const token = d.fields?.fcmToken?.stringValue;
            if (!token) return false;
            if (targetType === "journalist") return MEDIA_TYPES.has(type);
            if (targetType === "all") return true;
            return type === targetType;
          })
          .map((d) => d.fields.fcmToken.stringValue);
      }
    } else {
      // Admin-only notification: use saved admin token
      const fsRes = await fetch(`${baseUrl}/config/adminFCM?key=${apiKey}`);
      if (fsRes.ok) {
        const data = await fsRes.json();
        const token = data.fields?.token?.stringValue;
        if (token) tokens = [token];
      }
    }

    if (tokens.length === 0) return res.status(200).json({ ok: false, reason: "No FCM tokens found" });

    tokens = [...new Set(tokens)];

    const results = await Promise.all(
      tokens.map(async (regToken) => {
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
                token: regToken,
                notification: { title, body: body ?? "" },
                webpush: {
                  notification: { icon: "/icon-192.png" },
                  fcm_options: {},
                },
                android: { priority: "high" },
                apns: { payload: { aps: { sound: "default" } } },
              },
            }),
          }
        );
        return fcmRes.json();
      })
    );

    return res.status(200).json({ ok: true, result: results, count: tokens.length });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "FCM operation failed", error: e.message });
  }
}
