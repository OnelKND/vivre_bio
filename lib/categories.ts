export type CategorySlug = "huiles-essentielles" | "extraits-naturels";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
}

export const categories: Category[] = [
  {
    slug: "huiles-essentielles",
    name: "Huiles essentielles",
    description:
      "Extraites par distillation de plantes aromatiques cultivées localement, pour le bien-être au quotidien.",
  },
  {
    slug: "extraits-naturels",
    name: "Extraits naturels",
    description:
      "Concentrés de plantes obtenus par macération, pour la cuisine, les soins et le bien-être.",
  },
];

export function getAllCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
