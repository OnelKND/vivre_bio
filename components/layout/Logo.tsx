import Link from "next/link";


export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="VIVRE BIO — Retour à l'accueil"
      className={`inline-flex items-center gap-2.5 py-2 ${className}`}
    >
      <img src="/logo.png" alt="VIVRE BIO" className="h-[45px] w-[45px] object-contain" />
    </Link>
  );
}
