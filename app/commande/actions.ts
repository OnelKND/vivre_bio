"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { getDeliveryZoneBySlug } from "@/lib/delivery-zones";
import { insertOrder, getOrderById, type OrderItemRecord } from "@/lib/orders";
import { sendOrderNotificationEmail } from "@/lib/mail";

const cartItemSchema = z.object({
  slug: z.string(),
  quantity: z.number().int().positive().max(50),
});

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Merci d'indiquer votre nom complet."),
  phone: z.string().trim().min(8, "Merci d'indiquer un numéro de téléphone valide."),
  address: z.string().trim().min(5, "Merci d'indiquer une adresse de livraison."),
  zoneSlug: z.string().min(1, "Merci de choisir une zone de livraison."),
  cartItems: z.array(cartItemSchema).min(1, "Votre panier est vide."),
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
  const items: OrderItemRecord[] = [];
  for (const line of parsed.data.cartItems) {
    const product = getProductBySlug(line.slug);
    if (!product) continue;
    items.push({
      slug: product.slug,
      name: product.name,
      unitPrice: product.price,
      quantity: line.quantity,
    });
  }

  if (items.length === 0) {
    return {
      status: "error",
      message: "Votre panier est vide ou contient des produits indisponibles.",
    };
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const total = subtotal + zone.fee;

  const orderId = insertOrder({
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    address: parsed.data.address,
    deliveryZoneSlug: zone.slug,
    deliveryZoneLabel: zone.label,
    deliveryFee: zone.fee,
    items,
    subtotal,
    total,
  });

  const order = getOrderById(orderId);
  if (order) {
    await sendOrderNotificationEmail(order);
  }

  redirect(`/commande/confirmation/${orderId}`);
}
