import { buildWhatsAppLink } from "@/lib/whatsapp";

const DEFAULT_MESSAGE = "Bonjour, je voudrais des informations sur vos produits.";

export default function WhatsAppButton() {
  const href = buildWhatsAppLink(DEFAULT_MESSAGE);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter VIVRE BIO sur WhatsApp"
      className="fixed bottom-5 right-5 z-50 group"
    >
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform group-hover:scale-110">
        <i className="fa-brands fa-whatsapp text-2xl" aria-hidden="true" />
      </span>
    </a>
  );
}
