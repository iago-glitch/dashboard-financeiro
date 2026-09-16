"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { CHART_CHROME, TITULAR_HEX } from "@/lib/colors";
import { useIsDark } from "@/lib/useIsDark";
import type { ResumoMensal } from "@/lib/types";

interface MonthlyTrendChartProps {
  resumo: ResumoMensal[];
}

interface TooltipPayloadEntry {
  value: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md px-3 py-2 text-sm shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div style={{ color: "var(--muted-foreground)" }}>{label}</div>
      <div className="font-semibold" style={{ color: "var(--foreground)" }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
}

export function MonthlyTrendChart({ resumo }: MonthlyTrendChartProps) {
  const isDark = useIsDark();
  const chrome = isDark ? CHART_CHROME.dark : CHART_CHROME.light;
  const lineColor = isDark ? TITULAR_HEX.Iago.dark : TITULAR_HEX.Iago.light;
  const data = resumo.map((r) => ({ mes: r.mes, total: r.totalGeral }));

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h3 className="text-sm font-medium mb-4" style={{ color: "var(--foreground)" }}>
        Compromisso total por mês (próximos {data.length} meses)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={chrome.gridline} strokeDasharray="0" />
          <XAxis
            dataKey="mes"
            tick={{ fill: chrome.subtleForeground, fontSize: 12 }}
            axisLine={{ stroke: chrome.baseline }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: chrome.subtleForeground, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
            width={72}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 4, fill: lineColor, stroke: chrome.surface, strokeWidth: 2 }}
            activeDot={{ r: 5, stroke: chrome.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
