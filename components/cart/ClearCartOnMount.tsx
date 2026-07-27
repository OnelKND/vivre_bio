"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/** Vide le panier une fois la commande confirmée (page de confirmation). */
export default function ClearCartOnMount() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
