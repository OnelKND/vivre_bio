import { getProductBySlug } from "./products";
import type { OrderItemRecord } from "./orders";

export interface CartItemInput {
  slug: string;
  quantity: number;
}

export async function computeOrderItems(cartItems: CartItemInput[]): Promise<OrderItemRecord[]> {
  const items: OrderItemRecord[] = [];
  for (const line of cartItems) {
    const product = await getProductBySlug(line.slug);
    if (!product) continue;
    items.push({
      slug: product.slug,
      name: product.name,
      unitPrice: product.price,
      quantity: line.quantity,
    });
  }
  return items;
}

export function computeTotals(
  items: OrderItemRecord[],
  deliveryFee: number
): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return { subtotal, total: subtotal + deliveryFee };
}
