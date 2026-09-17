"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/admin/login/actions";
import ThemeToggle from "@/components/layout/ThemeToggle";

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord", icon: "fa-gauge" },
  { href: "/admin/commandes", label: "Commandes", icon: "fa-receipt" },
  { href: "/admin/produits", label: "Produits", icon: "fa-box" },
  { href: "/admin/articles", label: "Articles", icon: "fa-newspaper" },
  { href: "/admin/avis", label: "Avis", icon: "fa-star" },
  { href: "/admin/abonnes", label: "Abonnés", icon: "fa-envelope" },
  { href: "/admin/zones", label: "Zones de livraison", icon: "fa-truck" },
] as const;

export default function AdminSidebar({
  pendingReviewsCount,
}: {
  pendingReviewsCount: number;
}) {
  const pathname = usePathname();

  return (
    <ul className="menu bg-base-100 min-h-full w-64 border-r border-base-300 p-4 gap-1 flex flex-col">
      <li className="menu-title flex-row items-center justify-between">
        <span>Espace VIVRE BIO</span>
        <ThemeToggle
          className="btn btn-ghost btn-circle btn-lg"
          iconClassName="text-2xl"
        />
      </li>
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link href={item.href} className={isActive ? "active" : ""}>
              <i className={`fa-solid ${item.icon} text-lg`} aria-hidden="true" />
              {item.label}
              {item.href === "/admin/avis" && pendingReviewsCount > 0 && (
                <span className="badge badge-accent badge-xs ml-auto">
                  {pendingReviewsCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
      <li className="mt-auto pt-2 border-t border-base-300">
        <form action={logoutAdmin}>
          <button type="submit" className="w-full text-left">
            <i className="fa-solid fa-right-from-bracket text-lg" aria-hidden="true" />
            Déconnexion
          </button>
        </form>
      </li>
    </ul>
  );
}
