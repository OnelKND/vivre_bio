import Link from "next/link";
import { getAllCategories } from "@/lib/categories";

const SOCIAL_LINKS = [
  { label: "Facebook", icon: "fa-brands fa-facebook", href: "#" },
  { label: "Instagram", icon: "fa-brands fa-instagram", href: "#" },
  { label: "TikTok", icon: "fa-brands fa-tiktok", href: "#" },
  { label: "WhatsApp", icon: "fa-brands fa-whatsapp", href: "#" },
];

export default function Footer() {
  const categories = getAllCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral text-neutral-content">
      <div className="h-1 bg-linear-to-r from-primary to-accent" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="md:col-span-1">
          <span className="font-sans font-bold text-2xl text-white">
            VIVRE <span className="text-secondary">BIO</span>
          </span>
          <p className="font-accent text-3xl text-secondary mt-2">
            Le meilleur de la nature pour vous
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Navigation</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-secondary">Accueil</Link></li>
            <li><Link href="/catalogue" className="hover:text-secondary">Catalogue</Link></li>
            <li><Link href="/a-propos" className="hover:text-secondary">À propos</Link></li>
            <li><Link href="/contact" className="hover:text-secondary">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Nos produits</h2>
          <ul className="space-y-2 text-sm">
            {categories.slice(0, 5).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/catalogue?categorie=${category.slug}`}
                  className="hover:text-secondary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/catalogue" className="hover:text-secondary font-medium">
                Voir tout le catalogue
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Contact</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-location-dot w-4" aria-hidden="true" />
              Porto-Novo, Bénin
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-phone w-4" aria-hidden="true" />
              +229 00 00 00 00
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-envelope w-4" aria-hidden="true" />
              contact@vivrebio.bj
            </li>
          </ul>
          <div className="flex items-center gap-3 mt-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="btn btn-circle btn-sm bg-white/10 border-none text-white transition-transform hover:bg-secondary hover:text-neutral hover:scale-110"
              >
                <i className={social.icon} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-content/70">
          <p>© {year} VIVRE BIO — Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/mentions-legales" className="hover:text-secondary">
              Mentions légales
            </Link>
            <Link href="/conditions-generales-vente" className="hover:text-secondary">
              CGV
            </Link>
          </div>
        </div>
      </div>

      {/* Piège invisible : aucun visiteur (humain ou lecteur d'écran) ne
          peut atteindre ce lien, seul un robot qui parse le HTML brut le
          trouvera. Voir app/admin/legacy. */}
      <a
        href="/admin/legacy"
        aria-hidden="true"
        tabIndex={-1}
        rel="nofollow"
        className="absolute h-px w-px overflow-hidden opacity-0"
      >
        Administration
      </a>
    </footer>
  );
}
