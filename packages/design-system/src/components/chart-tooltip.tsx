/**
 * ChartTooltip (VYZ-36, item 7 da spec; ADR-0014): a aparência do Tooltip (tooltipStyles),
 * servindo de `content` custom do Tooltip do Recharts — o Recharts posiciona e mostra/esconde
 * (hover, foco por teclado via accessibilityLayer), este componente só renderiza o miolo.
 * Nunca é o único jeito de ler um valor: a legenda e a tabela alternativa sempre têm os números.
 */
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { tooltipStyles } from "./tooltip";

export type ChartTooltipRow = {
  key: string;
  label: ReactNode;
  value: ReactNode;
  /** Cor já resolvida pelo Recharts (o valor passado a stroke/fill de cada série, ex.:
   * "var(--chart-1)"): um traço curto ao lado do valor, nunca uma caixa. */
  color?: string;
};

export type ChartTooltipProps = {
  /** Vem de `active` do Recharts: sem marco em foco/hover, nada é renderizado. */
  active?: boolean;
  label?: ReactNode;
  rows: ChartTooltipRow[];
  className?: string;
};

export function ChartTooltip({ active, label, rows, className }: ChartTooltipProps) {
  if (!active || rows.length === 0) return null;
  return (
    <div
      role="tooltip"
      className={cn(tooltipStyles.content, "flex-col items-start gap-1 py-2", className)}
    >
      {label != null && <p className="text-label-sm text-primary">{label}</p>}
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-1.5 text-body-sm text-secondary">
            {row.color && (
              <span
                aria-hidden
                className="h-0.5 w-3 shrink-0 rounded-full"
                style={{ background: row.color }}
              />
            )}
            <span className="text-primary tabular-nums">{row.value}</span>
            <span>{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Payload de item do Recharts (Tooltip content), sem depender dos tipos internos da lib. */
type RechartsTooltipPayloadEntry = {
  // O Recharts também aceita uma função de acesso em dataKey; nossos gráficos só passam string.
  dataKey?: string | number | ((obj: never) => unknown);
  name?: ReactNode;
  value?: ReactNode;
  color?: string;
};

/** Converte o payload do Recharts em ChartTooltipRow[], para os três gráficos montarem
 * `<Tooltip content={(p) => <ChartTooltip active={p.active} label={p.label} rows={toChartTooltipRows(p.payload)} />} />`. */
export function toChartTooltipRows(
  payload: readonly RechartsTooltipPayloadEntry[] | undefined,
): ChartTooltipRow[] {
  return (payload ?? []).map((entry) => {
    const dataKey = typeof entry.dataKey === "function" ? undefined : entry.dataKey;
    return {
      key: String(dataKey ?? entry.name),
      label: entry.name ?? dataKey,
      value: entry.value,
      color: entry.color,
    };
  });
}
