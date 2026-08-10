"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildLetterPlaceholderSvg } from "@/lib/media";
import { z } from "zod";
import { ADMIN_SESSION_COOKIE, isSessionTokenValid } from "@/lib/admin-auth";
import { getAllCategories, type CategorySlug } from "@/lib/categories";
import {
  createProduct,
  deleteProduct,
  generateProductSlug,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductWhatsappLink,
} from "@/lib/products";

async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return isSessionTokenValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

const CATEGORY_SLUGS = getAllCategories().map((category) => category.slug);

const productSchema = z.object({
  name: z.string().trim().min(2, "Le nom est trop court.").max(150),
  category: z
    .string()
    .refine(
      (value): value is CategorySlug => CATEGORY_SLUGS.includes(value as CategorySlug),
      "Catégorie invalide."
    ),
  shortDescription: z.string().trim().min(5, "Description courte trop courte.").max(200),
  description: z.string().trim().min(10, "Description trop courte.").max(3000),
  price: z.coerce.number().int().positive().max(10_000_000, "Prix invalide."),
  volumeMl: z.coerce.number().int().positive().max(100_000, "Volume invalide."),
  stock: z.coerce.number().int().min(0).max(100_000, "Stock invalide."),
  whatsappCatalogUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || /^https:\/\//.test(value), {
      message: "Le lien catalogue WhatsApp doit commencer par https://",
    })
    .optional()
    .transform((value) => (value ? value : null)),
});

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Écrit l'image dans public/products/<slug>.<ext>. Le nom de fichier est
 * toujours dérivé du slug (jamais du nom de fichier envoyé par le client)
 * et le type est vérifié via une liste blanche stricte — pas de SVG côté
 * upload admin (contrairement aux placeholders, qui sont générés par nous).
 */
async function saveProductImage(
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
  const filename = `${slug}.${extension}`;
  const filePath = path.join(process.cwd(), "public", "products", filename);
  await writeFile(filePath, buffer);

  return { imagePath: `/products/${filename}` };
}

/** Aucune photo fournie : dépose un médaillon-lettre à la place, mêmes conventions de nommage. */
async function savePlaceholderImage(name: string, slug: string): Promise<string> {
  const filename = `${slug}.svg`;
  const filePath = path.join(process.cwd(), "public", "products", filename);
  await writeFile(filePath, buildLetterPlaceholderSvg(name), "utf8");
  return `/products/${filename}`;
}

async function deleteProductImageFile(slug: string): Promise<void> {
  const publicDir = path.join(process.cwd(), "public", "products");
  const extensions = [...Object.values(ALLOWED_IMAGE_TYPES), "svg"];

  await Promise.all(
    extensions.map(async (extension) => {
      try {
        await unlink(path.join(publicDir, `${slug}.${extension}`));
      } catch {
        // silence if le fichier n'existe pas
      }
    })
  );
}

export interface ProductFormState {
  status: "idle" | "error";
  message?: string;
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  if (!(await hasValidAdminSession())) {
    return { status: "error", message: "Session expirée, reconnectez-vous." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    price: formData.get("price"),
    volumeMl: formData.get("volumeMl"),
    stock: formData.get("stock"),
    whatsappCatalogUrl: formData.get("whatsappCatalogUrl"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const slug = generateProductSlug(parsed.data.name);

  const imageFile = formData.get("image");
  let imagePath: string;
  if (imageFile instanceof File && imageFile.size > 0) {
    const { imagePath: uploadedPath, error } = await saveProductImage(imageFile, slug);
    if (error || !uploadedPath) {
      return { status: "error", message: error ?? "Échec de l'enregistrement de l'image." };
    }
    imagePath = uploadedPath;
  } else {
    imagePath = await savePlaceholderImage(parsed.data.name, slug);
  }

  const featured = formData.get("featured") === "on";

  createProduct(slug, { ...parsed.data, image: imagePath, featured });

  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/admin/produits");
  redirect(`/admin/produits?updated=${encodeURIComponent(parsed.data.name)}`);
}

export async function updateProductAction(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  if (!(await hasValidAdminSession())) {
    return { status: "error", message: "Session expirée, reconnectez-vous." };
  }

  const id = Number(formData.get("id"));
  const existing = Number.isFinite(id) ? getProductById(id) : undefined;
  if (!existing) {
    return { status: "error", message: "Produit introuvable." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    price: formData.get("price"),
    volumeMl: formData.get("volumeMl"),
    stock: formData.get("stock"),
    whatsappCatalogUrl: formData.get("whatsappCatalogUrl"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  let imagePath = existing.image;
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    const { imagePath: newImagePath, error } = await saveProductImage(imageFile, existing.slug);
    if (error || !newImagePath) {
      return { status: "error", message: error ?? "Échec de l'enregistrement de l'image." };
    }
    imagePath = newImagePath;
  }

  const featured = formData.get("featured") === "on";
  const q = String(formData.get("q") ?? "").trim();
  const deleteImage = formData.get("deleteImage") === "on";

  if (deleteImage && !(imageFile instanceof File && imageFile.size > 0)) {
    await deleteProductImageFile(existing.slug);
    imagePath = await savePlaceholderImage(parsed.data.name, existing.slug);
  }

  updateProduct(id, { ...parsed.data, image: imagePath, featured });

  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath(`/produits/${existing.slug}`);
  revalidatePath("/admin/produits");
  redirect(
    `/admin/produits?updated=${encodeURIComponent(parsed.data.name)}${q ? `&q=${encodeURIComponent(q)}` : ""}`
  );
}

export interface BulkWhatsappLinksState {
  status: "idle" | "success" | "error";
  message?: string;
}

/**
 * Met à jour en une seule soumission le lien catalogue WhatsApp de tous les
 * produits édités depuis la page /admin/produits/liens-whatsapp — évite de
 * rouvrir chaque fiche produit une par une.
 */
export async function bulkUpdateWhatsappLinksAction(
  _prevState: BulkWhatsappLinksState,
  formData: FormData
): Promise<BulkWhatsappLinksState> {
  if (!(await hasValidAdminSession())) {
    return { status: "error", message: "Session expirée, reconnectez-vous." };
  }

  const products = getAllProducts();
  let updated = 0;
  const skipped: string[] = [];

  for (const product of products) {
    const raw = formData.get(`link-${product.id}`);
    if (raw === null) continue;
    const value = String(raw).trim();

    if (value !== "" && !/^https:\/\//.test(value)) {
      skipped.push(product.name);
      continue;
    }

    const nextValue = value === "" ? null : value;
    if (nextValue === product.whatsappCatalogUrl) continue;

    updateProductWhatsappLink(product.id, nextValue);
    updated += 1;
  }

  revalidatePath("/admin/produits/liens-whatsapp");

  if (skipped.length > 0) {
    return {
      status: "error",
      message: `${updated} lien(s) enregistré(s). Ignorés (doivent commencer par https://) : ${skipped.join(", ")}.`,
    };
  }

  return {
    status: "success",
    message: updated > 0 ? `${updated} lien(s) enregistré(s).` : "Aucun changement.",
  };
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  if (!(await hasValidAdminSession())) {
    return;
  }

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  const existing = getProductById(id);
  if (!existing) return;

  const q = String(formData.get("q") ?? "").trim();

  deleteProduct(id);

  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/admin/produits");
  redirect(
    `/admin/produits?deleted=${encodeURIComponent(existing.name)}${q ? `&q=${encodeURIComponent(q)}` : ""}`
  );
}
