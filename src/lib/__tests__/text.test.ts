import { describe, it, expect } from "vitest";
import { normalizeArabic, matchesQuery, normalizePhone, isValidAlgerianPhone } from "../text";

describe("normalizeArabic", () => {
  it("folds the hamza forms onto bare alif", () => {
    expect(normalizeArabic("إعلام")).toBe(normalizeArabic("اعلام"));
    expect(normalizeArabic("أحمد")).toBe(normalizeArabic("احمد"));
    expect(normalizeArabic("آسيا")).toBe(normalizeArabic("اسيا"));
  });

  it("folds tāʾ marbūṭa and alif maqṣūra", () => {
    expect(normalizeArabic("قناة")).toBe(normalizeArabic("قناه"));
    expect(normalizeArabic("مصطفى")).toBe(normalizeArabic("مصطفي"));
  });

  it("strips diacritics and tatweel", () => {
    expect(normalizeArabic("صِحَافَة")).toBe(normalizeArabic("صحافة"));
    expect(normalizeArabic("إعــلام")).toBe(normalizeArabic("اعلام"));
  });
});

describe("matchesQuery", () => {
  // These are the exact searches that returned nothing before normalisation.
  it("matches across spelling variants", () => {
    expect(matchesQuery("اعلام", "الإعلام الجزائري")).toBe(true);
    expect(matchesQuery("قناه", "قناة الوطنية")).toBe(true);
  });

  it("still matches latin text", () => {
    expect(matchesQuery("premiere", "Premiere Pro")).toBe(true);
    expect(matchesQuery("PREMIERE", "premiere pro")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesQuery("رياضة", "قناة الوطنية")).toBe(false);
  });

  it("treats an empty query as matching everything", () => {
    expect(matchesQuery("", "anything")).toBe(true);
  });

  it("ignores undefined fields", () => {
    expect(matchesQuery("قناة", undefined, null, "قناة الشروق")).toBe(true);
  });
});

describe("normalizePhone", () => {
  it("rewrites country prefixes to the local form", () => {
    expect(normalizePhone("+213551234567")).toBe("0551234567");
    expect(normalizePhone("00213551234567")).toBe("0551234567");
    expect(normalizePhone("213551234567")).toBe("0551234567");
  });

  it("strips separators", () => {
    expect(normalizePhone("05 51 23 45 67")).toBe("0551234567");
    expect(normalizePhone("0551-23-45-67")).toBe("0551234567");
    expect(normalizePhone("(0551) 234 567")).toBe("0551234567");
  });

  it("converts Arabic-Indic digits", () => {
    expect(normalizePhone("٠٥٥١٢٣٤٥٦٧")).toBe("0551234567");
    expect(normalizePhone("۰۵۵۱۲۳۴۵۶۷")).toBe("0551234567");
  });
});

describe("isValidAlgerianPhone", () => {
  it("accepts mobile and landline numbers", () => {
    expect(isValidAlgerianPhone("0551234567")).toBe(true);
    expect(isValidAlgerianPhone("021234567")).toBe(true);
    expect(isValidAlgerianPhone("+213 551 23 45 67")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isValidAlgerianPhone("0551")).toBe(false);
    expect(isValidAlgerianPhone("abcdefghij")).toBe(false);
    expect(isValidAlgerianPhone("551234567")).toBe(false);
    expect(isValidAlgerianPhone("")).toBe(false);
  });

  /**
   * The order and course-registration rules in firestore.rules validate the
   * phone server-side with this pattern. If the client normalises to anything
   * it rejects, the write fails and the user sees an unexplained error.
   */
  it("always produces a value the security rules accept", () => {
    const rulesPattern = /^0[1-9][0-9]{7,8}$/;
    for (const input of ["+213551234567", "05 51 23 45 67", "٠٥٥١٢٣٤٥٦٧", "021234567"]) {
      expect(rulesPattern.test(normalizePhone(input))).toBe(true);
    }
  });
});
