"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { CHART_CHROME, hexFor } from "@/lib/colors";
import { useIsDark } from "@/lib/useIsDark";

interface BreakdownBarChartProps {
  title: string;
  data: { name: string; value: number }[];
  colorMap: Record<string, { light: string; dark: string }>;
}

interface TooltipPayloadEntry {
  value: number;
  payload: { name: string };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md px-3 py-2 text-sm shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div style={{ color: "var(--muted-foreground)" }}>{payload[0].payload.name}</div>
      <div className="font-semibold" style={{ color: "var(--foreground)" }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
}

export function BreakdownBarChart({ title, data, colorMap }: BreakdownBarChartProps) {
  const isDark = useIsDark();
  const chrome = isDark ? CHART_CHROME.dark : CHART_CHROME.light;

  const sorted = [...data]
    .sort((a, b) => b.value - a.value)
    .map((item, i) => ({ ...item, color: hexFor(colorMap, item.name, i, isDark) }));

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h3 className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
        {title}
      </h3>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {sorted.map((item) => (
          <span key={item.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: item.color }} />
            {item.name}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={sorted} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={12}>
          <XAxis
            dataKey="name"
            tick={{ fill: chrome.subtleForeground, fontSize: 12 }}
            axisLine={{ stroke: chrome.baseline }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: chrome.subtleForeground, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
            width={64}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: chrome.gridline, opacity: 0.4 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
            {sorted.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
