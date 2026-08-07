"use client";

import { deleteProductAction } from "@/app/admin/produits/actions";

export default function DeleteProductButton({
  id,
  name,
  q,
}: {
  id: number;
  name: string;
  q?: string;
}) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(event) => {
        if (!confirm(`Supprimer « ${name} » ? Cette action est définitive.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      {q && <input type="hidden" name="q" value={q} />}
      <button type="submit" className="btn btn-ghost btn-sm text-accent">
        Supprimer
      </button>
    </form>
  );
}
