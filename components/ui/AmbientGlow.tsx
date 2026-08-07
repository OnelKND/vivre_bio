interface AmbientGlowProps {
  /** "dark" pour un fond plein (vert), "light" pour un fond blanc/crème. */
  variant?: "dark" | "light";
}

/**
 * Fond décoratif : quelques halos de couleur flous qui dérivent lentement.
 * Respecte prefers-reduced-motion (voir globals.css, classe .ambient-glow).
 */
export default function AmbientGlow({ variant = "dark" }: AmbientGlowProps) {
  const blobClasses =
    variant === "dark"
      ? ["bg-white/10", "bg-accent/25", "bg-white/10"]
      : ["bg-primary/15", "bg-accent/15", "bg-secondary/20"];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={`ambient-glow absolute -top-24 -left-16 h-80 w-80 rounded-full ${blobClasses[0]} blur-3xl [animation-duration:16s]`}
      />
      <div
        className={`ambient-glow absolute top-1/3 -right-20 h-96 w-96 rounded-full ${blobClasses[1]} blur-3xl [animation-duration:20s] [animation-delay:-4s]`}
      />
      <div
        className={`ambient-glow absolute -bottom-28 left-1/4 h-72 w-72 rounded-full ${blobClasses[2]} blur-3xl [animation-duration:14s] [animation-delay:-8s]`}
      />
    </div>
  );
}
