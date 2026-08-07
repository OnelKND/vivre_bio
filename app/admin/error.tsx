"use client";

import { useEffect } from "react";

export default function AdminErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-24 text-center flex flex-col items-center gap-4">
      <h1 className="font-bold text-2xl">Erreur dans l&apos;espace admin</h1>
      <p className="text-base-content/70">
        Une erreur inattendue est survenue en chargeant cette page.
      </p>
      <button type="button" onClick={() => unstable_retry()} className="btn btn-primary">
        Réessayer
      </button>
    </div>
  );
}
