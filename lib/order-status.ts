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

export type PaymentMethod = "cash" | "fedapay";
export type PaymentStatus = "non_requis" | "en_attente" | "paye" | "echoue";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Paiement à la livraison",
  fedapay: "FedaPay (en ligne)",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  non_requis: "N/A",
  en_attente: "En attente",
  paye: "Payé",
  echoue: "Échoué",
};

/** Classes daisyUI par statut de paiement. */
export const PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatus, string> = {
  non_requis: "badge-ghost",
  en_attente: "badge-warning",
  paye: "badge-success",
  echoue: "badge-error",
};
