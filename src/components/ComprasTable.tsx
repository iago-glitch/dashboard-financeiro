"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { STATUS_COLORS } from "@/lib/colors";
import type { Compra } from "@/lib/types";

interface ComprasTableProps {
  compras: Compra[];
  titulares: string[];
  tipos: string[];
}

const ALL = "Todos";

export function ComprasTable({ compras, titulares, tipos }: ComprasTableProps) {
  const [titular, setTitular] = useState(ALL);
  const [tipo, setTipo] = useState(ALL);

  const filtered = useMemo(
    () =>
      compras.filter(
        (c) =>
          (titular === ALL || c.titular === titular) && (tipo === ALL || c.tipoCompra === tipo)
      ),
    [compras, titular, tipo]
  );

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Lançamentos ({filtered.length})
        </h3>
        <div className="flex gap-2">
          <select
            value={titular}
            onChange={(e) => setTitular(e.target.value)}
            className="text-sm rounded-md px-2 py-1"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <option value={ALL}>Todos os titulares</option>
            {titulares.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="text-sm rounded-md px-2 py-1"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <option value={ALL}>Todos os tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
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
