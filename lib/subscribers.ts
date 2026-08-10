import "server-only";
import { getDb } from "./db";

export interface Subscriber {
  id: number;
  email: string;
  createdAt: string;
}

interface SubscriberRow {
  id: number;
  email: string;
  created_at: string;
}

function rowToSubscriber(row: SubscriberRow): Subscriber {
  return { id: row.id, email: row.email, createdAt: row.created_at };
}

export type CreateSubscriberResult = "created" | "already_subscribed";

/** Insertion idempotente : un email déjà inscrit ne provoque pas d'erreur. */
export async function createSubscriber(email: string): Promise<CreateSubscriberResult> {
  const db = await getDb();
  const existing = await db.execute({
    sql: "SELECT id FROM subscribers WHERE email = ?",
    args: [email],
  });
  if (existing.rows.length > 0) return "already_subscribed";

  await db.execute({
    sql: "INSERT INTO subscribers (email, created_at) VALUES (?, ?)",
    args: [email, new Date().toISOString()],
  });
  return "created";
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM subscribers ORDER BY created_at DESC");
  return result.rows.map((row) => rowToSubscriber(row as unknown as SubscriberRow));
}