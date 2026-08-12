import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user identity supplied by the built-in OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** One editable record controlling the copy, imagery, and key colors of the public site. */
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").primaryKey(),
  announcementText: varchar("announcementText", { length: 255 }).notNull().default("كل كيلو يتم إنقاذه… حكاية خير جديدة"),
  heroBadge: varchar("heroBadge", { length: 160 }).notNull().default("محصول طازج، أثر أكبر"),
  heroTitle: varchar("heroTitle", { length: 180 }).notNull().default("الخير ما يضيع"),
  heroAccent: varchar("heroAccent", { length: 80 }).notNull().default("والو."),
  heroDescription: text("heroDescription").notNull(),
  heroCta: varchar("heroCta", { length: 100 }).notNull().default("تصفح المنتجات"),
  productsTitle: varchar("productsTitle", { length: 180 }).notNull().default("اختار الخير القريب منك"),
  servicesLabel: varchar("servicesLabel", { length: 100 }).notNull().default("خدماتنا"),
  servicesTitle: varchar("servicesTitle", { length: 180 }).notNull().default("مش مجرد منتجات. منظومة خير."),
  impactTitle: varchar("impactTitle", { length: 180 }).notNull().default("كل حركة صغيرة تزرع فرقًا."),
  assistantTitle: varchar("assistantTitle", { length: 180 }).notNull().default("فوكال، معك في كل اختيار"),
  supportEmail: varchar("supportEmail", { length: 255 }).notNull().default("maydi3walo@example.com"),
  primaryColor: varchar("primaryColor", { length: 16 }).notNull().default("#1C6B3C"),
  accentColor: varchar("accentColor", { length: 16 }).notNull().default("#D9553F"),
  heroImageUrl: text("heroImageUrl"),
  heroImageKey: varchar("heroImageKey", { length: 500 }),
  mapImageUrl: text("mapImageUrl"),
  mapImageKey: varchar("mapImageKey", { length: 500 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const productStatus = mysqlEnum("productStatus", ["active", "hidden"]);

/** Editable marketplace cards, managed through the in-site admin panel. */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  farm: varchar("farm", { length: 180 }).notNull(),
  location: varchar("location", { length: 120 }).notNull(),
  price: varchar("price", { length: 80 }).notNull(),
  availability: varchar("availability", { length: 120 }).notNull().default("متوفر اليوم"),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 500 }),
  status: productStatus.notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const serviceStatus = mysqlEnum("serviceStatus", ["active", "hidden"]);

/** Editable service explainer cards used by the public delivery / redistribution section. */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  description: varchar("description", { length: 320 }).notNull(),
  icon: varchar("icon", { length: 40 }).notNull().default("Truck"),
  sortOrder: int("sortOrder").notNull().default(0),
  status: serviceStatus.notNull().default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Service = typeof services.$inferSelect;
