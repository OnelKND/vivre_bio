import Image from "next/image";

interface ProductImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Cadre à ratio fixe et fond neutre pour uniformiser des photos produit de
 * qualité inégale : même cadrage, même fond, même ratio pour toutes les
 * fiches et cartes produit.
 */
export default function ProductImage({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
}: ProductImageProps) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-box bg-base-200">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}
