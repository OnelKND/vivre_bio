import Link from "next/link";

/**
 * Wordmark de secours en attendant le fichier logo officiel de VIVRE BIO.
 * Quand le logo sera fourni : le remplacer par un <Image> respectant la
 * taille minimale (90px) et la zone de protection imposées par la charte —
 * ne jamais le déformer, pivoter, recolorer ou lui ajouter un effet.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="VIVRE BIO — Retour à l'accueil"
      className={`inline-flex items-center gap-2 py-2 ${className}`}
    >
      <span className="font-sans font-bold text-2xl leading-none tracking-tight text-primary">
        VIVRE <span className="text-accent">BIO</span>
      </span>
    </Link>
  );
}
