const currencyFormatter = new Intl.NumberFormat("fr-BJ", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0,
});

export function formatFCFA(amount: number): string {
  return currencyFormatter.format(amount);
}
