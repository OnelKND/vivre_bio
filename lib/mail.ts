import "server-only";
import nodemailer from "nodemailer";
import type { OrderRecord } from "./orders";
import { formatFCFA } from "./format";

let transporter: nodemailer.Transporter | null | undefined;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter !== undefined) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[mail] SMTP non configuré (SMTP_HOST/SMTP_USER/SMTP_PASS manquants) : les emails ne seront pas envoyés."
    );
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/** Envoi best-effort : n'interrompt jamais le flux appelant en cas d'échec. */
async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const client = getTransporter();
  if (!client) return false;

  try {
    await client.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error("[mail] Échec de l'envoi de l'email :", error);
    return false;
  }
}

export async function sendOrderNotificationEmail(
  order: OrderRecord
): Promise<void> {
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!to) {
    console.warn(
      "[mail] ORDER_NOTIFICATION_EMAIL non configuré : aucune notification envoyée pour la commande #" +
        order.id
    );
    return;
  }

  const itemsText = order.items
    .map(
      (item) =>
        `  - ${item.quantity} x ${item.name} (${formatFCFA(item.unitPrice)})`
    )
    .join("\n");

  await sendMail({
    to,
    subject: `Nouvelle commande VIVRE BIO #${order.id}`,
    text: [
      `Nouvelle commande reçue sur le site VIVRE BIO.`,
      ``,
      `Client : ${order.customerName}`,
      `Téléphone : ${order.phone}`,
      `Adresse : ${order.address}`,
      `Zone de livraison : ${order.deliveryZoneLabel} (${formatFCFA(order.deliveryFee)})`,
      ``,
      `Produits :`,
      itemsText,
      ``,
      `Sous-total : ${formatFCFA(order.subtotal)}`,
      `Total (livraison incluse) : ${formatFCFA(order.total)}`,
      ``,
      `Paiement à la livraison.`,
    ].join("\n"),
  });
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<boolean> {
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!to) return false;

  return sendMail({
    to,
    subject: `Nouveau message de contact — ${input.name}`,
    text: [
      `Nom : ${input.name}`,
      `Email : ${input.email}`,
      input.phone ? `Téléphone : ${input.phone}` : undefined,
      ``,
      input.message,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
