"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import CartIcon from "@/components/cart/CartIcon";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-base-100/95 backdrop-blur border-b border-base-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Logo />

          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-8"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-base-content hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CartIcon />
            <button
              type="button"
              className="btn btn-ghost btn-circle md:hidden"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <i
                className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"} text-lg`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            aria-label="Navigation mobile"
            className="md:hidden flex flex-col gap-1 pb-4"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-field px-3 py-2 font-medium hover:bg-base-200 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
