import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(LOCAL_DATA_DIR, "vivrebio.db");
const TMP_DB_PATH = path.join(os.tmpdir(), "vivrebio.db");

/**
 * Choisit où créer le fichier SQLite selon l'environnement :
 * - Sur Netlify (et tout serverless read-only) → `/tmp/vivrebio.db`, le seul
 *   emplacement writable des Lambda.
 * - En local → `data/vivrebio.db` à la racine du projet (workflow de dev).
 * - Fallback `/tmp` si jamais le dossier local n'est pas accessible
 *   (CI, conteneur read-only, etc.) plutôt que de crasher.
 */
function resolveDbPath(): string {
  if (process.env.NETLIFY === "true") return TMP_DB_PATH;
  try {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    fs.accessSync(LOCAL_DATA_DIR, fs.constants.W_OK);
    return LOCAL_DB_PATH;
  } catch {
    return TMP_DB_PATH;
  }
}

const DB_PATH = resolveDbPath();

declare global {
  var __vivrebioDb: DatabaseSync | undefined;
}

/** Ajoute une colonne si elle n'existe pas déjà (migration défensive, sans lib de migration). */
function ensureColumn(database: DatabaseSync, table: string, column: string, definition: string): void {
  try {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  } catch (error) {
    if (!(error instanceof Error) || !/duplicate column name/i.test(error.message)) {
      throw error;
    }
  }
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
] as const;

function createDatabase(): DatabaseSync {
  // Le dossier parent de DB_PATH est garanti writable par resolveDbPath()
  // (LOCAL_DATA_DIR testé en local, os.tmpdir() toujours writable sur
  // serverless). On n'a donc plus besoin de mkdirSync ici.
  const database = new DatabaseSync(DB_PATH);
  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
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
      status TEXT NOT NULL DEFAULT 'recue'
    );
  `);

  ensureColumn(database, "orders", "idempotency_key", "TEXT");
  ensureColumn(database, "orders", "status_history", "TEXT");
  database.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;"
  );

  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
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
      created_at TEXT NOT NULL
    );
  `);

  // Défaut à 100 (pas 0) : les produits déjà en base ne doivent pas
  // apparaître soudainement "épuisés" après cette migration — l'admin
  // ajuste ensuite les vraies quantités produit par produit.
  ensureColumn(database, "products", "stock", "INTEGER NOT NULL DEFAULT 100");
  ensureColumn(database, "products", "whatsapp_catalog_url", "TEXT");

  const { count } = database
    .prepare("SELECT COUNT(*) as count FROM products")
    .get() as { count: number };

  if (count === 0) {
    const insert = database.prepare(`
      INSERT INTO products (
        slug, name, category, short_description, description,
        price, volume_ml, image, featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    for (const product of SEED_PRODUCTS) {
      insert.run(
        product.slug,
        product.name,
        product.category,
        product.shortDescription,
        product.description,
        product.price,
        product.volumeMl,
        product.image,
        product.featured ? 1 : 0,
        now
      );
    }
  }

  // Migration défensive : la catégorie "extraits-naturels" a été remplacée
  // par une taxonomie plus détaillée (voir lib/categories.ts). Ne touche
  // que les bases déjà seedées avec l'ancienne catégorie ; sans effet sinon.
  const legacyCategoryMap: Record<string, string> = {
    "extrait-naturel-moringa": "poudres",
    "extrait-naturel-gingembre": "infusions",
    "extrait-naturel-neem": "cosmetiques-reparateurs",
    "extrait-naturel-basilic": "infusions",
  };
  const updateCategory = database.prepare(
    "UPDATE products SET category = ? WHERE slug = ? AND category = 'extraits-naturels'"
  );
  for (const [slug, category] of Object.entries(legacyCategoryMap)) {
    updateCategory.run(category, slug);
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS articles (
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
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_slug TEXT NOT NULL,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'en_attente',
      created_at TEXT NOT NULL
    );
  `);

  return database;
}

/**
 * Instance unique de la base SQLite, mise en cache sur `globalThis` pour
 * survivre au rechargement à chaud du serveur de dev (évite de rouvrir le
 * fichier à chaque modification de code).
 */
export function getDb(): DatabaseSync {
  if (!globalThis.__vivrebioDb) {
    globalThis.__vivrebioDb = createDatabase();
  }
  return globalThis.__vivrebioDb;
}
