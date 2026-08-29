import { verifyFedapaySignature, parseFedapayWebhookEvent } from "@/lib/fedapay";
import {
  getOrderById,
  markOrderPaymentPaid,
  markOrderPaymentFailed,
} from "@/lib/orders";
import { decrementStock } from "@/lib/products";
import { sendOrderNotificationEmail } from "@/lib/mail";

// Jamais mis en cache : c'est un endpoint de traitement d'événement à la demande.
export const dynamic = "force-dynamic";

interface FedapayEntityWithMetadata {
  id: number;
  status: string;
  custom_metadata?: { orderId?: number };
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("X-FEDAPAY-SIGNATURE");

  if (!verifyFedapaySignature(rawBody, signatureHeader)) {
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
    }
    return new Response("OK", { status: 200 });
  }

  if (event.name === "transaction.declined" || event.name === "transaction.canceled") {
    await markOrderPaymentFailed(orderId, transactionId);
    return new Response("OK", { status: 200 });
  }

  // Événement FedaPay non géré par ce périmètre (ex: transaction.created) : accusé
  // de réception sans effet, pour ne pas déclencher de retentatives inutiles côté FedaPay.
  return new Response("Ignoré.", { status: 200 });
}
