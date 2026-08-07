const ITEMS = [
  {
    icon: "fa-solid fa-leaf",
    title: "100% naturel",
    description: "Plantes aromatiques transformées sans additifs.",
  },
  {
    icon: "fa-solid fa-truck",
    title: "Livraison au Bénin",
    description: "Dans toutes les grandes villes et leur périphérie.",
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="group flex flex-col items-center text-center gap-2"
          >
            <i
              className={`${item.icon} text-2xl text-primary transition-transform duration-300 group-hover:scale-110`}
              aria-hidden="true"
            />
            <p className="font-semibold text-sm">{item.title}</p>
            <p className="text-sm text-base-content/60">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
