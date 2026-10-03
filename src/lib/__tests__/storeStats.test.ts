import { describe, it, expect } from "vitest";
import { storeStats, bestSellers, formatDinars, LOW_STOCK, stockDelta, applyStockDelta } from "../storeStats";
import type { Order, Product } from "../types";

const product = (over: Partial<Product>): Product => ({
  id: "p1", storeId: "s1", name: "كاميرا", description: "", price: 1000,
  category: "كاميرات", quantity: 10, createdAt: 0, status: "active", ...over,
});

const order = (over: Partial<Order>): Order => ({
  id: "o1", productId: "p1", productName: "كاميرا", storeId: "s1",
  buyerFirstName: "أمين", buyerLastName: "بن علي", buyerPhone: "0551234567",
  wilaya: "الجزائر", city: "باب الوادي", quantity: 1,
  status: "pending", createdAt: 0, ...over,
});

describe("what the shop is doing", () => {
  it("counts only completed sales as revenue", () => {
    const stats = storeStats(
      [
        order({ id: "a", status: "sold", quantity: 2 }),
        order({ id: "b", status: "pending" }),
        order({ id: "c", status: "in_delivery" }),
        order({ id: "d", status: "cancelled" }),
      ],
      [product({ price: 1000 })]
    );
    expect(stats.sold).toBe(1);
    expect(stats.revenue).toBe(2000);
    expect(stats.pending).toBe(1);
    expect(stats.inDelivery).toBe(1);
    expect(stats.cancelled).toBe(1);
  });

  it("does not invent a price for a product that was deleted", () => {
    const stats = storeStats([order({ status: "sold", productId: "gone" })], []);
    // Counting it as zero understates the figure; inventing one would be worse.
    expect(stats.revenue).toBe(0);
    expect(stats.sold).toBe(1);
  });

  it("separates what has run out from what is about to", () => {
    const stats = storeStats([], [
      product({ id: "a", quantity: 0 }),
      product({ id: "b", quantity: LOW_STOCK }),
      product({ id: "c", quantity: LOW_STOCK + 1 }),
    ]);
    expect(stats.outOfStock).toBe(1);
    expect(stats.lowStock).toBe(1);
    expect(stats.stock).toBe(0 + LOW_STOCK + LOW_STOCK + 1);
  });

  it("never reports negative stock, however the number got there", () => {
    const stats = storeStats([], [product({ quantity: -5 })]);
    expect(stats.stock).toBe(0);
    expect(stats.outOfStock).toBe(1);
  });

  it("reports an empty shop as empty, not as broken", () => {
    const stats = storeStats([], []);
    expect(stats).toMatchObject({ sold: 0, revenue: 0, stock: 0, outOfStock: 0 });
  });
});

describe("the best sellers", () => {
  it("adds up the units of each product that sold", () => {
    const rows = bestSellers([
      order({ id: "1", productId: "a", productName: "ميكروفون", status: "sold", quantity: 3 }),
      order({ id: "2", productId: "a", productName: "ميكروفون", status: "sold", quantity: 2 }),
      order({ id: "3", productId: "b", productName: "كاميرا", status: "sold", quantity: 4 }),
      order({ id: "4", productId: "c", productName: "إضاءة", status: "pending", quantity: 9 }),
    ]);
    expect(rows[0]).toEqual({ productId: "a", name: "ميكروفون", units: 5 });
    expect(rows[1]).toEqual({ productId: "b", name: "كاميرا", units: 4 });
    // A pending order has not sold anything.
    expect(rows.map((r) => r.productId)).not.toContain("c");
  });

  it("returns nothing when nothing has sold", () => {
    expect(bestSellers([order({ status: "pending" })])).toEqual([]);
  });
});

describe("the figures as they read", () => {
  it("groups the thousands", () => {
    expect(formatDinars(1234567)).toBe("1,234,567 دج");
    expect(formatDinars(0)).toBe("0 دج");
  });
});

describe("what a status change does to stock", () => {
  it("takes the units out when an order is marked sold", () => {
    expect(stockDelta("pending", "sold", 3)).toBe(-3);
    expect(stockDelta("in_delivery", "sold", 1)).toBe(-1);
  });

  it("puts them back when a sale is undone", () => {
    expect(stockDelta("sold", "cancelled", 3)).toBe(3);
    expect(stockDelta("sold", "pending", 2)).toBe(2);
  });

  it("moves nothing for a step that is not a sale", () => {
    // A seller moving an order along is not selling it twice.
    expect(stockDelta("pending", "in_delivery", 5)).toBe(0);
    expect(stockDelta("pending", "cancelled", 5)).toBe(0);
    expect(stockDelta("in_delivery", "cancelled", 5)).toBe(0);
  });

  it("moves nothing when the status did not change", () => {
    expect(stockDelta("sold", "sold", 5)).toBe(0);
    expect(stockDelta("pending", "pending", 5)).toBe(0);
  });

  it("ignores a quantity that makes no sense", () => {
    expect(stockDelta("pending", "sold", 0)).toBe(0);
    expect(stockDelta("pending", "sold", -4)).toBe(0);
    expect(stockDelta("pending", "sold", Number.NaN)).toBe(0);
  });

  it("never lets stock fall below zero", () => {
    // A shop that oversold by hand would otherwise carry a negative count
    // for ever, and every later sale would push it further down.
    expect(applyStockDelta(2, -5)).toBe(0);
    expect(applyStockDelta(0, -1)).toBe(0);
  });

  it("returns the units of a cancelled sale even to an empty shelf", () => {
    expect(applyStockDelta(0, 3)).toBe(3);
  });

  it("survives a stock figure that was never a number", () => {
    expect(applyStockDelta(Number.NaN, 2)).toBe(2);
  });

  it("round-trips: selling then cancelling leaves the shelf as it was", () => {
    const start = 7;
    const afterSale = applyStockDelta(start, stockDelta("pending", "sold", 3));
    const afterUndo = applyStockDelta(afterSale, stockDelta("sold", "cancelled", 3));
    expect(afterSale).toBe(4);
    expect(afterUndo).toBe(start);
  });
});
