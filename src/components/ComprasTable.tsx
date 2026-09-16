"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { STATUS_COLORS } from "@/lib/colors";
import { parseMesAno } from "@/lib/parsers";
import { isActiveInMonth, type MonthEntry } from "@/lib/monthlyTimeline";
import type { Compra } from "@/lib/types";

interface ComprasTableProps {
  compras: Compra[];
  titulares: string[];
  tipos: string[];
  timeline: MonthEntry[];
}

type SortField = "data" | "valor";
type SortDir = "asc" | "desc";

const ALL = "Todos";

export function ComprasTable({ compras, titulares, tipos, timeline }: ComprasTableProps) {
  const [titular, setTitular] = useState(ALL);
  const [tipo, setTipo] = useState(ALL);
  const [mesIndex, setMesIndex] = useState<string>(ALL);
  const [busca, setBusca] = useState("");
  const [sortField, setSortField] = useState<SortField>("data");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase();
    const mesSelecionado = mesIndex === ALL ? null : timeline[Number(mesIndex)];

    const result = compras.filter((c) => {
      if (titular !== ALL && c.titular !== titular) return false;
      if (tipo !== ALL && c.tipoCompra !== tipo) return false;
      if (buscaNormalizada && !c.descricao.toLowerCase().includes(buscaNormalizada)) return false;
      if (mesSelecionado && !isActiveInMonth(c, mesSelecionado.date)) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (sortField === "valor") {
        const va = a.valorParcela ?? -Infinity;
        const vb = b.valorParcela ?? -Infinity;
        return (va - vb) * dir;
      }
      const da = parseMesAno(a.mesInicio)?.getTime() ?? 0;
      const db = parseMesAno(b.mesInicio)?.getTime() ?? 0;
      return (da - db) * dir;
    });

    return result;
  }, [compras, titular, tipo, mesIndex, busca, sortField, sortDir, timeline]);

  const selectClass = "text-sm rounded-md px-2 py-1";
  const selectStyle = {
    background: "var(--background)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Lançamentos ({filtered.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição..."
            className={selectClass}
            style={{ ...selectStyle, minWidth: 180 }}
          />
          <select value={mesIndex} onChange={(e) => setMesIndex(e.target.value)} className={selectClass} style={selectStyle}>
            <option value={ALL}>Todos os meses</option>
            {timeline.map((entry, i) => (
              <option key={entry.mes + i} value={i}>
                {entry.mes}
              </option>
            ))}
          </select>
          <select value={titular} onChange={(e) => setTitular(e.target.value)} className={selectClass} style={selectStyle}>
            <option value={ALL}>Todos os titulares</option>
            {titulares.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={selectClass} style={selectStyle}>
            <option value={ALL}>Todos os tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className={selectClass}
            style={selectStyle}
          >
            <option value="data">Ordenar por data</option>
            <option value="valor">Ordenar por valor</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as SortDir)}
            className={selectClass}
            style={selectStyle}
          >
            {sortField === "valor" ? (
              <>
                <option value="desc">Maior valor</option>
                <option value="asc">Menor valor</option>
              </>
            ) : (
              <>
                <option value="desc">Mais recente</option>
                <option value="asc">Mais antigo</option>
              </>
            )}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Titular", "Tipo", "Cartão", "Descrição", "Valor", "Início", "Fim", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left font-medium py-2 pr-4 whitespace-nowrap"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody style={{ fontVariantNumeric: "tabular-nums" }}>
            {filtered.map((c, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="py-2 pr-4 whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                  {c.titular}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                  {c.tipoCompra}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                  {c.cartao}
                </td>
                <td className="py-2 pr-4" style={{ color: "var(--foreground)" }}>
                  {c.descricao}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                  {c.valorParcela !== null ? formatCurrency(c.valorParcela) : "—"}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                  {c.mesInicio}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                  {c.mesFim}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: STATUS_COLORS[c.status] ?? "var(--subtle-foreground)" }}
                    />
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm py-6 text-center" style={{ color: "var(--subtle-foreground)" }}>
            Nenhum lançamento para esse filtro.
          </p>
        )}
      </div>
    </div>
  );
}
