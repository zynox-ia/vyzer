/**
 * Legend (VYZ-36, sem frame no Figma — desenhada a partir de marks-and-anatomy.md da skill
 * dataviz): swatch + rótulo + valor, nunca só a cor. Usada por StackedBarChart e LineChart; o
 * BurnUpChart tem sua própria legenda de papel fixo (Figma 25:3047).
 */
import type { ReactNode } from "react";
import {
  CHART_MARKER_RING_WIDTH,
  LEGEND_SWATCH_INSET,
  LEGEND_SWATCH_RADIUS,
  LEGEND_SWATCH_SIZE,
} from "../lib/chart-geometry";
import { cn } from "../lib/cn";

export type LegendMark = "swatch" | "line";

export type LegendItem = {
  key: string;
  label: string;
  value?: ReactNode;
  /** Cor: nome de variável CSS ("--chart-1") ou um valor já pronto (ex.: "var(--chart-1)", como
   * o Recharts devolve no payload da legenda) — nunca uma cor fixa. */
  colorVar: string;
  /** swatch (padrão): quadrado, para barras/áreas. line: traço, para séries de linha. */
  mark?: LegendMark;
};

/** "--chart-1" vira "var(--chart-1)"; um valor já pronto (do payload do Recharts) passa direto. */
function resolveColor(value: string): string {
  return value.startsWith("--") ? `var(${value})` : value;
}

export type LegendProps = {
  items: LegendItem[];
  /** Isola uma série (fora do escopo desta fase; a API já permite — spec "Comportamento"). */
  onToggleItem?: (key: string) => void;
  /** Hover num item: destaca a série no gráfico e esmaece as outras (skill dataviz,
   * interaction.md). Chamado com `null` ao sair do item. O hover fica na Legend (HTML puro), não
   * no marco do Recharts: um `onMouseEnter`/`onMouseLeave` direto num `Line`/`Bar` do Recharts
   * 3.x mostra um tooltip fantasma no primeiro ponto assim que o gráfico monta (achado da
   * bateria de testes do redesenho, VYZ-36 fase 2). */
  onItemHover?: (key: string | null) => void;
  activeKey?: string | null;
  className?: string;
};

function Swatch({ colorVar, mark = "swatch" }: { colorVar: string; mark?: LegendMark }) {
  const rectSize = LEGEND_SWATCH_SIZE - LEGEND_SWATCH_INSET * 2;
  const lineMid = LEGEND_SWATCH_SIZE / 2;
  return (
    <svg
      width={LEGEND_SWATCH_SIZE}
      height={LEGEND_SWATCH_SIZE}
      viewBox={`0 0 ${LEGEND_SWATCH_SIZE} ${LEGEND_SWATCH_SIZE}`}
      aria-hidden
      className="shrink-0"
      style={{ color: resolveColor(colorVar) }}
    >
      {mark === "line" ? (
        <line
          x1="0"
          y1={lineMid}
          x2={LEGEND_SWATCH_SIZE}
          y2={lineMid}
          stroke="currentColor"
          style={{ strokeWidth: CHART_MARKER_RING_WIDTH }}
          strokeLinecap="round"
        />
      ) : (
        <rect
          x={LEGEND_SWATCH_INSET}
          y={LEGEND_SWATCH_INSET}
          width={rectSize}
          height={rectSize}
          rx={LEGEND_SWATCH_RADIUS}
          fill="currentColor"
        />
      )}
    </svg>
  );
}

/** Cada item é texto + swatch (dataviz: "text never wears the data color"). */
export function Legend({ items, onToggleItem, onItemHover, activeKey, className }: LegendProps) {
  // Com onToggleItem ou onItemHover, o item vira um <button> de verdade — focável de verdade
  // (Tab), não só um span com onMouseEnter: onFocus/onBlur disparam o mesmo destaque que
  // onMouseEnter/onMouseLeave, então quem usa teclado tem o mesmo reforço visual de quem usa
  // mouse (achado da revisão de código, VYZ-36 redesenho r2). aria-pressed só quando o item é
  // alternável de verdade (onToggleItem); um botão só de hover/foco não tem estado pressionado.
  const interactive = Boolean(onToggleItem || onItemHover);
  return (
    <ul className={cn("flex flex-wrap items-center gap-4", className)}>
      {items.map((item) => {
        const muted = activeKey != null && activeKey !== item.key;
        const body = (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-body-sm text-secondary",
              muted && "opacity-inactive",
            )}
          >
            <Swatch colorVar={item.colorVar} mark={item.mark} />
            {item.label}
            {item.value !== undefined && (
              <span className="text-primary tabular-nums">{item.value}</span>
            )}
          </span>
        );
        return (
          <li key={item.key}>
            {interactive ? (
              <button
                type="button"
                onClick={onToggleItem ? () => onToggleItem(item.key) : undefined}
                onMouseEnter={onItemHover ? () => onItemHover(item.key) : undefined}
                onMouseLeave={onItemHover ? () => onItemHover(null) : undefined}
                onFocus={onItemHover ? () => onItemHover(item.key) : undefined}
                onBlur={onItemHover ? () => onItemHover(null) : undefined}
                aria-pressed={onToggleItem ? activeKey === item.key : undefined}
                className="rounded-inline focus-ring"
              >
                {body}
              </button>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
