"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { getProductBySlug, type Product } from "@/lib/products";
import { getAllDeliveryZones } from "@/lib/delivery-zones";
import { formatFCFA } from "@/lib/format";
import { createOrder, type CheckoutFormState } from "./actions";

const initialState: CheckoutFormState = { status: "idle" };

export default function CheckoutPageClient() {
  const { lines } = useCart();
  const zones = getAllDeliveryZones();
  const [zoneSlug, setZoneSlug] = useState(zones[0]?.slug ?? "");
  const [state, formAction, pending] = useActionState(createOrder, initialState);

  const items = useMemo(
    () =>
      lines
        .map((line) => {
          const product = getProductBySlug(line.slug);
          return product ? { product, quantity: line.quantity } : null;
        })
        .filter(
          (item): item is { product: Product; quantity: number } => item !== null
        ),
    [lines]
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const selectedZone = zones.find((zone) => zone.slug === zoneSlug);
  const deliveryFee = selectedZone?.fee ?? 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center flex flex-col items-center gap-4">
        <h1 className="font-bold text-3xl">Votre panier est vide</h1>
        <p className="text-base-content/70">
          Ajoutez des produits à votre panier avant de passer commande.
        </p>
        <Link href="/catalogue" className="btn btn-primary">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <h1 className="font-bold text-3xl mb-8">Passer la commande</h1>

      <form action={formAction} className="grid md:grid-cols-2 gap-10">
        <input type="hidden" name="cartItems" value={JSON.stringify(lines)} />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="customerName" className="font-medium text-sm">
              Nom complet
            </label>
            <input
              id="customerName"
              name="customerName"
              required
              className="input input-bordered w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="font-medium text-sm">
              Téléphone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="input input-bordered w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="font-medium text-sm">
              Adresse de livraison
            </label>
            <textarea
              id="address"
              name="address"
              required
              rows={3}
              className="textarea textarea-bordered w-full"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="font-medium text-sm mb-1">
              Zone de livraison
            </legend>
            {zones.map((zone) => (
              <label
                key={zone.slug}
                className="flex items-center justify-between gap-3 border border-base-300 rounded-field px-4 py-3 cursor-pointer has-[:checked]:border-primary"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="zoneSlug"
                    value={zone.slug}
                    checked={zoneSlug === zone.slug}
                    onChange={() => setZoneSlug(zone.slug)}
                    className="radio radio-primary radio-sm"
                  />
                  {zone.label}
                </span>
                <span className="font-medium">{formatFCFA(zone.fee)}</span>
              </label>
            ))}
          </fieldset>

          {state.status === "error" && (
            <p role="alert" className="text-accent text-sm">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary btn-lg mt-2"
          >
            {pending ? "Envoi de la commande..." : "Confirmer la commande"}
          </button>
          <p className="text-xs text-base-content/60">
            Paiement à la livraison uniquement (espèces ou Mobile Money).
          </p>
        </div>

        <div className="rounded-box border border-base-300 p-6 h-fit">
          <h2 className="font-semibold mb-4">Récapitulatif</h2>
          <ul className="flex flex-col gap-2 mb-4">
            {items.map((item) => (
              <li key={item.product.slug} className="flex justify-between text-sm">
                <span>
                  {item.quantity} x {item.product.name}
                </span>
                <span>{formatFCFA(item.product.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-base-300 pt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatFCFA(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>{selectedZone ? formatFCFA(deliveryFee) : "—"}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-base-300">
              <span>Total</span>
              <span>{formatFCFA(total)}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
