"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshButton } from "@/components/RefreshButton";
import { StatTile } from "@/components/StatTile";
import { MonthlyTrendChart } from "@/components/MonthlyTrendChart";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
import { UpcomingEndings } from "@/components/UpcomingEndings";
import { ComprasTable } from "@/components/ComprasTable";
import { formatCurrency } from "@/lib/format";
import { TITULAR_HEX, TIPO_HEX } from "@/lib/colors";
import type { SheetData } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sheet-data");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao buscar dados.");
      setData(json as SheetData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount needs to flip the loading flag synchronously so the
    // "Carregando..." state shows immediately.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const mesAtual = data?.resumo[0];

  return (
    <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
            Dashboard Financeiro
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Compras parceladas, assinaturas e combustível — direto da planilha
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-xs" style={{ color: "var(--subtle-foreground)" }}>
              Atualizado às{" "}
              {new Date(data.fetchedAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <RefreshButton onRefresh={load} loading={loading} />
        </div>
      </header>

      {error && (
        <div
          className="rounded-lg p-4 text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--status-critical)", color: "var(--status-critical)" }}
        >
          {error}
        </div>
      )}

      {!data && loading && (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Carregando dados da planilha...
        </p>
      )}

      {data && mesAtual && (
        <>
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile label="Total do mês" value={formatCurrency(mesAtual.totalGeral)} hint={mesAtual.mes} />
            <StatTile
              label="Termina este mês"
              value={formatCurrency(mesAtual.terminaTotal)}
              hint="compromissos quitados"
            />
            <StatTile
              label="Lançamentos ativos"
              value={String(
                data.compras.filter((c) => c.status === "Em andamento" || c.status === "Ativa").length
              )}
            />
            <StatTile
              label="Assinaturas ativas"
              value={String(data.compras.filter((c) => c.tipoCompra === "Assinatura").length)}
            />
          </section>

          <MonthlyTrendChart resumo={data.resumo} />

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BreakdownBarChart
              title={`Por titular — ${mesAtual.mes}`}
              data={data.titulares.map((t) => ({
                name: t,
                value: mesAtual.porTitular[t] ?? 0,
              }))}
              colorMap={TITULAR_HEX}
            />
            <BreakdownBarChart
              title={`Por tipo de gasto — ${mesAtual.mes}`}
              data={data.tipos.map((t) => ({
                name: t,
                value: mesAtual.porTipo[t] ?? 0,
              }))}
              colorMap={TIPO_HEX}
            />
          </section>

          <UpcomingEndings resumo={data.resumo} />

          <ComprasTable compras={data.compras} titulares={data.titulares} tipos={data.tipos} />
        </>
      )}
    </main>
  );
}
