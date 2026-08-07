export type CategorySlug =
  | "huiles-essentielles"
  | "huiles-vegetales"
  | "poudres"
  | "graines"
  | "infusions"
  | "cosmetiques-reparateurs"
  | "produits-de-la-ruche"
  | "alimentation-bio"
  | "autres-produits-bio";

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
    slug: "huiles-vegetales",
    name: "Huiles végétales",
    description:
      "Huiles de première pression, riches en nutriments, pour la peau, les cheveux et la cuisine.",
  },
  {
    slug: "poudres",
    name: "Poudres",
    description:
      "Plantes séchées et broyées, prêtes à l'emploi pour vos préparations et soins.",
  },
  {
    slug: "graines",
    name: "Graines",
    description: "Graines locales, brutes ou torréfiées, pour la cuisine et le bien-être.",
  },
  {
    slug: "infusions",
    name: "Infusions",
    description:
      "Mélanges de plantes séchées à infuser, pour le plaisir et les bienfaits au quotidien.",
  },
  {
    slug: "cosmetiques-reparateurs",
    name: "Cosmétiques réparateurs",
    description: "Soins naturels formulés pour réparer et nourrir la peau en profondeur.",
  },
  {
    slug: "produits-de-la-ruche",
    name: "Produits de la ruche Vivre Bio",
    description: "Miel et dérivés de la ruche, récoltés et conditionnés avec soin.",
  },
  {
    slug: "alimentation-bio",
    name: "Alimentation bio",
    description: "Produits alimentaires sains, naturels et sans additifs pour le quotidien.",
  },
  {
    slug: "autres-produits-bio",
    name: "Autres produits bio",
    description: "Le reste de notre sélection de produits naturels et biologiques.",
  },
];

export function getAllCategories(): Category[] {
  return categories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
