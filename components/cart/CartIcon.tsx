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
        <span
          key={totalItems}
          className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-content ring-2 ring-base-100 animate-[cart-badge-pop_300ms_ease-out]"
        >
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
