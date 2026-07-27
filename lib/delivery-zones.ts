export interface DeliveryZone {
  slug: string;
  label: string;
  /** Frais de livraison fixe en FCFA. */
  fee: number;
}

/**
 * Zones et tarifs de livraison — valeurs indicatives à confirmer avec
 * VIVRE BIO avant la mise en ligne.
 */
export const deliveryZones: DeliveryZone[] = [
  { slug: "cotonou-intra-muros", label: "Cotonou intra-muros", fee: 1000 },
  { slug: "peripherie-cotonou", label: "Périphérie de Cotonou", fee: 1500 },
  { slug: "autres-villes-benin", label: "Autres villes du Bénin", fee: 2500 },
];

export function getAllDeliveryZones(): DeliveryZone[] {
  return deliveryZones;
}

export function getDeliveryZoneBySlug(slug: string): DeliveryZone | undefined {
  return deliveryZones.find((zone) => zone.slug === slug);
}
