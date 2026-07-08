export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, body, targetType } = req.body ?? {};
  if (!title) return res.status(400).json({ error: "Missing title" });

  const serverKey = process.env.FCM_SERVER_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const apiKey    = process.env.VITE_FIREBASE_API_KEY;

  if (!serverKey || !projectId || !apiKey) {
    return res.status(200).json({ ok: false, reason: "FCM not configured", serverKey: !!serverKey, projectId: !!projectId, apiKey: !!apiKey });
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
    if (targetType) {
      // Must be a query constrained to status == 'approved': security rules
      // only allow unauthenticated reads of approved profiles, and a plain
      // unfiltered list of /users is denied outright.
      const fsRes = await fetch(`${baseUrl}:runQuery?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "users" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "status" },
                op: "EQUAL",
                value: { stringValue: "approved" },
              },
            },
            limit: 300,
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
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "Firestore read failed", error: e.message });
  }

  if (tokens.length === 0) return res.status(200).json({ ok: false, reason: "No FCM tokens found" });

  tokens = [...new Set(tokens)];

  try {
    const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registration_ids: tokens,
        notification: { title, body: body ?? "", icon: "/icon.svg" },
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
      }),
    });
    const result = await fcmRes.json();
    return res.status(200).json({ ok: true, result, count: tokens.length });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: "FCM send failed", error: e.message });
  }
}
