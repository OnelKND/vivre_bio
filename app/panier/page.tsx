import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import CartPageClient from "./CartPageClient";

// Le catalogue vit en base et peut changer à tout moment depuis l'admin.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Votre panier",
  description: "Consultez et modifiez les articles de votre panier VIVRE BIO avant de passer commande.",
  robots: { index: false },
};

export default function CartPage() {
  const products = getAllProducts();
  return <CartPageClient products={products} />;
}
