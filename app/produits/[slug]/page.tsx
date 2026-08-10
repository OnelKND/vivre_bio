import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductsByCategory } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/categories";
import { getApprovedReviews, getReviewStats } from "@/lib/reviews";
import { formatFCFA } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import Badge from "@/components/ui/Badge";
import ProductImage from "@/components/product/ProductImage";
import ProductDetailActions from "@/components/product/ProductDetailActions";
import ProductGrid from "@/components/product/ProductGrid";
import ReviewStars from "@/components/product/ReviewStars";
import ReviewForm from "@/components/product/ReviewForm";
import SectionHeading from "@/components/ui/SectionHeading";

// Le catalogue vit en base (lib/products.ts) et peut recevoir de nouveaux
// produits depuis l'admin sans redéploiement : pas de generateStaticParams,
// rendu à la demande pour chaque slug.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategoryBySlug(product.category);
  const reviews = getApprovedReviews(product.slug);
  const reviewStats = getReviewStats(product.slug);
  const relatedProducts = getProductsByCategory(product.category)
    .filter((related) => related.slug !== product.slug)
    .slice(0, 4);
  // Si l'admin a renseigné le lien de l'article dans le catalogue WhatsApp
  // Business, on y renvoie directement (photos et prix tenus à jour côté
  // WhatsApp) ; sinon on retombe sur une conversation avec message pré-rempli.
  const whatsappHref =
    product.whatsappCatalogUrl ??
    buildWhatsAppLink(
      `Bonjour, je voudrais commander : ${product.name} (${formatFCFA(product.price)})`
    );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    category: category?.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "XOF",
      price: product.price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(reviewStats.count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: reviewStats.average,
        reviewCount: reviewStats.count,
      },
    }),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
      <nav aria-label="Fil d'Ariane" className="text-sm text-base-content/60 mb-6">
        <Link href="/catalogue" className="hover:text-primary">
          Catalogue
        </Link>
        {category && (
          <>
            {" / "}
            <Link
              href={`/catalogue?categorie=${category.slug}`}
              className="hover:text-primary"
            >
              {category.name}
            </Link>
          </>
        )}
        {" / "}
        <span>{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="rounded-box shadow-lg ring-1 ring-base-300">
          <ProductImage
            src={product.image}
            alt={product.name}
            priority
            sizes="(min-width: 768px) 40vw, 90vw"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {category && <Badge variant="outline">{category.name}</Badge>}
            {product.stock <= 0 ? (
              <Badge variant="accent">Épuisé</Badge>
            ) : (
              product.stock <= 5 && (
                <Badge variant="accent">Plus que {product.stock} en stock</Badge>
              )
            )}
          </div>
          <h1 className="font-bold text-3xl">{product.name}</h1>
          {reviewStats.count > 0 && (
            <div className="flex items-center gap-2">
              <ReviewStars rating={reviewStats.average} />
              <span className="text-sm text-base-content/60">
                {reviewStats.average.toFixed(1)} ({reviewStats.count} avis)
              </span>
            </div>
          )}
          <p className="text-2xl font-semibold text-primary">
            {formatFCFA(product.price)}
            <span className="text-sm font-normal text-base-content/50">
              {" "}
              / {product.volumeMl} ml
            </span>
          </p>
          <p className="text-base-content/70">{product.description}</p>
          <ProductDetailActions slug={product.slug} stock={product.stock} />
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline gap-2 self-start"
          >
            <i className="fa-brands fa-whatsapp text-lg" aria-hidden="true" />
            Commander sur WhatsApp
          </a>
          <p className="flex items-center gap-2 text-sm text-base-content/60">
            <i className="fa-solid fa-truck-fast text-primary" aria-hidden="true" />
            Paiement à la livraison uniquement (espèces ou Mobile Money).
          </p>
        </div>
      </div>

      <details className="mt-16 max-w-2xl group">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-xl marker:content-none">
          Avis clients
          {reviewStats.count > 0 && (
            <span className="text-sm font-normal text-base-content/60">
              ({reviewStats.count})
            </span>
          )}
          <i
            className="fa-solid fa-chevron-down text-sm text-base-content/50 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="mt-6">
          {reviews.length === 0 ? (
            <p className="text-base-content/60 mb-8">Aucun avis pour ce produit pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-6 mb-10">
              {reviews.map((review) => (
                <li key={review.id} className="border-b border-base-300 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ReviewStars rating={review.rating} />
                    <span className="font-medium text-sm">{review.authorName}</span>
                  </div>
                  <p className="text-sm text-base-content/70">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
          <ReviewForm productSlug={product.slug} />
        </div>
      </details>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <SectionHeading eyebrow="À découvrir aussi" title="Produits liés" />
          <div className="mt-8">
            <ProductGrid products={relatedProducts} />
          </div>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
