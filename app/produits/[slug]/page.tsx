import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/categories";
import { formatFCFA } from "@/lib/format";
import ProductImage from "@/components/product/ProductImage";
import ProductDetailActions from "@/components/product/ProductDetailActions";

export function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }));
}

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
      availability: "https://schema.org/InStock",
    },
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
        <ProductImage
          src={product.image}
          alt={product.name}
          priority
          sizes="(min-width: 768px) 40vw, 90vw"
        />

        <div className="flex flex-col gap-4">
          <h1 className="font-bold text-3xl">{product.name}</h1>
          <p className="text-2xl font-semibold text-primary">
            {formatFCFA(product.price)}
            <span className="text-sm font-normal text-base-content/50">
              {" "}
              / {product.volumeMl} ml
            </span>
          </p>
          <p className="text-base-content/70">{product.description}</p>
          <ProductDetailActions slug={product.slug} />
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
