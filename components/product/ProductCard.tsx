import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatFCFA } from "@/lib/format";
import ProductImage from "./ProductImage";
import AddToCartButton from "@/components/cart/AddToCartButton";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col gap-3">
      <div className="relative">
        <Link href={`/produits/${product.slug}`} className="block">
          <ProductImage src={product.image} alt={product.name} />
        </Link>
        <div className="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
          <AddToCartButton slug={product.slug} className="btn-sm btn-circle shadow-md" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
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
