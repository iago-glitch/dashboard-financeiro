import { formatCurrency } from "@/lib/format";
import { TITULAR_COLORS } from "@/lib/colors";
import type { DespesaItem } from "@/lib/monthlyTimeline";

interface TopExpensesProps {
  items: DespesaItem[];
  mes: string;
}

export function TopExpenses({ items, mes }: TopExpensesProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h3 className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>
        Maiores despesas — {mes}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--subtle-foreground)" }}>
          Nenhum lançamento neste mês.
        </p>
      ) : (
        <ol className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {items.map((item, i) => (
            <li key={`${item.descricao}-${i}`} className="py-2 flex items-center gap-3">
              <span
                className="text-xs w-5 shrink-0 text-right"
                style={{ color: "var(--subtle-foreground)", fontVariantNumeric: "tabular-nums" }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate" style={{ color: "var(--foreground)" }}>
                  {item.descricao}
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: TITULAR_COLORS[item.titular] ?? "var(--subtle-foreground)" }}
                  />
                  {item.titular} · {item.tipoCompra}
                </div>
              </div>
              <span
                className="text-sm font-semibold shrink-0"
                style={{ color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}
              >
                {formatCurrency(item.valor)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
