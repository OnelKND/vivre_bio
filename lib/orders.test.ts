import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./db", async () => {
  const { createClient } = require("@libsql/client");
  // On garde les exports réels (ensureSchema, etc.) et on ne remplace que
  // getDb, pour brancher un client libSQL en mémoire dédié aux tests. Le
  // mock brut du plan ({ getDb, __client }) casse `ensureSchema` importé
  // plus bas depuis "./db" — d'où le spread de l'implémentation réelle.
  const actual = await vi.importActual<typeof import("./db")>("./db");
  const client = createClient({ url: ":memory:" });
  return { ...actual, getDb: async () => client, __client: client };
});

import {
  insertOrder,
  getOrderById,
  markOrderPaymentPaid,
  markOrderPaymentFailed,
  getOrderByFedapayTransactionId,
} from "./orders";
import { ensureSchema } from "./db";
import { getDb } from "./db";

const baseInput = {
  customerName: "Awa Test",
  phone: "90000000",
  address: "Rue 1, Cotonou",
  deliveryZoneSlug: "cotonou",
  deliveryZoneLabel: "Cotonou",
  deliveryFee: 500,
  items: [{ slug: "produit-1", name: "Produit 1", unitPrice: 1000, quantity: 2 }],
  subtotal: 2000,
  total: 2500,
};

beforeEach(async () => {
  const db = await getDb();
  await ensureSchema(db);
  await db.execute("DELETE FROM orders");
});

describe("insertOrder avec paiement", () => {
  it("insère une commande cash avec payment_status non_requis", async () => {
    const { id } = await insertOrder({ ...baseInput, paymentMethod: "cash" });
    const order = await getOrderById(id);
    expect(order?.paymentMethod).toBe("cash");
    expect(order?.paymentStatus).toBe("non_requis");
  });

  it("insère une commande fedapay avec payment_status en_attente", async () => {
    const { id } = await insertOrder({ ...baseInput, paymentMethod: "fedapay" });
    const order = await getOrderById(id);
    expect(order?.paymentMethod).toBe("fedapay");
    expect(order?.paymentStatus).toBe("en_attente");
  });
});

describe("markOrderPaymentPaid", () => {
  it("passe la commande à paye et enregistre la référence FedaPay", async () => {
    const { id } = await insertOrder({ ...baseInput, paymentMethod: "fedapay" });
    const result = await markOrderPaymentPaid(id, "txn_123");
    expect(result.alreadyPaid).toBe(false);

    const order = await getOrderById(id);
    expect(order?.paymentStatus).toBe("paye");
    expect(order?.fedapayTransactionId).toBe("txn_123");
  });

  it("est idempotent : un second appel signale alreadyPaid sans erreur", async () => {
    const { id } = await insertOrder({ ...baseInput, paymentMethod: "fedapay" });
    await markOrderPaymentPaid(id, "txn_123");
    const second = await markOrderPaymentPaid(id, "txn_123");
    expect(second.alreadyPaid).toBe(true);
  });
});

describe("markOrderPaymentFailed", () => {
  it("passe la commande à echoue", async () => {
    const { id } = await insertOrder({ ...baseInput, paymentMethod: "fedapay" });
    await markOrderPaymentFailed(id, "txn_456");
    const order = await getOrderById(id);
    expect(order?.paymentStatus).toBe("echoue");
  });
});

describe("getOrderByFedapayTransactionId", () => {
  it("retrouve la commande par référence de transaction", async () => {
    const { id } = await insertOrder({ ...baseInput, paymentMethod: "fedapay" });
    await markOrderPaymentPaid(id, "txn_789");
    const order = await getOrderByFedapayTransactionId("txn_789");
    expect(order?.id).toBe(id);
  });

  it("retourne undefined si aucune commande ne correspond", async () => {
    const order = await getOrderByFedapayTransactionId("inexistant");
    expect(order).toBeUndefined();
  });
});
