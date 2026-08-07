"use client";

import { deleteArticleAction } from "@/app/admin/articles/actions";

export default function DeleteArticleButton({ id, title }: { id: number; title: string }) {
  return (
    <form
      action={deleteArticleAction}
      onSubmit={(event) => {
        if (!confirm(`Supprimer « ${title} » ? Cette action est définitive.`)) {
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
