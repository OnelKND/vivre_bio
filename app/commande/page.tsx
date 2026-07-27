import type { Metadata } from "next";
import CheckoutPageClient from "./CheckoutPageClient";

export const metadata: Metadata = {
  title: "Passer la commande",
  description:
    "Choisissez votre zone de livraison et vos coordonnées pour finaliser votre commande VIVRE BIO. Paiement à la livraison.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
