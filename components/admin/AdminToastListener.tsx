"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

/** Affiche une notif après une redirection post-action admin, puis nettoie l'URL. */
export default function AdminToastListener() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledSearch = useRef<string | null>(null);

  useEffect(() => {
    const currentSearch = window.location.search;
    if (handledSearch.current === currentSearch) return;

    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    const deleted = searchParams.get("deleted");
    const published = searchParams.get("published");
    const unpublished = searchParams.get("unpublished");

    if (!created && !updated && !deleted && !published && !unpublished) return;
    handledSearch.current = currentSearch;

    if (created) toast.success(`"${created}" créé avec succès.`);
    if (updated) toast.success(`"${updated}" mis à jour.`);
    if (deleted) toast.success(`"${deleted}" supprimé.`);
    if (published) toast.success(`"${published}" publié.`);
    if (unpublished) toast.success(`"${unpublished}" repassé en brouillon.`);

    const url = new URL(window.location.href);
    url.searchParams.delete("created");
    url.searchParams.delete("updated");
    url.searchParams.delete("deleted");
    url.searchParams.delete("published");
    url.searchParams.delete("unpublished");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [searchParams, router]);

  return null;
}
