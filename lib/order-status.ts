// Constantes pures (pas d'accès DB) séparées de lib/orders.ts (server-only)
// pour pouvoir être importées depuis un Client Component, comme
// TrackOrderForm.tsx.
export type OrderStatus = "recue" | "preparation" | "expediee" | "livree";

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  "recue",
  "preparation",
  "expediee",
  "livree",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recue: "Commande reçue",
  preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
};

/** Classes daisyUI par statut, pour repérer l'état d'une commande d'un coup d'œil. */
export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  recue: "badge-info",
  preparation: "badge-warning",
  expediee: "badge-secondary",
  livree: "badge-primary",
};
