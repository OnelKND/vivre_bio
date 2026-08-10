"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

interface AddToCartButtonProps {
  slug: string;
  quantity?: number;
  className?: string;
  fullLabel?: boolean;
  disabled?: boolean;
}

export default function AddToCartButton({
  slug,
  quantity = 1,
  className = "",
  fullLabel = false,
  disabled = false,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = () => {
    addToCart(slug, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={disabled ? "Produit épuisé" : "Ajouter au panier"}
      className={`btn btn-primary ${className}`}
    >
      <i
        className={`fa-solid ${justAdded ? "fa-check" : "fa-cart-plus"}`}
        aria-hidden="true"
      />
      {fullLabel && (
        <span>{disabled ? "Épuisé" : justAdded ? "Ajouté" : "Ajouter au panier"}</span>
      )}
    </button>
  );
}
