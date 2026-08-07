import { headers } from "next/headers";

/**
 * IP du client à des fins de rate limiting uniquement (pas une identité
 * fiable — un en-tête `x-forwarded-for` peut être falsifié par le client
 * si le serveur n'est pas derrière un reverse proxy qui le fixe lui-même).
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}
