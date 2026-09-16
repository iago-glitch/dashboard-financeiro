import { formatCurrency } from "@/lib/format";
import { TITULAR_COLORS } from "@/lib/colors";
import type { MonthEntry } from "@/lib/monthlyTimeline";

interface UpcomingEndingsProps {
  timeline: MonthEntry[];
  monthsAhead?: number;
}

export function UpcomingEndings({ timeline, monthsAhead = 6 }: UpcomingEndingsProps) {
  const upcoming = timeline.filter((e) => e.source === "sheet").slice(0, monthsAhead);

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h3 className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
        Planejamento — próximos meses
      </h3>
      <p className="text-xs mb-3" style={{ color: "var(--subtle-foreground)" }}>
        Valor comprometido por mês e quanto disso deixa de existir quando compromissos terminam
      </p>
      {upcoming.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--subtle-foreground)" }}>
          Nada previsto para os próximos meses.
        </p>
      ) : (
        <ul className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {upcoming.map((entry) => {
            const titularesEncerrando = Object.entries(entry.terminaPorTitular).filter(
              ([, v]) => v > 0
            );
            return (
              <li key={entry.mes} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {entry.mes}
                  </div>
                  {titularesEncerrando.length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {titularesEncerrando.map(([titular, valor]) => (
                        <span
                          key={titular}
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{ background: TITULAR_COLORS[titular] }}
                          />
                          {titular}: -{formatCurrency(valor)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs mt-0.5" style={{ color: "var(--subtle-foreground)" }}>
                      Nada termina neste mês
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {formatCurrency(entry.totalGeral)}
                  </div>
                  {entry.terminaTotal > 0 && (
                    <div className="text-xs font-medium" style={{ color: "var(--status-good)" }}>
                      -{formatCurrency(entry.terminaTotal)} a partir do mês seguinte
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
