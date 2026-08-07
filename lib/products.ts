import "server-only";
import { getDb } from "./db";
import { slugify } from "./slugify";
import type { CategorySlug } from "./categories";

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: CategorySlug;
  shortDescription: string;
  description: string;
  /** Price in FCFA (XOF) for the reference volume below. */
  price: number;
  volumeMl: number;
  image: string;
  featured: boolean;
}

/** Champs éditables depuis l'admin — le slug est dérivé du nom, jamais saisi. */
export interface ProductInput {
  name: string;
  category: CategorySlug;
  shortDescription: string;
  description: string;
  price: number;
  volumeMl: number;
  image: string;
  featured: boolean;
}

interface ProductRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  short_description: string;
  description: string;
  price: number;
  volume_ml: number;
  image: string;
  featured: number;
  created_at: string;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as CategorySlug,
    shortDescription: row.short_description,
    description: row.description,
    price: row.price,
    volumeMl: row.volume_ml,
    image: row.image,
    featured: row.featured === 1,
  };
}

export function getAllProducts(): Product[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM products ORDER BY id ASC")
    .all() as unknown as ProductRow[];
  return rows.map(rowToProduct);
}

export function getProductBySlug(slug: string): Product | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM products WHERE slug = ?").get(slug) as
    | ProductRow
    | undefined;
  return row ? rowToProduct(row) : undefined;
}

export function getProductById(id: number): Product | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | ProductRow
    | undefined;
  return row ? rowToProduct(row) : undefined;
}

export function getProductsByCategory(category: CategorySlug): Product[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM products WHERE category = ? ORDER BY id ASC")
    .all(category) as unknown as ProductRow[];
  return rows.map(rowToProduct);
}

export function getFeaturedProducts(): Product[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM products WHERE featured = 1 ORDER BY id ASC")
    .all() as unknown as ProductRow[];
  return rows.map(rowToProduct);
}

/** Dérive un slug unique à partir du nom, en ajoutant -2/-3/... en cas de collision. */
function uniqueSlug(base: string): string {
  const db = getDb();
  const root = base || "produit";
  let candidate = root;
  let suffix = 2;
  for (;;) {
    const existing = db.prepare("SELECT id FROM products WHERE slug = ?").get(candidate);
    if (!existing) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}

/**
 * Calcule à l'avance le slug définitif d'un futur produit (dérivé du nom,
 * dédoublonné). Utile côté action admin : le fichier image doit être
 * nommé d'après ce slug avant l'insertion en base elle-même.
 */
export function generateProductSlug(name: string): string {
  return uniqueSlug(slugify(name));
}

export function createProduct(slug: string, input: ProductInput): Product {
  const db = getDb();
  const now = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO products (
      slug, name, category, short_description, description,
      price, volume_ml, image, featured, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = statement.run(
    slug,
    input.name,
    input.category,
    input.shortDescription,
    input.description,
    input.price,
    input.volumeMl,
    input.image,
    input.featured ? 1 : 0,
    now
  );

  const product = getProductById(Number(result.lastInsertRowid));
  if (!product) throw new Error("Échec de la création du produit.");
  return product;
}

/** Le slug n'est jamais modifié après création, pour ne pas casser un lien déjà partagé. */
export function updateProduct(id: number, input: ProductInput): Product | undefined {
  const db = getDb();
  db.prepare(`
    UPDATE products SET
      name = ?, category = ?, short_description = ?, description = ?,
      price = ?, volume_ml = ?, image = ?, featured = ?
    WHERE id = ?
  `).run(
    input.name,
    input.category,
    input.shortDescription,
    input.description,
    input.price,
    input.volumeMl,
    input.image,
    input.featured ? 1 : 0,
    id
  );
  return getProductById(id);
}

export function deleteProduct(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
}
