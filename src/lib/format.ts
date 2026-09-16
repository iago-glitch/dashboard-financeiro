const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number): string {
  return brlFormatter.format(value);
}

/** Compact currency for tight spaces, e.g. R$ 4,2 mil / R$ 1,2 mi. */
export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace(".", ",")} mil`;
  return formatCurrency(value);
}
