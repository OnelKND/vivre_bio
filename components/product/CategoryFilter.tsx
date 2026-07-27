import Link from "next/link";
import { getAllCategories } from "@/lib/categories";

export default function CategoryFilter({ activeCategory }: { activeCategory?: string }) {
  const categories = getAllCategories();

  return (
    <nav aria-label="Filtrer par catégorie" className="flex flex-wrap gap-2 justify-center">
      <Link
        href="/catalogue"
        className={`btn btn-sm rounded-field ${!activeCategory ? "btn-primary" : "btn-outline"}`}
      >
        Tous les produits
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/catalogue?categorie=${category.slug}`}
          className={`btn btn-sm rounded-field ${
            activeCategory === category.slug ? "btn-primary" : "btn-outline"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
