import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isSessionTokenValid } from "@/lib/admin-auth";

/**
 * Remplace `middleware.ts` (déprécié en Next.js 16) pour protéger l'espace
 * `/admin` de VIVRE BIO. Chaque Server Function admin vérifie aussi la
 * session de son côté : ce proxy est une première barrière, pas la seule.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const hasValidSession = isSessionTokenValid(sessionToken);

  if (pathname.startsWith("/admin/login")) {
    if (hasValidSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !hasValidSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
