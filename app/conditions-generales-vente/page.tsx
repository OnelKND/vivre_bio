import type { Metadata } from "next";
import { getAllDeliveryZones } from "@/lib/delivery-zones";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente du site VIVRE BIO : commande, livraison et paiement à la livraison.",
};

export default function CGVPage() {
  const zones = getAllDeliveryZones();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 prose">
      <h1>Conditions générales de vente</h1>
      <p className="text-base-content/60 italic">
        Contenu à finaliser avec VIVRE BIO avant la mise en ligne.
      </p>

      <h2>Commande</h2>
      <p>
        Les commandes sont passées directement sur le site, sans obligation
        de créer un compte. Un compte peut être créé après la commande.
      </p>

      <h2>Paiement</h2>
      <p>
        Le paiement s&apos;effectue exclusivement à la livraison, en espèces
        ou par Mobile Money remis directement au livreur à la réception.
        Aucun paiement en ligne n&apos;est proposé sur ce site.
      </p>

      <h2>Livraison</h2>
      <p>Des frais de livraison fixes s&apos;appliquent selon la zone choisie :</p>
      <ul>
        {zones.map((zone) => (
          <li key={zone.slug}>
            {zone.label} — {zone.fee} FCFA
          </li>
        ))}
      </ul>

      <h2>Suivi de commande</h2>
      <p>
        Chaque commande suit les statuts suivants : Commande reçue, En
        préparation, Expédiée, Livrée. Ces statuts sont mis à jour
        manuellement par VIVRE BIO.
      </p>
    </div>
  );
}
