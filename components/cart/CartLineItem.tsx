"use client";

import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatFCFA } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import ProductImage from "@/components/product/ProductImage";
import QuantityInput from "@/components/product/QuantityInput";

export default function CartLineItem({
  product,
  quantity,
}: {
  product: Product;
  quantity: number;
}) {
  const { setQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4 py-4 border-b border-base-300 last:border-b-0">
      <div className="w-20 shrink-0">
        <ProductImage src={product.image} alt={product.name} sizes="80px" />
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/produits/${product.slug}`}
          className="font-semibold hover:text-primary transition-colors"
        >
          {product.name}
        </Link>
        <p className="text-sm text-base-content/60">{formatFCFA(product.price)}</p>
      </div>

      <QuantityInput
        value={quantity}
        onChange={(next) => setQuantity(product.slug, next)}
        min={1}
        max={20}
      />

      <p className="w-24 text-right font-semibold">
        {formatFCFA(product.price * quantity)}
      </p>

      <button
        type="button"
        onClick={() => removeFromCart(product.slug)}
        aria-label={`Retirer ${product.name} du panier`}
        className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-accent"
      >
        <i className="fa-solid fa-trash" aria-hidden="true" />
      </button>
    </div>
  );
}
