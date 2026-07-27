"use server";

import { z } from "zod";
import { sendContactMessage } from "@/lib/mail";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Merci d'indiquer votre nom."),
  email: z.string().trim().email("Adresse email invalide."),
  phone: z.string().trim().optional(),
  message: z.string().trim().min(10, "Votre message est un peu court."),
});

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
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ??
        "Merci de vérifier les champs du formulaire.",
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
