import { describe, it, expect } from "vitest";
import { PREVIEW_KINDS, previewByKind } from "../previewProfiles";
import { ACCOUNT_TYPE_LABEL } from "../types";

/**
 * The stand-in members the admin previews the dashboard as.
 *
 * They are invented, and must stay plainly so: the dashboard refuses to write
 * while showing one, but an id that could pass for a real uid is a loaded gun
 * pointed at a real member's document if a write ever slips past that guard.
 */
describe("the stand-in profiles", () => {
  it("can never be mistaken for a real account", () => {
    for (const kind of PREVIEW_KINDS) {
      expect(kind.profile.id, kind.id).toMatch(/^preview-/);
      // A Firebase uid is 28 characters of [A-Za-z0-9]; a hyphen cannot occur.
      expect(kind.profile.id).toContain("-");
      expect(kind.profile.email, kind.id).toMatch(/@example\.test$/);
    }
  });

  it("names a job title the site knows", () => {
    for (const kind of PREVIEW_KINDS) {
      expect(ACCOUNT_TYPE_LABEL[kind.profile.type], kind.id).toBeTruthy();
    }
  });

  it("gives each one an id of its own, and a description", () => {
    const ids = PREVIEW_KINDS.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const kind of PREVIEW_KINDS) {
      expect(kind.label.length, kind.id).toBeGreaterThan(0);
      expect(kind.description.length, kind.id).toBeGreaterThan(0);
    }
  });

  it("covers the states a member can be in, not only the approved one", () => {
    const states = new Set(PREVIEW_KINDS.map((k) => k.profile.status));
    expect(states).toContain("approved");
    expect(states).toContain("pending");
    expect(states).toContain("rejected");
  });

  it("covers the kinds whose dashboard differs", () => {
    const types = new Set(PREVIEW_KINDS.map((k) => k.profile.type));
    // A store sees different field labels, a voice artist sees audio samples.
    expect(types).toContain("store");
    expect(types).toContain("voice");
    expect(types).toContain("trainer");
  });

  it("is found by its id, and nothing else is", () => {
    expect(previewByKind("store")?.profile.type).toBe("store");
    expect(previewByKind("nope")).toBeUndefined();
    expect(previewByKind(undefined)).toBeUndefined();
  });

  it("shows a rejected profile with the note that explains it", () => {
    const rejected = PREVIEW_KINDS.find((k) => k.profile.status === "rejected");
    expect(rejected?.profile.rejectionNote).toBeTruthy();
  });
});
