import path from "node:path";
import { z } from "zod";
import { storagePut } from "./storage";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createProduct,
  createService,
  getAdminOverview,
  getCatalog,
  listAdminProducts,
  listAdminServices,
  removeProduct,
  removeService,
  saveSettings,
  updateProduct,
  updateService,
} from "./catalogDb";
import { imageUploadSchema, productSchema, serviceSchema, siteSettingsSchema } from "./catalogSchemas";

function decodeBase64Image(value: string) {
  const raw = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value;
  return Buffer.from(raw, "base64");
}

function safeImageName(filename: string) {
  const extension = path.extname(filename).toLowerCase() || ".jpg";
  const stem = path.basename(filename, extension).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60) || "image";
  return `${stem}-${Date.now()}${extension}`;
}

export const catalogRouter = router({
  get: publicProcedure.query(() => getCatalog()),
  admin: router({
    overview: adminProcedure.query(() => getAdminOverview()),
    products: adminProcedure.query(() => listAdminProducts()),
    services: adminProcedure.query(() => listAdminServices()),
    saveSettings: adminProcedure.input(siteSettingsSchema).mutation(({ input }) => saveSettings(input)),
    createProduct: adminProcedure.input(productSchema).mutation(({ input }) => createProduct(input)),
    updateProduct: adminProcedure.input(z.object({ id: z.number().int().positive(), data: productSchema })).mutation(({ input }) => updateProduct(input.id, input.data)),
    deleteProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => removeProduct(input.id)),
    createService: adminProcedure.input(serviceSchema).mutation(({ input }) => createService(input)),
    updateService: adminProcedure.input(z.object({ id: z.number().int().positive(), data: serviceSchema })).mutation(({ input }) => updateService(input.id, input.data)),
    deleteService: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => removeService(input.id)),
    uploadImage: adminProcedure.input(imageUploadSchema).mutation(async ({ ctx, input }) => {
      const bytes = decodeBase64Image(input.base64);
      if (bytes.byteLength > 5_000_000) throw new Error("حجم الصورة يجب ألا يتجاوز 5 ميغابايت.");
      const object = await storagePut(`cms/${ctx.user.id}/${safeImageName(input.filename)}`, bytes, input.mimeType);
      return object;
    }),
  }),
});
