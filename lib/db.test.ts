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
