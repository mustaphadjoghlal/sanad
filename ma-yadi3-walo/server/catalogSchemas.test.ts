import { describe, expect, it } from "vitest";
import { defaultSiteSettings, productSchema, serviceSchema, siteSettingsSchema } from "./catalogSchemas";

describe("catalog editor validation", () => {
  it("accepts a complete editable site configuration", () => {
    const result = siteSettingsSchema.safeParse(defaultSiteSettings);
    expect(result.success).toBe(true);
  });

  it("rejects malformed theme colors before they reach the database", () => {
    const result = siteSettingsSchema.safeParse({ ...defaultSiteSettings, primaryColor: "green" });
    expect(result.success).toBe(false);
  });

  it("accepts active product cards and rejects missing marketplace fields", () => {
    const valid = productSchema.safeParse({
      name: "طماطم طازجة",
      category: "خضروات",
      farm: "مزرعة الوادي",
      location: "البليدة",
      price: "35 دج / كغ",
      availability: "متوفر اليوم",
      imageUrl: null,
      imageKey: null,
      status: "active",
    });
    const invalid = productSchema.safeParse({ ...valid.data, name: "" });
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("limits service icons to the set rendered by the public site", () => {
    expect(serviceSchema.safeParse({ title: "خدمات النقل", description: "نقل من المزرعة إلى الحي", icon: "Truck", sortOrder: 1, status: "active" }).success).toBe(true);
    expect(serviceSchema.safeParse({ title: "خدمات النقل", description: "نقل من المزرعة إلى الحي", icon: "Rocket", sortOrder: 1, status: "active" }).success).toBe(false);
  });
});
