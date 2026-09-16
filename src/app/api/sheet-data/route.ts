import { NextResponse } from "next/server";
import { fetchSheetData } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!apiKey || !spreadsheetId) {
    return NextResponse.json(
      {
        error:
          "Configuração ausente: defina GOOGLE_SHEETS_API_KEY e GOOGLE_SPREADSHEET_ID em .env.local e reinicie o servidor.",
      },
      { status: 500 }
    );
  }

  try {
    const data = await fetchSheetData(spreadsheetId, apiKey);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao buscar a planilha.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
