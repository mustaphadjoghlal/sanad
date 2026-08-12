import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { defaultSiteSettings } from "./catalogSchemas";

const catalogDb = vi.hoisted(() => ({
  getCatalog: vi.fn(),
  getAdminOverview: vi.fn(),
  listAdminProducts: vi.fn(),
  listAdminServices: vi.fn(),
  saveSettings: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  removeProduct: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  removeService: vi.fn(),
}));

vi.mock("./catalogDb", () => catalogDb);

import { appRouter } from "./routers";

const productInput = {
  name: "طماطم طازجة",
  category: "خضروات",
  farm: "مزرعة الوادي",
  location: "البليدة",
  price: "35 دج / كغ",
  availability: "متوفر اليوم",
  imageUrl: null,
  imageKey: null,
  status: "active" as const,
};

const serviceInput = {
  title: "خدمات النقل",
  description: "نقل المنتج من المزرعة إلى الحي.",
  icon: "Truck" as const,
  sortOrder: 1,
  status: "active" as const,
};

function context(role: "admin" | "user" = "admin") {
  return {
    user: {
      id: 1,
      openId: "owner-test",
      name: "Site owner",
      email: "owner@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {},
    res: {},
  } as TrpcContext;
}

describe("catalog admin router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    catalogDb.getCatalog.mockResolvedValue({ settings: defaultSiteSettings, products: [], services: [] });
    catalogDb.getAdminOverview.mockResolvedValue({ products: 0, activeProducts: 0, services: 0, activeServices: 0 });
    catalogDb.listAdminProducts.mockResolvedValue([]);
    catalogDb.listAdminServices.mockResolvedValue([]);
  });

  it("passes product creation, update, and removal through the protected catalog contract", async () => {
    const caller = appRouter.createCaller(context());
    catalogDb.createProduct.mockResolvedValue({ id: 9, ...productInput });
    catalogDb.updateProduct.mockResolvedValue({ id: 9, ...productInput, name: "طماطم بلدية" });
    catalogDb.removeProduct.mockResolvedValue({ success: true });

    await caller.catalog.admin.createProduct(productInput);
    await caller.catalog.admin.updateProduct({ id: 9, data: { ...productInput, name: "طماطم بلدية" } });
    await caller.catalog.admin.deleteProduct({ id: 9 });

    expect(catalogDb.createProduct).toHaveBeenCalledWith(productInput);
    expect(catalogDb.updateProduct).toHaveBeenCalledWith(9, { ...productInput, name: "طماطم بلدية" });
    expect(catalogDb.removeProduct).toHaveBeenCalledWith(9);
  });

  it("passes service creation, update, and removal through the protected catalog contract", async () => {
    const caller = appRouter.createCaller(context());
    catalogDb.createService.mockResolvedValue({ id: 5, ...serviceInput });
    catalogDb.updateService.mockResolvedValue({ id: 5, ...serviceInput, sortOrder: 3 });
    catalogDb.removeService.mockResolvedValue({ success: true });

    await caller.catalog.admin.createService(serviceInput);
    await caller.catalog.admin.updateService({ id: 5, data: { ...serviceInput, sortOrder: 3 } });
    await caller.catalog.admin.deleteService({ id: 5 });

    expect(catalogDb.createService).toHaveBeenCalledWith(serviceInput);
    expect(catalogDb.updateService).toHaveBeenCalledWith(5, { ...serviceInput, sortOrder: 3 });
    expect(catalogDb.removeService).toHaveBeenCalledWith(5);
  });

  it("denies product edits to authenticated non-admin users", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.catalog.admin.createProduct(productInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(catalogDb.createProduct).not.toHaveBeenCalled();
  });
});
