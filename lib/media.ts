import { existsSync } from "node:fs";
import path from "node:path";

// Emplacements vidéo connus du site. Pour activer une vidéo, déposer le
// fichier au chemin `public/videos/<slot>.mp4` correspondant — aucun
// changement de code requis, sur le même principe que les visuels produits
// dans `public/products/`.
export const VIDEO_SLOTS = {
  atelier: {
    title: "Notre atelier",
    caption: "Un aperçu de notre atelier de transformation au Bénin.",
  },
  recolte: {
    title: "Récolte",
    caption: "La récolte des plantes aromatiques auprès de nos producteurs.",
  },
  distillation: {
    title: "Distillation",
    caption: "La distillation, étape clé pour préserver les principes actifs.",
  },
  conditionnement: {
    title: "Conditionnement",
    caption: "La mise en flacon, dernière étape avant l'expédition.",
  },
} as const;

export type VideoSlot = keyof typeof VIDEO_SLOTS;

export function getVideoAsset(slot: VideoSlot): { src: string | null } {
  const fileName = `${slot}.mp4`;
  const filePath = path.join(process.cwd(), "public", "videos", fileName);

  return {
    src: existsSync(filePath) ? `/videos/${fileName}` : null,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Visuel de secours quand un produit n'a pas encore de vraie photo : un
 * simple médaillon avec la première lettre du nom, dans le même style que
 * les placeholders déjà utilisés sur le site (fond #F5F3ED, disque
 * primaire #2E7D32).
 */
export function buildLetterPlaceholderSvg(name: string): string {
  const letter = escapeXml((name.trim().charAt(0) || "?").toUpperCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-hidden="true">
  <rect width="400" height="400" fill="#F5F3ED" />
  <circle cx="200" cy="180" r="90" fill="#2E7D32" fill-opacity="0.9" />
  <text x="200" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="#FFFFFF">${letter}</text>
  <rect x="150" y="290" width="100" height="16" rx="8" fill="#2E7D32" fill-opacity="0.25" />
</svg>
`;
}
