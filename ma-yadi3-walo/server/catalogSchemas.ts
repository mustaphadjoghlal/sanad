import { z } from "zod";

export const defaultSiteSettings = {
  announcementText: "كل كيلو يتم إنقاذه… حكاية خير جديدة",
  heroBadge: "محصول طازج، أثر أكبر",
  heroTitle: "الخير ما يضيع",
  heroAccent: "والو.",
  heroDescription: "منصة تجمع فائض المزارع بالبيت والحي والجهة المحتاجة، عشان كل ثمرة تلقى طريقها.",
  heroCta: "تصفح المنتجات",
  productsTitle: "اختار الخير القريب منك",
  servicesLabel: "خدماتنا",
  servicesTitle: "مش مجرد منتجات. منظومة خير.",
  impactTitle: "كل حركة صغيرة تزرع فرقًا.",
  assistantTitle: "فوكال، معك في كل اختيار",
  supportEmail: "maydi3walo@example.com",
  primaryColor: "#1C6B3C",
  accentColor: "#D9553F",
  heroImageUrl: "/manus-storage/walo-hero_e511b490.jpg",
  heroImageKey: "",
  mapImageUrl: "/manus-storage/walo-map_ab88a8d7.jpg",
  mapImageKey: "",
} as const;

const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "اللون يجب أن يكون بصيغة HEX مثل #1C6B3C");
const optionalUrl = z.string().max(2000).optional().nullable();
const optionalKey = z.string().max(500).optional().nullable();

export const siteSettingsSchema = z.object({
  announcementText: z.string().trim().min(1).max(255),
  heroBadge: z.string().trim().min(1).max(160),
  heroTitle: z.string().trim().min(1).max(180),
  heroAccent: z.string().trim().min(1).max(80),
  heroDescription: z.string().trim().min(1).max(1000),
  heroCta: z.string().trim().min(1).max(100),
  productsTitle: z.string().trim().min(1).max(180),
  servicesLabel: z.string().trim().min(1).max(100),
  servicesTitle: z.string().trim().min(1).max(180),
  impactTitle: z.string().trim().min(1).max(180),
  assistantTitle: z.string().trim().min(1).max(180),
  supportEmail: z.string().trim().email().max(255),
  primaryColor: colorSchema,
  accentColor: colorSchema,
  heroImageUrl: optionalUrl,
  heroImageKey: optionalKey,
  mapImageUrl: optionalUrl,
  mapImageKey: optionalKey,
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(100),
  farm: z.string().trim().min(2).max(180),
  location: z.string().trim().min(2).max(120),
  price: z.string().trim().min(2).max(80),
  availability: z.string().trim().min(2).max(120),
  imageUrl: optionalUrl,
  imageKey: optionalKey,
  status: z.enum(["active", "hidden"]),
});

export const serviceSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(320),
  icon: z.enum(["Truck", "PackageCheck", "Recycle", "Leaf"]),
  sortOrder: z.number().int().min(0).max(1000),
  status: z.enum(["active", "hidden"]),
});

export const imageUploadSchema = z.object({
  filename: z.string().trim().min(1).max(160),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64: z.string().min(20).max(7_000_000),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
