/**
 * The 58 Algerian wilayas, in official order (décret exécutif 21-343).
 *
 * This is the single source of truth. A second, divergent list used to live in
 * `wilayas.ts`: it mixed in dairas and communes (بوسعادة، مسعد، بريكة …), so a
 * user could register with a "wilaya" that the admin's filters did not know
 * about and their profile became unfilterable. `wilayas.ts` now re-exports
 * this list.
 *
 * Note: wilaya 55 is تقرت (Touggourt). Earlier builds listed both "تقرت" and
 * "توغرت" as separate entries and omitted عين قزام (wilaya 52) entirely.
 */
export const WILAYAS = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار",
  "البليدة", "البويرة", "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر",
  "الجلفة", "جيجل", "سطيف", "سعيدة", "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة",
  "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة", "وهران", "البيض",
  "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي",
  "خنشلة", "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت",
  "غرداية", "غليزان", "تيميمون", "برج باجي مختار", "أولاد جلال", "بني عباس",
  "عين صالح", "عين قزام", "تقرت", "جانت", "المغير", "المنيعة",
] as const;

export type Wilaya = (typeof WILAYAS)[number];
