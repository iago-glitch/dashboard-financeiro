// Fixed categorical color assignment — never cycled, so the same entity
// always carries the same color across every chart and badge.

interface ModeHex {
  light: string;
  dark: string;
}

export const TITULAR_HEX: Record<string, ModeHex> = {
  Iago: { light: "#2a78d6", dark: "#3987e5" },
  Esposa: { light: "#eb6834", dark: "#d95926" },
  Cícero: { light: "#1baf7a", dark: "#199e70" },
  Sandra: { light: "#eda100", dark: "#c98500" },
  Alessandra: { light: "#e87ba4", dark: "#d55181" },
};

export const TIPO_HEX: Record<string, ModeHex> = {
  Parcelado: { light: "#2a78d6", dark: "#3987e5" },
  "À vista": { light: "#eb6834", dark: "#d95926" },
  Assinatura: { light: "#1baf7a", dark: "#199e70" },
  Combustível: { light: "#eda100", dark: "#c98500" },
};

const FALLBACK_HEX: ModeHex[] = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#eb6834", dark: "#d95926" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#e87ba4", dark: "#d55181" },
  { light: "#008300", dark: "#008300" },
  { light: "#4a3aa7", dark: "#9085e9" },
  { light: "#e34948", dark: "#e66767" },
];

/** Resolves a categorical entity to a literal hex for the given mode — used for
 * Recharts SVG props, which need a concrete color rather than `var(--token)`. */
export function hexFor(
  map: Record<string, ModeHex>,
  key: string,
  fallbackIndex: number,
  isDark: boolean
): string {
  const entry = map[key] ?? FALLBACK_HEX[fallbackIndex % FALLBACK_HEX.length];
  return isDark ? entry.dark : entry.light;
}

export const CHART_CHROME = {
  light: {
    gridline: "#e1e0d9",
    baseline: "#c3c2b7",
    subtleForeground: "#898781",
    surface: "#fcfcfb",
  },
  dark: {
    gridline: "#2c2c2a",
    baseline: "#383835",
    subtleForeground: "#898781",
    surface: "#1a1a19",
  },
};

// CSS custom-property references, for use on plain HTML elements only
// (badges, legend dots) — these resolve correctly via the cascade, unlike
// Recharts' SVG fill/stroke props above.
export const TITULAR_COLORS: Record<string, string> = {
  Iago: "var(--series-1)",
  Esposa: "var(--series-2)",
  Cícero: "var(--series-3)",
  Sandra: "var(--series-4)",
  Alessandra: "var(--series-5)",
};

export const STATUS_COLORS: Record<string, string> = {
  "Em andamento": "var(--status-good)",
  Quitado: "var(--subtle-foreground)",
  Ativa: "var(--series-1)",
};
