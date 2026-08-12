import { asc, desc, eq } from "drizzle-orm";
import { products, services, siteSettings } from "../drizzle/schema";
import { getDb } from "./db";
import { defaultSiteSettings, type ProductInput, type ServiceInput, type SiteSettingsInput } from "./catalogSchemas";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db;
}

export async function getSettings() {
  const db = await requireDb();
  const [saved] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return saved ? { ...defaultSiteSettings, ...saved } : { ...defaultSiteSettings };
}

export async function saveSettings(input: SiteSettingsInput) {
  const db = await requireDb();
  await db.insert(siteSettings).values({ id: 1, ...input }).onDuplicateKeyUpdate({ set: input });
  return getSettings();
}

export async function listPublicProducts() {
  const db = await requireDb();
  return db.select().from(products).where(eq(products.status, "active")).orderBy(desc(products.createdAt));
}

export async function listAdminProducts() {
  const db = await requireDb();
  return db.select().from(products).orderBy(desc(products.updatedAt));
}

export async function createProduct(input: ProductInput) {
  const db = await requireDb();
  const result = await db.insert(products).values(input);
  const id = Number(result[0].insertId);
  const [created] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return created;
}

export async function updateProduct(id: number, input: ProductInput) {
  const db = await requireDb();
  await db.update(products).set(input).where(eq(products.id, id));
  const [updated] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return updated;
}

export async function removeProduct(id: number) {
  const db = await requireDb();
  await db.delete(products).where(eq(products.id, id));
  return { success: true } as const;
}

export async function listPublicServices() {
  const db = await requireDb();
  return db.select().from(services).where(eq(services.status, "active")).orderBy(asc(services.sortOrder), desc(services.createdAt));
}

export async function listAdminServices() {
  const db = await requireDb();
  return db.select().from(services).orderBy(asc(services.sortOrder), desc(services.updatedAt));
}

export async function createService(input: ServiceInput) {
  const db = await requireDb();
  const result = await db.insert(services).values(input);
  const id = Number(result[0].insertId);
  const [created] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return created;
}

export async function updateService(id: number, input: ServiceInput) {
  const db = await requireDb();
  await db.update(services).set(input).where(eq(services.id, id));
  const [updated] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return updated;
}

export async function removeService(id: number) {
  const db = await requireDb();
  await db.delete(services).where(eq(services.id, id));
  return { success: true } as const;
}

export async function getCatalog() {
  const [settings, productList, serviceList] = await Promise.all([getSettings(), listPublicProducts(), listPublicServices()]);
  return { settings, products: productList, services: serviceList };
}

export async function getAdminOverview() {
  const [productList, serviceList] = await Promise.all([listAdminProducts(), listAdminServices()]);
  return {
    products: productList.length,
    activeProducts: productList.filter((product) => product.status === "active").length,
    services: serviceList.length,
    activeServices: serviceList.filter((service) => service.status === "active").length,
  };
}
