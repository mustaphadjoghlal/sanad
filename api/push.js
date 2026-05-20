export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { title, body } = req.body ?? {};
  if (!title) return res.status(400).json({ error: "Missing title" });

  const serverKey = process.env.FCM_SERVER_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey    = process.env.FIREBASE_API_KEY;

  if (!serverKey || !projectId || !apiKey) {
    return res.status(200).json({ ok: false, reason: "FCM not configured" });
  }

  // Read admin FCM token from Firestore REST API
  let token;
  try {
    const fsRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/adminFCM?key=${apiKey}`
    );
    if (fsRes.ok) {
      const data = await fsRes.json();
      token = data.fields?.token?.stringValue;
    }
  } catch {
    return res.status(200).json({ ok: false, reason: "Firestore read failed" });
  }

  if (!token) return res.status(200).json({ ok: false, reason: "No FCM token stored" });

  // Send FCM push notification
  try {
    const fcmRes = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body: body ?? "", icon: "/icon.svg" },
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
      }),
    });
    const result = await fcmRes.json();
    return res.status(200).json({ ok: true, result });
  } catch {
    return res.status(200).json({ ok: false, reason: "FCM send failed" });
  }
}
