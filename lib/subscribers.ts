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
export function createSubscriber(email: string): CreateSubscriberResult {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM subscribers WHERE email = ?").get(email);
  if (existing) return "already_subscribed";

  db.prepare("INSERT INTO subscribers (email, created_at) VALUES (?, ?)").run(
    email,
    new Date().toISOString()
  );
  return "created";
}

export function getAllSubscribers(): Subscriber[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM subscribers ORDER BY created_at DESC")
    .all() as unknown as SubscriberRow[];
  return rows.map(rowToSubscriber);
}
