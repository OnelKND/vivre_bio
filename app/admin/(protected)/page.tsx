import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardStats } from "@/lib/orders";
import { getOutOfStockProducts } from "@/lib/products";
import { formatFCFA } from "@/lib/format";

export const metadata: Metadata = {
  title: "Tableau de bord — Espace VIVRE BIO",
  robots: { index: false },
};

export default async function AdminDashboardPage() {
  const [stats, outOfStockProducts] = await Promise.all([
    getDashboardStats(),
    getOutOfStockProducts(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <h1 className="font-bold text-2xl mb-8">Tableau de bord</h1>
          <Link href="/" className="btn btn-primary mt-4">← Retour à l'accueil</Link>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="rounded-box border border-base-300 p-4">
          <p className="text-xs text-base-content/60 mb-1">CA total (toutes commandes)</p>
          <p className="font-bold text-xl">{formatFCFA(stats.totalRevenue)}</p>
        </div>
        <div className="rounded-box border border-base-300 p-4">
          <p className="text-xs text-base-content/60 mb-1">Commandes aujourd&apos;hui</p>
          <p className="font-bold text-xl">{stats.ordersToday}</p>
        </div>
        <div className="rounded-box border border-base-300 p-4">
          <p className="text-xs text-base-content/60 mb-1">Encaissé (FedaPay)</p>
          <p className="font-bold text-xl">{formatFCFA(stats.totalFedapayPaid)}</p>
        </div>
        <div className="rounded-box border border-base-300 p-4">
          <p className="text-xs text-base-content/60 mb-1">Paiements FedaPay en attente</p>
          <p className="font-bold text-xl">{stats.pendingFedapayCount}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-box border border-base-300 p-6">
          <h2 className="font-semibold mb-4">Top ventes</h2>
          {stats.topSellingProducts.length === 0 ? (
            <p className="text-sm text-base-content/60">Aucune vente pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.topSellingProducts.map((product, index) => (
                <li key={product.slug} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-base-content/40 w-4">{index + 1}.</span>
                    {product.name}
                  </span>
                  <span className="font-medium">{product.quantity} vendu(s)</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-box border border-base-300 p-6">
          <h2 className="font-semibold mb-4">
            Produits en rupture de stock
            {outOfStockProducts.length > 0 && (
              <span className="badge badge-accent badge-sm ml-2">
                {outOfStockProducts.length}
              </span>
            )}
          </h2>
          {outOfStockProducts.length === 0 ? (
            <p className="text-sm text-base-content/60">Aucun produit en rupture.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {outOfStockProducts.map((product) => (
                <li key={product.slug} className="flex items-center justify-between text-sm">
                  <span>{product.name}</span>
                  <Link
                    href={`/admin/produits/${product.id}`}
                    className="link link-primary text-xs"
                  >
                    Gérer le stock
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
