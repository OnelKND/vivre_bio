import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Les photos produits sont pour l'instant des SVG placeholder générés
    // localement (aucun contenu utilisateur) ; à retirer si elles sont
    // remplacées par des JPG/PNG fournis par le client.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
