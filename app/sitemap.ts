import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  "",
  "/catalogue",
  "/a-propos",
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

  return [...staticEntries, ...productEntries];
}
