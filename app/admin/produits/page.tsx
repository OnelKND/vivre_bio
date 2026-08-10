import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { getAllCategories } from "@/lib/categories";
import { formatFCFA } from "@/lib/format";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produits — Espace VIVRE BIO",
  robots: { index: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const categories = getAllCategories();
  const categoryNames = new Map(categories.map((category) => [category.slug, category.name]));

  const allProducts = await getAllProducts();
  const query = q?.trim().toLowerCase();
  const products = query
    ? allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (categoryNames.get(product.category) ?? "").toLowerCase().includes(query)
      )
    : allProducts;
  const suggestions = Array.from(categoryNames.values());

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <Link href="/admin" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux commandes
      </Link>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-2xl">Produits</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/produits/liens-whatsapp" className="btn btn-outline btn-sm">
            <i className="fa-brands fa-whatsapp" aria-hidden="true" />
            Liens catalogue WhatsApp
          </Link>
          <Link href="/admin/produits/nouveau" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Ajouter un produit
          </Link>
        </div>
      </div>

      <form action="/admin/produits" method="get" className="flex gap-2 mb-2 max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher (nom, catégorie)"
          list="product-suggestions"
          className="input border border-base-300 input-sm w-full"
        />
        <datalist id="product-suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
        <button type="submit" className="btn btn-sm btn-outline">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        </button>
      </form>
      <div className="mb-6">
        <p className="text-sm text-base-content/70 mb-2">
          Suggestions de recherche
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.slice(0, 12).map((suggestion) => (
            <Link
              key={suggestion}
              href={`/admin/produits?q=${encodeURIComponent(suggestion)}`}
              className="badge badge-outline badge-sm"
            >
              {suggestion}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-base-content/60">
          {query ? "Aucun produit ne correspond à cette recherche." : "Aucun produit pour le moment."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th aria-label="Image" />
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Vedette</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="w-12 h-12 relative rounded-field overflow-hidden bg-base-200">
                      <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {product.name}
                      {product.image.endsWith(".svg") && (
                        <span
                          className="badge badge-warning badge-xs whitespace-nowrap"
                          title="Photo produit pas encore uploadée"
                        >
                          Sans photo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-sm text-base-content/60">
                    {categoryNames.get(product.category) ?? product.category}
                  </td>
                  <td>{formatFCFA(product.price)}</td>
                  <td>
                    {product.stock <= 0 ? (
                      <span className="badge badge-accent badge-sm">Épuisé</span>
                    ) : product.stock <= 5 ? (
                      <span className="badge badge-warning badge-sm">{product.stock} — bas</span>
                    ) : (
                      product.stock
                    )}
                  </td>
                  <td>
                    {product.featured && (
                      <span className="badge badge-primary badge-sm">Vedette</span>
                    )}
                  </td>
                  <td className="flex gap-2 justify-end">
                    <Link
                      href={`/admin/produits/${product.id}${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                      className="link link-primary text-sm"
                    >
                      Modifier
                    </Link>
                    <DeleteProductButton id={product.id} name={product.name} q={q} />
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
