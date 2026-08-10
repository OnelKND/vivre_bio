import "server-only";
import { getDb } from "./db";

export type ReviewStatus = "en_attente" | "approuve";

export interface Review {
  id: number;
  productSlug: string;
  authorName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface ReviewInput {
  productSlug: string;
  authorName: string;
  rating: number;
  comment: string;
}

export interface ReviewStats {
  average: number;
  count: number;
}

interface ReviewRow {
  id: number;
  product_slug: string;
  author_name: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productSlug: row.product_slug,
    authorName: row.author_name,
    rating: row.rating,
    comment: row.comment,
    status: row.status as ReviewStatus,
    createdAt: row.created_at,
  };
}

export async function getApprovedReviews(productSlug: string): Promise<Review[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM reviews WHERE product_slug = ? AND status = 'approuve' ORDER BY created_at DESC",
    args: [productSlug],
  });
  return result.rows.map((row) => rowToReview(row as unknown as ReviewRow));
}

export async function getReviewStats(productSlug: string): Promise<ReviewStats> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE product_slug = ? AND status = 'approuve'",
    args: [productSlug],
  });
  const row = result.rows[0] as unknown as { average: number | null; count: number };
  return { average: row.average ?? 0, count: row.count };
}

/** Note moyenne et nombre total d'avis approuvés, tous produits confondus (preuve sociale sur la home). */
export async function getSiteReviewStats(): Promise<ReviewStats> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE status = 'approuve'",
  });
  const row = result.rows[0] as unknown as { average: number | null; count: number };
  return { average: row.average ?? 0, count: row.count };
}

/** Avis les mieux notés, tous produits confondus, pour une mise en avant sur la home. */
export async function getFeaturedReviews(limit: number): Promise<(Review & { productSlug: string })[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM reviews WHERE status = 'approuve' AND rating >= 4 ORDER BY rating DESC, created_at DESC LIMIT ?",
    args: [limit],
  });
  return result.rows.map((row) => rowToReview(row as unknown as ReviewRow));
}

/** Admin : tous les avis, tous produits, en attente en premier. */
export async function getAllReviews(): Promise<Review[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM reviews ORDER BY (status = 'en_attente') DESC, created_at DESC",
  });
  return result.rows.map((row) => rowToReview(row as unknown as ReviewRow));
}

export async function getReviewById(id: number): Promise<Review | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM reviews WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToReview(row as unknown as ReviewRow) : undefined;
}

export async function createReview(input: ReviewInput): Promise<Review> {
  const db = await getDb();
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `INSERT INTO reviews (product_slug, author_name, rating, comment, status, created_at)
      VALUES (?, ?, ?, ?, 'en_attente', ?)`,
    args: [input.productSlug, input.authorName, input.rating, input.comment, now],
  });
  const review = await getReviewById(Number(result.lastInsertRowid));
  if (!review) throw new Error("Échec de la création de l'avis.");
  return review;
}

export async function approveReview(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE reviews SET status = 'approuve' WHERE id = ?",
    args: [id],
  });
}

export async function deleteReview(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM reviews WHERE id = ?", args: [id] });
}