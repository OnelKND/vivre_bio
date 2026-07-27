"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

export interface CartLine {
  slug: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
}

type CartAction =
  | { type: "add"; slug: string; quantity: number }
  | { type: "setQuantity"; slug: string; quantity: number }
  | { type: "remove"; slug: string }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

const STORAGE_KEY = "vivrebio-cart";

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines };
    case "add": {
      const existing = state.lines.find((line) => line.slug === action.slug);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.slug === action.slug
              ? { ...line, quantity: line.quantity + action.quantity }
              : line
          ),
        };
      }
      return {
        lines: [...state.lines, { slug: action.slug, quantity: action.quantity }],
      };
    }
    case "setQuantity": {
      if (action.quantity <= 0) {
        return { lines: state.lines.filter((line) => line.slug !== action.slug) };
      }
      return {
        lines: state.lines.map((line) =>
          line.slug === action.slug ? { ...line, quantity: action.quantity } : line
        ),
      };
    }
    case "remove":
      return { lines: state.lines.filter((line) => line.slug !== action.slug) };
    case "clear":
      return { lines: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  addToCart: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeFromCart: (slug: string) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const lines = JSON.parse(raw) as CartLine[];
        if (Array.isArray(lines)) {
          dispatch({ type: "hydrate", lines });
        }
      }
    } catch {
      // Stockage corrompu ou indisponible : on repart d'un panier vide.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
  }, [state.lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      addToCart: (slug, quantity = 1) => dispatch({ type: "add", slug, quantity }),
      setQuantity: (slug, quantity) => dispatch({ type: "setQuantity", slug, quantity }),
      removeFromCart: (slug) => dispatch({ type: "remove", slug }),
      clearCart: () => dispatch({ type: "clear" }),
      totalItems: state.lines.reduce((sum, line) => sum + line.quantity, 0),
    }),
    [state.lines]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé à l'intérieur de <CartProvider>");
  }
  return context;
}
