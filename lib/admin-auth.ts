import crypto from "node:crypto";

// Pas de garde `server-only` ici : ce module est aussi importé par
// `proxy.ts`, qui a ses propres règles de bundling distinctes des
// Server Components/Actions.

export const ADMIN_SESSION_COOKIE = "vivrebio_admin_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 jours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[admin-auth] SESSION_SECRET non défini : refus de démarrer en production avec un secret par défaut."
    );
  }

  console.warn(
    "[admin-auth] SESSION_SECRET non défini : utilisation d'une clé de développement non sécurisée. À définir impérativement en production."
  );
  return "dev-only-insecure-secret-change-me";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/** Compare en temps constant, via un hash, pour ne pas fuiter la longueur du mot de passe. */
export function checkAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error(
      "[admin-auth] ADMIN_PASSWORD non défini : la connexion admin est désactivée."
    );
    return false;
  }
  const candidateHash = crypto.createHash("sha256").update(candidate).digest("hex");
  const expectedHash = crypto.createHash("sha256").update(expected).digest("hex");
  return timingSafeEqualHex(candidateHash, expectedHash);
}

export function createSessionToken(): string {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  return `${issuedAt}.${signature}`;
}

export function isSessionTokenValid(token: string | undefined | null): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  if (!timingSafeEqualHex(sign(issuedAt), signature)) return false;
  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age <= SESSION_MAX_AGE_MS;
}
