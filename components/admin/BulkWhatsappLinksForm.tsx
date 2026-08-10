"use client";

import { useActionState } from "react";
import type { Product } from "@/lib/products";
import {
  bulkUpdateWhatsappLinksAction,
  type BulkWhatsappLinksState,
} from "@/app/admin/produits/actions";

const initialState: BulkWhatsappLinksState = { status: "idle" };

export default function BulkWhatsappLinksForm({ products }: { products: Product[] }) {
  const [state, formAction, pending] = useActionState(
    bulkUpdateWhatsappLinksAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Lien catalogue WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td className="whitespace-nowrap">{product.name}</td>
                <td>
                  <input
                    type="url"
                    name={`link-${product.id}`}
                    defaultValue={product.whatsappCatalogUrl ?? ""}
                    placeholder="https://wa.me/c/..."
                    className="input input-sm border border-base-300 w-full min-w-72"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.status !== "idle" && (
        <p
          role="alert"
          className={`text-sm ${state.status === "error" ? "text-accent" : "text-primary"}`}
        >
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary self-start">
        {pending ? "Enregistrement..." : "Enregistrer tous les liens"}
      </button>
    </form>
  );
}
