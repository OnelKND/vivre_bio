import type { Metadata } from "next";
import ProcessSteps from "@/components/ui/ProcessSteps";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import VideoShowcase from "@/components/ui/VideoShowcase";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Découvrez l'histoire et les valeurs de VIVRE BIO, transformateur béninois de plantes aromatiques en huiles essentielles et autres produits naturels bio.",
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
      "Un ancrage local au Bénin, au plus près des producteurs et de nos clients.",
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
      <Reveal>
        <SectionHeading
          as="h1"
          eyebrow="À propos"
          title="Notre histoire"
          description="VIVRE BIO est née d'une conviction simple : la nature béninoise regorge de plantes aromatiques capables d'apporter, une fois transformées avec soin, le meilleur au quotidien."
        />
      </Reveal>

      <Reveal delay={100}>
        <div className="flex flex-col gap-4 max-w-2xl mx-auto text-center text-base-content/80">
          <p>
            Depuis le Bénin, VIVRE BIO transforme des plantes aromatiques
            locales en huiles essentielles, huiles végétales et autres
            produits naturels bio vendus directement en ligne. Notre démarche
            part d&apos;une exigence de qualité et de transparence : chaque
            produit est pensé pour accompagner un mode de vie plus naturel,
            sans intermédiaire superflu entre la plante et votre flacon.
          </p>
          <p>
            Notre slogan, « Le meilleur de la nature pour vous », résume notre
            engagement : offrir des produits naturels premium, accessibles, et
            livrés directement chez nos clients partout au Bénin.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <h2 className="font-bold text-2xl mb-8 text-center">Notre savoir-faire</h2>
          <p className="text-base-content/70 text-center max-w-2xl mx-auto mb-10">
            Trois étapes, une même exigence : préserver le meilleur de chaque
            plante, de la récolte au flacon prêt à être livré.
          </p>
          <ProcessSteps />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <h2 className="font-bold text-2xl mb-8 text-center">En images</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <VideoShowcase slot="distillation" />
            <VideoShowcase slot="conditionnement" />
          </div>
        </div>
      </Reveal>

      <div>
        <Reveal>
          <h2 className="font-bold text-2xl mb-8 text-center">Nos valeurs</h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-8">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={index * 100}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <i className={`${value.icon} text-xl text-primary`} aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{value.title}</h3>
                <p className="text-sm text-base-content/70">{value.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
