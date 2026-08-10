import Link from "next/link";
import { getAllCategories } from "@/lib/categories";
import { getAllDeliveryZones } from "@/lib/delivery-zones";
import { getAllProducts, getFeaturedProducts, getProductBySlug } from "@/lib/products";
import { getFeaturedReviews, getSiteReviewStats } from "@/lib/reviews";
import AmbientGlow from "@/components/ui/AmbientGlow";
import CtaBand from "@/components/ui/CtaBand";
import ProductGrid from "@/components/product/ProductGrid";
import ProcessSteps from "@/components/ui/ProcessSteps";
import ReassuranceBar from "@/components/ui/ReassuranceBar";
import ReviewStars from "@/components/product/ReviewStars";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import VideoShowcase from "@/components/ui/VideoShowcase";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const categories = getAllCategories();
  const featuredProducts = getFeaturedProducts();
  const reviewStats = getSiteReviewStats();
  const featuredReviews = getFeaturedReviews(3).map((review) => ({
    ...review,
    productName: getProductBySlug(review.productSlug)?.name,
  }));
  const STATS = [
    { value: `${getAllProducts().length}+`, label: "Produits naturels" },
    { value: `${getAllDeliveryZones().length}`, label: "Zones livrées au Bénin" },
    { value: "100%", label: "Artisanal, made in BENIN" },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-base-100">
        <AmbientGlow variant="light" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-center text-center md:items-start md:text-left gap-6">
            <Reveal>
              <h1 className="font-sans font-bold text-4xl sm:text-5xl text-primary max-w-xl">
                VIVRE BIO
              </h1>
            </Reveal>
            <Reveal delay={100}>
              <p className="font-accent text-4xl sm:text-5xl text-secondary">
                Le meilleur de la nature pour vous
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="max-w-xl text-base-content/70">
                Des huiles essentielles et extraits naturels issus de plantes
                aromatiques, transformées au Bénin avec soin — livrés chez
                vous.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link href="/catalogue" className="btn btn-primary btn-lg">
                  Découvrir nos produits
                </Link>
                <Link href="/a-propos" className="btn btn-outline btn-primary btn-lg">
                  Notre histoire
                </Link>
              </div>
            </Reveal>
            <Reveal delay={400} className="w-full">
              <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto md:mx-0 mt-4">
                {STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center md:items-start gap-1">
                    <span className="font-bold text-2xl sm:text-3xl text-primary">
                      {stat.value}
                    </span>
                    <span className="text-xs sm:text-sm text-base-content/60">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <div className="rounded-box shadow-2xl ring-1 ring-base-300">
              <VideoShowcase slot="atelier" caption={false} />
            </div>
          </Reveal>
        </div>
      </section>

      <ReassuranceBar />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <Reveal>
          <SectionHeading
            eyebrow="Nos catégories"
            title="Une gamme complète de produits naturels"
            description="Huiles essentielles, huiles végétales, poudres, graines, infusions et bien plus, pensés pour s'intégrer à votre quotidien."
          />
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {categories.map((category, index) => (
            <Reveal key={category.slug} delay={index * 100}>
              <Link
                href={`/catalogue?categorie=${category.slug}`}
                className="group rounded-box border border-base-300 bg-base-100 p-8 flex flex-col gap-3 hover:border-primary hover:-translate-y-1 hover:shadow-md transition-all"
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
            </Reveal>
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="bg-base-200/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
            <Reveal>
              <SectionHeading
                eyebrow="Sélection"
                title="Nos produits phares"
                description="Les références préférées de nos clients, à découvrir en premier."
              />
            </Reveal>
            <Reveal delay={150}>
              <div className="mt-10">
                <ProductGrid products={featuredProducts} />
              </div>
              <div className="text-center mt-10">
                <Link href="/catalogue" className="btn btn-outline btn-primary">
                  Voir tout le catalogue
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {reviewStats.count > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <Reveal>
            <SectionHeading
              eyebrow="Ils nous font confiance"
              title="Ce que nos clients en disent"
            />
          </Reveal>
          <Reveal delay={100}>
            <div className="flex items-center justify-center gap-3 mt-6">
              <ReviewStars rating={reviewStats.average} size="text-xl" />
              <span className="font-semibold">
                {reviewStats.average.toFixed(1)} / 5
              </span>
              <span className="text-sm text-base-content/60">
                ({reviewStats.count} avis vérifiés)
              </span>
            </div>
          </Reveal>
          {featuredReviews.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {featuredReviews.map((review, index) => (
                <Reveal key={review.id} delay={150 + index * 100}>
                  <div className="h-full rounded-box border border-base-300 bg-base-100 p-6 flex flex-col gap-3">
                    <ReviewStars rating={review.rating} />
                    <p className="text-base-content/80 text-sm">
                      « {review.comment} »
                    </p>
                    <p className="text-xs text-base-content/50 mt-auto">
                      {review.authorName}
                      {review.productName && ` — ${review.productName}`}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <Reveal>
          <SectionHeading
            eyebrow="Notre procédé"
            title="Du champ au flacon"
            description="Une transformation artisanale en trois étapes, pensée pour préserver le meilleur de chaque plante."
          />
        </Reveal>
        <div className="mt-10">
          <ProcessSteps />
        </div>
        <div className="text-center mt-10">
          <Link href="/a-propos" className="link link-primary font-medium">
            Découvrir notre histoire
          </Link>
        </div>
      </section>

      <CtaBand
        title="Envie de découvrir nos produits ?"
        description="Livraison partout au Bénin, paiement à la réception."
        href="/catalogue"
        label="Voir le catalogue"
      />
    </>
  );
}
