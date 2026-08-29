import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHmac } from "node:crypto";

vi.mock("./../../../../lib/db", async () => {
  const { createClient } = require("@libsql/client");
  // On garde les exports réels (ensureSchema) et on ne remplace que getDb —
  // un mock qui ne renvoie que { getDb } casse l'import d'ensureSchema
  // plus bas depuis le même module (voir la même correction en Task 3).
  const actual = await vi.importActual<typeof import("../../../../lib/db")>(
    "./../../../../lib/db"
  );
  const client = createClient({ url: ":memory:" });
  return { ...actual, getDb: async () => client };
});

vi.mock("@/lib/mail", () => ({
  sendOrderNotificationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/security-log", () => ({
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { ensureSchema } from "@/lib/db";
import { getDb } from "@/lib/db";
import { insertOrder, getOrderById } from "@/lib/orders";
import { getProductBySlug } from "@/lib/products";
import { sendOrderNotificationEmail } from "@/lib/mail";
import { logSecurityEvent } from "@/lib/security-log";

const SECRET = "test_webhook_secret";

function signedRequest(body: object): Request {
  const rawBody = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return new Request("http://localhost/api/fedapay/webhook", {
    method: "POST",
    headers: { "X-FEDAPAY-SIGNATURE": `t=${timestamp},s=${signature}` },
    body: rawBody,
  });
}

/**
 * Insère un produit de test directement en SQL : la DB `:memory:` de ce
 * test n'appelle que `ensureSchema` (pas `seedIfEmpty`), donc les slugs du
 * catalogue réel (huile-essentielle-...) n'existent pas ici.
 */
async function insertTestProduct(slug: string, stock: number): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO products (
      slug, name, category, short_description, description,
      price, volume_ml, image, featured, created_at, stock
    ) VALUES (?, ?, 'huiles-essentielles', 'desc courte', 'desc longue', 1000, 15, '/x.svg', 0, ?, ?)`,
    args: [slug, slug, new Date().toISOString(), stock],
  });
}

beforeEach(async () => {
  process.env.FEDAPAY_WEBHOOK_SECRET = SECRET;
  const db = await getDb();
  await ensureSchema(db);
  await db.execute("DELETE FROM orders");
  await db.execute("DELETE FROM products");
  vi.clearAllMocks();
});

async function createPendingOrder(slug: string, quantity: number): Promise<number> {
  const { id } = await insertOrder({
    customerName: "Test",
    phone: "90000000",
    address: "Adresse",
    deliveryZoneSlug: "cotonou",
    deliveryZoneLabel: "Cotonou",
    deliveryFee: 500,
    items: [{ slug, name: "Produit", unitPrice: 1000, quantity }],
    subtotal: 1000 * quantity,
    total: 1000 * quantity + 500,
    paymentMethod: "fedapay",
  });
  return id;
}

describe("POST /api/fedapay/webhook", () => {
  it("rejette une signature invalide avec 401", async () => {
    const request = new Request("http://localhost/api/fedapay/webhook", {
      method: "POST",
      headers: { "X-FEDAPAY-SIGNATURE": "t=1,s=invalide" },
      body: JSON.stringify({ name: "transaction.approved", entity: { id: 1, status: "approved" } }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("transaction.approved marque la commande payée et décrémente le stock", async () => {
    const slug = "produit-test-approved";
    await insertTestProduct(slug, 10);
    const stockBefore = 10;

    const orderId = await createPendingOrder(slug, 2);

    const request = signedRequest({
      name: "transaction.approved",
      entity: {
        id: 999,
        status: "approved",
        custom_metadata: { orderId },
      },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const order = await getOrderById(orderId);
    expect(order?.paymentStatus).toBe("paye");
    expect(order?.fedapayTransactionId).toBe("999");

    const productAfter = await getProductBySlug(slug);
    expect(productAfter?.stock).toBe(stockBefore - 2);
    expect(sendOrderNotificationEmail).toHaveBeenCalledTimes(1);
  });

  it("un événement transaction.approved dupliqué ne redécrémente pas le stock", async () => {
    const slug = "produit-test-duplicate";
    await insertTestProduct(slug, 10);
    const orderId = await createPendingOrder(slug, 1);

    const request = () =>
      signedRequest({
        name: "transaction.approved",
        entity: { id: 111, status: "approved", custom_metadata: { orderId } },
      });

    await POST(request());
    const stockAfterFirst = (await getProductBySlug(slug))?.stock;
    await POST(request());
    const stockAfterSecond = (await getProductBySlug(slug))?.stock;

    expect(stockAfterSecond).toBe(stockAfterFirst);
    expect(sendOrderNotificationEmail).toHaveBeenCalledTimes(1);
  });

  it("transaction.declined marque la commande échouée sans décrémenter", async () => {
    const slug = "produit-test-declined";
    await insertTestProduct(slug, 10);
    const stockBefore = 10;
    const orderId = await createPendingOrder(slug, 3);

    const request = signedRequest({
      name: "transaction.declined",
      entity: { id: 222, status: "declined", custom_metadata: { orderId } },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const order = await getOrderById(orderId);
    expect(order?.paymentStatus).toBe("echoue");

    const productAfter = await getProductBySlug(slug);
    expect(productAfter?.stock).toBe(stockBefore);
  });

  it("retourne 404 si la commande référencée n'existe pas", async () => {
    const request = signedRequest({
      name: "transaction.approved",
      entity: { id: 333, status: "approved", custom_metadata: { orderId: 999999 } },
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("journalise et rejette avec 401 une signature invalide (sous la limite de débit)", async () => {
    const request = new Request("http://localhost/api/fedapay/webhook", {
      method: "POST",
      headers: {
        "X-FEDAPAY-SIGNATURE": "t=1,s=invalide",
        "X-Forwarded-For": "203.0.113.10",
      },
      body: JSON.stringify({ name: "transaction.approved", entity: { id: 1, status: "approved" } }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "fedapay-webhook-invalid-signature", ip: "203.0.113.10" })
    );
  });

  it("bloque avec 429 après trop de signatures invalides depuis la même IP", async () => {
    const ip = "203.0.113.20";
    const badRequest = () =>
      new Request("http://localhost/api/fedapay/webhook", {
        method: "POST",
        headers: { "X-FEDAPAY-SIGNATURE": "t=1,s=invalide", "X-Forwarded-For": ip },
        body: JSON.stringify({ name: "transaction.approved", entity: { id: 1, status: "approved" } }),
      });

    // La limite (voir implémentation) est de 10 tentatives invalides / 5 minutes.
    for (let i = 0; i < 10; i += 1) {
      const response = await POST(badRequest());
      expect(response.status).toBe(401);
    }
    const blockedResponse = await POST(badRequest());
    expect(blockedResponse.status).toBe(429);
  });

  it("une signature valide n'est jamais limitée en débit, même après de nombreux appels", async () => {
    const slug = "produit-test-no-rate-limit";
    await insertTestProduct(slug, 50);
    const ip = "203.0.113.30";

    for (let i = 0; i < 15; i += 1) {
      const orderId = await createPendingOrder(slug, 1);
      const request = signedRequest({
        name: "transaction.declined",
        entity: { id: 1000 + i, status: "declined", custom_metadata: { orderId } },
      });
      request.headers.set("X-Forwarded-For", ip);
      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });

  it("journalise la confirmation d'un paiement", async () => {
    const slug = "produit-test-log-approved";
    await insertTestProduct(slug, 10);
    const orderId = await createPendingOrder(slug, 1);

    const request = signedRequest({
      name: "transaction.approved",
      entity: { id: 555, status: "approved", custom_metadata: { orderId } },
    });
    await POST(request);

    expect(logSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "fedapay-payment-confirmed", detail: expect.stringContaining(String(orderId)) })
    );
  });
});
