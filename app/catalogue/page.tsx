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
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const category = categorie ? getCategoryBySlug(categorie) : undefined;
  const products = category
    ? getProductsByCategory(category.slug)
    : getAllProducts();

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
          <div className="mt-8">
            <CategoryFilter activeCategory={category?.slug} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <ProductGrid products={products} />
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
