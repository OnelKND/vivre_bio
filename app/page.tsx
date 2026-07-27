import Link from "next/link";
import { getAllCategories } from "@/lib/categories";
import { getFeaturedProducts } from "@/lib/products";
import ProductGrid from "@/components/product/ProductGrid";
import ReassuranceBar from "@/components/ui/ReassuranceBar";
import SectionHeading from "@/components/ui/SectionHeading";

const PROCESS_STEPS = [
  {
    icon: "fa-solid fa-seedling",
    title: "Récolte",
    description:
      "Les plantes aromatiques sont récoltées à maturité auprès de producteurs locaux.",
  },
  {
    icon: "fa-solid fa-flask",
    title: "Distillation",
    description:
      "Chaque lot est distillé ou macéré avec soin pour préserver ses principes actifs.",
  },
  {
    icon: "fa-solid fa-vial",
    title: "Conditionnement",
    description:
      "Les huiles et extraits sont conditionnés en flacon, prêts à être livrés chez vous.",
  },
];

export default function HomePage() {
  const categories = getAllCategories();
  const featuredProducts = getFeaturedProducts();

  return (
    <>
      <section className="bg-base-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center gap-6">
          <h1 className="font-sans font-bold text-4xl sm:text-5xl text-primary max-w-3xl">
            VIVRE BIO
          </h1>
          <p className="font-accent text-3xl sm:text-4xl text-secondary">
            Le meilleur de la nature pour vous
          </p>
          <p className="max-w-xl text-base-content/70">
            Des huiles essentielles et extraits naturels issus de plantes
            aromatiques, transformées à Cotonou avec soin — livrés chez vous,
            payables à la réception.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/catalogue" className="btn btn-primary">
              Découvrir nos produits
            </Link>
            <Link href="/a-propos" className="btn btn-outline btn-primary">
              Notre histoire
            </Link>
          </div>
        </div>
      </section>

      <ReassuranceBar />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <SectionHeading
          eyebrow="Nos catégories"
          title="Deux gammes, une exigence"
          description="Explorez nos huiles essentielles et nos extraits naturels, pensés pour s'intégrer à votre quotidien."
        />
        <div className="grid sm:grid-cols-2 gap-6 mt-10">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/catalogue?categorie=${category.slug}`}
              className="group rounded-box border border-base-300 bg-base-100 p-8 flex flex-col gap-3 hover:border-primary transition-colors"
            >
              <h3 className="font-bold text-2xl text-primary group-hover:underline">
                {category.name}
              </h3>
              <p className="text-base-content/70">{category.description}</p>
              <span className="text-sm font-medium text-primary mt-2 inline-flex items-center gap-1">
                Voir les produits
                <i className="fa-solid fa-arrow-right text-xs" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="bg-base-200/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <SectionHeading
              eyebrow="Sélection"
              title="Nos produits phares"
              description="Les références préférées de nos clients, à découvrir en premier."
            />
            <div className="mt-10">
              <ProductGrid products={featuredProducts} />
            </div>
            <div className="text-center mt-10">
              <Link href="/catalogue" className="btn btn-outline btn-primary">
                Voir tout le catalogue
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <SectionHeading
          eyebrow="Notre procédé"
          title="Du champ au flacon"
          description="Une transformation artisanale en trois étapes, pensée pour préserver le meilleur de chaque plante."
        />
        <div className="grid sm:grid-cols-3 gap-8 mt-10">
          {PROCESS_STEPS.map((step, index) => (
            <div key={step.title} className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <i className={`${step.icon} text-2xl text-primary`} aria-hidden="true" />
              </div>
              <h3 className="font-semibold">
                {index + 1}. {step.title}
              </h3>
              <p className="text-sm text-base-content/70">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
