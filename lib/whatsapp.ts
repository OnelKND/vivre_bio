// Numéro au format international, sans "+" ni espaces (format wa.me).
// TODO: remplacer par le vrai numéro WhatsApp de VIVRE BIO.
export const WHATSAPP_NUMBER = "22900000000";

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
