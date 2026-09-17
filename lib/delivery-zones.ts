import "server-only";
import { getDb } from "./db";
import { slugify } from "./slugify";

export interface DeliveryZone {
  id: number;
  slug: string;
  label: string;
  /** Frais de livraison fixe en FCFA. */
  fee: number;
  sortOrder: number;
}

export interface DeliveryZoneInput {
  label: string;
  fee: number;
}

interface DeliveryZoneRow {
  id: number;
  slug: string;
  label: string;
  fee: number;
  sort_order: number;
}

function rowToZone(row: DeliveryZoneRow): DeliveryZone {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    fee: row.fee,
    sortOrder: row.sort_order,
  };
}

export async function getAllDeliveryZones(): Promise<DeliveryZone[]> {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM delivery_zones ORDER BY sort_order ASC, id ASC");
  return result.rows.map((row) => rowToZone(row as unknown as DeliveryZoneRow));
}

export async function getDeliveryZoneBySlug(slug: string): Promise<DeliveryZone | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM delivery_zones WHERE slug = ?",
    args: [slug],
  });
  const row = result.rows[0];
  return row ? rowToZone(row as unknown as DeliveryZoneRow) : undefined;
}

export async function getDeliveryZoneById(id: number): Promise<DeliveryZone | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM delivery_zones WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToZone(row as unknown as DeliveryZoneRow) : undefined;
}

async function uniqueSlug(base: string): Promise<string> {
  const db = await getDb();
  const root = base || "zone";
  let candidate = root;
  let suffix = 2;
  for (;;) {
    const result = await db.execute({
      sql: "SELECT id FROM delivery_zones WHERE slug = ?",
      args: [candidate],
    });
    if (result.rows.length === 0) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}

export async function createDeliveryZone(input: DeliveryZoneInput): Promise<DeliveryZone> {
  const db = await getDb();
  const slug = await uniqueSlug(slugify(input.label));

  const maxOrderResult = await db.execute(
    "SELECT COALESCE(MAX(sort_order), -1) as max FROM delivery_zones"
  );
  const nextOrder = Number((maxOrderResult.rows[0] as unknown as { max: number }).max) + 1;

  const result = await db.execute({
    sql: "INSERT INTO delivery_zones (slug, label, fee, sort_order) VALUES (?, ?, ?, ?)",
    args: [slug, input.label, input.fee, nextOrder],
  });

  const id = Number(result.lastInsertRowid);
  const zone = await getDeliveryZoneById(id);
  if (!zone) throw new Error("Échec de la création de la zone de livraison.");
  return zone;
}

/** Le slug n'est jamais modifié après création, pour ne pas casser les commandes déjà passées. */
export async function updateDeliveryZone(
  id: number,
  input: DeliveryZoneInput
): Promise<DeliveryZone | undefined> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE delivery_zones SET label = ?, fee = ? WHERE id = ?",
    args: [input.label, input.fee, id],
  });
  return getDeliveryZoneById(id);
}

export async function deleteDeliveryZone(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM delivery_zones WHERE id = ?", args: [id] });
}

export async function countDeliveryZones(): Promise<number> {
  const db = await getDb();
  const result = await db.execute("SELECT COUNT(*) as count FROM delivery_zones");
  return Number((result.rows[0] as unknown as { count: number })?.count ?? 0);
}
