// Limiteur de débit en mémoire (process unique, cohérent avec un
// déploiement VPS mono-instance — voir lib/db.ts pour le même principe de
// cache sur `globalThis` qui survit au rechargement à chaud du dev).
//
// Volontairement sans dépendance à Next.js (voir lib/client-ip.ts pour la
// récupération de l'IP) pour rester testable en isolation.

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  var __vivrebioRateLimitBuckets: Map<string, Bucket> | undefined;
}

function getBuckets(): Map<string, Bucket> {
  if (!globalThis.__vivrebioRateLimitBuckets) {
    globalThis.__vivrebioRateLimitBuckets = new Map();
  }
  return globalThis.__vivrebioRateLimitBuckets;
}

/**
 * Autorise jusqu'à `limit` appels par `windowMs` pour une même clé.
 * Retourne `true` si l'appel est autorisé (et le compte), `false` s'il
 * dépasse la limite.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const buckets = getBuckets();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
