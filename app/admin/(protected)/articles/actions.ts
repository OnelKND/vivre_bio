"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { buildLetterPlaceholderSvg } from "@/lib/media";
import { ADMIN_SESSION_COOKIE, isSessionTokenValid } from "@/lib/admin-auth";
import {
  createArticle,
  deleteArticle,
  generateArticleSlug,
  getArticleById,
  updateArticle,
  type ArticleStatus,
} from "@/lib/articles";

async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return isSessionTokenValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

const ARTICLE_STATUSES: ArticleStatus[] = ["brouillon", "publie"];

const articleSchema = z.object({
  title: z.string().trim().min(3, "Le titre est trop court.").max(150),
  excerpt: z.string().trim().min(5, "L'extrait est trop court.").max(2000, "L'extrait est trop long."),
  content: z.string().trim().min(10, "Le contenu est trop court."),
  status: z
    .string()
    .refine(
      (value): value is ArticleStatus => ARTICLE_STATUSES.includes(value as ArticleStatus),
      "Statut invalide."
    ),
});

/**
 * Liste blanche stricte : le contenu vient de Tiptap côté client mais reste
 * une simple string de FormData, donc pas fiable telle quelle (soumission
 * directe hors UI, ou HTML collé par l'utilisateur dans l'éditeur). Rien
 * d'exécutable ne doit pouvoir atteindre le stockage — c'est cette étape,
 * pas le rendu public, qui est la vraie barrière de sécurité.
 */
function sanitizeArticleContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "rel", "target"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Écrit l'image dans public/blog/<slug>.<ext>, même convention que public/products/. */
async function saveCoverImage(
  file: File,
  slug: string
): Promise<{ imagePath?: string; error?: string }> {
  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    return { error: "Format d'image non supporté (jpg, png ou webp uniquement)." };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { error: "Image trop volumineuse (5 Mo maximum)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${slug}-${Date.now()}.${extension}`;
  const filePath = path.join(process.cwd(), "public", "blog", filename);
  await writeFile(filePath, buffer);

  return { imagePath: `/blog/${filename}` };
}

async function deleteAllCoverImagesForSlug(slug: string): Promise<void> {
  const publicDir = path.join(process.cwd(), "public", "blog");

  try {
    const entries = await readdir(publicDir);
    await Promise.all(
      entries
        .filter((name) => name.startsWith(`${slug}.`) || name.startsWith(`${slug}-`))
        .map(async (name) => {
          try {
            await unlink(path.join(publicDir, name));
          } catch {
            // ignore missing file
          }
        })
    );
  } catch {
    // ignore missing directory or unreadable folder
  }
}

/** Aucune photo fournie : dépose un médaillon-lettre à la place. */
async function savePlaceholderImage(title: string, slug: string): Promise<string> {
  const filename = `${slug}.svg`;
  const filePath = path.join(process.cwd(), "public", "blog", filename);
  await writeFile(filePath, buildLetterPlaceholderSvg(title), "utf8");
  return `/blog/${filename}`;
}

export interface ArticleFormState {
  status: "idle" | "error";
  message?: string;
}

function parseArticleForm(formData: FormData) {
  return articleSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    status: formData.get("status"),
  });
}

export async function createArticleAction(
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  if (!(await hasValidAdminSession())) {
    return { status: "error", message: "Session expirée, reconnectez-vous." };
  }

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const slug = await generateArticleSlug(parsed.data.title);

  const imageFile = formData.get("coverImage");
  let coverImage: string;
  if (imageFile instanceof File && imageFile.size > 0) {
    const { imagePath, error } = await saveCoverImage(imageFile, slug);
    if (error || !imagePath) {
      return { status: "error", message: error ?? "Échec de l'enregistrement de l'image." };
    }
    coverImage = imagePath;
  } else {
    coverImage = await savePlaceholderImage(parsed.data.title, slug);
  }

  const article = await createArticle(slug, {
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    content: sanitizeArticleContent(parsed.data.content),
    status: parsed.data.status,
    coverImage,
  });

  revalidatePath("/blog");
  revalidatePath("/admin/articles");
  redirect(`/admin/articles?created=${encodeURIComponent(article.title)}`);
}

export async function updateArticleAction(
  _prevState: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  if (!(await hasValidAdminSession())) {
    return { status: "error", message: "Session expirée, reconnectez-vous." };
  }

  const id = Number(formData.get("id"));
  const existing = Number.isFinite(id) ? await getArticleById(id) : undefined;
  if (!existing) {
    return { status: "error", message: "Article introuvable." };
  }

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  let coverImage = existing.coverImage;
  const imageFile = formData.get("coverImage");
  if (imageFile instanceof File && imageFile.size > 0) {
    await deleteAllCoverImagesForSlug(existing.slug);
    const { imagePath, error } = await saveCoverImage(imageFile, existing.slug);
    if (error || !imagePath) {
      return { status: "error", message: error ?? "Échec de l'enregistrement de l'image." };
    }
    coverImage = imagePath;
  }

  await updateArticle(id, {
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    content: sanitizeArticleContent(parsed.data.content),
    status: parsed.data.status,
    coverImage,
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);
  revalidatePath("/admin/articles");
  redirect(`/admin/articles?updated=${encodeURIComponent(parsed.data.title)}`);
}

export async function togglePublishAction(formData: FormData): Promise<void> {
  if (!(await hasValidAdminSession())) {
    return;
  }

  const id = Number(formData.get("id"));
  const existing = Number.isFinite(id) ? await getArticleById(id) : undefined;
  if (!existing) return;

  const nextStatus: ArticleStatus = existing.status === "publie" ? "brouillon" : "publie";
  await updateArticle(id, {
    title: existing.title,
    excerpt: existing.excerpt,
    content: existing.content,
    coverImage: existing.coverImage,
    status: nextStatus,
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);
  revalidatePath("/admin/articles");
  redirect(
    `/admin/articles?${nextStatus === "publie" ? "published" : "unpublished"}=${encodeURIComponent(existing.title)}`
  );
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  if (!(await hasValidAdminSession())) {
    return;
  }

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  const existing = await getArticleById(id);
  if (!existing) return;

  await deleteArticle(id);

  revalidatePath("/blog");
  revalidatePath("/admin/articles");
  redirect(`/admin/articles?deleted=${encodeURIComponent(existing.title)}`);
}
