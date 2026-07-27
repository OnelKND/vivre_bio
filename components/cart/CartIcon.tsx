"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartIcon() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/panier"
      aria-label={`Panier, ${totalItems} article${totalItems > 1 ? "s" : ""}`}
      className="btn btn-ghost btn-circle relative"
    >
      <i className="fa-solid fa-cart-shopping text-lg" aria-hidden="true" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 badge badge-accent badge-sm text-accent-content">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
