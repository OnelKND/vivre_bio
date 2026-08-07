import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isSessionTokenValid } from "@/lib/admin-auth";
import {
  listOrdersForExport,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/orders";

// Jamais mis en cache : c'est un export de données à la demande.
export const dynamic = "force-dynamic";

/** Échappe une valeur pour une cellule CSV (RFC 4180). */
function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsvRow(values: (string | number)[]): string {
  return values.map(csvCell).join(",") + "\r\n";
}

export async function GET(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  if (!isSessionTokenValid(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const statutParam = searchParams.get("statut");
  const status =
    statutParam && statutParam !== "toutes" ? (statutParam as OrderStatus) : undefined;

  const orders = listOrdersForExport({ status, from, to });

  const header = toCsvRow([
    "N° commande",
    "Date",
    "Client",
    "Téléphone",
    "Adresse",
    "Zone de livraison",
    "Produits",
    "Sous-total (FCFA)",
    "Livraison (FCFA)",
    "Total (FCFA)",
    "Statut",
  ]);

  const rows = orders
    .map((order) =>
      toCsvRow([
        order.id,
        new Date(order.createdAt).toLocaleString("fr-FR"),
        order.customerName,
        order.phone,
        order.address,
        order.deliveryZoneLabel,
        order.items.map((item) => `${item.quantity} x ${item.name}`).join("; "),
        order.subtotal,
        order.deliveryFee,
        order.total,
        ORDER_STATUS_LABELS[order.status],
      ])
    )
    .join("");

  // BOM UTF-8 : sans ça, Excel affiche mal les accents.
  const csv = "﻿" + header + rows;

  const filenameParts = ["commandes", from, to].filter(Boolean);
  const filename = `${filenameParts.join("_")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
