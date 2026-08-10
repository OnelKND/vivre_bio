import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import CheckoutPageClient from "./CheckoutPageClient";

// Le catalogue vit en base et peut changer à tout moment depuis l'admin.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Passer la commande",
  description:
    "Choisissez votre zone de livraison et vos coordonnées pour finaliser votre commande VIVRE BIO. Paiement à la livraison.",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const products = await getAllProducts();
  return <CheckoutPageClient products={products} />;
}
