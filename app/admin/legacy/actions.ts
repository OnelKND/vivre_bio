"use server";

import { headers } from "next/headers";
import { getClientIp } from "@/lib/client-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export interface LegacyLoginState {
  status: "idle" | "error";
  message?: string;
}

/**
 * Piège : ressemble à un vieux formulaire de connexion admin, mais ne
 * mène nulle part. Journalise tout ce qui est tenté (identifiants inclus —
 * contrairement au vrai login, il n'y a ici aucune donnée réelle à
 * protéger, donc aucun risque à les logger).
 */
export async function attemptLegacyLogin(
  _prevState: LegacyLoginState,
  formData: FormData
): Promise<LegacyLoginState> {
  const ip = await getClientIp();
  const userAgent = (await headers()).get("user-agent");

  // Simple garde-fou pour ne pas laisser un bot faire exploser le fichier
  // de log : au-delà de 20 tentatives/minute on arrête de journaliser
  // chaque appel, sans que la réponse ne change.
  if (checkRateLimit(`honeypot-legacy:${ip}`, 20, 60_000)) {
    await logSecurityEvent({
      type: "honeypot-legacy-login",
      ip,
      userAgent,
      detail: `identifiant="${String(formData.get("identifiant") ?? "")}" mot_de_passe="${String(
        formData.get("password") ?? ""
      )}"`,
    });
  }

  // Ralentit volontairement une éventuelle attaque par force brute.
  await new Promise((resolve) => setTimeout(resolve, 2500));

  return { status: "error", message: "Identifiants incorrects." };
}
