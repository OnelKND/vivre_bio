import Link from "next/link";
import { getAllCategories } from "@/lib/categories";
import NewsletterForm from "./NewsletterForm";

const SOCIAL_LINKS = [
  { label: "Facebook", icon: "fa-brands fa-facebook", href: "https://www.facebook.com/share/1BFH2G1FmX/?mibextid=wwXIfr" },
  { label: "Instagram", icon: "fa-brands fa-instagram", href: "https://www.instagram.com/vivre27854?igsh=bDVsb3E3bmRyYnh6" },
  { label: "TikTok", icon: "fa-brands fa-tiktok", href: "https://www.tiktok.com/@vivre_bio?_r=1&_t=ZS-98ojS1BsxS1" },
  { label: "WhatsApp", icon: "fa-brands fa-whatsapp", href: "https://wa.me/22991043434" },
];

export default function Footer() {
  const categories = getAllCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral text-neutral-content">
      <div
        className="h-0 border-t-2 border-dashed border-label/60"
        aria-hidden="true"
      />
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-white">Nos offres et nouveautés</h2>
            <p className="text-sm text-neutral-content/70">
              Inscrivez-vous pour être informé·e des nouveaux produits et promotions.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="md:col-span-1">
          <img src="/logo2.png" alt="VIVRE BIO" className="h-45 w-45 object-contain mb-2" />
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
              +229 01 67 24 24 07
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
          <p>© {year} Tous droits réservés.</p>
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
