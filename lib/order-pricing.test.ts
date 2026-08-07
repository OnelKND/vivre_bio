import { describe, expect, it, vi } from "vitest";

// lib/products.ts est maintenant branché sur SQLite (import "server-only"),
// donc on le mocke avec un catalogue fixe plutôt que de dépendre de la vraie
// base — un test de logique de calcul pur n'a pas besoin de toucher la DB.
const FIXTURE_PRODUCTS = [
  { slug: "produit-a", name: "Produit A", price: 3000 },
  { slug: "produit-b", name: "Produit B", price: 5000 },
];

vi.mock("./products", () => ({
  getProductBySlug: (slug: string) =>
    FIXTURE_PRODUCTS.find((product) => product.slug === slug),
}));

const { computeOrderItems, computeTotals } = await import("./order-pricing");

describe("order-pricing", () => {
  const [productA, productB] = FIXTURE_PRODUCTS;

  it("recomputes items from the catalogue, never trusting client-sent prices", () => {
    const items = computeOrderItems([{ slug: productA.slug, quantity: 2 }]);
    expect(items).toEqual([
      {
        slug: productA.slug,
        name: productA.name,
        unitPrice: productA.price,
        quantity: 2,
      },
    ]);
  });

  it("drops unknown or removed product slugs instead of trusting them", () => {
    const items = computeOrderItems([
      { slug: productA.slug, quantity: 1 },
      { slug: "produit-qui-n-existe-plus", quantity: 5 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]?.slug).toBe(productA.slug);
  });

  it("computes subtotal and total including the delivery fee", () => {
    const items = computeOrderItems([
      { slug: productA.slug, quantity: 2 },
      { slug: productB.slug, quantity: 1 },
    ]);
    const expectedSubtotal = productA.price * 2 + productB.price;
    const { subtotal, total } = computeTotals(items, 1500);
    expect(subtotal).toBe(expectedSubtotal);
    expect(total).toBe(expectedSubtotal + 1500);
  });

  it("returns a zero subtotal for an empty cart, keeping the delivery fee", () => {
    const { subtotal, total } = computeTotals([], 1000);
    expect(subtotal).toBe(0);
    expect(total).toBe(1000);
  });
});
