"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_SESSION_COOKIE, isSessionTokenValid } from "@/lib/admin-auth";
import {
  updateOrderStatus,
  ORDER_STATUS_SEQUENCE,
  type OrderStatus,
} from "@/lib/orders";

export async function changeOrderStatus(formData: FormData): Promise<void> {
  // Défense en profondeur : proxy.ts protège déjà /admin/*, mais une
  // Server Function qui modifie des données ne doit pas dépendre
  // uniquement de la route depuis laquelle elle est appelée.
  const cookieStore = await cookies();
  if (!isSessionTokenValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return;
  }

  const id = Number(formData.get("orderId"));
  const status = String(formData.get("status")) as OrderStatus;

  if (!Number.isFinite(id) || !ORDER_STATUS_SEQUENCE.includes(status)) {
    return;
  }

  updateOrderStatus(id, status);
  revalidatePath("/admin");
  revalidatePath(`/admin/commandes/${id}`);
}
