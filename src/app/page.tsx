"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshButton } from "@/components/RefreshButton";
import { StatTile } from "@/components/StatTile";
import { MonthSelector } from "@/components/MonthSelector";
import { IncomeSettingsPanel } from "@/components/IncomeSettingsPanel";
import { MonthlyTrendChart } from "@/components/MonthlyTrendChart";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
import { TopExpenses } from "@/components/TopExpenses";
import { UpcomingEndings } from "@/components/UpcomingEndings";
import { ComprasTable } from "@/components/ComprasTable";
import { formatCurrency } from "@/lib/format";
import { TITULAR_HEX, TIPO_HEX } from "@/lib/colors";
import { useIncomeSettings } from "@/lib/incomeSettings";
import {
  buildMonthlyTimeline,
  computeVariacaoPercentual,
  findCurrentMonthIndex,
  getTopExpenses,
} from "@/lib/monthlyTimeline";
import type { SheetData } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [lastData, setLastData] = useState<SheetData | null>(null);

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

  const timeline = useMemo(() => (data ? buildMonthlyTimeline(data) : []), [data]);

  // Reset the month selection back to the current month whenever fresh data
  // arrives (e.g. after clicking "Atualizar dados") — the React-recommended
  // way to adjust state in response to a prop/derived-value change without
  // doing it inside an effect.
  if (data !== lastData) {
    setLastData(data);
    setManualIndex(null);
  }

  const defaultIndex = timeline.length > 0 ? findCurrentMonthIndex(timeline) : -1;
  const selectedIndex = manualIndex !== null ? manualIndex : defaultIndex;
  const selectedEntry = selectedIndex >= 0 ? (timeline[selectedIndex] ?? null) : null;
  const previousEntry = selectedIndex > 0 ? timeline[selectedIndex - 1] : null;

  const variacao = selectedEntry && previousEntry
    ? computeVariacaoPercentual(selectedEntry.totalGeral, previousEntry.totalGeral)
    : null;

  const [income] = useIncomeSettings();
  const rendaFamiliar = income.iago + income.esposa;
  const despesasDoMes = selectedEntry?.totalGeral ?? 0;
  const rendaConfigurada = rendaFamiliar > 0;
  const percentualComprometido = rendaConfigurada ? (despesasDoMes / rendaFamiliar) * 100 : null;
  const disponivelAposDespesas = rendaConfigurada ? rendaFamiliar - despesasDoMes : null;

  const topExpenses = useMemo(
    () => (data && selectedEntry ? getTopExpenses(data.compras, selectedEntry.date, 10) : []),
    [data, selectedEntry]
  );

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

      {data && selectedEntry && (
        <>
          <IncomeSettingsPanel />

          {/* 1. Visão geral */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Visão geral
              </h2>
              <MonthSelector
                timeline={timeline}
                selectedIndex={selectedIndex}
                onChange={setManualIndex}
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile label="Renda familiar" value={formatCurrency(rendaFamiliar)} hint="Iago + Esposa" />
              <StatTile label="Despesas do mês" value={formatCurrency(despesasDoMes)} hint={selectedEntry.mes} />
              <StatTile
                label="% da renda comprometida"
                value={percentualComprometido === null ? "—" : `${percentualComprometido.toFixed(1)}%`}
                muted={percentualComprometido === null}
                hint={rendaConfigurada ? undefined : "cadastre a renda em Configurações financeiras"}
              />
              <StatTile
                label="Disponível após despesas"
                value={disponivelAposDespesas === null ? "—" : formatCurrency(disponivelAposDespesas)}
                muted={disponivelAposDespesas === null}
                hint={
                  rendaConfigurada
                    ? undefined
                    : "cadastre a renda em Configurações financeiras"
                }
                delta={
                  disponivelAposDespesas !== null && disponivelAposDespesas < 0
                    ? { label: "despesas maiores que a renda", tone: "bad" }
                    : undefined
                }
              />
              <StatTile
                label="Variação vs mês anterior"
                value={variacao === null ? "—" : `${variacao > 0 ? "+" : ""}${variacao.toFixed(1)}%`}
                delta={
                  variacao === null
                    ? undefined
                    : {
                        label: previousEntry ? `vs ${previousEntry.mes}` : "",
                        tone: variacao > 0 ? "bad" : variacao < 0 ? "good" : "neutral",
                      }
                }
                muted={variacao === null}
                hint={variacao === null ? "sem mês anterior para comparar" : undefined}
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
            </div>
          </section>

          {/* 2. Evolução dos gastos */}
          <MonthlyTrendChart timeline={timeline} selectedIndex={selectedIndex} />

          {/* 3. Análise dos gastos */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Análise dos gastos — {selectedEntry.mes}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BreakdownBarChart
                title={`Por titular — ${selectedEntry.mes}`}
                data={data.titulares.map((t) => ({
                  name: t,
                  value: selectedEntry.porTitular[t] ?? 0,
                }))}
                colorMap={TITULAR_HEX}
              />
              <BreakdownBarChart
                title={`Por tipo de gasto — ${selectedEntry.mes}`}
                data={data.tipos.map((t) => ({
                  name: t,
                  value: selectedEntry.porTipo[t] ?? 0,
                }))}
                colorMap={TIPO_HEX}
              />
            </div>
            <TopExpenses items={topExpenses} mes={selectedEntry.mes} />
          </section>

          {/* 4. Compromissos futuros */}
          <UpcomingEndings timeline={timeline} />

          {/* 5. Tabela de lançamentos */}
          <ComprasTable
            compras={data.compras}
            titulares={data.titulares}
            tipos={data.tipos}
            timeline={timeline}
          />
        </>
      )}
    </main>
  );
}
