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
        <span className="font-accent text-2xl text-secondary">{eyebrow}</span>
      )}
      <Heading className="font-sans font-bold text-3xl sm:text-4xl text-base-content">
        {title}
      </Heading>
      {description && (
        <p className="max-w-2xl text-base-content/70">{description}</p>
      )}
    </div>
  );
}
