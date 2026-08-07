"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import CartIcon from "@/components/cart/CartIcon";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/blog", label: "Blog" },
  { href: "/a-propos", label: "À propos" },
  { href: "/suivi-commande", label: "Suivre ma commande" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 300, damping: 30 };

  return (
    <header className="sticky top-0 z-50">
      <motion.div
        animate={{
          paddingTop: scrolled ? 8 : 16,
          paddingBottom: scrolled ? 8 : 16,
          boxShadow: scrolled
            ? "0 4px 20px -8px rgba(0,0,0,0.15)"
            : "0 0 0 0 rgba(0,0,0,0)",
        }}
        transition={springTransition}
        className="relative w-full bg-base-100/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between">
          <Logo />

          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-1"
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    isActive ? "text-primary" : "text-base-content hover:text-primary"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-primary/10"
                      transition={springTransition}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CartIcon />
            <div className="hidden sm:block h-6 w-px bg-base-300 mx-1" aria-hidden="true" />
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

        <div
          className={`md:hidden grid transition-all duration-300 ease-in-out ${
            menuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <nav
            aria-label="Navigation mobile"
            className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col gap-1 pb-4 overflow-hidden"
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-field px-3 py-2 font-medium transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-base-200"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bordure basse en dégradé, sur toute la largeur. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-primary/40 via-accent/40 to-secondary/40"
        />
      </motion.div>
    </header>
  );
}
