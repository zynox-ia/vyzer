/**
 * Sparkline (Figma 25:5437/25:5438, coluna Status da lista de projetos; ADR-0014): tendência
 * decorativa ao lado de um valor textual — nunca sozinho (docs/specs/fase-9-data-visualization.md,
 * item 3). Variante "line": duas linhas sobrepostas (--hue-indigo atrás, currentColor na frente),
 * como a sparkline real do Linear (conferida ao vivo em 28/09: mesmo par de cores, traço 1,25).
 * Sem eixo nem grade. Miolo em Recharts (LineChart/BarChart num tamanho fixo, sem
 * ResponsiveContainer — é um elemento inline pequeno).
 */
import { Bar, BarChart, Line, LineChart } from "recharts";
import {
  SPARKLINE_BAR_CATEGORY_GAP,
  SPARKLINE_BAR_RADIUS,
  SPARKLINE_HEIGHT,
  SPARKLINE_MARGIN,
  SPARKLINE_WIDTH,
} from "../lib/chart-geometry";
import { cn } from "../lib/cn";
import type { ProgressTone } from "./progress";

export type SparklineVariant = "line" | "bar";

const toneClass: Record<ProgressTone, string> = {
  neutral: "text-secondary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export type SparklineProps = {
  /** Série de valores, do mais antigo ao mais recente. */
  data: number[];
  variant?: SparklineVariant;
  tone?: ProgressTone;
  width?: number;
  height?: number;
  className?: string;
};

/**
 * aria-hidden sempre: o par percentual + tendência (ex.: "33%") já é o texto acessível. Com
 * menos de 2 pontos não há tendência para desenhar — a spec pede oculto (só o valor ao lado).
 * accessibilityLayer desligado: decorativo não deve ser alcançável por Tab (achado do axe).
 * Sem animação: o traço aparece pronto junto do valor, sem atraso de entrada.
 */
export function Sparkline({
  data,
  variant = "line",
  tone = "neutral",
  width = SPARKLINE_WIDTH,
  height = SPARKLINE_HEIGHT,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;
  // A segunda linha (indigo, atrás) é a reta do primeiro ao último valor — a mesma leitura da
  // sparkline do Linear (duas inclinações diferentes), sem inventar uma segunda métrica: é a
  // tendência linear dos mesmos dados, por trás do traço real (currentColor, na frente).
  const first = data[0] ?? 0;
  const last = data.at(-1) ?? 0;
  const rows = data.map((value, index) => ({
    index,
    value,
    trend: first + ((last - first) * index) / (data.length - 1),
  }));

  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 leading-none", toneClass[tone], className)}
      style={{ width, height }}
    >
      {variant === "line" ? (
        <LineChart
          width={width}
          height={height}
          data={rows}
          margin={SPARKLINE_MARGIN}
          accessibilityLayer={false}
        >
          <Line
            dataKey="trend"
            stroke="var(--hue-indigo)"
            style={{ strokeWidth: "var(--chart-sparkline-width)" }}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="value"
            stroke="currentColor"
            style={{ strokeWidth: "var(--chart-sparkline-width)" }}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      ) : (
        <BarChart
          width={width}
          height={height}
          data={rows}
          margin={SPARKLINE_MARGIN}
          barCategoryGap={SPARKLINE_BAR_CATEGORY_GAP}
          accessibilityLayer={false}
        >
          <Bar
            dataKey="value"
            fill="currentColor"
            radius={[SPARKLINE_BAR_RADIUS, SPARKLINE_BAR_RADIUS, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      )}
    </span>
  );
}
