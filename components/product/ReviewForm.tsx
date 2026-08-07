"use client";

import { useActionState, useState } from "react";
import { submitReviewAction, type ReviewFormState } from "@/app/produits/actions";

const initialState: ReviewFormState = { status: "idle" };

export default function ReviewForm({ productSlug }: { productSlug: string }) {
  const [state, formAction, pending] = useActionState(submitReviewAction, initialState);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  if (state.status === "success") {
    return (
      <p className="text-sm text-primary bg-primary/10 rounded-field px-4 py-3">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-md">
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="rating" value={rating} />

      {/* Honeypot : invisible pour un humain, souvent rempli par les robots de spam. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">Votre note</span>
        <div className="flex items-center gap-1 text-xl text-secondary">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="btn btn-ghost btn-xs btn-circle"
            >
              <i className={`${star <= (hoverRating || rating) ? "fa-solid" : "fa-regular"} fa-star`} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="authorName" className="font-medium text-sm">
          Votre nom
        </label>
        <input
          id="authorName"
          name="authorName"
          required
          className="input border border-base-300 w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="comment" className="font-medium text-sm">
          Votre avis
        </label>
        <textarea
          id="comment"
          name="comment"
          required
          rows={3}
          className="textarea border border-base-300 w-full"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-accent text-sm">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary self-start">
        {pending ? "Envoi..." : "Envoyer mon avis"}
      </button>
    </form>
  );
}
