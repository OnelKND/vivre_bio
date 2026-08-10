import type { Metadata } from "next";
import Link from "next/link";
import { getAllReviews } from "@/lib/reviews";
import ReviewStars from "@/components/product/ReviewStars";
import DeleteReviewButton from "@/components/admin/DeleteReviewButton";
import { approveReviewAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Avis clients — Espace VIVRE BIO",
  robots: { index: false },
};

export default async function AdminReviewsPage() {
  const reviews = await getAllReviews();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <Link href="/admin" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux commandes
      </Link>
      <h1 className="font-bold text-2xl mb-8">Avis clients</h1>

      {reviews.length === 0 ? (
        <p className="text-base-content/60">Aucun avis pour le moment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Auteur</th>
                <th>Note</th>
                <th>Avis</th>
                <th>Statut</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td className="text-sm">
                    <Link href={`/produits/${review.productSlug}`} className="link link-primary">
                      {review.productSlug}
                    </Link>
                  </td>
                  <td>{review.authorName}</td>
                  <td>
                    <ReviewStars rating={review.rating} />
                  </td>
                  <td className="text-sm text-base-content/70 max-w-xs">
                    <p className="line-clamp-2">{review.comment}</p>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        review.status === "approuve" ? "badge-primary" : "badge-outline"
                      }`}
                    >
                      {review.status === "approuve" ? "Approuvé" : "En attente"}
                    </span>
                  </td>
                  <td className="flex gap-2 justify-end">
                    {review.status === "en_attente" && (
                      <form action={approveReviewAction}>
                        <input type="hidden" name="id" value={review.id} />
                        <button type="submit" className="link link-primary text-sm">
                          Approuver
                        </button>
                      </form>
                    )}
                    <DeleteReviewButton id={review.id} />
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
