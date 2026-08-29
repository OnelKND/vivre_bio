import { verifyFedapaySignature, parseFedapayWebhookEvent } from "@/lib/fedapay";
import {
  getOrderById,
  markOrderPaymentPaid,
  markOrderPaymentFailed,
} from "@/lib/orders";
import { decrementStock } from "@/lib/products";
import { sendOrderNotificationEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

// Jamais mis en cache : c'est un endpoint de traitement d'événement à la demande.
export const dynamic = "force-dynamic";

interface FedapayEntityWithMetadata {
  id: number;
  status: string;
  custom_metadata?: { orderId?: number };
}

const INVALID_SIGNATURE_RATE_LIMIT = 10;
const INVALID_SIGNATURE_RATE_WINDOW_MS = 5 * 60 * 1000;

/**
 * IP directement depuis la requête reçue par la route — ne pas utiliser
 * `getClientIp()` (lib/client-ip.ts) ici : elle dépend de `headers()` de
 * `next/headers`, qui exige le contexte de requête Next.js, absent quand
 * cette route est appelée directement dans les tests (`POST(request)`).
 */
function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("X-FEDAPAY-SIGNATURE");
  const ip = getRequestIp(request);

  if (!verifyFedapaySignature(rawBody, signatureHeader)) {
    if (!checkRateLimit(`fedapay-webhook-invalid:${ip}`, INVALID_SIGNATURE_RATE_LIMIT, INVALID_SIGNATURE_RATE_WINDOW_MS)) {
      return new Response("Trop de tentatives.", { status: 429 });
    }
    await logSecurityEvent({ type: "fedapay-webhook-invalid-signature", ip });
    return new Response("Signature invalide.", { status: 401 });
  }

  const event = parseFedapayWebhookEvent(rawBody);
  if (!event) {
    return new Response("Payload invalide.", { status: 400 });
  }

  const entity = event.entity as FedapayEntityWithMetadata;
  const orderId = entity.custom_metadata?.orderId;
  if (!orderId) {
    return new Response("Référence de commande absente.", { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return new Response("Commande introuvable.", { status: 404 });
  }

  const transactionId = String(entity.id);

  if (event.name === "transaction.approved") {
    const { alreadyPaid } = await markOrderPaymentPaid(orderId, transactionId);
    if (!alreadyPaid) {
      for (const item of order.items) {
        await decrementStock(item.slug, item.quantity);
      }
      const updatedOrder = await getOrderById(orderId);
      if (updatedOrder) {
        await sendOrderNotificationEmail(updatedOrder);
      }
      await logSecurityEvent({
        type: "fedapay-payment-confirmed",
        ip,
        detail: `commande #${orderId}, transaction ${transactionId}`,
      });
    }
    return new Response("OK", { status: 200 });
  }

  if (event.name === "transaction.declined" || event.name === "transaction.canceled") {
    await markOrderPaymentFailed(orderId, transactionId);
    await logSecurityEvent({
      type: "fedapay-payment-failed",
      ip,
      detail: `commande #${orderId}, transaction ${transactionId}, événement ${event.name}`,
    });
    return new Response("OK", { status: 200 });
  }

  // Événement FedaPay non géré par ce périmètre (ex: transaction.created) : accusé
  // de réception sans effet, pour ne pas déclencher de retentatives inutiles côté FedaPay.
  return new Response("Ignoré.", { status: 200 });
}
