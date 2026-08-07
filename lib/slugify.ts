const COMBINING_DIACRITICS = new RegExp("[̀-ͯ]", "g");

/** Transforme un nom de produit en slug d'URL : minuscules, sans accents, tirets. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
