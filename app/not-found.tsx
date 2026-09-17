import type { Metadata } from "next";
import Link from "next/link";
import AmbientGlow from "@/components/ui/AmbientGlow";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="relative overflow-hidden bg-base-100">
      <AmbientGlow variant="light" />
      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-24 sm:py-32 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <i className="fa-solid fa-leaf text-3xl text-primary" aria-hidden="true" />
        </div>
        <p className="font-accent text-5xl text-secondary">404</p>
        <h1 className="font-bold text-3xl">Cette page s&apos;est égarée</h1>
        <p className="text-base-content/70 max-w-md">
          La page que vous cherchez n&apos;existe pas ou a été déplacée. Direction le
          catalogue, ou retour à l&apos;accueil ?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Link href="/" className="btn btn-primary">
            <i className="fa-solid fa-house" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
          <Link href="/catalogue" className="btn btn-outline btn-primary">
            Voir le catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
