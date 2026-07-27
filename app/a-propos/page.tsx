import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Découvrez l'histoire et les valeurs de VIVRE BIO, transformateur béninois de plantes aromatiques en huiles essentielles et extraits naturels.",
};

const VALUES = [
  {
    icon: "fa-solid fa-leaf",
    title: "Naturalité",
    description:
      "Des plantes aromatiques transformées sans additifs superflus, pour préserver leurs bienfaits.",
  },
  {
    icon: "fa-solid fa-handshake",
    title: "Proximité",
    description:
      "Un ancrage local à Cotonou, au plus près des producteurs et de nos clients.",
  },
  {
    icon: "fa-solid fa-gem",
    title: "Exigence",
    description:
      "Un savoir-faire artisanal appliqué avec la même rigueur à chaque lot produit.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 flex flex-col gap-16">
      <SectionHeading
        as="h1"
        eyebrow="À propos"
        title="Notre histoire"
        description="VIVRE BIO est née d'une conviction simple : la nature béninoise regorge de plantes aromatiques capables d'apporter, une fois transformées avec soin, le meilleur au quotidien."
      />

      <div className="prose max-w-none text-base-content/80">
        <p>
          Depuis Cotonou, VIVRE BIO transforme des plantes aromatiques
          locales en huiles essentielles et extraits naturels vendus
          directement en ligne. Notre démarche part d&apos;une exigence de
          qualité et de transparence : chaque produit est pensé pour
          accompagner un mode de vie plus naturel, sans intermédiaire
          superflu entre la plante et votre flacon.
        </p>
        <p>
          Notre slogan, « Le meilleur de la nature pour vous », résume notre
          engagement : offrir des produits naturels premium, accessibles, et
          livrés directement chez nos clients partout au Bénin.
        </p>
      </div>

      <div>
        <h2 className="font-bold text-2xl mb-8 text-center">Nos valeurs</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {VALUES.map((value) => (
            <div key={value.title} className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <i className={`${value.icon} text-xl text-primary`} aria-hidden="true" />
              </div>
              <h3 className="font-semibold">{value.title}</h3>
              <p className="text-sm text-base-content/70">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
