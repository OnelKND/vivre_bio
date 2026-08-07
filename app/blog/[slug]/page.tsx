import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/articles";
import ProductImage from "@/components/product/ProductImage";

// Les articles vivent en base et peuvent changer à tout moment depuis l'admin.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article || article.status !== "publie") return {};

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.coverImage }],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  // Un brouillon n'est jamais accessible publiquement, même en devinant son URL.
  if (!article || article.status !== "publie") notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage,
    datePublished: article.publishedAt,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <nav aria-label="Fil d'Ariane" className="text-sm text-base-content/60 mb-6">
        <Link href="/blog" className="hover:text-primary">
          Blog
        </Link>
        {" / "}
        <span>{article.title}</span>
      </nav>

      <h1 className="font-bold text-3xl mb-3">{article.title}</h1>
      {article.publishedAt && (
        <p className="text-sm text-base-content/60 mb-8">
          {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      <div className="rounded-box shadow-lg ring-1 ring-base-300 mb-8">
        <ProductImage src={article.coverImage} alt={article.title} priority sizes="(min-width: 768px) 60vw, 90vw" />
      </div>

      <div
        className="article-content"
        // Contenu assaini côté serveur avant stockage (sanitize-html, voir
        // app/admin/articles/actions.ts) — aucun HTML brut non filtré n'atteint jamais ce rendu.
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
