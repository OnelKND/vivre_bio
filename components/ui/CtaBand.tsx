import Link from "next/link";
import AmbientGlow from "./AmbientGlow";

interface CtaBandProps {
  title: string;
  description?: string;
  href: string;
  label: string;
}

export default function CtaBand({ title, description, href, label }: CtaBandProps) {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-content">
      <AmbientGlow />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 flex flex-col items-center text-center gap-4">
        <h2 className="font-sans font-bold text-2xl sm:text-3xl">{title}</h2>
        {description && <p className="text-primary-content/80">{description}</p>}
        <Link href={href} className="btn btn-accent mt-2">
          {label}
        </Link>
      </div>
    </section>
  );
}
