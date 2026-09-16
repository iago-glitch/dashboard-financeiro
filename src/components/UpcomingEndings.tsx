import { formatCurrency } from "@/lib/format";
import { TITULAR_COLORS } from "@/lib/colors";
import type { ResumoMensal } from "@/lib/types";

interface UpcomingEndingsProps {
  resumo: ResumoMensal[];
  monthsAhead?: number;
}

export function UpcomingEndings({ resumo, monthsAhead = 6 }: UpcomingEndingsProps) {
  const upcoming = resumo.filter((r) => r.terminaTotal > 0).slice(0, monthsAhead);

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h3 className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>
        Compromissos que terminam em breve
      </h3>
      {upcoming.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--subtle-foreground)" }}>
          Nada previsto para encerrar nos próximos meses.
        </p>
      ) : (
        <ul className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {upcoming.map((r) => {
            const titularesEncerrando = Object.entries(r.terminaPorTitular).filter(
              ([, v]) => v > 0
            );
            return (
              <li key={r.mes} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {r.mes}
                  </div>
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
                        {titular}: {formatCurrency(valor)}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-sm font-semibold shrink-0" style={{ color: "var(--foreground)" }}>
                  {formatCurrency(r.terminaTotal)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
