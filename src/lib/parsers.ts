const MONTH_ABBR: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};

const MONTH_LABEL = Object.fromEntries(
  Object.entries(MONTH_ABBR).map(([label, index]) => [index, label])
) as Record<number, string>;

/** Parses a BRL currency string like "R$ 1.234,56" into a number. Returns null for
 * non-numeric placeholders such as "Recorrente" or empty cells. */
export function parseBRL(value: string | undefined | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("R$")) return null;
  const numeric = trimmed
    .replace("R$", "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(numeric);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Parses a "mmm./yyyy" PT-BR abbreviated month (e.g. "out./2026") into a Date
 * (first day of that month). Returns null if the format doesn't match. */
export function parseMesAno(value: string | undefined | null): Date | null {
  if (!value) return null;
  const match = value.trim().toLowerCase().match(/^([a-zç]{3})\.?\/(\d{4})$/);
  if (!match) return null;
  const month = MONTH_ABBR[match[1]];
  if (month === undefined) return null;
  return new Date(Number(match[2]), month, 1);
}

/** Formats a Date back into "mmm./yyyy" PT-BR abbreviated form. */
export function formatMesAno(date: Date): string {
  return `${MONTH_LABEL[date.getMonth()]}./${date.getFullYear()}`;
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
