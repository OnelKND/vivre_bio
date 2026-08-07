import type { Metadata } from "next";
import Link from "next/link";
import { getAllCategories } from "@/lib/categories";
import ProductForm from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Nouveau produit — Espace VIVRE BIO",
  robots: { index: false },
};

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <Link href="/admin/produits" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux produits
      </Link>
      <h1 className="font-bold text-2xl mb-8">Ajouter un produit</h1>
      <ProductForm categories={getAllCategories()} />
    </div>
  );
}
