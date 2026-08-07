import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import DeleteArticleButton from "@/components/admin/DeleteArticleButton";
import { togglePublishAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles — Espace VIVRE BIO",
  robots: { index: false },
};

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const allArticles = getAllArticles();
  const query = q?.trim().toLowerCase();
  const articles = query
    ? allArticles.filter((article) => article.title.toLowerCase().includes(query))
    : allArticles;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <Link href="/admin" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux commandes
      </Link>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-2xl">Articles</h1>
        <Link href="/admin/articles/nouveau" className="btn btn-primary btn-sm">
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Ajouter un article
        </Link>
      </div>

      <form action="/admin/articles" method="get" className="flex gap-2 mb-6 max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher (titre)"
          className="input border border-base-300 input-sm w-full"
        />
        <button type="submit" className="btn btn-sm btn-outline">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        </button>
      </form>

      {articles.length === 0 ? (
        <p className="text-base-content/60">
          {query ? "Aucun article ne correspond à cette recherche." : "Aucun article pour le moment."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th aria-label="Image" />
                <th>Titre</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <div className="w-12 h-12 relative rounded-field overflow-hidden bg-base-200">
                      <Image src={article.coverImage} alt="" fill className="object-cover" />
                    </div>
                  </td>
                  <td>{article.title}</td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        article.status === "publie" ? "badge-primary" : "badge-outline"
                      }`}
                    >
                      {article.status === "publie" ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/60">
                    {new Date(article.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="flex gap-2 justify-end">
                    <form action={togglePublishAction}>
                      <input type="hidden" name="id" value={article.id} />
                      <button type="submit" className="link link-primary text-sm">
                        {article.status === "publie" ? "Dépublier" : "Publier"}
                      </button>
                    </form>
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="link link-primary text-sm"
                    >
                      Modifier
                    </Link>
                    <DeleteArticleButton id={article.id} title={article.title} />
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
