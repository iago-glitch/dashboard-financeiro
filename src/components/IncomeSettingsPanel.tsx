"use client";

import { CurrencyInput } from "./CurrencyInput";
import { formatCurrency } from "@/lib/format";
import { useIncomeSettings } from "@/lib/incomeSettings";

export function IncomeSettingsPanel() {
  const [income, setIncome] = useIncomeSettings();
  const rendaFamiliar = income.iago + income.esposa;

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Configurações financeiras
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--subtle-foreground)" }}>
          Usada só para calcular o comprometimento da renda abaixo. Fica salva apenas neste
          navegador — nunca vai para a planilha, para o repositório ou para qualquer servidor.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <CurrencyInput
          id="renda-iago"
          label="Iago"
          value={income.iago}
          onChange={(iago) => setIncome({ ...income, iago })}
        />
        <CurrencyInput
          id="renda-esposa"
          label="Esposa"
          value={income.esposa}
          onChange={(esposa) => setIncome({ ...income, esposa })}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Renda familiar
          </span>
          <div
            className="text-sm rounded-md px-2 py-1.5 font-medium"
            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            {formatCurrency(rendaFamiliar)}
          </div>
        </div>
      </div>
      <p className="text-xs" style={{ color: "var(--subtle-foreground)" }}>
        Sua renda é salva apenas neste navegador e não é sincronizada entre dispositivos.
      </p>
    </div>
  );
}
