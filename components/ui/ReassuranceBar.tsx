const ITEMS = [
  {
    icon: "fa-solid fa-leaf",
    title: "100% naturel",
    description: "Plantes aromatiques transformées sans additifs.",
  },
  {
    icon: "fa-solid fa-truck",
    title: "Livraison au Bénin",
    description: "Cotonou, sa périphérie et les autres villes.",
  },
  {
    icon: "fa-solid fa-hand-holding-dollar",
    title: "Paiement à la livraison",
    description: "Espèces ou Mobile Money à la réception.",
  },
  {
    icon: "fa-solid fa-seedling",
    title: "Savoir-faire local",
    description: "Une transformation artisanale, du champ au flacon.",
  },
];

export default function ReassuranceBar() {
  return (
    <section
      aria-label="Nos engagements"
      className="border-y border-base-300 bg-base-200/60"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex flex-col items-center text-center gap-2">
            <i className={`${item.icon} text-2xl text-primary`} aria-hidden="true" />
            <p className="font-semibold text-sm">{item.title}</p>
            <p className="text-xs text-base-content/60">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
