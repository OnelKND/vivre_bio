"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getDeliveryZoneBySlug } from "@/lib/delivery-zones";
import { insertOrder, getOrderById } from "@/lib/orders";
import { computeOrderItems, computeTotals } from "@/lib/order-pricing";
import { sendOrderNotificationEmail } from "@/lib/mail";
import { decrementStock, getProductBySlug } from "@/lib/products";

const cartItemSchema = z.object({
  slug: z.string().max(200),
  quantity: z.number().int().positive().max(50),
});

// Numéros béninois : +229 optionnel suivi de 8 à 10 chiffres (espaces tolérés).
const PHONE_REGEX = /^(\+229)?\d{8,10}$/;

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Merci d'indiquer votre nom complet.").max(100),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, ""))
    .pipe(z.string().regex(PHONE_REGEX, "Merci d'indiquer un numéro de téléphone valide.")),
  address: z.string().trim().min(5, "Merci d'indiquer une adresse de livraison.").max(500),
  zoneSlug: z.string().min(1, "Merci de choisir une zone de livraison.").max(100),
  cartItems: z.array(cartItemSchema).min(1, "Votre panier est vide.").max(50),
  idempotencyKey: z.string().max(100).optional(),
});

export interface CheckoutFormState {
  status: "idle" | "error";
  message?: string;
}

export async function createOrder(
  _prevState: CheckoutFormState,
  formData: FormData
): Promise<CheckoutFormState> {
  let cartItemsRaw: unknown;
  try {
    cartItemsRaw = JSON.parse(String(formData.get("cartItems") ?? "[]"));
  } catch {
    cartItemsRaw = [];
  }

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    zoneSlug: formData.get("zoneSlug"),
    cartItems: cartItemsRaw,
    idempotencyKey: formData.get("idempotencyKey") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Merci de vérifier le formulaire.",
    };
  }

  const zone = getDeliveryZoneBySlug(parsed.data.zoneSlug);
  if (!zone) {
    return { status: "error", message: "Zone de livraison invalide." };
  }

  // On ne fait jamais confiance aux prix envoyés par le client : les prix et
  // le tarif de livraison sont relus depuis le catalogue et les zones de
  // référence, uniquement les slugs/quantités viennent du formulaire.
  const items = computeOrderItems(parsed.data.cartItems);

  if (items.length === 0) {
    return {
      status: "error",
      message: "Votre panier est vide ou contient des produits indisponibles.",
    };
  }

  // Le panier (localStorage) ne connaît pas le stock en temps réel : on
  // revalide toujours côté serveur, jamais confiance aux quantités du
  // client — même logique que les prix, déjà relus depuis lib/products.ts.
  for (const item of items) {
    const product = getProductBySlug(item.slug);
    if (!product || product.stock < item.quantity) {
      return {
        status: "error",
        message: product
          ? `Stock insuffisant pour ${product.name} (il en reste ${product.stock}).`
          : "Un des produits de votre panier n'est plus disponible.",
      };
    }
  }

  const { subtotal, total } = computeTotals(items, zone.fee);

  const { id: orderId, isNew } = insertOrder({
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    address: parsed.data.address,
    deliveryZoneSlug: zone.slug,
    deliveryZoneLabel: zone.label,
    deliveryFee: zone.fee,
    items,
    subtotal,
    total,
    idempotencyKey: parsed.data.idempotencyKey,
  });

  if (isNew) {
    for (const item of items) {
      decrementStock(item.slug, item.quantity);
    }

    const order = getOrderById(orderId);
    if (order) {
      await sendOrderNotificationEmail(order);
    }
  }

  redirect(`/commande/confirmation/${orderId}`);
}
