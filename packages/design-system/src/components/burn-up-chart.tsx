/**
 * BurnUpChart (Figma 25:3040/25:3047-25:3130; ADR-0014): progresso de projeto ou ciclo. Três
 * séries de papel fixo — Scope (linha neutra, teto), Started (--hue-amber) e Completed
 * (--hue-indigo) — não é um componente de séries genéricas: as cores são fixas por papel, não vêm
 * da paleta categórica (item 4 da spec). Miolo em Recharts (ComposedChart), com eixo X em escala
 * de tempo real (para a hachura de fim de semana), preenchimento em gradiente e as três linhas
 * sólidas em 1,5 px, como o gráfico real do Linear — conferido ao vivo em 28/09 e na revisão de
 * fidelidade. Sem grade: medido ao vivo no card Progress real (28/09), as únicas "gridlines" do
 * Linear são hairlines quase invisíveis, sem função de leitura. Tabela alternativa sempre
 * disponível, atrás de um menu "…" discreto ("View as table") — nem todo leitor navega um SVG de
 * gráfico ponto a ponto, mas o botão visível de texto poluía a composição (achado do redesenho,
 * VYZ-36 fase 2).
 */
import { ChartNoAxesCombined, Ellipsis, Table2 } from "lucide-react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import {
  Area,
  ComposedChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "../lib/cn";
import {
  BURN_UP_LEGEND_SWATCH_RADIUS,
  BURN_UP_LEGEND_SWATCH_SIZE,
  CHART_MARGIN,
  CHART_MARKER_RADIUS,
  CHART_MARKER_RING_WIDTH,
  WEEKEND_PATTERN_HEIGHT,
  WEEKEND_PATTERN_ROTATION_DEG,
  WEEKEND_PATTERN_WIDTH,
} from "../lib/chart-geometry";
import { MONTHS_SHORT } from "../lib/date-value";
import { IconButton } from "./button";
import { ChartTooltip, toChartTooltipRows } from "./chart-tooltip";
import { EmptyState } from "./empty-state";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type BurnUpPoint = {
  /** Data ISO ("AAAA-MM-DD"); o eixo X formata para um rótulo curto (ex.: "Sep 1"). */
  date: string;
  scope: number;
  started: number;
  completed: number;
};

export type BurnUpChartProps = {
  data: BurnUpPoint[];
  /** Nome acessível (ex.: "Zynox OS progress"), usado na legenda da tabela alternativa. */
  label: string;
  className?: string;
};

const DAY_MS = 86_400_000;

/** "AAAA-MM-DD" em timestamp UTC à meia-noite — sem deslocamento de fuso horário. */
function parseISODate(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Sábados e domingos entre o início e o fim, mesclados em faixas contínuas — como o eixo de
 * calendário real do Linear, independente de quantos pontos de dado existem entre eles. */
function weekendBands(minTs: number, maxTs: number): [number, number][] {
  const bands: [number, number][] = [];
  const startDay = Math.floor(minTs / DAY_MS) * DAY_MS;
  const endDay = Math.floor(maxTs / DAY_MS) * DAY_MS;
  let bandStart: number | null = null;
  for (let day = startDay; day <= endDay; day += DAY_MS) {
    const isWeekend = [0, 6].includes(new Date(day).getUTCDay());
    if (isWeekend && bandStart === null) bandStart = day;
    if (!isWeekend && bandStart !== null) {
      bands.push([bandStart, day]);
      bandStart = null;
    }
  }
  if (bandStart !== null) bands.push([bandStart, endDay + DAY_MS]);
  return bands;
}

/** Esc fecha o tooltip: o Recharts abre por hover/teclado (accessibilityLayer), mas não tem um
 * fechamento nativo por Esc — perder o foco do gráfico zera o estado de interação por teclado. */
function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") (document.activeElement as HTMLElement | null)?.blur();
}

export function BurnUpChart({ data, label, className }: BurnUpChartProps) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const uid = useId().replaceAll(/[^a-zA-Z0-9]/g, "");
  const last = data.at(-1);

  // Hooks sempre na mesma ordem, mesmo com data=[] (regra dos hooks do React): o cálculo abaixo é
  // barato em cima de um array vazio, então o `return` do estado vazio vem depois deles.
  const chartData = useMemo(() => data.map((d) => ({ ...d, ts: parseISODate(d.date) })), [data]);
  const firstPoint = chartData[0];
  const lastPoint = chartData.at(-1);
  const weekends = useMemo(() => {
    if (!firstPoint || !lastPoint) return [];
    return weekendBands(firstPoint.ts, lastPoint.ts);
  }, [firstPoint, lastPoint]);
  // Só início e fim do período, como o eixo X do Linear real — tickCount deixava de rotular a
  // data inicial verdadeira (achado da revisão de fidelidade).
  const axisTicks = firstPoint && lastPoint ? [firstPoint.ts, lastPoint.ts] : undefined;

  if (data.length === 0) {
    return (
      <EmptyState icon={ChartNoAxesCombined} title="No progress yet" className={className}>
        Scope, Started and Completed appear here once the project has issues.
      </EmptyState>
    );
  }

  const legend = [
    { key: "scope", label: "Scope", value: last?.scope ?? 0, className: "text-tertiary" },
    { key: "started", label: "Started", value: last?.started ?? 0, className: "text-amber" },
    { key: "completed", label: "Completed", value: last?.completed ?? 0, className: "text-indigo" },
  ];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-6">
          {legend.map((item) => (
            <div key={item.key} className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5 text-body-sm text-secondary">
                <svg
                  width={BURN_UP_LEGEND_SWATCH_SIZE}
                  height={BURN_UP_LEGEND_SWATCH_SIZE}
                  viewBox={`0 0 ${BURN_UP_LEGEND_SWATCH_SIZE} ${BURN_UP_LEGEND_SWATCH_SIZE}`}
                  aria-hidden
                  className={cn("shrink-0", item.className)}
                >
                  <rect
                    width={BURN_UP_LEGEND_SWATCH_SIZE}
                    height={BURN_UP_LEGEND_SWATCH_SIZE}
                    rx={BURN_UP_LEGEND_SWATCH_RADIUS}
                    fill="currentColor"
                  />
                </svg>
                {item.label}
              </span>
              <span className="text-body-sm text-primary tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
        <Menu>
          <MenuTrigger asChild>
            <IconButton icon={Ellipsis} label="Chart options" tone="subtle" size="sm" />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem icon={Table2} onSelect={() => setShowTable((v) => !v)}>
              {showTable ? "Show chart" : "View as table"}
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>

      {showTable ? (
        <Table label={label} aria-describedby={tableId}>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.date}>
                <TableCell className="text-primary">
                  {formatShortDate(parseISODate(d.date))}
                </TableCell>
                <TableCell className="tabular-nums">{d.scope}</TableCell>
                <TableCell className="tabular-nums">{d.started}</TableCell>
                <TableCell className="tabular-nums">{d.completed}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
        <div onKeyDown={closeOnEscape} className="h-50 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={CHART_MARGIN}>
              <defs>
                <linearGradient id={`${uid}-scope`} x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--fg-tertiary)"
                    stopOpacity="var(--opacity-subtle)"
                  />
                  <stop offset="100%" stopColor="var(--fg-tertiary)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${uid}-started`} x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--hue-amber)"
                    stopOpacity="var(--opacity-subtle)"
                  />
                  <stop offset="100%" stopColor="var(--hue-amber)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${uid}-completed`} x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--hue-indigo)"
                    stopOpacity="var(--opacity-subtle)"
                  />
                  <stop offset="100%" stopColor="var(--hue-indigo)" stopOpacity="0" />
                </linearGradient>
                {/* Hachura de fim de semana (Linear real, conferido em 28/09): linha diagonal
                 * repetida num ladrilho pequeno, girada ~60°, em tons de superfície/borda. */}
                <pattern
                  id={`${uid}-weekend`}
                  width={WEEKEND_PATTERN_WIDTH}
                  height={WEEKEND_PATTERN_HEIGHT}
                  patternUnits="userSpaceOnUse"
                  patternTransform={`rotate(${WEEKEND_PATTERN_ROTATION_DEG})`}
                >
                  <rect
                    width={WEEKEND_PATTERN_WIDTH}
                    height={WEEKEND_PATTERN_HEIGHT}
                    fill="var(--bg-subtle)"
                  />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={WEEKEND_PATTERN_HEIGHT}
                    stroke="var(--border-subtle)"
                    style={{ strokeWidth: "var(--chart-weekend-hatch-width)" }}
                  />
                </pattern>
              </defs>
              {weekends.map(([start, end]) => (
                <ReferenceArea
                  key={start}
                  x1={start}
                  x2={end}
                  fill={`url(#${uid}-weekend)`}
                  stroke="none"
                  ifOverflow="visible"
                />
              ))}
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                ticks={axisTicks}
                interval={0}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatShortDate}
                tick={{ fill: "var(--fg-secondary)", style: { fontSize: "var(--text-body-sm)" } }}
              />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip
                cursor={{ stroke: "var(--border-default)" }}
                content={({ active, label: tickLabel, payload }) => (
                  <ChartTooltip
                    active={active}
                    label={formatShortDate(Number(tickLabel))}
                    rows={toChartTooltipRows(payload)}
                  />
                )}
              />
              <Area
                dataKey="scope"
                name="Scope"
                stroke="var(--fg-tertiary)"
                fill={`url(#${uid}-scope)`}
                style={{ strokeWidth: "var(--chart-line-width)" }}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Area
                dataKey="started"
                name="Started"
                stroke="var(--hue-amber)"
                fill={`url(#${uid}-started)`}
                style={{ strokeWidth: "var(--chart-line-width)" }}
                dot={false}
                activeDot={{
                  r: CHART_MARKER_RADIUS,
                  stroke: "var(--bg-panel)",
                  strokeWidth: CHART_MARKER_RING_WIDTH,
                }}
                isAnimationActive={false}
              />
              <Area
                dataKey="completed"
                name="Completed"
                stroke="var(--hue-indigo)"
                fill={`url(#${uid}-completed)`}
                style={{ strokeWidth: "var(--chart-line-width)" }}
                dot={false}
                activeDot={{
                  r: CHART_MARKER_RADIUS,
                  stroke: "var(--bg-panel)",
                  strokeWidth: CHART_MARKER_RING_WIDTH,
                }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <p id={tableId} className="sr-only">
        {label}: progress of Scope, Started and Completed by date.
      </p>
    </div>
  );
}
