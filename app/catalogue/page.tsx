import type { Metadata } from "next";
import { getAllProducts, getProductsByCategory } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/categories";
import CategoryFilter from "@/components/product/CategoryFilter";
import ProductGrid from "@/components/product/ProductGrid";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Découvrez toutes les huiles essentielles et extraits naturels VIVRE BIO, classés par catégorie.",
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <SectionHeading
        as="h1"
        eyebrow="Catalogue"
        title={category ? category.name : "Tous nos produits"}
        description={
          category
            ? category.description
            : "L'ensemble de notre gamme d'huiles essentielles et d'extraits naturels."
        }
      />
      <div className="mt-8 mb-10">
        <CategoryFilter activeCategory={category?.slug} />
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
