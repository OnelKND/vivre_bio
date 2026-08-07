interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as: Heading = "h2",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow && (
        <span className="font-accent text-3xl sm:text-4xl text-secondary">{eyebrow}</span>
      )}
      <span className="h-1 w-12 rounded-full bg-secondary" aria-hidden="true" />
      <Heading className="font-sans font-bold text-3xl sm:text-4xl text-base-content">
        {title}
      </Heading>
      {description && (
        <p className="max-w-2xl text-base-content/70">{description}</p>
      )}
    </div>
  );
}
