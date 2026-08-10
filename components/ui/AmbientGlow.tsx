interface AmbientGlowProps {
  /** "dark" pour un fond plein (vert), "light" pour un fond crème/kraft. */
  variant?: "dark" | "light";
}

/**
 * Fond décoratif façon planche d'herbier : une branche au trait fin, en
 * filigrane, plutôt que des halos flous génériques. Dérive très lentement
 * (respecte prefers-reduced-motion, voir globals.css classe .ambient-glow).
 */
export default function AmbientGlow({ variant = "dark" }: AmbientGlowProps) {
  const stroke = variant === "dark" ? "rgba(255,255,255,0.14)" : "var(--color-label)";
  const strokeOpacity = variant === "dark" ? 1 : 0.35;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="ambient-glow absolute -top-10 -right-16 h-72 w-72 sm:h-96 sm:w-96 [animation-duration:40s]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path
          d="M100 10 C100 60 100 140 100 190"
          stroke={stroke}
          strokeOpacity={strokeOpacity}
          strokeWidth="1"
        />
        {[40, 75, 110, 145].map((y, i) => (
          <path
            key={y}
            d={`M100 ${y} C ${i % 2 === 0 ? "70 " + (y - 10) + ", 55 " + (y + 5) + ", 45" : "130 " + (y - 10) + ", 145 " + (y + 5) + ", 155"} ${y + 18}`}
            stroke={stroke}
            strokeOpacity={strokeOpacity}
            strokeWidth="1"
          />
        ))}
      </svg>
      <svg
        className="ambient-glow absolute -bottom-16 -left-10 h-56 w-56 sm:h-72 sm:w-72 [animation-duration:48s] [animation-delay:-6s]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle
          cx="100"
          cy="100"
          r="70"
          stroke={stroke}
          strokeOpacity={strokeOpacity}
          strokeWidth="1"
          strokeDasharray="2 6"
        />
      </svg>
    </div>
  );
}
