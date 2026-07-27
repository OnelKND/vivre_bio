import type { Metadata } from "next";
import Link from "next/link";
import { listOrders, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";
import { formatFCFA } from "@/lib/format";
import { logoutAdmin } from "./login/actions";

export const metadata: Metadata = {
  title: "Commandes — Espace VIVRE BIO",
  robots: { index: false },
};

const STATUS_FILTERS: Array<{ slug: OrderStatus | "toutes"; label: string }> = [
  { slug: "toutes", label: "Toutes" },
  { slug: "recue", label: ORDER_STATUS_LABELS.recue },
  { slug: "preparation", label: ORDER_STATUS_LABELS.preparation },
  { slug: "expediee", label: ORDER_STATUS_LABELS.expediee },
  { slug: "livree", label: ORDER_STATUS_LABELS.livree },
];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const allOrders = listOrders();
  const orders =
    statut && statut !== "toutes"
      ? allOrders.filter((order) => order.status === statut)
      : allOrders;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-2xl">Commandes</h1>
        <form action={logoutAdmin}>
          <button type="submit" className="btn btn-ghost btn-sm">
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
            Déconnexion
          </button>
        </form>
      </div>

      <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.slug}
            href={filter.slug === "toutes" ? "/admin" : `/admin?statut=${filter.slug}`}
            className={`btn btn-sm rounded-field ${
              (statut ?? "toutes") === filter.slug ? "btn-primary" : "btn-outline"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="text-base-content/60">Aucune commande pour ce filtre.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Client</th>
                <th>Zone</th>
                <th>Total</th>
                <th>Statut</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{new Date(order.createdAt).toLocaleString("fr-FR")}</td>
                  <td>{order.customerName}</td>
                  <td>{order.deliveryZoneLabel}</td>
                  <td>{formatFCFA(order.total)}</td>
                  <td>
                    <span className="badge badge-outline">
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/commandes/${order.id}`}
                      className="link link-primary text-sm"
                    >
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
