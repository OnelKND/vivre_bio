"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
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
      <h1 className="font-bold text-2xl">Une erreur est survenue</h1>
      <p className="text-base-content/70">
        Quelque chose s&apos;est mal passé de notre côté. Réessayez, ou
        revenez à l&apos;accueil.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={() => unstable_retry()} className="btn btn-primary">
          Réessayer
        </button>
        <Link href="/" className="btn btn-outline btn-primary">
          Accueil
        </Link>
      </div>
    </div>
  );
}
