export type CouponType = "percentage" | "fixed" | "free_shipping";

export interface Coupon {
  code: string;
  description: string;
  type: CouponType;
  value: number;
}

export const COUPONS: Coupon[] = [
  {
    code: "BIO10",
    description: "10% de réduction sur le panier",
    type: "percentage",
    value: 10,
  },
  {
    code: "WELCOME500",
    description: "500 FCFA de réduction sur la commande",
    type: "fixed",
    value: 500,
  },
  {
    code: "LIVRAISON",
    description: "Livraison offerte",
    type: "free_shipping",
    value: 0,
  },
];

export function findCoupon(code?: string): Coupon | undefined {
  const normalized = String(code ?? "").trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === normalized);
}

export interface CouponCalculation {
  coupon: Coupon | undefined;
  discount: number;
  adjustedDeliveryFee: number;
}

export function calculateCoupon(
  subtotal: number,
  deliveryFee: number,
  couponCode?: string
): CouponCalculation {
  const coupon = findCoupon(couponCode);
  if (!coupon) {
    return { coupon: undefined, discount: 0, adjustedDeliveryFee: deliveryFee };
  }

  if (coupon.type === "percentage") {
    const discount = Math.floor((subtotal * coupon.value) / 100);
    return {
      coupon,
      discount,
      adjustedDeliveryFee: deliveryFee,
    };
  }

  if (coupon.type === "fixed") {
    return {
      coupon,
      discount: Math.min(coupon.value, subtotal),
      adjustedDeliveryFee: deliveryFee,
    };
  }

  // free_shipping
  return {
    coupon,
    discount: 0,
    adjustedDeliveryFee: 0,
  };
}
