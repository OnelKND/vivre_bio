import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOrderById,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SEQUENCE,
} from "@/lib/orders";
import { formatFCFA } from "@/lib/format";
import { changeOrderStatus } from "../../actions";

export const metadata: Metadata = {
  title: "Détail commande — Espace VIVRE BIO",
  robots: { index: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getOrderById(Number(id));
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <Link href="/admin" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux commandes
      </Link>
      <h1 className="font-bold text-2xl mb-6">Commande #{order.id}</h1>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="font-semibold mb-2">Client</h2>
          <p>{order.customerName}</p>
          <p>{order.phone}</p>
          <p>{order.address}</p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Livraison</h2>
          <p>
            {order.deliveryZoneLabel} — {formatFCFA(order.deliveryFee)}
          </p>
          <p className="text-sm text-base-content/60">
            Passée le {new Date(order.createdAt).toLocaleString("fr-FR")}
          </p>
        </div>
      </div>

      <div className="rounded-box border border-base-300 p-6 mb-8">
        <h2 className="font-semibold mb-4">Produits</h2>
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
            <span>Livraison</span>
            <span>{formatFCFA(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-base-300">
            <span>Total</span>
            <span>{formatFCFA(order.total)}</span>
          </div>
        </div>
      </div>

      <form action={changeOrderStatus} className="flex items-end gap-3">
        <input type="hidden" name="orderId" value={order.id} />
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="font-medium text-sm">
            Statut de la commande
          </label>
          <select
            id="status"
            name="status"
            defaultValue={order.status}
            className="select select-bordered"
          >
            {ORDER_STATUS_SEQUENCE.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Mettre à jour
        </button>
      </form>
    </div>
  );
}
