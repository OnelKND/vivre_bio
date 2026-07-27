import type { CategorySlug } from "./categories";

export interface Product {
  slug: string;
  name: string;
  category: CategorySlug;
  shortDescription: string;
  description: string;
  /** Price in FCFA (XOF) for the reference volume below. */
  price: number;
  volumeMl: number;
  image: string;
  featured?: boolean;
}

/**
 * Catalogue de démonstration — à remplacer par les données réelles fournies
 * par VIVRE BIO (nom, description, prix, catégorie, photo). La structure des
 * fonctions ci-dessous (getAllProducts, getProductBySlug, ...) ne changera
 * pas quand les vraies données seront intégrées.
 */
export const products: Product[] = [
  {
    slug: "huile-essentielle-citronnelle",
    name: "Huile essentielle de Citronnelle",
    category: "huiles-essentielles",
    shortDescription:
      "Note fraîche et citronnée, idéale en diffusion pour purifier l'air.",
    description:
      "Distillée à la vapeur à partir de feuilles de citronnelle cultivées sans pesticides, cette huile essentielle dégage une note fraîche et citronnée. En diffusion, elle purifie l'air et éloigne les moustiques ; diluée dans une huile végétale, elle apaise les tensions musculaires.",
    price: 3500,
    volumeMl: 15,
    image: "/products/huile-essentielle-citronnelle.svg",
    featured: true,
  },
  {
    slug: "huile-essentielle-eucalyptus",
    name: "Huile essentielle d'Eucalyptus",
    category: "huiles-essentielles",
    shortDescription: "Fraîcheur intense, parfaite pour dégager les voies respiratoires.",
    description:
      "Obtenue par distillation des feuilles d'eucalyptus, cette huile essentielle est reconnue pour sa fraîcheur intense. Utilisée en inhalation ou en diffusion, elle aide à dégager les voies respiratoires, notamment pendant la saison sèche.",
    price: 4000,
    volumeMl: 15,
    image: "/products/huile-essentielle-eucalyptus.svg",
    featured: true,
  },
  {
    slug: "huile-essentielle-menthe-poivree",
    name: "Huile essentielle de Menthe poivrée",
    category: "huiles-essentielles",
    shortDescription: "Effet coup de fraîcheur, tonifiant et rafraîchissant.",
    description:
      "Cette huile essentielle de menthe poivrée, au parfum vif et mentholé, procure une sensation de fraîcheur immédiate. Quelques gouttes diluées sur les tempes ou en diffusion aident à retrouver énergie et clarté d'esprit.",
    price: 4500,
    volumeMl: 15,
    image: "/products/huile-essentielle-menthe-poivree.svg",
  },
  {
    slug: "huile-essentielle-vetiver",
    name: "Huile essentielle de Vétiver",
    category: "huiles-essentielles",
    shortDescription: "Senteur boisée et terreuse, apaisante et enracinante.",
    description:
      "Extraite des racines de vétiver, cette huile essentielle au parfum boisé et terreux est traditionnellement utilisée pour apaiser l'esprit et favoriser un sommeil réparateur. Son sillage profond en fait aussi une base de choix en parfumerie naturelle.",
    price: 6500,
    volumeMl: 15,
    image: "/products/huile-essentielle-vetiver.svg",
  },
  {
    slug: "huile-essentielle-girofle",
    name: "Huile essentielle de Girofle",
    category: "huiles-essentielles",
    shortDescription: "Note chaude et épicée, aux vertus purifiantes reconnues.",
    description:
      "Distillée à partir des clous de girofle, cette huile essentielle épicée et chaleureuse est traditionnellement utilisée pour ses vertus purifiantes. Elle s'utilise fortement diluée, en diffusion ou en application locale.",
    price: 5000,
    volumeMl: 15,
    image: "/products/huile-essentielle-girofle.svg",
  },
  {
    slug: "extrait-naturel-moringa",
    name: "Extrait naturel de Moringa",
    category: "extraits-naturels",
    shortDescription: "Concentré végétal riche, issu des feuilles de moringa.",
    description:
      "Le moringa, surnommé « l'arbre de vie », est réputé pour sa richesse en nutriments. Cet extrait naturel, obtenu par macération des feuilles séchées, s'intègre facilement à une routine bien-être quotidienne.",
    price: 4000,
    volumeMl: 30,
    image: "/products/extrait-naturel-moringa.svg",
    featured: true,
  },
  {
    slug: "extrait-naturel-gingembre",
    name: "Extrait naturel de Gingembre",
    category: "extraits-naturels",
    shortDescription: "Concentré chaleureux et tonifiant, à la note épicée typique.",
    description:
      "Préparé à partir de racines de gingembre frais, cet extrait naturel conserve la note chaude et épicée caractéristique de la plante. Il s'utilise en cuisine ou en infusion pour profiter de ses bienfaits traditionnels.",
    price: 3500,
    volumeMl: 30,
    image: "/products/extrait-naturel-gingembre.svg",
  },
  {
    slug: "extrait-naturel-neem",
    name: "Extrait naturel de Neem",
    category: "extraits-naturels",
    shortDescription: "Extrait traditionnel de feuilles de neem, usage cosmétique.",
    description:
      "Le neem est une plante largement utilisée en Afrique de l'Ouest pour ses propriétés reconnues en usage cosmétique. Cet extrait naturel de feuilles de neem est produit selon des méthodes traditionnelles respectueuses de la plante.",
    price: 3000,
    volumeMl: 30,
    image: "/products/extrait-naturel-neem.svg",
  },
  {
    slug: "extrait-naturel-basilic",
    name: "Extrait naturel de Basilic tropical",
    category: "extraits-naturels",
    shortDescription: "Note aromatique verte et légèrement anisée.",
    description:
      "Cet extrait de basilic tropical (basilic africain) restitue la note aromatique verte et légèrement anisée de la plante fraîche. Idéal pour parfumer naturellement une infusion ou une préparation culinaire.",
    price: 3000,
    volumeMl: 30,
    image: "/products/extrait-naturel-basilic.svg",
  },
];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(category: CategorySlug): Product[] {
  return products.filter((product) => product.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured);
}
