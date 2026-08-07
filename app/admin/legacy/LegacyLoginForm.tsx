"use client";

import { useActionState } from "react";
import { attemptLegacyLogin, type LegacyLoginState } from "./actions";

const initialState: LegacyLoginState = { status: "idle" };

export default function LegacyLoginForm() {
  const [state, formAction, pending] = useActionState(attemptLegacyLogin, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor="identifiant" className="font-medium text-sm">
          Identifiant
        </label>
        <input
          id="identifiant"
          name="identifiant"
          type="text"
          required
          autoFocus
          className="input border border-base-300 w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="font-medium text-sm">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="input border border-base-300 w-full"
        />
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-accent text-sm">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
