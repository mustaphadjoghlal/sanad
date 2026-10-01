import type { MemberActivity } from "./firestore";

/**
 * Reading "when did this member last use their account" without claiming more
 * than was actually read.
 *
 * The first version collapsed a failed lookup into an empty map, so the list
 * said لم يدخل قطّ about every member — stating as a fact about each person
 * something that was only ever a failure to ask. These three states stay
 * apart for that reason.
 */
export type ActivityState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rows: Record<string, MemberActivity> };

/**
 * When a member was last seen, or null if that is unknown.
 *
 * The later of a sign-in and a session renewal: someone who stayed signed in
 * for a month never "signed in" again, and counting them absent would be
 * wrong.
 */
export function lastSeenAt(state: ActivityState, uid: string): number | null {
  if (state.status !== "ready") return null;
  const row = state.rows[uid];
  if (!row) return null;
  return Math.max(row.lastSignInAt ?? 0, row.lastSeenAt ?? 0) || null;
}

/** "منذ ٣ أيام" reads at a glance; a timestamp does not. */
export function timeAgo(ms: number | null, now = Date.now()): string {
  if (!ms) return "لم يدخل قطّ";
  const minutes = Math.floor((now - ms) / 60000);
  if (minutes < 2) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  return months < 12 ? `منذ ${months} شهر` : `منذ ${Math.floor(months / 12)} سنة`;
}

/**
 * What the column shows for one member. لم يدخل قطّ is said only when the
 * records were read and hold no sign-in for them; everything else is a dash,
 * because an unanswered question is not an answer.
 */
export function seenLabel(
  state: ActivityState,
  uid: string,
  now = Date.now()
): { text: string; never: boolean } {
  if (state.status === "loading") return { text: "…", never: false };
  if (state.status === "error") return { text: "—", never: false };
  if (!state.rows[uid]) return { text: "—", never: false };
  const at = lastSeenAt(state, uid);
  return { text: timeAgo(at, now), never: at === null };
}

/** Counted only over the members the records actually covered. */
export function activitySummary(
  state: ActivityState,
  uids: string[],
  now = Date.now()
): { returned: number; never: number } | null {
  if (state.status !== "ready") return null;
  const week = now - 7 * 24 * 60 * 60 * 1000;
  const known = uids.filter((uid) => state.rows[uid]);
  return {
    returned: known.filter((uid) => (lastSeenAt(state, uid) ?? 0) > week).length,
    never: known.filter((uid) => !lastSeenAt(state, uid)).length,
  };
}
