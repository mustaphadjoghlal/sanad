import { describe, it, expect } from "vitest";
import { seenLabel, lastSeenAt, timeAgo, activitySummary } from "../activity";
import type { ActivityState } from "../activity";
import type { MemberActivity } from "../firestore";

const NOW = Date.parse("2026-10-01T12:00:00Z");
const hoursAgo = (h: number) => NOW - h * 3600_000;
const daysAgo = (d: number) => NOW - d * 86400_000;

const row = (over: Partial<MemberActivity> = {}): MemberActivity => ({
  uid: "u1", email: "a@b.c", createdAt: daysAgo(30),
  lastSignInAt: null, lastSeenAt: null, disabled: false, ...over,
});

const ready = (rows: Record<string, MemberActivity>): ActivityState => ({ status: "ready", rows });

describe("what the column says", () => {
  it("says لم يدخل قطّ only when the records were read and hold no sign-in", () => {
    const state = ready({ u1: row() });
    expect(seenLabel(state, "u1", NOW)).toEqual({ text: "لم يدخل قطّ", never: true });
  });

  it("does NOT say it while the records are still being read", () => {
    const label = seenLabel({ status: "loading" }, "u1", NOW);
    expect(label.never).toBe(false);
    expect(label.text).not.toContain("لم يدخل");
  });

  it("does NOT say it when the lookup failed", () => {
    // The bug this file exists for: a failed read was reported as a fact
    // about every member.
    const label = seenLabel({ status: "error", message: "403" }, "u1", NOW);
    expect(label.never).toBe(false);
    expect(label.text).toBe("—");
  });

  it("does NOT say it for someone the records did not cover", () => {
    const label = seenLabel(ready({ someone_else: row() }), "u1", NOW);
    expect(label.never).toBe(false);
    expect(label.text).toBe("—");
  });

  it("reports a member who just signed in", () => {
    const state = ready({ u1: row({ lastSignInAt: hoursAgo(2) }) });
    expect(seenLabel(state, "u1", NOW)).toEqual({ text: "منذ 2 ساعة", never: false });
  });
});

describe("when they were last seen", () => {
  it("takes a renewed session over an older sign-in", () => {
    const state = ready({ u1: row({ lastSignInAt: daysAgo(30), lastSeenAt: hoursAgo(1) }) });
    expect(lastSeenAt(state, "u1")).toBe(hoursAgo(1));
  });

  it("takes the sign-in when it is the later of the two", () => {
    const state = ready({ u1: row({ lastSignInAt: hoursAgo(1), lastSeenAt: daysAgo(30) }) });
    expect(lastSeenAt(state, "u1")).toBe(hoursAgo(1));
  });

  it("is unknown — not zero — while loading or on failure", () => {
    expect(lastSeenAt({ status: "loading" }, "u1")).toBeNull();
    expect(lastSeenAt({ status: "error", message: "x" }, "u1")).toBeNull();
  });
});

describe("how long ago", () => {
  it("reads in the largest unit that still says something", () => {
    expect(timeAgo(NOW - 30_000, NOW)).toBe("الآن");
    expect(timeAgo(NOW - 20 * 60_000, NOW)).toBe("منذ 20 دقيقة");
    expect(timeAgo(hoursAgo(5), NOW)).toBe("منذ 5 ساعة");
    expect(timeAgo(daysAgo(3), NOW)).toBe("منذ 3 يوم");
    expect(timeAgo(daysAgo(90), NOW)).toBe("منذ 3 شهر");
    expect(timeAgo(daysAgo(400), NOW)).toBe("منذ 1 سنة");
  });
});

describe("the summary", () => {
  it("counts only the members the records covered", () => {
    const state = ready({
      u1: row({ lastSignInAt: daysAgo(2) }),
      u2: row({ lastSignInAt: daysAgo(40) }),
      u3: row(),
    });
    // u4 has no record at all — it must not be counted as "never".
    expect(activitySummary(state, ["u1", "u2", "u3", "u4"], NOW)).toEqual({
      returned: 1,
      never: 1,
    });
  });

  it("reports nothing at all rather than zeros when it could not read", () => {
    expect(activitySummary({ status: "loading" }, ["u1"], NOW)).toBeNull();
    expect(activitySummary({ status: "error", message: "x" }, ["u1"], NOW)).toBeNull();
  });
});
