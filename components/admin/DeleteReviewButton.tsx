"use client";

import { deleteReviewAction } from "@/app/admin/avis/actions";

export default function DeleteReviewButton({ id }: { id: number }) {
  return (
    <form
      action={deleteReviewAction}
      onSubmit={(event) => {
        if (!confirm("Supprimer cet avis ? Cette action est définitive.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn btn-ghost btn-sm text-accent">
        Supprimer
      </button>
    </form>
  );
}
