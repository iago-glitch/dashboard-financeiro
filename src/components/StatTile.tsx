interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  accentColor?: string;
}

export function StatTile({ label, value, hint, accentColor }: StatTileProps) {
  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-1"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2">
        {accentColor && (
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: accentColor }}
          />
        )}
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
      </div>
      <span className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
        {value}
      </span>
      {hint && (
        <span className="text-xs" style={{ color: "var(--subtle-foreground)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}
