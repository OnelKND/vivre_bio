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

export function getApprovedReviews(productSlug: string): Review[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM reviews WHERE product_slug = ? AND status = 'approuve' ORDER BY created_at DESC"
    )
    .all(productSlug) as unknown as ReviewRow[];
  return rows.map(rowToReview);
}

export function getReviewStats(productSlug: string): ReviewStats {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE product_slug = ? AND status = 'approuve'"
    )
    .get(productSlug) as { average: number | null; count: number };
  return { average: row.average ?? 0, count: row.count };
}

/** Admin : tous les avis, tous produits, en attente en premier. */
export function getAllReviews(): Review[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM reviews ORDER BY (status = 'en_attente') DESC, created_at DESC"
    )
    .all() as unknown as ReviewRow[];
  return rows.map(rowToReview);
}

export function getReviewById(id: number): Review | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id) as
    | ReviewRow
    | undefined;
  return row ? rowToReview(row) : undefined;
}

export function createReview(input: ReviewInput): Review {
  const db = getDb();
  const now = new Date().toISOString();
  const statement = db.prepare(`
    INSERT INTO reviews (product_slug, author_name, rating, comment, status, created_at)
    VALUES (?, ?, ?, ?, 'en_attente', ?)
  `);
  const result = statement.run(
    input.productSlug,
    input.authorName,
    input.rating,
    input.comment,
    now
  );
  const review = getReviewById(Number(result.lastInsertRowid));
  if (!review) throw new Error("Échec de la création de l'avis.");
  return review;
}

export function approveReview(id: number): void {
  const db = getDb();
  db.prepare("UPDATE reviews SET status = 'approuve' WHERE id = ?").run(id);
}

export function deleteReview(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM reviews WHERE id = ?").run(id);
}
