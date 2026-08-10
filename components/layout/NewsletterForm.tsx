"use client";

import { useActionState } from "react";
import { subscribeToNewsletter, type NewsletterFormState } from "@/app/newsletter/actions";

const initialState: NewsletterFormState = { status: "idle" };

export default function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 max-w-sm">
      {/* Honeypot anti-spam, invisible pour les humains. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="newsletter-website">Site web</label>
        <input id="newsletter-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="Votre email"
          aria-label="Votre email"
          className="input input-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 w-full"
        />
        <button type="submit" disabled={pending} className="btn btn-secondary btn-sm shrink-0">
          {pending ? "..." : "S'inscrire"}
        </button>
      </div>
      {state.status !== "idle" && (
        <p
          role="status"
          className={`text-xs ${state.status === "error" ? "text-accent" : "text-secondary"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
