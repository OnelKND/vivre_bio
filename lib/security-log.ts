import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_PATH = path.join(LOG_DIR, "security-events.log");

export interface SecurityEvent {
  type: string;
  ip: string;
  detail?: string;
  userAgent?: string | null;
  path?: string;
}

/**
 * Journalise un événement de sécurité (tentative de connexion, accès à un
 * piège...) dans logs/security-events.log, en plus d'un console.warn pour
 * le voir en direct pendant le dev. Best-effort : une erreur d'écriture ne
 * doit jamais faire planter la requête qui a déclenché le log.
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const entry = {
    date: new Date().toISOString(),
    ...event,
  };

  console.warn("[security]", entry);

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_PATH, `${JSON.stringify(entry)}\n`, "utf-8");
  } catch (error) {
    console.error("[security] échec de l'écriture du journal :", error);
  }
}
