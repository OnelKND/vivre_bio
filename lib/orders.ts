import "server-only";
import { getDb } from "./db";

export type OrderStatus = "recue" | "preparation" | "expediee" | "livree";

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  "recue",
  "preparation",
  "expediee",
  "livree",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recue: "Commande reçue",
  preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
};

export interface OrderItemRecord {
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
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
}

export interface OrderRecord extends NewOrderInput {
  id: number;
  createdAt: string;
  status: OrderStatus;
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
  };
}

export function insertOrder(input: NewOrderInput): number {
  const db = getDb();
  const statement = db.prepare(`
    INSERT INTO orders (
      created_at, customer_name, phone, address,
      delivery_zone_slug, delivery_zone_label, delivery_fee,
      items_json, subtotal, total, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recue')
  `);
  const result = statement.run(
    new Date().toISOString(),
    input.customerName,
    input.phone,
    input.address,
    input.deliveryZoneSlug,
    input.deliveryZoneLabel,
    input.deliveryFee,
    JSON.stringify(input.items),
    input.subtotal,
    input.total
  );
  return Number(result.lastInsertRowid);
}

export function listOrders(): OrderRecord[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM orders ORDER BY id DESC")
    .all() as unknown as OrderRow[];
  return rows.map(rowToOrder);
}

export function getOrderById(id: number): OrderRecord | undefined {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(id) as OrderRow | undefined;
  return row ? rowToOrder(row) : undefined;
}

export function updateOrderStatus(id: number, status: OrderStatus): void {
  const db = getDb();
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
}
