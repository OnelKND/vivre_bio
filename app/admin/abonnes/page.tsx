import type { Metadata } from "next";
import Link from "next/link";
import { getAllSubscribers } from "@/lib/subscribers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abonnés newsletter — Espace VIVRE BIO",
  robots: { index: false },
};

export default function AdminSubscribersPage() {
  const subscribers = getAllSubscribers();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <Link href="/admin" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux commandes
      </Link>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-2xl">Abonnés newsletter</h1>
        <span className="badge badge-outline">{subscribers.length}</span>
      </div>

      {subscribers.length === 0 ? (
        <p className="text-base-content/60">Aucun abonné pour le moment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td>{subscriber.email}</td>
                  <td className="text-sm text-base-content/60">
                    {new Date(subscriber.createdAt).toLocaleString("fr-FR")}
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
