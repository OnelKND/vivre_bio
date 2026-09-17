"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ADMIN_SESSION_COOKIE, isSessionTokenValid } from "@/lib/admin-auth";
import {
  countDeliveryZones,
  createDeliveryZone,
  deleteDeliveryZone,
  getDeliveryZoneById,
  updateDeliveryZone,
} from "@/lib/delivery-zones";

async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return isSessionTokenValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

const zoneSchema = z.object({
  label: z.string().trim().min(2, "Le nom de la zone est trop court.").max(100),
  fee: z.coerce.number().int().min(0).max(1_000_000, "Frais de livraison invalide."),
});

function revalidateZonePages(): void {
  revalidatePath("/");
  revalidatePath("/conditions-generales-vente");
  revalidatePath("/commande");
  revalidatePath("/admin/zones");
}

export async function createZoneAction(formData: FormData): Promise<void> {
  if (!(await hasValidAdminSession())) return;

  const parsed = zoneSchema.safeParse({
    label: formData.get("label"),
    fee: formData.get("fee"),
  });
  if (!parsed.success) {
    redirect(
      `/admin/zones?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Formulaire invalide.")}`
    );
  }

  await createDeliveryZone(parsed.data);

  revalidateZonePages();
  redirect(`/admin/zones?created=${encodeURIComponent(parsed.data.label)}`);
}

export async function updateZoneAction(formData: FormData): Promise<void> {
  if (!(await hasValidAdminSession())) return;

  const id = Number(formData.get("id"));
  const existing = Number.isFinite(id) ? await getDeliveryZoneById(id) : undefined;
  if (!existing) {
    redirect(`/admin/zones?error=${encodeURIComponent("Zone introuvable.")}`);
  }

  const parsed = zoneSchema.safeParse({
    label: formData.get("label"),
    fee: formData.get("fee"),
  });
  if (!parsed.success) {
    redirect(
      `/admin/zones?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Formulaire invalide.")}`
    );
  }

  await updateDeliveryZone(id, parsed.data);

  revalidateZonePages();
  redirect(`/admin/zones?updated=${encodeURIComponent(parsed.data.label)}`);
}

export async function deleteZoneAction(formData: FormData): Promise<void> {
  if (!(await hasValidAdminSession())) return;

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  const existing = await getDeliveryZoneById(id);
  if (!existing) return;

  // Le checkout a besoin d'au moins une zone pour proposer une livraison.
  if ((await countDeliveryZones()) <= 1) {
    redirect(
      `/admin/zones?error=${encodeURIComponent("Impossible de supprimer la dernière zone de livraison.")}`
    );
  }

  await deleteDeliveryZone(id);

  revalidateZonePages();
  redirect(`/admin/zones?deleted=${encodeURIComponent(existing.label)}`);
}
