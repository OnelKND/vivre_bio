import Link from "next/link";


export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="VIVRE BIO — Retour à l'accueil"
      className={`inline-flex items-center gap-2.5 py-2 ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
        <i className="fa-solid fa-leaf text-sm text-primary-content" aria-hidden="true" />
      </span>
      <span className="font-sans font-bold text-2xl leading-none tracking-tight text-primary">
        VIVRE <span className="text-accent">BIO</span>
      </span>
    </Link>
  );
}
