# Intégration FedaPay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter FedaPay comme mode de paiement en ligne optionnel au checkout (à côté du paiement à la livraison existant), avec statut de paiement suivi séparément du statut de livraison, et refonte de l'admin commandes pour afficher ce statut + un bandeau de stats.

**Architecture:** Deux nouvelles colonnes (`payment_method`, `payment_status`) + une colonne de référence (`fedapay_transaction_id`) sur la table `orders` existante. Le checkout FedaPay utilise le widget `Checkout.js` côté client ; la confirmation du paiement passe exclusivement par un webhook HTTP vérifié par signature (`app/api/fedapay/webhook/route.ts`), jamais par un statut renseigné manuellement.

**Tech Stack:** Next.js App Router (existant), `@libsql/client` (existant), `zod` (existant), `nodemailer` (existant), FedaPay `Checkout.js` (script CDN, aucune dépendance npm nécessaire côté client), vérification de signature webhook en HMAC SHA256 (`node:crypto`, natif — pas de SDK FedaPay npm nécessaire pour ce périmètre).

**Spec:** `docs/superpowers/specs/2026-08-29-fedapay-payment-design.md`

## Global Constraints

- Paiement à la livraison reste le comportement par défaut, inchangé (décrément stock + email immédiats).
- `payment_status` ne se met jamais à jour ailleurs que dans le webhook — aucun formulaire admin ne doit permettre de le changer manuellement.
- Toute requête webhook doit être rejetée avec 401 si la signature `FEDAPAY_WEBHOOK_SECRET` ne correspond pas.
- Le décrément de stock pour une commande FedaPay ne doit jamais se produire deux fois pour le même événement de paiement (idempotence).
- Couleurs de marque (`#2E7D32` vert, `#E31E24` rouge) et fond blanc/crème existants : ne pas les modifier.
- Toutes les fonctions dans `lib/*.ts` sont `async` (accès DB via `getDb()` qui retourne `Promise<Client>`) — respecter ce pattern partout.

---

## File Structure

- `lib/order-status.ts` — types partagés purs (déjà existant) : ajoute `PaymentMethod`, `PaymentStatus`, labels/badges associés.
- `lib/db.ts` — modifie `ensureSchema` pour ajouter les 3 colonnes sur `orders` (migration additive via `ALTER TABLE ... ADD COLUMN` protégé, car `CREATE TABLE IF NOT EXISTS` ne touche pas une table existante).
- `lib/orders.ts` — modifie `NewOrderInput`, `OrderRecord`, `rowToOrder`, `insertOrder`, ajoute `markOrderPaymentPaid`, `markOrderPaymentFailed`, `getOrderByFedapayTransactionId` (pour l'idempotence webhook).
- `lib/fedapay.ts` (nouveau) — vérification de signature webhook (`verifyFedapaySignature`), construction de la config du widget côté client (`getFedapayCheckoutConfig`).
- `app/commande/actions.ts` — `createOrder` accepte `paymentMethod`, bifurque le comportement (décrément+email immédiats vs différés).
- `app/commande/CheckoutPageClient.tsx` — ajoute le choix de mode de paiement.
- `app/commande/confirmation/[id]/page.tsx` — pour une commande FedaPay `en_attente`, charge le script Checkout.js et ouvre le widget.
- `app/commande/confirmation/[id]/FedapayCheckoutButton.tsx` (nouveau, client component) — encapsule le chargement du script + `FedaPay.init()`.
- `app/api/fedapay/webhook/route.ts` (nouveau) — reçoit et traite les webhooks FedaPay.
- `app/admin/page.tsx` — bandeau de stats + colonne/filtre paiement.
- `app/admin/commandes/[id]/page.tsx` — bloc paiement séparé.
- `app/admin/commandes/export/route.ts` — colonnes CSV `payment_method`/`payment_status`.
- `.env.example` — nouvelles variables FedaPay.
- Tests : `lib/orders.test.ts` (nouveau), `lib/fedapay.test.ts` (nouveau), `app/api/fedapay/webhook/route.test.ts` (nouveau).

---

### Task 1: Types partagés paiement

**Files:**
- Modify: `lib/order-status.ts`

**Interfaces:**
- Produces: `type PaymentMethod = "cash" | "fedapay"`, `type PaymentStatus = "non_requis" | "en_attente" | "paye" | "echoue"`, `PAYMENT_METHOD_LABELS: Record<PaymentMethod, string>`, `PAYMENT_STATUS_LABELS: Record<PaymentStatus, string>`, `PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatus, string>`

- [ ] **Step 1: Ajouter les types et constantes**

Ajouter à la fin de `lib/order-status.ts` :

```ts
export type PaymentMethod = "cash" | "fedapay";
export type PaymentStatus = "non_requis" | "en_attente" | "paye" | "echoue";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Paiement à la livraison",
  fedapay: "FedaPay (en ligne)",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  non_requis: "N/A",
  en_attente: "En attente",
  paye: "Payé",
  echoue: "Échoué",
};

/** Classes daisyUI par statut de paiement. */
export const PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatus, string> = {
  non_requis: "badge-ghost",
  en_attente: "badge-warning",
  paye: "badge-success",
  echoue: "badge-error",
};
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur (fichier pur, aucun consommateur encore modifié)

- [ ] **Step 3: Commit**

```bash
git add lib/order-status.ts
git commit -m "feat: ajoute les types PaymentMethod/PaymentStatus"
```

---

### Task 2: Migration schéma — colonnes paiement

**Files:**
- Modify: `lib/db.ts:155-170` (fonction `ensureSchema`)
- Test: `lib/db.test.ts` (nouveau)

**Interfaces:**
- Consumes: rien de nouveau (juste `Client` de `@libsql/client`, déjà importé)
- Produces: colonnes `orders.payment_method` (TEXT NOT NULL DEFAULT 'cash'), `orders.payment_status` (TEXT NOT NULL DEFAULT 'non_requis'), `orders.fedapay_transaction_id` (TEXT NULL). `ensureSchema(client: Client): Promise<void>` reste la même signature.

- [ ] **Step 1: Écrire le test qui vérifie les nouvelles colonnes**

Créer `lib/db.test.ts` :

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createClient } from "@libsql/client";

// On importe ensureSchema en le rendant testable : il n'est pas exporté
// aujourd'hui, donc ce test pilote son export (voir Step 3).
import { ensureSchema } from "./db";

describe("ensureSchema", () => {
  it("crée les colonnes de paiement sur orders avec leurs valeurs par défaut", async () => {
    const client = createClient({ url: ":memory:" });
    await ensureSchema(client);

    await client.execute({
      sql: `INSERT INTO orders (
        created_at, customer_name, phone, address,
        delivery_zone_slug, delivery_zone_label, delivery_fee,
        items_json, subtotal, total
      ) VALUES ('2026-01-01T00:00:00.000Z', 'Test', '90000000', 'Adresse',
        'cotonou', 'Cotonou', 500, '[]', 1000, 1500)`,
      args: [],
    });

    const result = await client.execute("SELECT payment_method, payment_status, fedapay_transaction_id FROM orders");
    const row = result.rows[0] as unknown as {
      payment_method: string;
      payment_status: string;
      fedapay_transaction_id: string | null;
    };

    expect(row.payment_method).toBe("cash");
    expect(row.payment_status).toBe("non_requis");
    expect(row.fedapay_transaction_id).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run lib/db.test.ts`
Expected: FAIL — `ensureSchema` n'est pas exporté (`SyntaxError` ou `undefined is not a function`)

- [ ] **Step 3: Exporter `ensureSchema` et ajouter les colonnes**

Dans `lib/db.ts`, changer `async function ensureSchema` en `export async function ensureSchema` (ligne 154).

Puis, dans le tableau `statements` de `ensureSchema`, juste après la définition de `CREATE TABLE IF NOT EXISTS orders (...)`, ajouter les migrations additives suivantes (SQLite/libSQL n'a pas de `ADD COLUMN IF NOT EXISTS`, donc on vérifie via `PRAGMA table_info` avant d'altérer) :

```ts
async function ensureOrderPaymentColumns(client: Client): Promise<void> {
  const info = await client.execute("PRAGMA table_info(orders)");
  const columns = new Set(
    (info.rows as unknown as { name: string }[]).map((row) => row.name)
  );

  if (!columns.has("payment_method")) {
    await client.execute(
      "ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'"
    );
  }
  if (!columns.has("payment_status")) {
    await client.execute(
      "ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'non_requis'"
    );
  }
  if (!columns.has("fedapay_transaction_id")) {
    await client.execute(
      "ALTER TABLE orders ADD COLUMN fedapay_transaction_id TEXT"
    );
  }
}
```

Puis, à la fin de `ensureSchema` (après la boucle `for (const statement of statements)`), ajouter :

```ts
  await ensureOrderPaymentColumns(client);
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run lib/db.test.ts`
Expected: PASS

- [ ] **Step 5: Vérifier que la suite complète passe toujours**

Run: `npx vitest run`
Expected: PASS (aucune régression sur les tests existants)

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts lib/db.test.ts
git commit -m "feat: migration additive payment_method/payment_status/fedapay_transaction_id"
```

---

### Task 3: `lib/orders.ts` — modèle de commande avec paiement

**Files:**
- Modify: `lib/orders.ts`
- Test: `lib/orders.test.ts` (nouveau)

**Interfaces:**
- Consumes: `PaymentMethod`, `PaymentStatus` de `./order-status` (Task 1) ; `getDb` de `./db` (Task 2, colonnes disponibles)
- Produces:
  - `NewOrderInput` gagne `paymentMethod: PaymentMethod`
  - `OrderRecord` gagne `paymentMethod: PaymentMethod`, `paymentStatus: PaymentStatus`, `fedapayTransactionId?: string`
  - `insertOrder(input: NewOrderInput): Promise<InsertOrderResult>` (signature inchangée, comportement étendu)
  - `markOrderPaymentPaid(id: number, fedapayTransactionId: string): Promise<{ alreadyPaid: boolean }>`
  - `markOrderPaymentFailed(id: number, fedapayTransactionId: string): Promise<void>`
  - `getOrderByFedapayTransactionId(fedapayTransactionId: string): Promise<OrderRecord | undefined>`

- [ ] **Step 1: Écrire les tests pour l'insertion et les transitions de paiement**

Créer `lib/orders.test.ts` :

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./db", () => {
  const { createClient } = require("@libsql/client");
  const client = createClient({ url: ":memory:" });
  return { getDb: async () => client, __client: client };
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
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npx vitest run lib/orders.test.ts`
Expected: FAIL — `paymentMethod` non accepté par `insertOrder`, `markOrderPaymentPaid`/`markOrderPaymentFailed`/`getOrderByFedapayTransactionId` non exportés

- [ ] **Step 3: Modifier `lib/orders.ts`**

Ligne 1-11, importer les nouveaux types :

```ts
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
```

Modifier `NewOrderInput` (ligne 25-37) pour ajouter le champ :

```ts
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
```

Modifier `OrderRecord` (ligne 39-44) :

```ts
export interface OrderRecord extends NewOrderInput {
  id: number;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fedapayTransactionId?: string;
  statusHistory: OrderStatusHistoryEntry[];
}
```

Modifier `OrderRow` (ligne 59-74) pour ajouter les colonnes brutes :

```ts
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
```

Modifier `rowToOrder` (ligne 76-95) :

```ts
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
```

Modifier `insertOrder` (ligne 103-140) pour insérer `payment_method`/`payment_status` :

```ts
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
```

Ajouter, après `updateOrderStatus` (fin du fichier) :

```ts
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
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npx vitest run lib/orders.test.ts`
Expected: PASS

- [ ] **Step 5: Lancer la suite complète (order-pricing.test.ts dépend de types d'orders.ts)**

Run: `npx vitest run`
Expected: PASS. Si `order-pricing.test.ts` échoue à cause du champ `paymentMethod` manquant dans un objet `NewOrderInput` de test, ce n'est pas attendu ici (ce fichier ne construit que des `OrderItemRecord`, pas des `NewOrderInput` complets) — si une erreur de type apparaît malgré tout, ajouter `paymentMethod: "cash"` à l'objet concerné.

- [ ] **Step 6: Commit**

```bash
git add lib/orders.ts lib/orders.test.ts
git commit -m "feat: suivi du statut de paiement dans lib/orders.ts"
```

---

### Task 4: `lib/fedapay.ts` — vérification de signature + config widget

**Files:**
- Create: `lib/fedapay.ts`
- Test: `lib/fedapay.test.ts` (nouveau)

**Interfaces:**
- Consumes: `node:crypto` (natif), `process.env.FEDAPAY_PUBLIC_KEY`, `process.env.FEDAPAY_WEBHOOK_SECRET`
- Produces:
  - `verifyFedapaySignature(rawBody: string, signatureHeader: string | null): boolean`
  - `getFedapayPublicKey(): string` (lève une erreur explicite si absente — appelé uniquement côté serveur pour générer la page, jamais exposé sans configuration)
  - `parseFedapayWebhookEvent(rawBody: string): FedapayWebhookEvent | null`
  - `interface FedapayWebhookEvent { name: string; entity: { id: number; status: string } }`

FedaPay signe ses webhooks avec un header `X-FEDAPAY-SIGNATURE` au format
`t=<timestamp>,s=<signature_hex>`, où `signature_hex = HMAC_SHA256(webhookSecret, "<timestamp>.<rawBody>")` — c'est le même schéma que Stripe/la plupart des PSPs. On implémente cette vérification nous-mêmes avec `node:crypto`, sans dépendance au SDK npm FedaPay (non nécessaire pour ce périmètre — pas d'appel à l'API FedaPay elle-même, seulement réception de webhook + widget client).

- [ ] **Step 1: Écrire les tests**

Créer `lib/fedapay.test.ts` :

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { verifyFedapaySignature, parseFedapayWebhookEvent } from "./fedapay";

const SECRET = "test_webhook_secret";

function signPayload(rawBody: string, timestamp: number): string {
  const signature = createHmac("sha256", SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `t=${timestamp},s=${signature}`;
}

describe("verifyFedapaySignature", () => {
  const originalSecret = process.env.FEDAPAY_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.FEDAPAY_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.FEDAPAY_WEBHOOK_SECRET = originalSecret;
  });

  it("accepte une signature valide", () => {
    const body = '{"name":"transaction.approved"}';
    const header = signPayload(body, Math.floor(Date.now() / 1000));
    expect(verifyFedapaySignature(body, header)).toBe(true);
  });

  it("rejette une signature invalide", () => {
    const body = '{"name":"transaction.approved"}';
    expect(verifyFedapaySignature(body, "t=123,s=deadbeef")).toBe(false);
  });

  it("rejette un header absent", () => {
    expect(verifyFedapaySignature('{"name":"x"}', null)).toBe(false);
  });

  it("rejette si le secret n'est pas configuré", () => {
    delete process.env.FEDAPAY_WEBHOOK_SECRET;
    const body = '{"name":"transaction.approved"}';
    const header = signPayload(body, Math.floor(Date.now() / 1000));
    expect(verifyFedapaySignature(body, header)).toBe(false);
  });
});

describe("parseFedapayWebhookEvent", () => {
  it("parse un événement valide", () => {
    const event = parseFedapayWebhookEvent(
      JSON.stringify({ name: "transaction.approved", entity: { id: 42, status: "approved" } })
    );
    expect(event).toEqual({ name: "transaction.approved", entity: { id: 42, status: "approved" } });
  });

  it("retourne null pour un JSON invalide", () => {
    expect(parseFedapayWebhookEvent("pas du json")).toBeNull();
  });

  it("retourne null si la structure attendue est absente", () => {
    expect(parseFedapayWebhookEvent(JSON.stringify({ foo: "bar" }))).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npx vitest run lib/fedapay.test.ts`
Expected: FAIL — `./fedapay` n'existe pas

- [ ] **Step 3: Créer `lib/fedapay.ts`**

```ts
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * FedaPay signe ses webhooks avec `X-FEDAPAY-SIGNATURE: t=<timestamp>,s=<hmac>`
 * où hmac = HMAC_SHA256(FEDAPAY_WEBHOOK_SECRET, `${timestamp}.${rawBody}`).
 * On vérifie sur le corps brut (jamais le JSON re-sérialisé, qui pourrait
 * différer octet pour octet de ce que FedaPay a signé).
 */
export function verifyFedapaySignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const providedSignature = parts.s;
  if (!timestamp || !providedSignature) return false;

  const expectedSignature = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const provided = Buffer.from(providedSignature, "hex");
  if (expected.length !== provided.length) return false;

  return timingSafeEqual(expected, provided);
}

export interface FedapayWebhookEvent {
  name: string;
  entity: { id: number; status: string };
}

export function parseFedapayWebhookEvent(rawBody: string): FedapayWebhookEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).name !== "string" ||
    typeof (parsed as Record<string, unknown>).entity !== "object"
  ) {
    return null;
  }

  const entity = (parsed as { entity: Record<string, unknown> }).entity;
  if (typeof entity.id !== "number" || typeof entity.status !== "string") {
    return null;
  }

  return {
    name: (parsed as { name: string }).name,
    entity: { id: entity.id, status: entity.status },
  };
}

export function getFedapayPublicKey(): string {
  const key = process.env.FEDAPAY_PUBLIC_KEY;
  if (!key) {
    throw new Error(
      "FEDAPAY_PUBLIC_KEY manquant : ajoute-le dans les variables d'environnement."
    );
  }
  return key;
}

export function getFedapayEnvironment(): "sandbox" | "live" {
  return process.env.FEDAPAY_ENVIRONMENT === "live" ? "live" : "sandbox";
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npx vitest run lib/fedapay.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/fedapay.ts lib/fedapay.test.ts
git commit -m "feat: vérification de signature webhook FedaPay"
```

---

### Task 5: Webhook route `app/api/fedapay/webhook/route.ts`

**Files:**
- Create: `app/api/fedapay/webhook/route.ts`
- Test: `app/api/fedapay/webhook/route.test.ts` (nouveau)

**Interfaces:**
- Consumes: `verifyFedapaySignature`, `parseFedapayWebhookEvent` de `@/lib/fedapay` (Task 4) ; `getOrderByFedapayTransactionId`, `markOrderPaymentPaid`, `markOrderPaymentFailed`, `getOrderById` de `@/lib/orders` (Task 3) ; `decrementStock` de `@/lib/products` (existant) ; `sendOrderNotificationEmail` de `@/lib/mail` (existant)
- Produces: `POST(request: Request): Promise<Response>` — statuts HTTP 401 (signature invalide), 200 (traité ou ignoré), 404 (commande introuvable)

Note sur l'identification de la commande : le widget Checkout.js est initialisé avec `custom_metadata: { orderId }` (voir Task 6) ; FedaPay renvoie cette métadonnée dans `entity` du webhook sous `entity.custom_metadata.orderId` selon la doc FedaPay — on utilise ce champ pour retrouver `orderId` directement, sans dépendre de `getOrderByFedapayTransactionId` pour la recherche initiale (cette fonction sert seulement à l'idempotence/l'affichage admin après coup).

- [ ] **Step 1: Écrire les tests**

Créer `app/api/fedapay/webhook/route.test.ts` :

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHmac } from "node:crypto";

vi.mock("./../../../../lib/db", () => {
  const { createClient } = require("@libsql/client");
  const client = createClient({ url: ":memory:" });
  return { getDb: async () => client };
});

vi.mock("@/lib/mail", () => ({
  sendOrderNotificationEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { ensureSchema } from "@/lib/db";
import { getDb } from "@/lib/db";
import { insertOrder, getOrderById } from "@/lib/orders";
import { getProductBySlug } from "@/lib/products";
import { sendOrderNotificationEmail } from "@/lib/mail";

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
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npx vitest run app/api/fedapay/webhook/route.test.ts`
Expected: FAIL — `./route` n'existe pas

- [ ] **Step 3: Créer `app/api/fedapay/webhook/route.ts`**

```ts
import { verifyFedapaySignature, parseFedapayWebhookEvent } from "@/lib/fedapay";
import {
  getOrderById,
  markOrderPaymentPaid,
  markOrderPaymentFailed,
} from "@/lib/orders";
import { decrementStock } from "@/lib/products";
import { sendOrderNotificationEmail } from "@/lib/mail";

// Jamais mis en cache : c'est un endpoint de traitement d'événement à la demande.
export const dynamic = "force-dynamic";

interface FedapayEntityWithMetadata {
  id: number;
  status: string;
  custom_metadata?: { orderId?: number };
}

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("X-FEDAPAY-SIGNATURE");

  if (!verifyFedapaySignature(rawBody, signatureHeader)) {
    return new Response("Signature invalide.", { status: 401 });
  }

  const event = parseFedapayWebhookEvent(rawBody);
  if (!event) {
    return new Response("Payload invalide.", { status: 400 });
  }

  const entity = event.entity as FedapayEntityWithMetadata;
  const orderId = entity.custom_metadata?.orderId;
  if (!orderId) {
    return new Response("Référence de commande absente.", { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return new Response("Commande introuvable.", { status: 404 });
  }

  const transactionId = String(entity.id);

  if (event.name === "transaction.approved") {
    const { alreadyPaid } = await markOrderPaymentPaid(orderId, transactionId);
    if (!alreadyPaid) {
      for (const item of order.items) {
        await decrementStock(item.slug, item.quantity);
      }
      const updatedOrder = await getOrderById(orderId);
      if (updatedOrder) {
        await sendOrderNotificationEmail(updatedOrder);
      }
    }
    return new Response("OK", { status: 200 });
  }

  if (event.name === "transaction.declined" || event.name === "transaction.canceled") {
    await markOrderPaymentFailed(orderId, transactionId);
    return new Response("OK", { status: 200 });
  }

  // Événement FedaPay non géré par ce périmètre (ex: transaction.created) : accusé
  // de réception sans effet, pour ne pas déclencher de retentatives inutiles côté FedaPay.
  return new Response("Ignoré.", { status: 200 });
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npx vitest run app/api/fedapay/webhook/route.test.ts`
Expected: PASS

- [ ] **Step 5: Lancer la suite complète**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/fedapay/webhook/route.ts app/api/fedapay/webhook/route.test.ts
git commit -m "feat: webhook FedaPay (confirmation/échec de paiement)"
```

---

### Task 6: Checkout — choix du mode de paiement

**Files:**
- Modify: `app/commande/actions.ts`
- Modify: `app/commande/CheckoutPageClient.tsx`

**Interfaces:**
- Consumes: `insertOrder` avec `paymentMethod` (Task 3), `PaymentMethod` de `@/lib/order-status`
- Produces: `createOrder` redirige vers `/commande/confirmation/[id]` dans tous les cas ; pour `paymentMethod: "fedapay"`, ne décrémente pas le stock et n'envoie pas l'email à cette étape.

- [ ] **Step 1: Modifier le schéma et la logique de `app/commande/actions.ts`**

Ajouter l'import et le champ au schéma (après la ligne `import { decrementStock, getProductBySlug } from "@/lib/products";`) :

```ts
import type { PaymentMethod } from "@/lib/order-status";
```

Modifier `checkoutSchema` pour ajouter :

```ts
  paymentMethod: z.enum(["cash", "fedapay"]),
```

Modifier le bloc `parsed = checkoutSchema.safeParse({...})` pour ajouter :

```ts
    paymentMethod: formData.get("paymentMethod"),
```

Modifier l'appel à `insertOrder` (ligne ~99-110) pour passer `paymentMethod: parsed.data.paymentMethod`.

Remplacer le bloc `if (isNew) { ... }` (ligne 112-121) par :

```ts
  if (isNew && parsed.data.paymentMethod === "cash") {
    for (const item of items) {
      await decrementStock(item.slug, item.quantity);
    }

    const order = await getOrderById(orderId);
    if (order) {
      await sendOrderNotificationEmail(order);
    }
  }
  // Pour FedaPay : ni décrément de stock ni email ici — différés jusqu'à
  // la confirmation du paiement par webhook (voir app/api/fedapay/webhook).
```

- [ ] **Step 2: Modifier `app/commande/CheckoutPageClient.tsx`**

Ajouter l'état et l'import après la ligne `const [idempotencyKey, setIdempotencyKey] = useState("");` :

```tsx
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "fedapay">("cash");
```

Ajouter le champ caché dans le `<form>`, à côté des autres `input type="hidden"` :

```tsx
        <input type="hidden" name="paymentMethod" value={paymentMethod} />
```

Ajouter le sélecteur de mode de paiement juste après le `<fieldset>` de zone de livraison (avant le bloc `{state.status === "error" && ...}`) :

```tsx
          <fieldset className="flex flex-col gap-2">
            <legend className="font-medium text-sm mb-1">
              Mode de paiement
            </legend>
            <label className="flex items-center gap-3 border border-base-300 rounded-field px-4 py-3 cursor-pointer has-[:checked]:border-primary">
              <input
                type="radio"
                name="paymentMethodChoice"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
                className="radio radio-primary radio-sm"
              />
              Paiement à la livraison (espèces ou Mobile Money)
            </label>
            <label className="flex items-center gap-3 border border-base-300 rounded-field px-4 py-3 cursor-pointer has-[:checked]:border-primary">
              <input
                type="radio"
                name="paymentMethodChoice"
                checked={paymentMethod === "fedapay"}
                onChange={() => setPaymentMethod("fedapay")}
                className="radio radio-primary radio-sm"
              />
              Payer en ligne maintenant (FedaPay)
            </label>
          </fieldset>
```

Retirer le `<p>` statique existant `Paiement à la livraison uniquement (espèces ou Mobile Money).` (il devient inexact et redondant avec le nouveau sélecteur).

- [ ] **Step 3: Vérifier manuellement (pas de test automatisé pour ce composant client existant — le projet n'a pas de tests de composants React)**

Run: `npm run dev` puis ouvrir `/commande` avec un produit dans le panier, vérifier que les deux options radio s'affichent et que la soumission avec "cash" fonctionne exactement comme avant (redirection vers confirmation, stock décrémenté).

- [ ] **Step 4: Lancer la suite de tests complète (non-régression)**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/commande/actions.ts app/commande/CheckoutPageClient.tsx
git commit -m "feat: choix du mode de paiement au checkout"
```

---

### Task 7: Widget Checkout.js sur la page de confirmation

**Files:**
- Create: `app/commande/confirmation/[id]/FedapayCheckoutButton.tsx`
- Modify: `app/commande/confirmation/[id]/page.tsx`

**Interfaces:**
- Consumes: `getFedapayPublicKey`, `getFedapayEnvironment` de `@/lib/fedapay` (Task 4) ; `order.paymentMethod`, `order.paymentStatus`, `order.total` de `OrderRecord` (Task 3)
- Produces: `FedapayCheckoutButton` (client component) props `{ publicKey: string; sandbox: boolean; amount: number; orderId: number; customerEmail?: string }`

- [ ] **Step 1: Créer `app/commande/confirmation/[id]/FedapayCheckoutButton.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    FedaPay?: {
      init: (selector: string, options: Record<string, unknown>) => void;
    };
  }
}

const CHECKOUT_SCRIPT_SRC = "https://cdn.fedapay.com/checkout.js?v=1.1.7";

export default function FedapayCheckoutButton({
  publicKey,
  sandbox,
  amount,
  orderId,
}: {
  publicKey: string;
  sandbox: boolean;
  amount: number;
  orderId: number;
}) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (document.querySelector(`script[src="${CHECKOUT_SCRIPT_SRC}"]`)) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handleClick = () => {
    if (!scriptLoaded || !window.FedaPay) return;

    window.FedaPay.init("#fedapay-checkout-trigger", {
      public_key: publicKey,
      environment: sandbox ? "sandbox" : "live",
      transaction: {
        amount,
        description: `Commande VIVRE BIO #${orderId}`,
        custom_metadata: { orderId },
      },
      onComplete: () => {
        // Le statut réel est confirmé par le webhook, pas par ce callback
        // (qui peut se déclencher avant que FedaPay ait notifié le serveur).
        window.location.reload();
      },
    });
  };

  return (
    <button
      id="fedapay-checkout-trigger"
      type="button"
      onClick={handleClick}
      disabled={!scriptLoaded}
      className="btn btn-primary btn-lg"
    >
      {scriptLoaded ? "Payer maintenant avec FedaPay" : "Chargement du paiement..."}
    </button>
  );
}
```

- [ ] **Step 2: Intégrer le bouton dans `app/commande/confirmation/[id]/page.tsx`**

Modifier l'import en ligne 4 :

```ts
import { getOrderById, ORDER_STATUS_LABELS } from "@/lib/orders";
import { getFedapayPublicKey, getFedapayEnvironment } from "@/lib/fedapay";
import FedapayCheckoutButton from "./FedapayCheckoutButton";
```

Remplacer les deux lignes (40-42) :

```tsx
        <p className="text-sm text-base-content/60">
          Paiement à la livraison, en espèces ou par Mobile Money.
        </p>
```

par un bloc conditionnel selon le mode/statut de paiement :

```tsx
        {order.paymentMethod === "cash" && (
          <p className="text-sm text-base-content/60">
            Paiement à la livraison, en espèces ou par Mobile Money.
          </p>
        )}
        {order.paymentMethod === "fedapay" && order.paymentStatus === "paye" && (
          <p className="text-sm font-medium text-primary">
            Paiement reçu — merci !
          </p>
        )}
        {order.paymentMethod === "fedapay" &&
          (order.paymentStatus === "en_attente" || order.paymentStatus === "echoue") && (
            <div className="flex flex-col items-center gap-2">
              {order.paymentStatus === "echoue" && (
                <p className="text-sm text-error">
                  Le paiement précédent n&apos;a pas abouti. Vous pouvez réessayer :
                </p>
              )}
              <FedapayCheckoutButton
                publicKey={getFedapayPublicKey()}
                sandbox={getFedapayEnvironment() === "sandbox"}
                amount={order.total}
                orderId={order.id}
              />
            </div>
          )}
```

- [ ] **Step 3: Vérifier manuellement**

Run: `npm run dev`, passer une commande FedaPay en sandbox (nécessite des clés sandbox FedaPay valides dans `.env.local`), vérifier que le widget s'ouvre.

- [ ] **Step 4: Lancer la suite de tests complète**

Run: `npx vitest run`
Expected: PASS (aucun test automatisé nouveau pour cette tâche — composant client + clé API externe)

- [ ] **Step 5: Commit**

```bash
git add app/commande/confirmation/[id]/
git commit -m "feat: widget FedaPay Checkout.js sur la page de confirmation"
```

---

### Task 8: `.env.example` — variables FedaPay

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Ajouter les variables**

Ajouter à la fin de `.env.example` :

```
# FedaPay (paiement en ligne optionnel) — récupère les clés sur
# https://dashboard.fedapay.com (mode sandbox pour les tests).
FEDAPAY_PUBLIC_KEY=
FEDAPAY_SECRET_KEY=
FEDAPAY_WEBHOOK_SECRET=
FEDAPAY_ENVIRONMENT=sandbox
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: ajoute les variables d'environnement FedaPay"
```

---

### Task 9: Admin — bandeau de stats + colonne/filtre paiement (liste)

**Files:**
- Modify: `lib/orders.ts` (nouvelle fonction de stats)
- Modify: `app/admin/page.tsx`
- Test: `lib/orders.test.ts` (ajout de cas)

**Interfaces:**
- Produces: `getOrderPaymentStats(options: { status?: OrderStatus; from?: string; to?: string }): Promise<OrderPaymentStats>` où `interface OrderPaymentStats { totalCash: number; totalFedapayPaid: number; pendingFedapayCount: number }`
- `listOrders` (Task 3, inchangé côté signature) accepte en plus un `paymentStatus?: PaymentStatus` dans `ListOrdersOptions`

- [ ] **Step 1: Écrire les tests pour `getOrderPaymentStats` et le filtre `paymentStatus`**

Ajouter à `lib/orders.test.ts` :

```ts
describe("listOrders avec filtre paymentStatus", () => {
  it("filtre les commandes par statut de paiement", async () => {
    await insertOrder({ ...baseInput, paymentMethod: "cash" });
    const { id: fedapayId } = await insertOrder({ ...baseInput, paymentMethod: "fedapay" });
    await markOrderPaymentPaid(fedapayId, "txn_filter");

    const { orders } = await listOrders({ paymentStatus: "paye" });
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe(fedapayId);
  });
});

describe("getOrderPaymentStats", () => {
  it("calcule le total cash, le total FedaPay payé et le nombre en attente", async () => {
    await insertOrder({ ...baseInput, paymentMethod: "cash" }); // total 2500
    const { id: paidId } = await insertOrder({ ...baseInput, paymentMethod: "fedapay" }); // total 2500
    await markOrderPaymentPaid(paidId, "txn_stats_1");
    await insertOrder({ ...baseInput, paymentMethod: "fedapay" }); // reste en_attente

    const stats = await getOrderPaymentStats({});
    expect(stats.totalCash).toBe(2500);
    expect(stats.totalFedapayPaid).toBe(2500);
    expect(stats.pendingFedapayCount).toBe(1);
  });
});
```

Ajouter `getOrderPaymentStats` et `markOrderPaymentPaid` à l'import en haut du fichier de test si absents.

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `npx vitest run lib/orders.test.ts`
Expected: FAIL — `paymentStatus` non supporté par `listOrders`, `getOrderPaymentStats` non exporté

- [ ] **Step 3: Modifier `lib/orders.ts`**

Modifier `ListOrdersOptions` :

```ts
export interface ListOrdersOptions {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** Recherche sur le nom du client ou le téléphone. */
  query?: string;
  limit?: number;
  offset?: number;
}
```

Modifier `listOrders` pour ajouter la condition (dans le bloc `conditions`/`params`, après le bloc `if (status) {...}`) :

```ts
  if (options.paymentStatus) {
    conditions.push("payment_status = ?");
    params.push(options.paymentStatus);
  }
```

Ajouter à la fin du fichier :

```ts
export interface OrderPaymentStats {
  totalCash: number;
  totalFedapayPaid: number;
  pendingFedapayCount: number;
}

export interface OrderPaymentStatsOptions {
  status?: OrderStatus;
  from?: string;
  to?: string;
}

export async function getOrderPaymentStats(
  options: OrderPaymentStatsOptions = {}
): Promise<OrderPaymentStats> {
  const db = await getDb();
  const { status, from, to } = options;

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
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `npx vitest run lib/orders.test.ts`
Expected: PASS

- [ ] **Step 5: Modifier `app/admin/page.tsx`**

Ajouter les imports :

```ts
import {
  listOrders,
  getOrderPaymentStats,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE_CLASS,
  type OrderStatus,
} from "@/lib/orders";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE_CLASS,
  type PaymentStatus,
} from "@/lib/order-status";
import { formatFCFA } from "@/lib/format";
```

Ajouter la liste des filtres paiement à côté de `STATUS_FILTERS` :

```ts
const PAYMENT_STATUS_FILTERS: Array<{ slug: PaymentStatus | "tous"; label: string }> = [
  { slug: "tous", label: "Tous" },
  { slug: "en_attente", label: PAYMENT_STATUS_LABELS.en_attente },
  { slug: "paye", label: PAYMENT_STATUS_LABELS.paye },
  { slug: "echoue", label: PAYMENT_STATUS_LABELS.echoue },
];
```

Modifier `buildUrl` pour propager le nouveau paramètre :

```ts
function buildUrl(params: { statut?: string; paiement?: string; q?: string; page?: number }): string {
  const search = new URLSearchParams();
  if (params.statut && params.statut !== "toutes") search.set("statut", params.statut);
  if (params.paiement && params.paiement !== "tous") search.set("paiement", params.paiement);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/admin?${qs}` : "/admin";
}
```

Modifier la signature de `AdminDashboardPage` et le corps pour lire `paiement` :

```ts
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; paiement?: string; q?: string; page?: string }>;
}) {
  const { statut, paiement, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const status = statut && statut !== "toutes" ? (statut as OrderStatus) : undefined;
  const paymentStatus = paiement && paiement !== "tous" ? (paiement as PaymentStatus) : undefined;

  const { orders, total } = await listOrders({
    status,
    paymentStatus,
    query: q,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const stats = await getOrderPaymentStats({ status });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
```

Ajouter le bandeau de stats juste après la balise `<h1>` (avant `<nav aria-label="Filtrer par statut">`) :

```tsx
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-box border border-base-300 p-4">
          <p className="text-xs text-base-content/60 mb-1">Encaissé (livraison/cash)</p>
          <p className="font-bold text-xl">{formatFCFA(stats.totalCash)}</p>
        </div>
        <div className="rounded-box border border-base-300 p-4">
          <p className="text-xs text-base-content/60 mb-1">Encaissé (FedaPay)</p>
          <p className="font-bold text-xl">{formatFCFA(stats.totalFedapayPaid)}</p>
        </div>
        <div className="rounded-box border border-base-300 p-4">
          <p className="text-xs text-base-content/60 mb-1">Paiements FedaPay en attente</p>
          <p className="font-bold text-xl">{stats.pendingFedapayCount}</p>
        </div>
      </div>
```

Ajouter le filtre paiement juste après le `<nav>` de filtre statut :

```tsx
      <nav aria-label="Filtrer par statut de paiement" className="flex flex-wrap gap-2 mb-4">
        {PAYMENT_STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.slug}
            href={buildUrl({ statut, paiement: filter.slug, q })}
            className={`btn btn-sm rounded-field px-4 whitespace-nowrap ${
              (paiement ?? "tous") === filter.slug ? "btn-secondary" : "btn-outline"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
```

Dans le `<thead>` du tableau, ajouter une colonne après `<th>Statut</th>` :

```tsx
                  <th>Paiement</th>
```

Dans le `<tbody>`, ajouter la cellule correspondante après la cellule de statut :

```tsx
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-base-content/60">
                          {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                        </span>
                        <span
                          className={`badge badge-sm ${PAYMENT_STATUS_BADGE_CLASS[order.paymentStatus]} whitespace-nowrap`}
                        >
                          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </span>
                      </div>
                    </td>
```

Dans le formulaire d'export CSV et le formulaire de recherche, ajouter `{paiement && <input type="hidden" name="paiement" value={paiement} />}` là où `{statut && <input type="hidden" name="statut" value={statut} />}` existe déjà (deux occurrences), pour que le filtre paiement soit préservé au changement de page/recherche/export.

- [ ] **Step 6: Vérifier manuellement**

Run: `npm run dev`, ouvrir `/admin`, se connecter, vérifier l'affichage du bandeau de stats et du filtre paiement avec des commandes de test (cash + fedapay créées via l'app).

- [ ] **Step 7: Lancer la suite de tests complète**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add lib/orders.ts lib/orders.test.ts app/admin/page.tsx
git commit -m "feat: bandeau de stats et filtre paiement dans l'admin commandes"
```

---

### Task 10: Admin — bloc paiement sur la page détail + export CSV

**Files:**
- Modify: `app/admin/commandes/[id]/page.tsx`
- Modify: `app/admin/commandes/export/route.ts`

**Interfaces:**
- Consumes: `PAYMENT_METHOD_LABELS`, `PAYMENT_STATUS_LABELS`, `PAYMENT_STATUS_BADGE_CLASS` de `@/lib/order-status` (Task 1) ; `order.paymentMethod`, `order.paymentStatus`, `order.fedapayTransactionId` (Task 3)

- [ ] **Step 1: Modifier `app/admin/commandes/[id]/page.tsx`**

Ajouter l'import :

```ts
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE_CLASS,
} from "@/lib/order-status";
```

Ajouter un bloc "Paiement" après le `<div className="grid sm:grid-cols-2 gap-6 mb-8">` existant (Client/Livraison) et avant le bloc "Produits" :

```tsx
      <div className="rounded-box border border-base-300 p-6 mb-8">
        <h2 className="font-semibold mb-2">Paiement</h2>
        <div className="flex items-center gap-3">
          <span>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
          <span className={`badge ${PAYMENT_STATUS_BADGE_CLASS[order.paymentStatus]}`}>
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </span>
        </div>
        {order.fedapayTransactionId && (
          <p className="text-xs text-base-content/60 mt-2">
            Référence FedaPay : {order.fedapayTransactionId}
          </p>
        )}
        {order.paymentMethod === "fedapay" && (
          <p className="text-xs text-base-content/50 mt-2">
            Le statut de paiement est mis à jour automatiquement par FedaPay
            (webhook) et ne peut pas être modifié manuellement ici.
          </p>
        )}
      </div>
```

- [ ] **Step 2: Modifier `app/admin/commandes/export/route.ts`**

Ajouter l'import :

```ts
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-status";
```

Ajouter les colonnes à `header` (après `"Statut"`) :

```ts
    "Statut",
    "Mode de paiement",
    "Statut paiement",
  ]);
```

Ajouter les valeurs correspondantes à `rows` (après `ORDER_STATUS_LABELS[order.status]`) :

```ts
        ORDER_STATUS_LABELS[order.status],
        PAYMENT_METHOD_LABELS[order.paymentMethod],
        PAYMENT_STATUS_LABELS[order.paymentStatus],
      ])
```

- [ ] **Step 3: Vérifier manuellement**

Run: `npm run dev`, ouvrir le détail d'une commande FedaPay et cash, vérifier l'affichage du bloc paiement ; télécharger l'export CSV et vérifier les nouvelles colonnes.

- [ ] **Step 4: Lancer la suite de tests complète**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/admin/commandes/
git commit -m "feat: bloc paiement en détail commande admin + colonnes export CSV"
```

---

## Self-Review Notes

- **Couverture spec** : modèle de données (Task 2-3), flux commande + widget (Task 6-7), webhook + sécurité (Task 4-5), config env (Task 8), admin stats/filtre/détail/export (Task 9-10) — toutes les sections de la spec sont couvertes.
- **Hors périmètre respecté** : aucune tâche n'ajoute de remboursement, de retry admin manuel, ni de notification SMS — conforme à la spec.
- **Cohérence des types** : `PaymentMethod`/`PaymentStatus` définis une fois (Task 1), réutilisés à l'identique dans `lib/orders.ts`, le webhook, et l'admin — aucune redéfinition divergente.
- **Diffs exacts** : toutes les tâches, y compris Task 7 (page de confirmation), citent le contenu actuel des fichiers modifiés et l'edit exact à appliquer — vérifié par lecture directe des fichiers pendant la planification.
