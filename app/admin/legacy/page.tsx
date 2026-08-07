import type { Metadata } from "next";
import LegacyLoginForm from "./LegacyLoginForm";

// Piège : jamais indexé, jamais lié visiblement (voir le lien caché dans
// Footer.tsx). Aucune donnée réelle ici — voir app/admin/legacy/actions.ts.
export const metadata: Metadata = {
  title: "Panneau d'administration",
  robots: { index: false, follow: false },
};

export default function LegacyAdminPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-24 flex flex-col items-center gap-6">
      <h1 className="font-bold text-2xl">Panneau d&apos;administration</h1>
      <p className="text-sm text-base-content/60 text-center">Accès réservé.</p>
      <LegacyLoginForm />
    </div>
  );
}
