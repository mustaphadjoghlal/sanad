/**
 * Arabic-aware text helpers shared by search, filtering and form validation.
 */

const ARABIC_DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;
// Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits.
const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/g;

/**
 * Folds the spelling variants Arabic readers type interchangeably so that
 * "اعلام" matches "إعلام" and "قناه" matches "قناة". Without this a visitor
 * who omits the hamza gets zero results for content that is clearly there.
 */
export function normalizeArabic(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when `needle` appears in any of `haystacks`, ignoring Arabic spelling variants. */
export function matchesQuery(needle: string, ...haystacks: (string | undefined | null)[]): boolean {
  const q = normalizeArabic(needle);
  if (!q) return true;
  return haystacks.some((h) => h && normalizeArabic(h).includes(q));
}

/** Converts Arabic-Indic digits to ASCII so typed phone numbers validate. */
export function toLatinDigits(input: string): string {
  return input.replace(ARABIC_INDIC_DIGITS, (d) => {
    const code = d.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/**
 * Normalises an Algerian phone number to the local `0XXXXXXXXX` form that the
 * security rules accept: strips spaces, dashes and parentheses, and rewrites
 * a `+213` / `00213` country prefix.
 */
export function normalizePhone(input: string): string {
  let v = toLatinDigits(input).replace(/[\s\-().]/g, "");
  if (v.startsWith("+213")) v = "0" + v.slice(4);
  else if (v.startsWith("00213")) v = "0" + v.slice(5);
  else if (v.startsWith("213") && v.length >= 11) v = "0" + v.slice(3);
  return v;
}

/** Mobile (10 digits) or landline (9 digits), both starting with 0. */
export function isValidAlgerianPhone(input: string): boolean {
  return /^0[1-9]\d{7,8}$/.test(normalizePhone(input));
}
