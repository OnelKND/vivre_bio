interface ReviewStarsProps {
  rating: number;
  size?: string;
}

/** Affichage lecture seule d'une note (moyenne ou avis individuel). */
export default function ReviewStars({ rating, size = "text-sm" }: ReviewStarsProps) {
  const rounded = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-0.5 text-secondary ${size}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`fa-star ${star <= rounded ? "fa-solid" : "fa-regular"}`}
        />
      ))}
    </span>
  );
}
