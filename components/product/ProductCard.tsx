import Link from "next/link";
import type { Product } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/categories";
import { formatFCFA } from "@/lib/format";
import ProductImage from "./ProductImage";
import AddToCartButton from "@/components/cart/AddToCartButton";
import Badge from "@/components/ui/Badge";

export default function ProductCard({ product }: { product: Product }) {
  const category = getCategoryBySlug(product.category);

  return (
    <article className="label-tick group flex flex-col gap-3 border border-base-300 bg-base-100 p-3 transition-colors duration-300 hover:border-label">
      <div className="relative">
        <Link href={`/produits/${product.slug}`} className="block">
          <ProductImage src={product.image} alt={product.name} />
        </Link>
        {product.stock <= 0 ? (
          <div className="absolute top-2 left-2">
            <Badge variant="accent">Épuisé</Badge>
          </div>
        ) : product.stock <= 5 ? (
          <div className="absolute top-2 left-2">
            <Badge variant="accent">Plus que {product.stock}</Badge>
          </div>
        ) : (
          product.featured && (
            <div className="absolute top-2 left-2">
              <Badge variant="accent">Vedette</Badge>
            </div>
          )
        )}
        <div className="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
          <AddToCartButton
            slug={product.slug}
            className="btn-sm btn-circle shadow-md"
            disabled={product.stock <= 0}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {category && (
          <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
            {category.name}
          </span>
        )}
        <Link
          href={`/produits/${product.slug}`}
          className="font-semibold hover:text-primary transition-colors"
        >
          {product.name}
        </Link>
        <p className="text-sm text-base-content/60 line-clamp-2">
          {product.shortDescription}
        </p>
        <p className="font-semibold text-primary">
          {formatFCFA(product.price)}
          <span className="text-xs font-normal text-base-content/50">
            {" "}
            / {product.volumeMl} ml
          </span>
        </p>
      </div>
    </article>
  );
}
