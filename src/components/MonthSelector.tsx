"use client";

import type { MonthEntry } from "@/lib/monthlyTimeline";

interface MonthSelectorProps {
  timeline: MonthEntry[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function MonthSelector({ timeline, selectedIndex, onChange }: MonthSelectorProps) {
  return (
    <select
      value={selectedIndex}
      onChange={(e) => onChange(Number(e.target.value))}
      className="text-sm rounded-md px-2 py-1.5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
      aria-label="Mês selecionado"
    >
      {timeline.map((entry, i) => (
        <option key={entry.mes + i} value={i}>
          {entry.mes}
          {entry.source === "reconstructed" ? " (estimado)" : ""}
        </option>
      ))}
    </select>
  );
}
