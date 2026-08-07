import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isSessionTokenValid } from "@/lib/admin-auth";
import { logSecurityEvent } from "@/lib/security-log";

/**
 * Remplace `middleware.ts` (déprécié en Next.js 16) pour protéger l'espace
 * `/admin` de VIVRE BIO. Chaque Server Function admin vérifie aussi la
 * session de son côté : ce proxy est une première barrière, pas la seule.
 *
 * Il sert aussi de piège : les chemins ci-dessous sont ceux que les
 * scanners automatiques (bots, gobuster, etc.) testent en premier sur
 * n'importe quel site. Un vrai visiteur ne les demande jamais. Toute
 * requête dessus est journalisée puis reçoit un 404 générique, sans rien
 * révéler.
 */
const BAIT_PATHS = new Set([
  "/wp-admin",
  "/wp-login.php",
  "/wp-config.php",
  "/phpmyadmin",
  "/xmlrpc.php",
  "/.env",
  "/.git/config",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BAIT_PATHS.has(pathname)) {
    await logSecurityEvent({
      type: "scanner-probe",
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      userAgent: request.headers.get("user-agent"),
      path: pathname,
    });
    return new NextResponse("Not Found", { status: 404 });
  }

  // /admin/legacy est le piège (voir app/admin/legacy) : accessible sans
  // session, comme /admin/login, sinon il serait redirigé avant même d'être
  // affiché à qui le trouve.
  if (pathname.startsWith("/admin/legacy")) {
    return NextResponse.next();
  }

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
  matcher: [
    "/admin/:path*",
    "/wp-admin",
    "/wp-login.php",
    "/wp-config.php",
    "/phpmyadmin",
    "/xmlrpc.php",
    "/.env",
    "/.git/config",
  ],
};
