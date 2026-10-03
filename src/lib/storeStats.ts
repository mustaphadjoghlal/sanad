import type { Order, OrderStatus, Product } from "./types";

/**
 * What a shop is actually doing, from the orders it already holds.
 *
 * The seller could see a list of orders and a column of stock numbers, and
 * nothing that added up: not what was sold, not what it came to, not what is
 * about to run out.
 */

export interface StoreStats {
  /** Orders that completed. */
  sold: number;
  /** What those orders came to, in dinars. */
  revenue: number;
  /** Waiting on the seller. */
  pending: number;
  inDelivery: number;
  cancelled: number;
  /** Units left across every product. */
  stock: number;
  outOfStock: number;
  lowStock: number;
}

/** At or below this, a product is about to run out. */
export const LOW_STOCK = 3;

export function storeStats(orders: Order[], products: Product[]): StoreStats {
  const priceOf = new Map(products.map((p) => [p.id, p.price]));

  const stats: StoreStats = {
    sold: 0, revenue: 0, pending: 0, inDelivery: 0, cancelled: 0,
    stock: 0, outOfStock: 0, lowStock: 0,
  };

  for (const order of orders) {
    if (order.status === "sold") {
      stats.sold += 1;
      // A product deleted since the sale leaves no price behind; counting it
      // as zero is wrong but inventing a number is worse.
      stats.revenue += (priceOf.get(order.productId) ?? 0) * (order.quantity || 1);
    } else if (order.status === "pending") stats.pending += 1;
    else if (order.status === "in_delivery") stats.inDelivery += 1;
    else if (order.status === "cancelled") stats.cancelled += 1;
  }

  for (const product of products) {
    const left = Math.max(0, product.quantity ?? 0);
    stats.stock += left;
    if (left === 0) stats.outOfStock += 1;
    else if (left <= LOW_STOCK) stats.lowStock += 1;
  }

  return stats;
}

/** The products that sold most, by units. */
export function bestSellers(
  orders: Order[],
  limit = 3
): { productId: string; name: string; units: number }[] {
  const tally = new Map<string, { name: string; units: number }>();

  for (const order of orders) {
    if (order.status !== "sold") continue;
    const row = tally.get(order.productId) ?? { name: order.productName, units: 0 };
    row.units += order.quantity || 1;
    tally.set(order.productId, row);
  }

  return [...tally.entries()]
    .map(([productId, row]) => ({ productId, ...row }))
    .sort((a, b) => b.units - a.units)
    .slice(0, limit);
}

/** Dinars, grouped the way they are read. */
export function formatDinars(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(Math.round(value))} دج`;
}


/**
 * How many units a status change takes out of stock, or puts back.
 *
 * Only crossing the "sold" line moves anything: pending → in_delivery is a
 * step towards a sale, not a sale. Marking a sold order cancelled returns the
 * units, and marking it sold again takes them out once more — so a seller who
 * clicks the wrong status does not quietly lose stock.
 */
export function stockDelta(from: OrderStatus, to: OrderStatus, units: number): number {
  const amount = Math.max(0, Math.floor(units) || 0);
  if (from === to || amount === 0) return 0;
  if (to === "sold") return -amount;
  if (from === "sold") return amount;
  return 0;
}

/** Stock after a change, never below zero. */
export function applyStockDelta(current: number, delta: number): number {
  return Math.max(0, (Number(current) || 0) + delta);
}
