import "server-only";
import { getDb } from "./db";
import {
  type OrderStatus,
  ORDER_STATUS_SEQUENCE,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_CLASS,
} from "./order-status";

export type { OrderStatus };
export { ORDER_STATUS_SEQUENCE, ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASS };

export interface OrderItemRecord {
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
}

export interface NewOrderInput {
  customerName: string;
  phone: string;
  address: string;
  deliveryZoneSlug: string;
  deliveryZoneLabel: string;
  deliveryFee: number;
  items: OrderItemRecord[];
  subtotal: number;
  total: number;
  /** Empêche la création d'une commande dupliquée (double-clic, resoumission). */
  idempotencyKey?: string;
}

export interface OrderRecord extends NewOrderInput {
  id: number;
  createdAt: string;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];
}

export interface ListOrdersOptions {
  status?: OrderStatus;
  /** Recherche sur le nom du client ou le téléphone. */
  query?: string;
  limit?: number;
  offset?: number;
}

export interface ListOrdersResult {
  orders: OrderRecord[];
  total: number;
}

interface OrderRow {
  id: number;
  created_at: string;
  customer_name: string;
  phone: string;
  address: string;
  delivery_zone_slug: string;
  delivery_zone_label: string;
  delivery_fee: number;
  items_json: string;
  subtotal: number;
  total: number;
  status: string;
  idempotency_key: string | null;
  status_history: string | null;
}

function rowToOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    deliveryZoneSlug: row.delivery_zone_slug,
    deliveryZoneLabel: row.delivery_zone_label,
    deliveryFee: row.delivery_fee,
    items: JSON.parse(row.items_json) as OrderItemRecord[],
    subtotal: row.subtotal,
    total: row.total,
    status: row.status as OrderStatus,
    idempotencyKey: row.idempotency_key ?? undefined,
    statusHistory: row.status_history
      ? (JSON.parse(row.status_history) as OrderStatusHistoryEntry[])
      : [{ status: row.status as OrderStatus, changedAt: row.created_at }],
  };
}

export interface InsertOrderResult {
  id: number;
  /** false si une commande avec la même idempotencyKey existait déjà. */
  isNew: boolean;
}

export function insertOrder(input: NewOrderInput): InsertOrderResult {
  const db = getDb();

  if (input.idempotencyKey) {
    const existing = db
      .prepare("SELECT id FROM orders WHERE idempotency_key = ?")
      .get(input.idempotencyKey) as { id: number } | undefined;
    if (existing) return { id: existing.id, isNew: false };
  }

  const now = new Date().toISOString();
  const statusHistory: OrderStatusHistoryEntry[] = [{ status: "recue", changedAt: now }];

  const statement = db.prepare(`
    INSERT INTO orders (
      created_at, customer_name, phone, address,
      delivery_zone_slug, delivery_zone_label, delivery_fee,
      items_json, subtotal, total, status, idempotency_key, status_history
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recue', ?, ?)
  `);
  const result = statement.run(
    now,
    input.customerName,
    input.phone,
    input.address,
    input.deliveryZoneSlug,
    input.deliveryZoneLabel,
    input.deliveryFee,
    JSON.stringify(input.items),
    input.subtotal,
    input.total,
    input.idempotencyKey ?? null,
    JSON.stringify(statusHistory)
  );
  return { id: Number(result.lastInsertRowid), isNew: true };
}

export function listOrders(options: ListOrdersOptions = {}): ListOrdersResult {
  const db = getDb();
  const { status, query, limit = 20, offset = 0 } = options;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (query) {
    conditions.push("(customer_name LIKE ? OR phone LIKE ?)");
    params.push(`%${query}%`, `%${query}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM orders ${whereClause}`).get(...params) as {
      count: number;
    }
  ).count;

  const rows = db
    .prepare(`SELECT * FROM orders ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as unknown as OrderRow[];

  return { orders: rows.map(rowToOrder), total };
}

export interface ExportOrdersOptions {
  status?: OrderStatus;
  /** Dates au format "YYYY-MM-DD", bornes incluses. */
  from?: string;
  to?: string;
}

/** Toutes les commandes correspondantes, sans pagination — pour l'export CSV. */
export function listOrdersForExport(options: ExportOrdersOptions = {}): OrderRecord[] {
  const db = getDb();
  const { status, from, to } = options;

  const conditions: string[] = [];
  const params: string[] = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (from) {
    conditions.push("created_at >= ?");
    params.push(from);
  }
  if (to) {
    conditions.push("created_at <= ?");
    params.push(`${to}T23:59:59.999Z`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(`SELECT * FROM orders ${whereClause} ORDER BY created_at ASC`)
    .all(...params) as unknown as OrderRow[];

  return rows.map(rowToOrder);
}

export function getOrderById(id: number): OrderRecord | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(id) as OrderRow | undefined;
  return row ? rowToOrder(row) : undefined;
}

/**
 * Ne garde que les chiffres et retire l'indicatif "229" pour comparer deux
 * numéros saisis avec ou sans "+229"/espaces.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("229") && digits.length > 8 ? digits.slice(3) : digits;
}

/**
 * Suivi de commande public : ne renvoie la commande que si le téléphone
 * fourni correspond exactement (après normalisation), pour empêcher qu'un
 * id de commande (séquentiel, donc devinable) suffise à consulter les
 * coordonnées d'un autre client.
 */
export function getOrderForTracking(id: number, phone: string): OrderRecord | undefined {
  const order = getOrderById(id);
  if (!order) return undefined;
  const providedDigits = normalizePhone(phone);
  if (!providedDigits) return undefined;
  return normalizePhone(order.phone) === providedDigits ? order : undefined;
}

export function updateOrderStatus(id: number, status: OrderStatus): void {
  const db = getDb();
  const existing = getOrderById(id);
  if (!existing) return;

  const statusHistory: OrderStatusHistoryEntry[] = [
    ...existing.statusHistory,
    { status, changedAt: new Date().toISOString() },
  ];

  db.prepare("UPDATE orders SET status = ?, status_history = ? WHERE id = ?").run(
    status,
    JSON.stringify(statusHistory),
    id
  );
}
