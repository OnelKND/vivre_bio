"use server";

import { z } from "zod";
import { getOrderForTracking, type OrderRecord } from "@/lib/orders";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const TRACK_RATE_LIMIT = 10;
const TRACK_RATE_WINDOW_MS = 15 * 60 * 1000;

const trackSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  phone: z.string().trim().min(4).max(30),
});

export interface TrackOrderState {
  status: "idle" | "error" | "success";
  message?: string;
  order?: OrderRecord;
}

export async function trackOrderAction(
  _prevState: TrackOrderState,
  formData: FormData
): Promise<TrackOrderState> {
  const ip = await getClientIp();
  if (!checkRateLimit(`track-order:${ip}`, TRACK_RATE_LIMIT, TRACK_RATE_WINDOW_MS)) {
    return { status: "error", message: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const parsed = trackSchema.safeParse({
    orderId: formData.get("orderId"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Merci d'indiquer un numéro de commande et un téléphone valides." };
  }

  const order = getOrderForTracking(parsed.data.orderId, parsed.data.phone);
  if (!order) {
    return {
      status: "error",
      message: "Aucune commande trouvée avec ce numéro et ce téléphone.",
    };
  }

  return { status: "success", order };
}
