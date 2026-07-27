"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "./actions";

const initialState: AdminLoginState = { status: "idle" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="font-medium text-sm">
          Mot de passe administrateur
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="input input-bordered w-full"
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
