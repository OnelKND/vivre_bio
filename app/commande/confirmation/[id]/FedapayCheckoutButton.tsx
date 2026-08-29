"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    FedaPay?: {
      init: (selector: string, options: Record<string, unknown>) => void;
    };
  }
}

const CHECKOUT_SCRIPT_SRC = "https://cdn.fedapay.com/checkout.js?v=1.1.7";

export default function FedapayCheckoutButton({
  publicKey,
  sandbox,
  amount,
  orderId,
}: {
  publicKey: string;
  sandbox: boolean;
  amount: number;
  orderId: number;
}) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // Ne pas se fier à la simple présence de la balise <script> : elle peut
    // avoir été ajoutée (par ce composant sur un montage précédent, ou par
    // un autre) sans que le chargement soit terminé — se fier uniquement à
    // `window.FedaPay`, qui n'existe qu'une fois le script exécuté.
    if (window.FedaPay) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScriptLoaded(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    // FedaPay's Checkout.js `init()` attaches its own click listener to the
    // element matching the selector — calling init() from our own onClick
    // handler means the triggering click is already spent and the modal only
    // opens on a second click. Initializing once here (as soon as the script
    // is ready) lets FedaPay's listener handle the very first click.
    // `initialized` guards against a second `init()` call (which would
    // attach a second listener) if this effect ever re-runs.
    if (!scriptLoaded || !window.FedaPay || initialized.current) return;
    initialized.current = true;

    window.FedaPay.init("#fedapay-checkout-trigger", {
      public_key: publicKey,
      environment: sandbox ? "sandbox" : "live",
      transaction: {
        amount,
        description: `Commande VIVRE BIO #${orderId}`,
        custom_metadata: { orderId },
      },
      onComplete: () => {
        // Le statut réel est confirmé par le webhook, pas par ce callback
        // (qui peut se déclencher avant que FedaPay ait notifié le serveur).
        window.location.reload();
      },
    });
  }, [scriptLoaded, publicKey, sandbox, amount, orderId]);

  return (
    <button
      id="fedapay-checkout-trigger"
      type="button"
      disabled={!scriptLoaded}
      className="btn btn-primary btn-lg"
    >
      {scriptLoaded ? "Payer maintenant avec FedaPay" : "Chargement du paiement..."}
    </button>
  );
}
