"use client";

import { useActionState } from "react";
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from "@/lib/order-status";
import { formatFCFA } from "@/lib/format";
import { trackOrderAction, type TrackOrderState } from "./actions";

const initialState: TrackOrderState = { status: "idle" };

export default function TrackOrderForm() {
  const [state, formAction, pending] = useActionState(trackOrderAction, initialState);

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} className="flex flex-col gap-4 max-w-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="orderId" className="font-medium text-sm">
            Numéro de commande
          </label>
          <input
            id="orderId"
            name="orderId"
            type="number"
            min={1}
            required
            placeholder="Ex : 42"
            className="input border border-base-300 w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="font-medium text-sm">
            Numéro de téléphone utilisé à la commande
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="Ex : 97 00 00 00"
            className="input border border-base-300 w-full"
          />
        </div>

        {state.status === "error" && (
          <p role="alert" className="text-accent text-sm">
            {state.message}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary self-start">
          {pending ? "Recherche..." : "Voir le statut"}
        </button>
      </form>

      {state.status === "success" && state.order && (
        <div className="rounded-box border border-base-300 p-6 max-w-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg">Commande #{state.order.id}</h2>
            <span className="badge badge-primary px-4 py-3 whitespace-nowrap">
              {ORDER_STATUS_LABELS[state.order.status]}
            </span>
          </div>

          <ol className="flex flex-col gap-4 mb-6">
            {ORDER_STATUS_SEQUENCE.map((step, index) => {
              const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(state.order!.status);
              const reached = index <= currentIndex;
              return (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      reached ? "bg-primary text-primary-content" : "bg-base-300 text-base-content/50"
                    }`}
                    aria-hidden="true"
                  >
                    {reached ? <i className="fa-solid fa-check" /> : index + 1}
                  </span>
                  <span className={reached ? "font-medium" : "text-base-content/50"}>
                    {ORDER_STATUS_LABELS[step]}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="border-t border-base-300 pt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-base-content/60">Livraison</span>
              <span>{state.order.deliveryZoneLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content/60">Adresse</span>
              <span className="text-right">{state.order.address}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-base-300">
              <span>Total</span>
              <span>{formatFCFA(state.order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
