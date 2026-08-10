import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import ProductImage from "@/components/product/ProductImage";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

// Les articles vivent en base et peuvent changer à tout moment depuis l'admin.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Conseils, actualités et coulisses de VIVRE BIO autour des plantes et du naturel.",
};

export default async function BlogPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <SectionHeading
        as="h1"
        eyebrow="Blog"
        title="Nos articles"
        description="Conseils, actualités et coulisses de notre atelier de transformation."
      />

      {articles.length === 0 ? (
        <p className="text-base-content/60 mt-10">Aucun article publié pour le moment.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {articles.map((article, index) => (
            <Reveal key={article.slug} delay={index * 80}>
              <article className="group flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1">
                <Link href={`/blog/${article.slug}`} className="block">
                  <ProductImage src={article.coverImage} alt={article.title} />
                </Link>
                <div className="flex flex-col gap-1">
                  {article.publishedAt && (
                    <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
                      {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                  <Link
                    href={`/blog/${article.slug}`}
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    {article.title}
                  </Link>
                  <p className="text-sm text-base-content/60 line-clamp-2">{article.excerpt}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
