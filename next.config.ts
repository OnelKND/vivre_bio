import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Le kit Font Awesome (voir app/layout.tsx) injecte dynamiquement une
// feuille de style et des polices web depuis ce domaine.
const FONT_AWESOME_ORIGIN = "https://ka-f.fontawesome.com";
const FONT_AWESOME_KIT_ORIGIN = "https://kit.fontawesome.com";

// 'unsafe-eval' n'est nécessaire qu'en dev : React s'en sert pour
// reconstruire les traces d'appel dans les outils de debug. Jamais utilisé
// en production (recommandation officielle Next.js).
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${FONT_AWESOME_KIT_ORIGIN}${isProd ? "" : " 'unsafe-eval'"};
  style-src 'self' 'unsafe-inline' ${FONT_AWESOME_ORIGIN};
  font-src 'self' data: ${FONT_AWESOME_ORIGIN};
  connect-src 'self' ${FONT_AWESOME_ORIGIN} ${FONT_AWESOME_KIT_ORIGIN};
  img-src 'self' data: blob:;
  media-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Le dossier `.next` par défaut est monté sur un tmpfs limité à 512 Mo
  // dans cet environnement de dev, qui sature après quelques builds. On
  // écrit donc la sortie ailleurs, sur le disque principal (bien plus
  // grand) — sans rapport avec le reste de la config, uniquement pour
  // contourner cette contrainte locale.
  // Netlify n'a pas cette contrainte et attend la sortie par défaut dans
  // `.next`, donc on ne l'applique pas sur leur environnement de build.
  ...(process.env.NETLIFY ? {} : { distDir: ".next-build" }),
  images: {
    // Certains produits ont encore l'image placeholder SVG générée
    // automatiquement (initiale du nom, aucun contenu utilisateur) en
    // attendant une vraie photo uploadée depuis l'admin — retirer ce
    // réglage une fois que tous les produits ont une vraie photo (JPG/PNG/
    // WEBP), sinon les fiches encore en placeholder cassent.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
