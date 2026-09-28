import { describe, it, expect } from "vitest";
import { professionsOf, SECONDARY_TYPE_OPTIONS, MAX_SECONDARY_TYPES, ACCOUNT_TYPE_LABEL } from "../types";

/**
 * One person is often two things — a مونتير who is also a معلق صوتي. The
 * profile kept a single `type`, so they had to pick one and vanished from the
 * other's listing. `professionsOf` is what the directory, the profile page and
 * the admin all read instead, so it has to be right.
 */
describe("the trades a member practises", () => {
  it("puts the main trade first", () => {
    expect(professionsOf({ type: "monteur", secondaryTypes: ["voice"] })).toEqual(["monteur", "voice"]);
  });

  it("works for someone who added nothing", () => {
    expect(professionsOf({ type: "journalist" })).toEqual(["journalist"]);
  });

  it("does not repeat a trade added on top of the main one", () => {
    expect(professionsOf({ type: "voice", secondaryTypes: ["voice", "monteur"] })).toEqual(["voice", "monteur"]);
  });

  it("survives a profile that has not loaded", () => {
    expect(professionsOf(null)).toEqual([]);
    expect(professionsOf(undefined)).toEqual([]);
    expect(professionsOf({})).toEqual([]);
  });

  it("offers only trades the site has a name for", () => {
    for (const type of SECONDARY_TYPE_OPTIONS) {
      expect(ACCOUNT_TYPE_LABEL[type], type).toBeTruthy();
    }
  });

  it("does not offer a shop or a training centre as a second trade", () => {
    const offered = SECONDARY_TYPE_OPTIONS as readonly string[];
    for (const notAJob of ["store", "trainer", "other"]) {
      expect(offered).not.toContain(notAJob);
    }
  });

  it("keeps the cap at a number that reads as a person, not a list", () => {
    expect(MAX_SECONDARY_TYPES).toBeLessThanOrEqual(4);
  });
});
