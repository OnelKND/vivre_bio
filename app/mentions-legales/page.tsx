import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site VIVRE BIO.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 prose">
      <h1>Mentions légales</h1>
      <p className="text-base-content/60 italic">
        Contenu à finaliser avec VIVRE BIO avant la mise en ligne (raison
        sociale, numéro d&apos;immatriculation, siège social, directeur de
        publication, hébergeur).
      </p>
      <h2>Éditeur du site</h2>
      <p>
        VIVRE BIO — Cotonou, République du Bénin.
        <br />
        Contact : contact@vivrebio.bj
      </p>
      <h2>Hébergement</h2>
      <p>Informations d&apos;hébergement à compléter.</p>
      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus présents sur ce site (textes, images,
        logo) est la propriété de VIVRE BIO, sauf mention contraire, et ne
        peut être reproduit sans autorisation préalable.
      </p>
    </div>
  );
}
