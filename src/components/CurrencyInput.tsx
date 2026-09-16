"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

interface CurrencyInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function parseInput(raw: string): number {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

export function CurrencyInput({ id, label, value, onChange }: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const [lastValue, setLastValue] = useState(value);

  // Keep the draft synced with external value changes while the field isn't
  // being edited (adjusting state during render, React's recommended way to
  // avoid doing this inside an effect).
  if (!focused && value !== lastValue) {
    setLastValue(value);
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={focused ? draft : formatCurrency(value)}
        onFocus={() => {
          setFocused(true);
          setDraft(value === 0 ? "" : String(value).replace(".", ","));
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setFocused(false);
          const parsed = parseInput(draft);
          setLastValue(parsed);
          onChange(parsed);
        }}
        className="text-sm rounded-md px-2 py-1.5"
        style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
        placeholder="R$ 0,00"
      />
    </div>
  );
}
