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
  stock: number;
  /** Lien vers la fiche produit dans le catalogue WhatsApp Business, s'il existe. */
  whatsappCatalogUrl: string | null;
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
  stock: number;
  whatsappCatalogUrl: string | null;
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
  stock: number;
  whatsapp_catalog_url: string | null;
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
    stock: row.stock,
    whatsappCatalogUrl: row.whatsapp_catalog_url,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM products ORDER BY id ASC");
  return result.rows.map((row) => rowToProduct(row as unknown as ProductRow));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM products WHERE slug = ?",
    args: [slug],
  });
  const row = result.rows[0];
  return row ? rowToProduct(row as unknown as ProductRow) : undefined;
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM products WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToProduct(row as unknown as ProductRow) : undefined;
}

export async function getProductsByCategory(category: CategorySlug): Promise<Product[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM products WHERE category = ? ORDER BY id ASC",
    args: [category],
  });
  return result.rows.map((row) => rowToProduct(row as unknown as ProductRow));
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM products WHERE featured = 1 ORDER BY id ASC",
  });
  return result.rows.map((row) => rowToProduct(row as unknown as ProductRow));
}

/** Dérive un slug unique à partir du nom, en ajoutant -2/-3/... en cas de collision. */
async function uniqueSlug(base: string): Promise<string> {
  const db = await getDb();
  const root = base || "produit";
  let candidate = root;
  let suffix = 2;
  for (;;) {
    const result = await db.execute({
      sql: "SELECT id FROM products WHERE slug = ?",
      args: [candidate],
    });
    if (result.rows.length === 0) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}

/**
 * Calcule à l'avance le slug définitif d'un futur produit (dérivé du nom,
 * dédoublonné). Utile côté action admin : le fichier image doit être
 * nommé d'après ce slug avant l'insertion en base elle-même.
 */
export async function generateProductSlug(name: string): Promise<string> {
  return uniqueSlug(slugify(name));
}

export async function createProduct(slug: string, input: ProductInput): Promise<Product> {
  const db = await getDb();
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: `INSERT INTO products (
      slug, name, category, short_description, description,
      price, volume_ml, image, featured, created_at, stock, whatsapp_catalog_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      slug,
      input.name,
      input.category,
      input.shortDescription,
      input.description,
      input.price,
      input.volumeMl,
      input.image,
      input.featured ? 1 : 0,
      now,
      input.stock,
      input.whatsappCatalogUrl,
    ],
  });

  const id = Number(result.lastInsertRowid);
  const product = await getProductById(id);
  if (!product) throw new Error("Échec de la création du produit.");
  return product;
}

/** Le slug n'est jamais modifié après création, pour ne pas casser un lien déjà partagé. */
export async function updateProduct(id: number, input: ProductInput): Promise<Product | undefined> {
  const db = await getDb();
  await db.execute({
    sql: `UPDATE products SET
      name = ?, category = ?, short_description = ?, description = ?,
      price = ?, volume_ml = ?, image = ?, featured = ?, stock = ?, whatsapp_catalog_url = ?
    WHERE id = ?`,
    args: [
      input.name,
      input.category,
      input.shortDescription,
      input.description,
      input.price,
      input.volumeMl,
      input.image,
      input.featured ? 1 : 0,
      input.stock,
      input.whatsappCatalogUrl,
      id,
    ],
  });
  return getProductById(id);
}

/** Mise à jour ciblée du lien catalogue WhatsApp seul (édition en bloc). */
export async function updateProductWhatsappLink(id: number, whatsappCatalogUrl: string | null): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE products SET whatsapp_catalog_url = ? WHERE id = ?",
    args: [whatsappCatalogUrl, id],
  });
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [id] });
}

/**
 * Décrémente le stock après une commande. `MAX(0, ...)` protège contre un
 * stock négatif si deux commandes concurrentes passaient la validation en
 * même temps.
 */
export async function decrementStock(slug: string, quantity: number): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE products SET stock = MAX(0, stock - ?) WHERE slug = ?",
    args: [quantity, slug],
  });
}