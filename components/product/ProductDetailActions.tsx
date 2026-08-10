"use client";

import { useState } from "react";
import QuantityInput from "./QuantityInput";
import AddToCartButton from "@/components/cart/AddToCartButton";

export default function ProductDetailActions({ slug, stock }: { slug: string; stock: number }) {
  const [quantity, setQuantity] = useState(1);

  if (stock <= 0) {
    return (
      <AddToCartButton slug={slug} quantity={1} fullLabel disabled className="mt-2 self-start" />
    );
  }

  return (
    <div className="flex items-center gap-4 mt-2">
      <QuantityInput value={quantity} onChange={setQuantity} min={1} max={Math.min(20, stock)} />
      <AddToCartButton
        slug={slug}
        quantity={quantity}
        fullLabel
        className="flex-1 gap-2"
      />
    </div>
  );
}
