"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isSessionTokenValid } from "@/lib/admin-auth";
import { approveReview, deleteReview, getReviewById } from "@/lib/reviews";

async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return isSessionTokenValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function approveReviewAction(formData: FormData): Promise<void> {
  if (!(await hasValidAdminSession())) return;

  const id = Number(formData.get("id"));
  const existing = Number.isFinite(id) ? getReviewById(id) : undefined;
  if (!existing) return;

  approveReview(id);

  revalidatePath(`/produits/${existing.productSlug}`);
  revalidatePath("/admin/avis");
  redirect(`/admin/avis?published=${encodeURIComponent("Cet avis")}`);
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  if (!(await hasValidAdminSession())) return;

  const id = Number(formData.get("id"));
  const existing = Number.isFinite(id) ? getReviewById(id) : undefined;
  if (!existing) return;

  deleteReview(id);

  revalidatePath(`/produits/${existing.productSlug}`);
  revalidatePath("/admin/avis");
  redirect(`/admin/avis?deleted=${encodeURIComponent("Cet avis")}`);
}
