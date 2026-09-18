import { describe, it, expect } from "vitest";
import { WILAYAS } from "../algeria";
import { WILAYAS as REEXPORTED } from "../wilayas";

describe("WILAYAS", () => {
  it("holds all 58 wilayas exactly once", () => {
    expect(WILAYAS).toHaveLength(58);
    expect(new Set(WILAYAS).size).toBe(58);
  });

  // Touggourt used to appear as both "تقرت" and "توغرت", which made 58 entries
  // with one wilaya counted twice and one (عين قزام) missing entirely.
  it("does not list Touggourt twice", () => {
    expect(WILAYAS).toContain("تقرت");
    expect(WILAYAS).not.toContain("توغرت");
  });

  it("includes عين قزام", () => {
    expect(WILAYAS).toContain("عين قزام");
  });

  // The registration form used a separate list that mixed in dairas and
  // communes, so a user could pick a "wilaya" the admin filters never showed.
  it("contains no communes or dairas", () => {
    for (const notAWilaya of ["بوسعادة", "مسعد", "بريكة", "أفلو", "القنطرة", "عين وسارة"]) {
      expect(WILAYAS).not.toContain(notAWilaya);
    }
  });

  it("is the same list everywhere it is imported from", () => {
    expect(REEXPORTED).toBe(WILAYAS);
  });
});
