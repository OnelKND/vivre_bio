import type { Metadata } from "next";
import { getAllProducts, getProductsByCategory } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/categories";
import CategoryFilter from "@/components/product/CategoryFilter";
import CtaBand from "@/components/ui/CtaBand";
import ProductGrid from "@/components/product/ProductGrid";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Découvrez tous les produits naturels bio VIVRE BIO — huiles essentielles, huiles végétales, poudres, graines, infusions et plus — classés par catégorie.",
};

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; q?: string }>;
}) {
  const { categorie, q } = await searchParams;
  const category = categorie ? getCategoryBySlug(categorie) : undefined;
  const baseProducts = category
    ? getProductsByCategory(category.slug)
    : getAllProducts();

  const query = q?.trim().toLowerCase();
  const products = query
    ? baseProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.shortDescription.toLowerCase().includes(query)
      )
    : baseProducts;

  return (
    <>
      <div className="bg-base-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <SectionHeading
            as="h1"
            eyebrow="Catalogue"
            title={category ? category.name : "Tous nos produits"}
            description={
              category
                ? category.description
                : "L'ensemble de notre gamme de produits naturels bio."
            }
          />
          <form
            action="/catalogue"
            method="get"
            className="mt-8 flex gap-2 max-w-sm mx-auto"
          >
            {category && <input type="hidden" name="categorie" value={category.slug} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Rechercher un produit..."
              className="input border border-base-300 w-full"
            />
            <button type="submit" className="btn btn-outline btn-square" aria-label="Rechercher">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            </button>
          </form>
          <div className="mt-4">
            <CategoryFilter activeCategory={category?.slug} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        {query && products.length === 0 ? (
          <p className="text-center text-base-content/60">
            Aucun produit ne correspond à « {q} ».
          </p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>

      <CtaBand
        title="Une question avant de commander ?"
        description="Notre équipe vous répond rapidement."
        href="/contact"
        label="Nous contacter"
      />
    </>
  );
}
