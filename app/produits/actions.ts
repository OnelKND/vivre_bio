"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createReview, type ReviewInput } from "@/lib/reviews";
import { getProductBySlug } from "@/lib/products";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const REVIEW_RATE_LIMIT = 3;
const REVIEW_RATE_WINDOW_MS = 10 * 60 * 1000;

const reviewSchema = z.object({
  productSlug: z.string().min(1).max(200),
  authorName: z.string().trim().min(2, "Merci d'indiquer votre nom.").max(100),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Votre avis est un peu court.").max(1000),
  // Honeypot : champ invisible pour les humains, souvent rempli par les
  // robots de spam. On ne le signale jamais comme une erreur de
  // validation pour ne pas leur apprendre qu'il est détecté.
  website: z.string().max(200).optional(),
});

export interface ReviewFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitReviewAction(
  _prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const parsed = reviewSchema.safeParse({
    productSlug: formData.get("productSlug"),
    authorName: formData.get("authorName"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
    website: formData.get("website") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Merci de vérifier les champs du formulaire.",
    };
  }

  if (!getProductBySlug(parsed.data.productSlug)) {
    return { status: "error", message: "Produit introuvable." };
  }

  // Honeypot rempli : on fait semblant que tout s'est bien passé, sans
  // enregistrer l'avis ni consommer le quota de rate limiting légitime.
  if (parsed.data.website) {
    return {
      status: "success",
      message: "Merci pour votre avis.",
    };
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`review:${ip}`, REVIEW_RATE_LIMIT, REVIEW_RATE_WINDOW_MS)) {
    return {
      status: "error",
      message: "Trop d'avis envoyés. Réessayez dans quelques minutes.",
    };
  }

  const input: ReviewInput = {
    productSlug: parsed.data.productSlug,
    authorName: parsed.data.authorName,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  };
  createReview(input);

  revalidatePath("/admin/avis");

  return {
    status: "success",
    message: "Merci, votre avis sera visible après validation.",
  };
}
