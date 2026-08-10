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

export async function getAllArticles(): Promise<Article[]> {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM articles ORDER BY created_at DESC");
  return result.rows.map((row) => rowToArticle(row as unknown as ArticleRow));
}

export async function getPublishedArticles(): Promise<Article[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM articles WHERE status = 'publie' ORDER BY published_at DESC",
  });
  return result.rows.map((row) => rowToArticle(row as unknown as ArticleRow));
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM articles WHERE slug = ?",
    args: [slug],
  });
  const row = result.rows[0];
  return row ? rowToArticle(row as unknown as ArticleRow) : undefined;
}

export async function getArticleById(id: number): Promise<Article | undefined> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM articles WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? rowToArticle(row as unknown as ArticleRow) : undefined;
}

/** Dérive un slug unique à partir du titre, en ajoutant -2/-3/... en cas de collision. */
async function uniqueSlug(base: string): Promise<string> {
  const db = await getDb();
  const root = base || "article";
  let candidate = root;
  let suffix = 2;
  for (;;) {
    const result = await db.execute({
      sql: "SELECT id FROM articles WHERE slug = ?",
      args: [candidate],
    });
    if (result.rows.length === 0) return candidate;
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
}

export async function generateArticleSlug(title: string): Promise<string> {
  return uniqueSlug(slugify(title));
}

export async function createArticle(slug: string, input: ArticleInput): Promise<Article> {
  const db = await getDb();
  const now = new Date().toISOString();
  const publishedAt = input.status === "publie" ? now : null;

  const result = await db.execute({
    sql: `INSERT INTO articles (
      slug, title, excerpt, content, cover_image, status, published_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      slug,
      input.title,
      input.excerpt,
      input.content,
      input.coverImage,
      input.status,
      publishedAt,
      now,
      now,
    ],
  });

  const id = Number(result.lastInsertRowid);
  const article = await getArticleById(id);
  if (!article) throw new Error("Échec de la création de l'article.");
  return article;
}

/**
 * Le slug n'est jamais modifié après création. `publishedAt` n'est
 * positionné que la première fois que l'article passe à "publie" — il
 * reste stable même en cas de dépublication/republication ultérieure.
 */
export async function updateArticle(id: number, input: ArticleInput): Promise<Article | undefined> {
  const db = await getDb();
  const existing = await getArticleById(id);
  if (!existing) return undefined;

  const now = new Date().toISOString();
  const publishedAt =
    input.status === "publie" && !existing.publishedAt ? now : existing.publishedAt;

  await db.execute({
    sql: `UPDATE articles SET
      title = ?, excerpt = ?, content = ?, cover_image = ?, status = ?,
      published_at = ?, updated_at = ?
    WHERE id = ?`,
    args: [
      input.title,
      input.excerpt,
      input.content,
      input.coverImage,
      input.status,
      publishedAt,
      now,
      id,
    ],
  });
  return getArticleById(id);
}

export async function deleteArticle(id: number): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM articles WHERE id = ?", args: [id] });
}