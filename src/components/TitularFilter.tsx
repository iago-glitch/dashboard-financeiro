"use client";

import { useEffect, useRef, useState } from "react";

interface TitularFilterProps {
  allTitulares: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function TitularFilter({ allTitulares, selected, onChange }: TitularFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelected = allTitulares.length > 0 && selected.length === allTitulares.length;
  const label =
    selected.length === 0
      ? "Nenhum"
      : allSelected
        ? "Todos"
        : selected.join(" + ");

  function toggleTitular(t: string) {
    onChange(selected.includes(t) ? selected.filter((s) => s !== t) : [...selected, t]);
  }

  function toggleAll() {
    onChange(allSelected ? [] : allTitulares);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="text-sm rounded-md px-2 py-1.5 flex items-center gap-1.5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
      >
        <span style={{ color: "var(--muted-foreground)" }}>Titular:</span>
        <span className="font-medium truncate max-w-40">{label}</span>
        <span style={{ color: "var(--subtle-foreground)" }} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 mt-1 rounded-md shadow-sm z-10 py-1 min-w-[180px]"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <label
            className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer"
            style={{ color: "var(--foreground)" }}
          >
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            Todos
          </label>
          <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
          {allTitulares.map((t) => (
            <label
              key={t}
              className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer"
              style={{ color: "var(--foreground)" }}
            >
              <input type="checkbox" checked={selected.includes(t)} onChange={() => toggleTitular(t)} />
              {t}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
