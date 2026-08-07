interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "outline";
  className?: string;
}

const VARIANT_CLASSES = {
  primary: "bg-primary text-primary-content",
  accent: "bg-accent text-accent-content",
  outline: "bg-base-100/90 text-base-content border border-base-300",
};

export default function Badge({ children, variant = "primary", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-field px-2 py-0.5 text-xs font-semibold shadow-sm ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
