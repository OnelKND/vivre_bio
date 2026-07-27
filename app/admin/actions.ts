"use server";

import { revalidatePath } from "next/cache";
import {
  updateOrderStatus,
  ORDER_STATUS_SEQUENCE,
  type OrderStatus,
} from "@/lib/orders";

export async function changeOrderStatus(formData: FormData): Promise<void> {
  const id = Number(formData.get("orderId"));
  const status = String(formData.get("status")) as OrderStatus;

  if (!Number.isFinite(id) || !ORDER_STATUS_SEQUENCE.includes(status)) {
    return;
  }

  updateOrderStatus(id, status);
  revalidatePath("/admin");
  revalidatePath(`/admin/commandes/${id}`);
}
