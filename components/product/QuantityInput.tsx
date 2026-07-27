"use client";

interface QuantityInputProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export default function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 20,
  label = "Quantité",
}: QuantityInputProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div className="inline-flex items-center border border-base-300 rounded-field">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Diminuer la quantité"
        className="btn btn-ghost btn-sm px-3"
      >
        <i className="fa-solid fa-minus text-xs" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        className="w-12 text-center bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        min={min}
        max={max}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isNaN(next)) {
            onChange(Math.min(max, Math.max(min, next)));
          }
        }}
      />
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        aria-label="Augmenter la quantité"
        className="btn btn-ghost btn-sm px-3"
      >
        <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
      </button>
    </div>
  );
}
