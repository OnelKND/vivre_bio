import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * FedaPay signe ses webhooks avec `X-FEDAPAY-SIGNATURE: t=<timestamp>,s=<hmac>`
 * où hmac = HMAC_SHA256(FEDAPAY_WEBHOOK_SECRET, `${timestamp}.${rawBody}`).
 * On vérifie sur le corps brut (jamais le JSON re-sérialisé, qui pourrait
 * différer octet pour octet de ce que FedaPay a signé).
 */
export function verifyFedapaySignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const providedSignature = parts.s;
  if (!timestamp || !providedSignature) return false;

  const expectedSignature = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const provided = Buffer.from(providedSignature, "hex");
  if (expected.length !== provided.length) return false;

  return timingSafeEqual(expected, provided);
}

export interface FedapayWebhookEvent {
  name: string;
  entity: { id: number; status: string };
}

export function parseFedapayWebhookEvent(rawBody: string): FedapayWebhookEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).name !== "string" ||
    typeof (parsed as Record<string, unknown>).entity !== "object"
  ) {
    return null;
  }

  const entity = (parsed as { entity: Record<string, unknown> }).entity;
  if (typeof entity.id !== "number" || typeof entity.status !== "string") {
    return null;
  }

  return {
    name: (parsed as { name: string }).name,
    entity: { id: entity.id, status: entity.status },
  };
}

export function getFedapayPublicKey(): string {
  const key = process.env.FEDAPAY_PUBLIC_KEY;
  if (!key) {
    throw new Error(
      "FEDAPAY_PUBLIC_KEY manquant : ajoute-le dans les variables d'environnement."
    );
  }
  return key;
}

export function getFedapayEnvironment(): "sandbox" | "live" {
  return process.env.FEDAPAY_ENVIRONMENT === "live" ? "live" : "sandbox";
}
