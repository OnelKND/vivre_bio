"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  checkAdminPassword,
  createSessionToken,
} from "@/lib/admin-auth";

const loginSchema = z.object({ password: z.string().min(1) });

export interface AdminLoginState {
  status: "idle" | "error";
  message?: string;
}

export async function loginAdmin(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const parsed = loginSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success || !checkAdminPassword(parsed.data.password)) {
    return { status: "error", message: "Mot de passe incorrect." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
