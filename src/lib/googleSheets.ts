import { parseBRL } from "./parsers";
import type { Compra, ResumoMensal, SheetData, TipoCompra } from "./types";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

const COMPRAS_SHEET = "Compras Parceladas";
const RESUMO_SHEET = "Resumo Mensal";

const TITULARES = ["Iago", "Esposa", "Cícero", "Sandra", "Alessandra"];
const TIPOS: TipoCompra[] = ["Parcelado", "À vista", "Assinatura", "Combustível"];

async function fetchRange(
  spreadsheetId: string,
  apiKey: string,
  sheetName: string,
  a1Range: string
): Promise<string[][]> {
  const range = `'${sheetName}'!${a1Range}`;
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const reason = body?.error?.message ?? res.statusText;
    throw new Error(`Falha ao ler a aba "${sheetName}": ${reason}`);
  }
  const data = (await res.json()) as { values?: string[][] };
  return data.values ?? [];
}

/** Finds the header row (matched by its first cell) and returns the data rows
 * beneath it, stopping at the first row whose first cell is blank. */
function extractTable(rows: string[][], headerMarker: string) {
  const headerIndex = rows.findIndex((row) => row[0]?.trim() === headerMarker);
  if (headerIndex === -1) {
    throw new Error(`Cabeçalho "${headerMarker}" não encontrado na planilha.`);
  }
  const header = rows[headerIndex].map((cell) => cell.trim());
  const dataRows: string[][] = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]?.trim()) break;
    dataRows.push(row);
  }
  return { header, dataRows };
}

function rowsToObjects(header: string[], dataRows: string[][]): Record<string, string>[] {
  return dataRows.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = (row[i] ?? "").trim();
    });
    return obj;
  });
}

function parseCompras(rows: string[][]): Compra[] {
  const { header, dataRows } = extractTable(rows, "Titular");
  return rowsToObjects(header, dataRows).map((o) => {
    const valorTotalRaw = o["Valor Total da Compra"];
    const mesesRestantesRaw = o["Meses Restantes"];
    return {
      titular: o["Titular"],
      tipoCompra: o["Tipo de Compra"] as TipoCompra,
      cartao: o["Cartão"],
      descricao: o["Descrição"],
      valorParcela: parseBRL(o["Valor da Parcela/Mensalidade"]),
      qtdParcelas: o["Qtd. Parcelas"] ? Number(o["Qtd. Parcelas"]) : null,
      mesInicio: o["Mês da 1ª Parcela / Início"],
      mesFim: o["Mês da Última Parcela"],
      valorTotal: parseBRL(valorTotalRaw),
      isRecorrente: valorTotalRaw?.trim() === "Recorrente",
      mesesRestantes:
        mesesRestantesRaw && mesesRestantesRaw !== "Recorrente"
          ? Number(mesesRestantesRaw)
          : null,
      status: o["Status"],
    };
  });
}

function parseResumo(rows: string[][]): ResumoMensal[] {
  const { header, dataRows } = extractTable(rows, "Mês");
  return rowsToObjects(header, dataRows).map((o) => ({
    mes: o["Mês"],
    totalGeral: parseBRL(o["Total Geral"]) ?? 0,
    porTitular: Object.fromEntries(TITULARES.map((t) => [t, parseBRL(o[t]) ?? 0])),
    porTipo: Object.fromEntries(TIPOS.map((t) => [t, parseBRL(o[t]) ?? 0])),
    terminaTotal: parseBRL(o["Termina Neste Mês (Total)"]) ?? 0,
    terminaParcelado: parseBRL(o["Termina Neste Mês (Parcelado)"]) ?? 0,
    terminaPorTitular: Object.fromEntries(
      TITULARES.map((t) => [t, parseBRL(o[`Termina - ${t}`]) ?? 0])
    ),
  }));
}

export async function fetchSheetData(
  spreadsheetId: string,
  apiKey: string
): Promise<SheetData> {
  const [comprasRows, resumoRows] = await Promise.all([
    fetchRange(spreadsheetId, apiKey, COMPRAS_SHEET, "A1:K300"),
    fetchRange(spreadsheetId, apiKey, RESUMO_SHEET, "A1:R60"),
  ]);

  const compras = parseCompras(comprasRows);
  const resumo = parseResumo(resumoRows);

  const titulares = Array.from(new Set(compras.map((c) => c.titular))).sort();
  const cartoes = Array.from(new Set(compras.map((c) => c.cartao))).sort();
  const tipos = Array.from(new Set(compras.map((c) => c.tipoCompra))).sort() as TipoCompra[];

  return {
    compras,
    resumo,
    titulares,
    cartoes,
    tipos,
    fetchedAt: new Date().toISOString(),
  };
}
