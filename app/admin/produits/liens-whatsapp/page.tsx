import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import BulkWhatsappLinksForm from "@/components/admin/BulkWhatsappLinksForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Liens catalogue WhatsApp — Espace VIVRE BIO",
  robots: { index: false },
};

export default function AdminWhatsappLinksPage() {
  const products = getAllProducts();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <Link href="/admin/produits" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux produits
      </Link>
      <h1 className="font-bold text-2xl mb-2">Liens catalogue WhatsApp</h1>
      <p className="text-sm text-base-content/60 mb-8">
        Renseigne ici le lien de chaque produit dans le catalogue WhatsApp
        Business (Partager → Copier le lien depuis l&apos;app), puis
        enregistre en une fois. Laisse un champ vide pour garder le
        comportement par défaut (message pré-rempli) sur ce produit.
      </p>

      {products.length === 0 ? (
        <p className="text-base-content/60">Aucun produit pour le moment.</p>
      ) : (
        <BulkWhatsappLinksForm products={products} />
      )}
    </div>
  );
}
