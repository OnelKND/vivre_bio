import "server-only";
import { getDb } from "./db";
import {
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  ORDER_STATUS_SEQUENCE,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_CLASS,
} from "./order-status";

export type { OrderStatus, PaymentMethod, PaymentStatus };
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
  paymentMethod: PaymentMethod;
  /** Empêche la création d'une commande dupliquée (double-clic, resoumission). */
  idempotencyKey?: string;
}

export interface OrderRecord extends NewOrderInput {
  id: number;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fedapayTransactionId?: string;
  statusHistory: OrderStatusHistoryEntry[];
}

export interface ListOrdersOptions {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
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
  payment_method: string;
  payment_status: string;
  fedapay_transaction_id: string | null;
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
    paymentMethod: row.payment_method as PaymentMethod,
    paymentStatus: row.payment_status as PaymentStatus,
    fedapayTransactionId: row.fedapay_transaction_id ?? undefined,
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

export async function insertOrder(input: NewOrderInput): Promise<InsertOrderResult> {
  const db = await getDb();

  if (input.idempotencyKey) {
    const existing = await db.execute({
      sql: "SELECT id FROM orders WHERE idempotency_key = ?",
      args: [input.idempotencyKey],
    });
    const row = existing.rows[0] as unknown as { id: number } | undefined;
    if (row) return { id: row.id, isNew: false };
  }

  const now = new Date().toISOString();
  const statusHistory: OrderStatusHistoryEntry[] = [{ status: "recue", changedAt: now }];
  const paymentStatus: PaymentStatus =
    input.paymentMethod === "fedapay" ? "en_attente" : "non_requis";

  const result = await db.execute({
    sql: `INSERT INTO orders (
      created_at, customer_name, phone, address,
      delivery_zone_slug, delivery_zone_label, delivery_fee,
      items_json, subtotal, total, status, idempotency_key, status_history,
      payment_method, payment_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recue', ?, ?, ?, ?)`,
    args: [
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
      JSON.stringify(statusHistory),
      input.paymentMethod,
      paymentStatus,
    ],
  });
  return { id: Number(result.lastInsertRowid), isNew: true };
}

export async function listOrders(options: ListOrdersOptions = {}): Promise<ListOrdersResult> {
  const db = await getDb();
  const { status, query, limit = 20, offset = 0 } = options;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (options.paymentStatus) {
    conditions.push("payment_status = ?");
    params.push(options.paymentStatus);
  }
  if (query) {
    conditions.push("(customer_name LIKE ? OR phone LIKE ?)");
    params.push(`%${query}%`, `%${query}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM orders ${whereClause}`,
    args: params,
  });
  const total = Number((totalResult.rows[0] as unknown as { count: number })?.count ?? 0);

  const rowsResult = await db.execute({
    sql: `SELECT * FROM orders ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    args: [...params, limit, offset],
  });

  const orders = rowsResult.rows.map((row) => rowToOrder(row as unknown as OrderRow));
  return { orders, total };
}

export interface ExportOrdersOptions {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** Dates au format "YYYY-MM-DD", bornes incluses. */
  from?: string;
  to?: string;
}

/** Toutes les commandes correspondantes, sans pagination — pour l'export CSV. */
export async function listOrdersForExport(options: ExportOrdersOptions = {}): Promise<OrderRecord[]> {
  const db = await getDb();
  const { status, from, to } = options;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (options.paymentStatus) {
    conditions.push("payment_status = ?");
    params.push(options.paymentStatus);
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

  const result = await db.execute({
    sql: `SELECT * FROM orders ${whereClause} ORDER BY id ASC`,
    args: params,
  });

  return result.rows.map((row) => rowToOrder(row as unknown as OrderRow));
}

export async function getOrderById(id: number): Promise<OrderRecord | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM orders WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToOrder(row as unknown as OrderRow) : undefined;
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
export async function getOrderForTracking(id: number, phone: string): Promise<OrderRecord | undefined> {
  const order = await getOrderById(id);
  if (!order) return undefined;
  const providedDigits = normalizePhone(phone);
  if (!providedDigits) return undefined;
  return normalizePhone(order.phone) === providedDigits ? order : undefined;
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<void> {
  const db = await getDb();
  const existing = await getOrderById(id);
  if (!existing) return;

  const statusHistory: OrderStatusHistoryEntry[] = [
    ...existing.statusHistory,
    { status, changedAt: new Date().toISOString() },
  ];

  await db.execute({
    sql: "UPDATE orders SET status = ?, status_history = ? WHERE id = ?",
    args: [status, JSON.stringify(statusHistory), id],
  });
}

export interface MarkPaymentPaidResult {
  /** true si la commande était déjà "paye" avant cet appel (événement webhook dupliqué). */
  alreadyPaid: boolean;
}

export async function markOrderPaymentPaid(
  id: number,
  fedapayTransactionId: string
): Promise<MarkPaymentPaidResult> {
  const db = await getDb();
  const existing = await getOrderById(id);
  if (!existing) return { alreadyPaid: false };
  if (existing.paymentStatus === "paye") return { alreadyPaid: true };

  await db.execute({
    sql: "UPDATE orders SET payment_status = 'paye', fedapay_transaction_id = ? WHERE id = ?",
    args: [fedapayTransactionId, id],
  });
  return { alreadyPaid: false };
}

export async function markOrderPaymentFailed(
  id: number,
  fedapayTransactionId: string
): Promise<void> {
  const db = await getDb();
  const existing = await getOrderById(id);
  if (!existing) return;
  // Empêche un événement declined/canceled tardif de dégrader une commande
  // déjà confirmée payée (ex: retentative client réussie après un premier échec).
  if (existing.paymentStatus === "paye") return;

  await db.execute({
    sql: "UPDATE orders SET payment_status = 'echoue', fedapay_transaction_id = ? WHERE id = ?",
    args: [fedapayTransactionId, id],
  });
}

export async function getOrderByFedapayTransactionId(
  fedapayTransactionId: string
): Promise<OrderRecord | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM orders WHERE fedapay_transaction_id = ?",
    args: [fedapayTransactionId],
  });
  const row = result.rows[0];
  return row ? rowToOrder(row as unknown as OrderRow) : undefined;
}

export interface OrderPaymentStats {
  totalCash: number;
  totalFedapayPaid: number;
  pendingFedapayCount: number;
}

export interface OrderPaymentStatsOptions {
  status?: OrderStatus;
  from?: string;
  to?: string;
  /** Recherche sur le nom du client ou le téléphone (même filtre que listOrders). */
  query?: string;
}

export async function getOrderPaymentStats(
  options: OrderPaymentStatsOptions = {}
): Promise<OrderPaymentStats> {
  const db = await getDb();
  const { status, from, to, query } = options;

  const conditions: string[] = [];
  const params: (string | number)[] = [];
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
  if (query) {
    conditions.push("(customer_name LIKE ? OR phone LIKE ?)");
    params.push(`%${query}%`, `%${query}%`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [cashResult, fedapayPaidResult, pendingResult] = await Promise.all([
    db.execute({
      sql: `SELECT COALESCE(SUM(total), 0) as sum FROM orders ${whereClause ? `${whereClause} AND` : "WHERE"} payment_method = 'cash'`,
      args: params,
    }),
    db.execute({
      sql: `SELECT COALESCE(SUM(total), 0) as sum FROM orders ${whereClause ? `${whereClause} AND` : "WHERE"} payment_method = 'fedapay' AND payment_status = 'paye'`,
      args: params,
    }),
    db.execute({
      sql: `SELECT COUNT(*) as count FROM orders ${whereClause ? `${whereClause} AND` : "WHERE"} payment_method = 'fedapay' AND payment_status = 'en_attente'`,
      args: params,
    }),
  ]);

  return {
    totalCash: Number((cashResult.rows[0] as unknown as { sum: number })?.sum ?? 0),
    totalFedapayPaid: Number((fedapayPaidResult.rows[0] as unknown as { sum: number })?.sum ?? 0),
    pendingFedapayCount: Number((pendingResult.rows[0] as unknown as { count: number })?.count ?? 0),
  };
}

export interface TopSellingProduct {
  slug: string;
  name: string;
  quantity: number;
}

export interface DashboardStats {
  totalRevenue: number;
  ordersToday: number;
  totalFedapayPaid: number;
  pendingFedapayCount: number;
  topSellingProducts: TopSellingProduct[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();

  const [revenueResult, todayResult, fedapayPaidResult, pendingResult, itemsResult] =
    await Promise.all([
      db.execute("SELECT COALESCE(SUM(total), 0) as sum FROM orders"),
      db.execute(
        "SELECT COUNT(*) as count FROM orders WHERE strftime('%Y-%m-%d', created_at) = strftime('%Y-%m-%d', 'now')"
      ),
      db.execute(
        "SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE payment_method = 'fedapay' AND payment_status = 'paye'"
      ),
      db.execute(
        "SELECT COUNT(*) as count FROM orders WHERE payment_method = 'fedapay' AND payment_status = 'en_attente'"
      ),
      db.execute("SELECT items_json FROM orders"),
    ]);

  // Les articles vendus sont stockés en JSON dans chaque commande (pas de
  // table `order_items` séparée) : l'agrégation par produit se fait donc en
  // JS plutôt qu'en SQL.
  const salesBySlug = new Map<string, TopSellingProduct>();
  for (const row of itemsResult.rows as unknown as { items_json: string }[]) {
    const items = JSON.parse(row.items_json) as OrderItemRecord[];
    for (const item of items) {
      const existing = salesBySlug.get(item.slug);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        salesBySlug.set(item.slug, { slug: item.slug, name: item.name, quantity: item.quantity });
      }
    }
  }
  const topSellingProducts = [...salesBySlug.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalRevenue: Number((revenueResult.rows[0] as unknown as { sum: number })?.sum ?? 0),
    ordersToday: Number((todayResult.rows[0] as unknown as { count: number })?.count ?? 0),
    totalFedapayPaid: Number((fedapayPaidResult.rows[0] as unknown as { sum: number })?.sum ?? 0),
    pendingFedapayCount: Number((pendingResult.rows[0] as unknown as { count: number })?.count ?? 0),
    topSellingProducts,
  };
}