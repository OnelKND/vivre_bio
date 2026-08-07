import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatFCFA } from "@/lib/format";
import ClearCartOnMount from "@/components/cart/ClearCartOnMount";

export const metadata: Metadata = {
  title: "Commande confirmée",
  description: "Récapitulatif de votre commande VIVRE BIO.",
  robots: { index: false },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getOrderById(Number(id));
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 flex flex-col gap-8">
      <ClearCartOnMount />

      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <i className="fa-solid fa-check text-2xl text-primary" aria-hidden="true" />
        </div>
        <h1 className="font-bold text-3xl">
          Merci, {order.customerName.split(" ")[0]} !
        </h1>
        <p className="text-base-content/70">
          Votre commande #{order.id} a bien été enregistrée. Statut actuel :{" "}
          <span className="font-semibold text-primary">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </p>
        <p className="text-sm text-base-content/60">
          Paiement à la livraison, en espèces ou par Mobile Money.
        </p>
        <p className="text-sm text-base-content/60">
          Vous pourrez suivre l&apos;avancement de votre commande à tout moment sur{" "}
          <Link href="/suivi-commande" className="link link-primary">
            la page de suivi
          </Link>
          , avec le numéro #{order.id} et votre téléphone.
        </p>
      </div>

      <div className="rounded-box border border-base-300 p-6">
        <h2 className="font-semibold mb-4">Récapitulatif</h2>
        <ul className="flex flex-col gap-2 mb-4">
          {order.items.map((item) => (
            <li key={item.slug} className="flex justify-between text-sm">
              <span>
                {item.quantity} x {item.name}
              </span>
              <span>{formatFCFA(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-base-300 pt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span>{formatFCFA(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Livraison ({order.deliveryZoneLabel})</span>
            <span>{formatFCFA(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-base-300">
            <span>Total</span>
            <span>{formatFCFA(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-base-content/70">
        <p>Livraison à : {order.address}</p>
        <p>Téléphone : {order.phone}</p>
      </div>

      <Link href="/catalogue" className="btn btn-outline btn-primary self-center">
        Continuer mes achats
      </Link>
    </div>
  );
}
