import { TITULARES, TIPOS } from "./googleSheets";
import { formatMesAno, isSameMonth, parseMesAno } from "./parsers";
import type { Compra, ResumoMensal, SheetData } from "./types";

/**
 * A unified monthly timeline, combining:
 * - "sheet" entries: months already aggregated by the spreadsheet's own
 *   formulas (aba "Resumo Mensal"). totalGeral/porTitular/porTipo are
 *   trusted as-is; terminaTotal/terminaParcelado/terminaPorTitular are
 *   always recomputed from the raw purchases (see getEndingInstallments),
 *   not read from the sheet's own "Termina Neste Mês (Total)" /
 *   "Termina - {titular}" columns — those turned out to also count one-off
 *   (À vista/Combustível) purchases disappearing between months, not just
 *   installments reaching their last parcela.
 * - "reconstructed" entries: months before the sheet's window, derived
 *   entirely client-side from the raw "Compras Parceladas" rows, using the
 *   same termina rule as above (a Parcelado item counts as "termina" only
 *   in the exact month its mesFim falls on; Assinatura/À vista/Combustível
 *   never count as "termina").
 *
 * Reconstructed months only go as far back as the earliest `mesInicio` found
 * in the raw data — there is no way to know spending from before the first
 * recorded purchase.
 */
export interface MonthEntry extends ResumoMensal {
  date: Date;
  source: "sheet" | "reconstructed";
}

function isActiveInMonth(compra: Compra, monthDate: Date): boolean {
  const inicio = parseMesAno(compra.mesInicio);
  const fim = parseMesAno(compra.mesFim);
  if (!inicio || !fim) return false;
  return inicio.getTime() <= monthDate.getTime() && monthDate.getTime() <= fim.getTime();
}

function emptyTotals() {
  return {
    porTitular: Object.fromEntries(TITULARES.map((t) => [t, 0])) as Record<string, number>,
    porTipo: Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<string, number>,
  };
}

interface EndingInstallments {
  total: number;
  porTitular: Record<string, number>;
}

/**
 * The real reduction that kicks in the month AFTER `monthDate`: the sum of
 * "Parcelado" installments whose `mesFim` falls exactly on `monthDate`.
 *
 * This is computed directly from "Compras Parceladas" for every month —
 * including months already summarized by the spreadsheet's own "Resumo
 * Mensal" — because the sheet's "Termina Neste Mês (Total)" and
 * "Termina - {titular}" columns turned out to also count one-off (À vista /
 * Combustível) purchases disappearing from one month to the next, not just
 * installments actually reaching their last parcela. Its
 * "Termina Neste Mês (Parcelado)" column IS correct (verified to match this
 * exact computation on live data), but rebuilding it here — the same way
 * for every month regardless of source — keeps a single, auditable rule
 * instead of depending on which spreadsheet column happens to be right.
 * Assinatura (no real end date), À vista and Combustível never contribute.
 */
function getEndingInstallments(compras: Compra[], monthDate: Date): EndingInstallments {
  const porTitular: Record<string, number> = Object.fromEntries(TITULARES.map((t) => [t, 0]));
  let total = 0;
  for (const c of compras) {
    if (c.tipoCompra !== "Parcelado" || c.valorParcela === null) continue;
    const fim = parseMesAno(c.mesFim);
    if (fim && isSameMonth(fim, monthDate)) {
      total += c.valorParcela;
      if (c.titular in porTitular) porTitular[c.titular] += c.valorParcela;
    }
  }
  return { total, porTitular };
}

function reconstructMonth(compras: Compra[], monthDate: Date): MonthEntry {
  const { porTitular, porTipo } = emptyTotals();
  let totalGeral = 0;

  for (const c of compras) {
    if (c.valorParcela === null || !isActiveInMonth(c, monthDate)) continue;
    totalGeral += c.valorParcela;
    if (c.titular in porTitular) porTitular[c.titular] += c.valorParcela;
    if (c.tipoCompra in porTipo) porTipo[c.tipoCompra] += c.valorParcela;
  }

  const { total: terminaTotal, porTitular: terminaPorTitular } = getEndingInstallments(
    compras,
    monthDate
  );

  return {
    mes: formatMesAno(monthDate),
    date: monthDate,
    totalGeral,
    porTitular,
    porTipo,
    terminaTotal,
    terminaParcelado: terminaTotal,
    terminaPorTitular,
    source: "reconstructed",
  };
}

/** Builds the full timeline: reconstructed past months (as far back as the
 * data allows) followed by every month already present in "Resumo Mensal". */
export function buildMonthlyTimeline(data: SheetData): MonthEntry[] {
  const sheetEntries: MonthEntry[] = data.resumo.flatMap((r) => {
    const date = parseMesAno(r.mes);
    if (!date) return [];
    // totalGeral/porTitular/porTipo are plain sums, trusted as-is from the
    // sheet — but terminaTotal/terminaPorTitular are always recomputed from
    // the raw purchases (see getEndingInstallments) rather than trusting the
    // sheet's "Termina Neste Mês (Total)" / "Termina - {titular}" columns.
    const { total: terminaTotal, porTitular: terminaPorTitular } = getEndingInstallments(
      data.compras,
      date
    );
    return [
      {
        ...r,
        date,
        source: "sheet" as const,
        terminaTotal,
        terminaParcelado: terminaTotal,
        terminaPorTitular,
      },
    ];
  });

  if (sheetEntries.length === 0) return sheetEntries;

  const earliestSheetDate = sheetEntries[0].date;

  const compraStartDates = data.compras.flatMap((c) => {
    const d = parseMesAno(c.mesInicio);
    return d ? [d] : [];
  });

  if (compraStartDates.length === 0) return sheetEntries;

  const earliestComprasDate = compraStartDates.reduce((min, d) => (d < min ? d : min));

  const reconstructed: MonthEntry[] = [];
  const cursor = new Date(earliestComprasDate);
  while (cursor.getTime() < earliestSheetDate.getTime()) {
    reconstructed.push(reconstructMonth(data.compras, new Date(cursor)));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return [...reconstructed, ...sheetEntries];
}

/** Index of the real current month in the timeline, falling back to the
 * first "sheet" entry (the month the spreadsheet itself treats as current)
 * if today doesn't match any entry. */
export function findCurrentMonthIndex(timeline: MonthEntry[]): number {
  const today = new Date();
  const exact = timeline.findIndex((e) => isSameMonth(e.date, today));
  if (exact !== -1) return exact;
  const firstSheet = timeline.findIndex((e) => e.source === "sheet");
  return firstSheet !== -1 ? firstSheet : 0;
}

export function computeVariacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

/** Sums a month's per-titular breakdown over a subset of titulares — used to
 * scope "Visão geral" to one or more selected titulares without needing a
 * separate reconstruction path (every MonthEntry already carries porTitular,
 * whether it came from the sheet or was reconstructed). */
export function sumPorTitulares(
  porTitular: Record<string, number>,
  titulares: string[]
): number {
  return titulares.reduce((sum, t) => sum + (porTitular[t] ?? 0), 0);
}

export function computeMediaMensal(entries: MonthEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, e) => sum + e.totalGeral, 0) / entries.length;
}

export interface DespesaItem {
  descricao: string;
  titular: string;
  tipoCompra: string;
  cartao: string;
  valor: number;
}

/** The N largest expenses active in a given month, by installment/charge
 * value (not the purchase's total value) — i.e. what actually weighs on
 * that specific month. */
export function getTopExpenses(compras: Compra[], monthDate: Date, limit = 10): DespesaItem[] {
  return compras
    .filter((c) => c.valorParcela !== null && isActiveInMonth(c, monthDate))
    .map((c) => ({
      descricao: c.descricao,
      titular: c.titular,
      tipoCompra: c.tipoCompra,
      cartao: c.cartao,
      valor: c.valorParcela as number,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limit);
}

export { isActiveInMonth };
