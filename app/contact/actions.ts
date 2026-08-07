"use server";

import { z } from "zod";
import { sendContactMessage } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Merci d'indiquer votre nom.").max(100),
  email: z.string().trim().email("Adresse email invalide.").max(200),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(10, "Votre message est un peu court.").max(2000),
  // Honeypot : champ invisible pour les humains, souvent rempli par les
  // robots de spam. On ne le signale jamais comme une erreur de
  // validation pour ne pas leur apprendre qu'il est détecté.
  website: z.string().max(200).optional(),
});

const CONTACT_RATE_LIMIT = 3;
const CONTACT_RATE_WINDOW_MS = 10 * 60 * 1000;

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    message: formData.get("message"),
    website: formData.get("website") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ??
        "Merci de vérifier les champs du formulaire.",
    };
  }

  // Honeypot rempli : on fait semblant que tout s'est bien passé, sans
  // envoyer l'email ni consommer le quota de rate limiting légitime.
  if (parsed.data.website) {
    return {
      status: "success",
      message: "Votre message a bien été envoyé, nous vous répondrons rapidement.",
    };
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`contact:${ip}`, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS)) {
    return {
      status: "error",
      message: "Trop de messages envoyés. Réessayez dans quelques minutes.",
    };
  }

  const sent = await sendContactMessage(parsed.data);

  if (!sent) {
    return {
      status: "error",
      message:
        "L'envoi automatique n'est pas encore configuré. Merci de nous contacter directement par téléphone ou WhatsApp en attendant.",
    };
  }

  return {
    status: "success",
    message: "Votre message a bien été envoyé, nous vous répondrons rapidement.",
  };
}
