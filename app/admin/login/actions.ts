"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  checkAdminPassword,
  createSessionToken,
} from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { logSecurityEvent } from "@/lib/security-log";

const loginSchema = z.object({ password: z.string().min(1).max(200) });

const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;

export interface AdminLoginState {
  status: "idle" | "error";
  message?: string;
}

export async function loginAdmin(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const ip = await getClientIp();
  const userAgent = (await headers()).get("user-agent");

  if (!checkRateLimit(`admin-login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS)) {
    await logSecurityEvent({ type: "admin-login-rate-limited", ip, userAgent });
    return {
      status: "error",
      message: "Trop de tentatives. Réessayez dans quelques minutes.",
    };
  }

  const parsed = loginSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success || !checkAdminPassword(parsed.data.password)) {
    // On ne journalise jamais le mot de passe tenté, même en échec — ce
    // n'est pas un piège, c'est le vrai formulaire, un mot de passe presque
    // correct dans un log resterait une donnée sensible.
    await logSecurityEvent({ type: "admin-login-failed", ip, userAgent });
    return { status: "error", message: "Mot de passe incorrect." };
  }

  await logSecurityEvent({ type: "admin-login-success", ip, userAgent });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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
