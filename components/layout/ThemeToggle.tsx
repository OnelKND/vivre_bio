"use client";

import { useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "vivrebio-theme";
const LIGHT_THEME = "vivrebio";
const DARK_THEME = "vivrebio-dark";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Le thème réel est déjà posé sur <html> par le script anti-flash du
    // layout avant l'hydratation (localStorage, sinon préférence système) ;
    // on ne peut lire cette valeur qu'après le montage sans provoquer un
    // décalage serveur/client (icône par défaut = lune tant que ce n'est
    // pas synchronisé).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.getAttribute("data-theme") === DARK_THEME);
  }, []);

  const toggleTheme = () => {
    const next = isDark ? LIGHT_THEME : DARK_THEME;
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setIsDark(!isDark);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      className="btn btn-ghost btn-circle"
    >
      <i className={`fa-solid ${isDark ? "fa-sun" : "fa-moon"}`} aria-hidden="true" />
    </button>
  );
}
