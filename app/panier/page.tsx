import type { Metadata } from "next";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = {
  title: "Votre panier",
  description: "Consultez et modifiez les articles de votre panier VIVRE BIO avant de passer commande.",
  robots: { index: false },
};

export default function CartPage() {
  return <CartPageClient />;
}
