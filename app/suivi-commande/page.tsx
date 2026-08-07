import type { Metadata } from "next";
import TrackOrderForm from "./TrackOrderForm";

export const metadata: Metadata = {
  title: "Suivre ma commande",
  description: "Consultez le statut de votre commande VIVRE BIO : reçue, en préparation, expédiée ou livrée.",
};

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <h1 className="font-bold text-3xl mb-2">Suivre ma commande</h1>
      <p className="text-base-content/70 mb-8">
        Renseignez le numéro de commande (indiqué sur votre page de confirmation) et le
        numéro de téléphone utilisé lors de la commande.
      </p>
      <TrackOrderForm />
    </div>
  );
}
