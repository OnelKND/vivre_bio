/**
 * Seed Turso : pousse le schéma + les 9 produits initiaux dans la base
 * cloud. À lancer UNE FOIS après avoir créé la DB sur turso.tech et
 * ajouté les variables d'env (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN).
 *
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=eyJ... \\
 *     npx jiti scripts/seed-turso.ts
 *
 * Idempotent : si la table products contient déjà des lignes, le seed
 * des produits est sauté (mais le schéma `CREATE TABLE IF NOT EXISTS`
 * est toujours appliqué).
 *
 * En .mjs pour éviter le tsx + la résolution des paths `@/` — on importe
 * directement depuis `@libsql/client`, qui est la seule dépendance
 * nécessaire ici.
 */
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error(
    "Variables d'env manquantes. Lance la commande avec :\n" +
      "  TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=eyJ... npx jiti scripts/seed-turso.ts",
  );
  process.exit(1);
}

const SEED_PRODUCTS = [
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
    featured: false,
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
    featured: false,
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
    featured: false,
  },
  {
    slug: "extrait-naturel-moringa",
    name: "Extrait naturel de Moringa",
    category: "poudres",
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
    category: "infusions",
    shortDescription: "Concentré chaleureux et tonifiant, à la note épicée typique.",
    description:
      "Préparé à partir de racines de gingembre frais, cet extrait naturel conserve la note chaude et épicée caractéristique de la plante. Il s'utilise en cuisine ou en infusion pour profiter de ses bienfaits traditionnels.",
    price: 3500,
    volumeMl: 30,
    image: "/products/extrait-naturel-gingembre.svg",
    featured: false,
  },
  {
    slug: "extrait-naturel-neem",
    name: "Extrait naturel de Neem",
    category: "cosmetiques-reparateurs",
    shortDescription: "Extrait traditionnel de feuilles de neem, usage cosmétique.",
    description:
      "Le neem est une plante largement utilisée en Afrique de l'Ouest pour ses propriétés reconnues en usage cosmétique. Cet extrait naturel de feuilles de neem est produit selon des méthodes traditionnelles respectueuses de la plante.",
    price: 3000,
    volumeMl: 30,
    image: "/products/extrait-naturel-neem.svg",
    featured: false,
  },
  {
    slug: "extrait-naturel-basilic",
    name: "Extrait naturel de Basilic tropical",
    category: "infusions",
    shortDescription: "Note aromatique verte et légèrement anisée.",
    description:
      "Cet extrait de basilic tropical (basilic africain) restitue la note aromatique verte et légèrement anisée de la plante fraîche. Idéal pour parfumer naturellement une infusion ou une préparation culinaire.",
    price: 3000,
    volumeMl: 30,
    image: "/products/extrait-naturel-basilic.svg",
    featured: false,
  },
];

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    delivery_zone_slug TEXT NOT NULL,
    delivery_zone_label TEXT NOT NULL,
    delivery_fee INTEGER NOT NULL,
    items_json TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'recue',
    idempotency_key TEXT,
    status_history TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    volume_ml INTEGER NOT NULL,
    image TEXT NOT NULL,
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 100,
    whatsapp_catalog_url TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
    ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'brouillon',
    published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_slug TEXT NOT NULL,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_attente',
    created_at TEXT NOT NULL
  )`,
];

async function main() {
  const client = createClient({ url, authToken });
  console.log("→ Connexion à Turso…");

  console.log("→ Application du schéma…");
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }

  const { rows } = await client.execute("SELECT COUNT(*) as count FROM products");
  const existing = Number(rows[0]?.count ?? 0);
  if (existing > 0) {
    console.log(`→ ${existing} produits déjà présents, seed ignoré.`);
    console.log("✓ Terminé.");
    return;
  }

  console.log("→ Insertion des 9 produits seed…");
  const now = new Date().toISOString();
  for (const product of SEED_PRODUCTS) {
    await client.execute({
      sql: `INSERT INTO products (
        slug, name, category, short_description, description,
        price, volume_ml, image, featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        product.slug,
        product.name,
        product.category,
        product.shortDescription,
        product.description,
        product.price,
        product.volumeMl,
        product.image,
        product.featured ? 1 : 0,
        now,
      ],
    });
  }

  console.log(`✓ Seed terminé : ${SEED_PRODUCTS.length} produits insérés.`);
}

main().catch((error) => {
  console.error("✗ Échec du seed :", error);
  process.exit(1);
});