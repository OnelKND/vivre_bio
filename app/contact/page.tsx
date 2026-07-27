import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez VIVRE BIO à Cotonou, Bénin, par téléphone, WhatsApp, email ou via notre formulaire de contact.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-12">
      <div className="flex flex-col gap-6">
        <SectionHeading
          as="h1"
          align="left"
          eyebrow="Contact"
          title="Parlons-en"
          description="Une question sur nos produits, une commande ou un partenariat ? Écrivez-nous."
        />
        <ul className="space-y-3 text-base-content/80">
          <li className="flex items-center gap-3">
            <i className="fa-solid fa-location-dot text-primary w-5" aria-hidden="true" />
            Cotonou, Bénin
          </li>
          <li className="flex items-center gap-3">
            <i className="fa-solid fa-phone text-primary w-5" aria-hidden="true" />
            +229 00 00 00 00
          </li>
          <li className="flex items-center gap-3">
            <i className="fa-brands fa-whatsapp text-primary w-5" aria-hidden="true" />
            +229 00 00 00 00
          </li>
          <li className="flex items-center gap-3">
            <i className="fa-solid fa-envelope text-primary w-5" aria-hidden="true" />
            contact@vivrebio.bj
          </li>
        </ul>
      </div>
      <ContactForm />
    </div>
  );
}
