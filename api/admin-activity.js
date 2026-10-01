import { requireAdminCaller, reportUpstreamFailure } from "./_admin.js";

/**
 * When each member last signed in.
 *
 * Firestore knows when a profile was created and what is in it; it does not
 * know whether anyone ever came back. That lives in the authentication
 * records, which no client may read — hence this endpoint, admin-gated like
 * its neighbours and reading through the service account.
 *
 * It answers one question the admin actually has: of everyone who registered,
 * who has used their account since?
 */
export default async function handler(req, res) {
  const gate = await requireAdminCaller(req, res);
  if (!gate) return;
  const { base, headers } = gate;

  const accounts = [];
  let nextPageToken = null;

  try {
    // Identity Toolkit pages at 1000; walk it so a growing platform does not
    // silently show only its first page.
    for (let page = 0; page < 50; page++) {
      const upstream = await fetch(`${base}:batchGet?maxResults=1000${nextPageToken ? `&nextPageToken=${encodeURIComponent(nextPageToken)}` : ""}`, {
        method: "GET",
        headers,
      });
      if (!upstream.ok) return reportUpstreamFailure(res, upstream, "batchGet");

      const body = await upstream.json();
      for (const user of body.users ?? []) {
        accounts.push({
          uid: user.localId,
          email: user.email ?? null,
          // Identity Toolkit returns these as strings of milliseconds.
          createdAt: Number(user.createdAt) || null,
          lastSignInAt: Number(user.lastLoginAt) || null,
          // Refreshed whenever the session is renewed, so it tracks real use
          // rather than only the moment a password was typed.
          lastSeenAt: user.lastRefreshAt ? Date.parse(user.lastRefreshAt) || null : null,
          disabled: Boolean(user.disabled),
        });
      }

      nextPageToken = body.nextPageToken ?? null;
      if (!nextPageToken) break;
    }
  } catch (e) {
    console.error("admin-activity: lookup failed", e);
    return res.status(502).json({ ok: false, error: "Lookup failed" });
  }

  return res.status(200).json({ ok: true, accounts });
}
