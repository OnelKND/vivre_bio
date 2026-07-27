import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion administrateur",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-24 flex flex-col items-center gap-6">
      <h1 className="font-bold text-2xl">Espace VIVRE BIO</h1>
      <p className="text-sm text-base-content/60 text-center">
        Réservé à l&apos;équipe VIVRE BIO pour la gestion des commandes.
      </p>
      <LoginForm />
    </div>
  );
}
