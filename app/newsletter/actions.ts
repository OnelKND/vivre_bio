"use server";

import { z } from "zod";
import { createSubscriber } from "@/lib/subscribers";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const subscribeSchema = z.object({
  email: z.string().trim().email("Adresse email invalide.").max(200),
  // Honeypot anti-spam, même principe que app/contact/actions.ts.
  website: z.string().max(200).optional(),
});

const SUBSCRIBE_RATE_LIMIT = 5;
const SUBSCRIBE_RATE_WINDOW_MS = 10 * 60 * 1000;

export interface NewsletterFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function subscribeToNewsletter(
  _prevState: NewsletterFormState,
  formData: FormData
): Promise<NewsletterFormState> {
  const parsed = subscribeSchema.safeParse({
    email: formData.get("email"),
    website: formData.get("website") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Adresse email invalide.",
    };
  }

  if (parsed.data.website) {
    return { status: "success", message: "Merci, vous êtes inscrit·e !" };
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`newsletter:${ip}`, SUBSCRIBE_RATE_LIMIT, SUBSCRIBE_RATE_WINDOW_MS)) {
    return {
      status: "error",
      message: "Trop de tentatives. Réessayez dans quelques minutes.",
    };
  }

  const result = await createSubscriber(parsed.data.email.toLowerCase());

  return {
    status: "success",
    message:
      result === "already_subscribed"
        ? "Vous êtes déjà inscrit·e, merci !"
        : "Merci, vous êtes inscrit·e ! Vous recevrez nos offres et nouveautés.",
  };
}
