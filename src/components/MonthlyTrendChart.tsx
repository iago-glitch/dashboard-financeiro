"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { CHART_CHROME, TITULAR_HEX } from "@/lib/colors";
import { useIsDark } from "@/lib/useIsDark";
import { computeMediaMensal, type MonthEntry } from "@/lib/monthlyTimeline";

interface MonthlyTrendChartProps {
  timeline: MonthEntry[];
  selectedIndex: number;
}

interface TooltipPayloadEntry {
  value: number;
  payload: { source: "sheet" | "reconstructed" };
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
  const isReconstructed = payload[0].payload.source === "reconstructed";
  return (
    <div
      className="rounded-md px-3 py-2 text-sm shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div style={{ color: "var(--muted-foreground)" }}>{label}</div>
      <div className="font-semibold" style={{ color: "var(--foreground)" }}>
        {formatCurrency(payload[0].value)}
      </div>
      {isReconstructed && (
        <div className="text-xs mt-0.5" style={{ color: "var(--subtle-foreground)" }}>
          estimado a partir dos lançamentos
        </div>
      )}
    </div>
  );
}

export function MonthlyTrendChart({ timeline, selectedIndex }: MonthlyTrendChartProps) {
  const isDark = useIsDark();
  const chrome = isDark ? CHART_CHROME.dark : CHART_CHROME.light;
  const lineColor = isDark ? TITULAR_HEX.Iago.dark : TITULAR_HEX.Iago.light;
  const media = computeMediaMensal(timeline);

  const data = timeline.map((entry, i) => ({
    mes: entry.mes,
    total: entry.totalGeral,
    source: entry.source,
    isSelected: i === selectedIndex,
  }));

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h3 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Evolução mensal ({data.length} meses)
        </h3>
        <span className="text-xs" style={{ color: "var(--subtle-foreground)" }}>
          Média do período: {formatCurrency(media)}
        </span>
      </div>
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
          <ReferenceLine
            y={media}
            stroke={chrome.subtleForeground}
            strokeWidth={1}
            ifOverflow="extendDomain"
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke={lineColor}
            strokeWidth={2}
            dot={(props: { cx?: number; cy?: number; payload?: { isSelected?: boolean } }) => {
              const { cx, cy, payload } = props;
              if (cx === undefined || cy === undefined) return <g key={`dot-${cx}-${cy}`} />;
              const isSelected = payload?.isSelected;
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6 : 3}
                  fill={lineColor}
                  stroke={chrome.surface}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 5, stroke: chrome.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
