/**
 * Deletes a member's Firebase Auth account, on the admin's request.
 *
 * The profile document itself is removed by the dashboard, which the security
 * rules already allow the admin to do. The sign-in account is not reachable
 * from the client at all, and leaving it behind is worse than it sounds: the
 * person could still sign in — landing on a dashboard with no profile — and
 * could never register again, because the address would come back as already
 * in use. So a delete has to cover both halves, and this is the other one.
 */

import { requireAdmin, reportUpstreamFailure } from "./_admin.js";

export default async function handler(req, res) {
  const uid = req.body?.uid;
  let gate;
  try {
    gate = await requireAdmin(req, res, uid);
  } catch (e) {
    console.error("admin-delete-account: gate failed", e?.message);
    return res.status(500).json({ ok: false, error: "Unexpected failure" });
  }
  if (!gate) return; // requireAdmin already answered.

  try {
    const deleted = await fetch(`${gate.base}:delete`, {
      method: "POST",
      headers: gate.headers,
      body: JSON.stringify({ localId: uid }),
    });
    if (!deleted.ok) return reportUpstreamFailure(res, deleted, "Delete");

    return res.status(200).json({ ok: true, email: gate.target.email ?? null });
  } catch (e) {
    console.error("admin-delete-account: unexpected failure", e?.message);
    return res.status(500).json({ ok: false, error: "Unexpected failure" });
  }
}
