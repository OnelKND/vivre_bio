import "server-only";
import { getDb } from "./db";
import { slugify } from "./slugify";

export type ArticleStatus = "brouillon" | "publie";

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  /** HTML déjà assaini (voir app/admin/articles/actions.ts) avant d'atteindre cette couche. */
  content: string;
  coverImage: string;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
}

/** Champs éditables depuis l'admin — le slug est dérivé du titre, jamais saisi. */
export interface ArticleInput {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  status: ArticleStatus;
}

interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image,
    status: row.status as ArticleStatus,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export function getAllArticles(): Article[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM articles ORDER BY created_at DESC")
    .all() as unknown as ArticleRow[];
  return rows.map(rowToArticle);
}

export function getPublishedArticles(): Article[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM articles WHERE status = 'publie' ORDER BY published_at DESC")
    .all() as unknown as ArticleRow[];
  return rows.map(rowToArticle);
}

export function getArticleBySlug(slug: string): Article | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM articles WHERE slug = ?").get(slug) as
    | ArticleRow
    | undefined;
  return row ? rowToArticle(row) : undefined;
}

export function getArticleById(id: number): Article | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM articles WHERE id = ?").get(id) as
    | ArticleRow
    | undefined;
  return row ? rowToArticle(row) : undefined;
}

/** Dérive un slug unique à partir du titre, en ajoutant -2/-3/... en cas de collision. */
function uniqueSlug(base: string): string {
  const db = getDb();
  const root = base || "article";
  let candidate = root;
  let suffix = 2;
  for (;;) {
    const existing = db.prepare("SELECT id FROM articles WHERE slug = ?").get(candidate);
    if (!existing) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}

export function generateArticleSlug(title: string): string {
  return uniqueSlug(slugify(title));
}

export function createArticle(slug: string, input: ArticleInput): Article {
  const db = getDb();
  const now = new Date().toISOString();
  const publishedAt = input.status === "publie" ? now : null;

  const statement = db.prepare(`
    INSERT INTO articles (
      slug, title, excerpt, content, cover_image, status, published_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = statement.run(
    slug,
    input.title,
    input.excerpt,
    input.content,
    input.coverImage,
    input.status,
    publishedAt,
    now,
    now
  );

  const article = getArticleById(Number(result.lastInsertRowid));
  if (!article) throw new Error("Échec de la création de l'article.");
  return article;
}

/**
 * Le slug n'est jamais modifié après création. `publishedAt` n'est
 * positionné que la première fois que l'article passe à "publie" — il
 * reste stable même en cas de dépublication/republication ultérieure.
 */
export function updateArticle(id: number, input: ArticleInput): Article | undefined {
  const db = getDb();
  const existing = getArticleById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const publishedAt =
    input.status === "publie" && !existing.publishedAt ? now : existing.publishedAt;

  db.prepare(`
    UPDATE articles SET
      title = ?, excerpt = ?, content = ?, cover_image = ?, status = ?,
      published_at = ?, updated_at = ?
    WHERE id = ?
  `).run(
    input.title,
    input.excerpt,
    input.content,
    input.coverImage,
    input.status,
    publishedAt,
    now,
    id
  );
  return getArticleById(id);
}

export function deleteArticle(id: number): void {
  const db = getDb();
  db.prepare("DELETE FROM articles WHERE id = ?").run(id);
}
