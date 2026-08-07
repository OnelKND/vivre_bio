import type { Metadata } from "next";
import Link from "next/link";
import { listOrders, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";
import { getAllReviews } from "@/lib/reviews";
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

const PAGE_SIZE = 20;

function buildUrl(params: { statut?: string; q?: string; page?: number }): string {
  const search = new URLSearchParams();
  if (params.statut && params.statut !== "toutes") search.set("statut", params.statut);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; page?: string }>;
}) {
  const { statut, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const status = statut && statut !== "toutes" ? (statut as OrderStatus) : undefined;

  const { orders, total } = listOrders({
    status,
    query: q,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pendingReviewsCount = getAllReviews().filter(
    (review) => review.status === "en_attente"
  ).length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-2xl">Commandes</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/produits" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-box" aria-hidden="true" />
            Produits
          </Link>
          <Link href="/admin/articles" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-newspaper" aria-hidden="true" />
            Articles
          </Link>
          <Link href="/admin/avis" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-star" aria-hidden="true" />
            Avis
            {pendingReviewsCount > 0 && (
              <span className="badge badge-accent badge-xs">{pendingReviewsCount}</span>
            )}
          </Link>
          <form action={logoutAdmin}>
            <button type="submit" className="btn btn-ghost btn-sm">
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-2 mb-4">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.slug}
            href={buildUrl({ statut: filter.slug, q })}
            className={`btn rounded-field px-5 whitespace-nowrap ${
              (statut ?? "toutes") === filter.slug ? "btn-primary" : "btn-outline"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <form action="/admin" method="get" className="flex gap-2 mb-6 max-w-sm">
        {statut && <input type="hidden" name="statut" value={statut} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher (nom, téléphone)"
          className="input border border-base-300 input-sm w-full"
        />
        <button type="submit" className="btn btn-sm btn-outline">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        </button>
      </form>

      <form
        action="/admin/commandes/export"
        method="get"
        className="flex flex-wrap items-end gap-2 mb-8 p-4 rounded-box border border-base-300 bg-base-200/40"
      >
        {statut && <input type="hidden" name="statut" value={statut} />}
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs font-medium text-base-content/70">
            Du
          </label>
          <input id="from" type="date" name="from" className="input border border-base-300 input-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs font-medium text-base-content/70">
            Au
          </label>
          <input id="to" type="date" name="to" className="input border border-base-300 input-sm" />
        </div>
        <button type="submit" className="btn btn-sm btn-outline">
          <i className="fa-solid fa-download" aria-hidden="true" />
          Exporter en CSV
        </button>
        <p className="text-xs text-base-content/50 w-full mt-1">
          Laisser les dates vides pour tout exporter. Respecte le filtre de statut actif ci-dessus.
        </p>
      </form>

      {orders.length === 0 ? (
        <p className="text-base-content/60">Aucune commande pour ce filtre.</p>
      ) : (
        <>
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
                      <span className="badge badge-outline px-3 py-3 whitespace-nowrap">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Link
                href={buildUrl({ statut, q, page: page - 1 })}
                aria-disabled={page <= 1}
                className={`btn btn-sm btn-outline ${page <= 1 ? "btn-disabled" : ""}`}
              >
                Précédent
              </Link>
              <span className="text-sm text-base-content/60">
                Page {page} / {totalPages}
              </span>
              <Link
                href={buildUrl({ statut, q, page: page + 1 })}
                aria-disabled={page >= totalPages}
                className={`btn btn-sm btn-outline ${page >= totalPages ? "btn-disabled" : ""}`}
              >
                Suivant
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
