"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { getProductBySlug, type Product } from "@/lib/products";
import { formatFCFA } from "@/lib/format";
import CartLineItem from "@/components/cart/CartLineItem";

export default function CartPageClient() {
  const { lines, clearCart } = useCart();

  const items = lines
    .map((line) => {
      const product = getProductBySlug(line.slug);
      return product ? { product, quantity: line.quantity } : null;
    })
    .filter((item): item is { product: Product; quantity: number } => item !== null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center flex flex-col items-center gap-4">
        <h1 className="font-bold text-3xl">Votre panier est vide</h1>
        <p className="text-base-content/70">
          Parcourez notre catalogue pour trouver vos huiles essentielles et
          extraits préférés.
        </p>
        <Link href="/catalogue" className="btn btn-primary">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <h1 className="font-bold text-3xl mb-8">Votre panier</h1>

      <div className="rounded-box border border-base-300 px-4 sm:px-6">
        {items.map((item) => (
          <CartLineItem
            key={item.product.slug}
            product={item.product}
            quantity={item.quantity}
          />
        ))}
      </div>

      <div className="flex flex-col items-end gap-4 mt-8">
        <div className="flex items-center gap-4 text-lg">
          <span>Sous-total</span>
          <span className="font-bold">{formatFCFA(subtotal)}</span>
        </div>
        <p className="text-sm text-base-content/60">
          Les frais de livraison seront ajoutés à l&apos;étape suivante selon
          votre zone.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={clearCart} className="btn btn-ghost">
            Vider le panier
          </button>
          <Link href="/commande" className="btn btn-primary">
            Passer la commande
          </Link>
        </div>
      </div>
    </div>
  );
}
