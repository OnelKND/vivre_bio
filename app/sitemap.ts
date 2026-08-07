import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { getPublishedArticles } from "@/lib/articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Le catalogue et le blog vivent en base et peuvent changer à tout moment depuis l'admin.
export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "",
  "/catalogue",
  "/blog",
  "/a-propos",
  "/suivi-commande",
  "/contact",
  "/mentions-legales",
  "/conditions-generales-vente",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = getAllProducts().map(
    (product) => ({
      url: `${SITE_URL}/produits/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  const articleEntries: MetadataRoute.Sitemap = getPublishedArticles().map(
    (article) => ({
      url: `${SITE_URL}/blog/${article.slug}`,
      lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
      changeFrequency: "monthly",
      priority: 0.5,
    })
  );

  return [...staticEntries, ...productEntries, ...articleEntries];
}
