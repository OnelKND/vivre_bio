"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactFormState } from "./actions";

const initialState: ContactFormState = { status: "idle" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Honeypot anti-spam : invisible et ignoré par les humains, souvent
          rempli automatiquement par les robots. Voir app/contact/actions.ts. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Site web</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="font-medium text-sm">
          Nom
        </label>
        <input
          id="name"
          name="name"
          required
          className="input border border-base-300 w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="font-medium text-sm">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input border border-base-300 w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="font-medium text-sm">
          Téléphone (optionnel)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="input border border-base-300 w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="font-medium text-sm">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="textarea border border-base-300 w-full"
        />
      </div>

      {state.status !== "idle" && (
        <p
          role="status"
          className={`text-sm ${
            state.status === "success" ? "text-primary" : "text-accent"
          }`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary self-start"
      >
        {pending ? "Envoi..." : "Envoyer le message"}
      </button>
    </form>
  );
}
