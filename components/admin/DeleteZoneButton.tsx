"use client";

import { deleteZoneAction } from "@/app/admin/(protected)/zones/actions";

/**
 * Rendu comme bouton de soumission d'un `<form>` existant (via `formAction`)
 * plutôt que son propre `<form>` : les zones sont éditées dans un formulaire
 * par ligne, et HTML interdit les formulaires imbriqués.
 */
export default function DeleteZoneButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      formAction={deleteZoneAction}
      className="btn btn-ghost btn-sm text-accent"
      onClick={(event) => {
        if (!confirm(`Supprimer la zone « ${label} » ? Cette action est définitive.`)) {
          event.preventDefault();
        }
      }}
    >
      Supprimer
    </button>
  );
}
