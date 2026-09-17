import type { Metadata } from "next";
import Link from "next/link";
import { getAllDeliveryZones } from "@/lib/delivery-zones";
import DeleteZoneButton from "@/components/admin/DeleteZoneButton";
import { createZoneAction, updateZoneAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zones de livraison — Espace VIVRE BIO",
  robots: { index: false },
};

export default async function AdminZonesPage() {
  const zones = await getAllDeliveryZones();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <Link href="/admin/commandes" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux commandes
      </Link>
      <h1 className="font-bold text-2xl mb-2">Zones de livraison</h1>
      <p className="text-sm text-base-content/60 mb-8">
        Ces zones et leurs frais sont proposés aux clients au moment de la commande.
      </p>

      <div className="flex flex-col gap-3 mb-10">
        {zones.map((zone) => (
          <form
            key={zone.id}
            action={updateZoneAction}
            className="flex flex-wrap items-end gap-3 rounded-box border border-base-300 p-4"
          >
            <input type="hidden" name="id" value={zone.id} />
            <div className="flex flex-col gap-1 flex-1 min-w-[10rem]">
              <label htmlFor={`label-${zone.id}`} className="text-xs font-medium text-base-content/70">
                Nom de la zone
              </label>
              <input
                id={`label-${zone.id}`}
                name="label"
                defaultValue={zone.label}
                required
                className="input input-sm border border-base-300 w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-32">
              <label htmlFor={`fee-${zone.id}`} className="text-xs font-medium text-base-content/70">
                Frais (FCFA)
              </label>
              <input
                id={`fee-${zone.id}`}
                name="fee"
                type="number"
                min={0}
                step={1}
                defaultValue={zone.fee}
                required
                className="input input-sm border border-base-300 w-full"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Enregistrer
            </button>
            <DeleteZoneButton label={zone.label} />
          </form>
        ))}
      </div>

      <div className="rounded-box border border-base-300 p-4">
        <h2 className="font-semibold mb-3">Ajouter une zone</h2>
        <form action={createZoneAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-[10rem]">
            <label htmlFor="new-label" className="text-xs font-medium text-base-content/70">
              Nom de la zone
            </label>
            <input
              id="new-label"
              name="label"
              required
              placeholder="ex : Porto-Novo"
              className="input input-sm border border-base-300 w-full"
            />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label htmlFor="new-fee" className="text-xs font-medium text-base-content/70">
              Frais (FCFA)
            </label>
            <input
              id="new-fee"
              name="fee"
              type="number"
              min={0}
              step={1}
              required
              className="input input-sm border border-base-300 w-full"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Ajouter
          </button>
        </form>
      </div>
    </div>
  );
}
