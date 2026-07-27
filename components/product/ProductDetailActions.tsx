"use client";

import { useState } from "react";
import QuantityInput from "./QuantityInput";
import AddToCartButton from "@/components/cart/AddToCartButton";

export default function ProductDetailActions({ slug }: { slug: string }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex items-center gap-4 mt-2">
      <QuantityInput value={quantity} onChange={setQuantity} min={1} max={20} />
      <AddToCartButton
        slug={slug}
        quantity={quantity}
        fullLabel
        className="flex-1 gap-2"
      />
    </div>
  );
}
