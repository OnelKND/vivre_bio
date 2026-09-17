import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCategories } from "@/lib/categories";
import { getProductById } from "@/lib/products";
import ProductForm from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Modifier le produit — Espace VIVRE BIO",
  robots: { index: false },
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const product = await getProductById(Number(id));
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <Link
        href={`/admin/produits${q ? `?q=${encodeURIComponent(q)}` : ""}`}
        className="text-sm link link-primary mb-6 inline-block"
      >
        ← Retour aux produits
      </Link>
      <h1 className="font-bold text-2xl mb-8">Modifier « {product.name} »</h1>
      <ProductForm categories={getAllCategories()} product={product} q={q} />
    </div>
  );
}
