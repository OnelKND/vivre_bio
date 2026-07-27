import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "vivrebio.db");

declare global {
  var __vivrebioDb: DatabaseSync | undefined;
}

function createDatabase(): DatabaseSync {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      delivery_zone_slug TEXT NOT NULL,
      delivery_zone_label TEXT NOT NULL,
      delivery_fee INTEGER NOT NULL,
      items_json TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'recue'
    );
  `);
  return database;
}

/**
 * Instance unique de la base SQLite, mise en cache sur `globalThis` pour
 * survivre au rechargement à chaud du serveur de dev (évite de rouvrir le
 * fichier à chaque modification de code).
 */
export function getDb(): DatabaseSync {
  if (!globalThis.__vivrebioDb) {
    globalThis.__vivrebioDb = createDatabase();
  }
  return globalThis.__vivrebioDb;
}
