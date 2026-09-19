/**
 * Sets a new password for a member's account, on the admin's request.
 *
 * Members who do not read the address they registered with cannot use the
 * emailed reset link, so the admin — who reviews every profile by hand
 * anyway — hands them a new password directly.
 *
 * Every authorization check lives in `_admin.js`, shared with the other
 * admin endpoints.
 */

import { requireAdmin, reportUpstreamFailure } from "./_admin.js";

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
  const uid = req.body?.uid;
  let gate;
  try {
    gate = await requireAdmin(req, res, uid);
  } catch (e) {
    console.error("admin-reset-password: gate failed", e?.message);
    return res.status(500).json({ ok: false, error: "Unexpected failure" });
  }
  if (!gate) return; // requireAdmin already answered.

  try {
    const password = await generatePassword();
    // A password change moves validSince forward, which signs the account out
    // of every device it was left logged in on.
    const update = await fetch(`${gate.base}:update`, {
      method: "POST",
      headers: gate.headers,
      body: JSON.stringify({ localId: uid, password }),
    });
    if (!update.ok) return reportUpstreamFailure(res, update, "Update");

    // No caching layer should ever hold this.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, password, email: gate.target.email ?? null });
  } catch (e) {
    console.error("admin-reset-password: unexpected failure", e?.message);
    return res.status(500).json({ ok: false, error: "Unexpected failure" });
  }
}
