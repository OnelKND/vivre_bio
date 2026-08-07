import VideoShowcase from "./VideoShowcase";
import type { VideoSlot } from "@/lib/media";

interface ProcessStep {
  slot: VideoSlot;
  icon: string;
  title: string;
  description: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    slot: "recolte",
    icon: "fa-solid fa-seedling",
    title: "Récolte",
    description:
      "Les plantes aromatiques sont récoltées à maturité auprès de producteurs locaux.",
  },
  {
    slot: "distillation",
    icon: "fa-solid fa-flask",
    title: "Distillation",
    description:
      "Chaque lot est distillé ou macéré avec soin pour préserver ses principes actifs.",
  },
  {
    slot: "conditionnement",
    icon: "fa-solid fa-vial",
    title: "Conditionnement",
    description:
      "Les huiles et extraits sont conditionnés en flacon, prêts à être livrés chez vous.",
  },
];

export default function ProcessSteps() {
  return (
    <div className="grid sm:grid-cols-3 gap-8">
      {PROCESS_STEPS.map((step, index) => (
        <div key={step.title} className="flex flex-col items-center text-center gap-4">
          <VideoShowcase slot={step.slot} aspect="square" caption={false} />
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <i className={`${step.icon} text-xl text-primary`} aria-hidden="true" />
          </div>
          <h3 className="font-semibold">
            {index + 1}. {step.title}
          </h3>
          <p className="text-sm text-base-content/70">{step.description}</p>
        </div>
      ))}
    </div>
  );
}
