/**
 * LineChart (VYZ-36, item 6; ADR-0014 — sem frame no Figma, segue o Insights do Linear hoje):
 * linhas de throughput/velocidade multi-série. Cor por `colorVar` (paleta categórica --chart-1…8
 * para identidade livre, ou tokens de status quando a série é um estado). Miolo em Recharts
 * (LineChart); o Tooltip é `shared` por padrão — uma leitura por posição X, com o valor de todas
 * as séries ali (interaction.md "one tooltip, every series"). Grade horizontal mínima (3 marcas do
 * eixo Y oculto, skill dataviz "poucos ticks"), sem grade vertical. Hover num item da Legend
 * esmaece as outras linhas (skill dataviz, interaction.md) — não no traço da linha em si: o
 * Recharts (3.x) mostra um tooltip fantasma no primeiro ponto, no mount, quando um `Line` recebe
 * `onMouseEnter`/`onMouseLeave` próprios (achado da bateria de testes deste redesenho).
 */
import { ChartNoAxesCombined, Ellipsis, Table2 } from "lucide-react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_GRID_TICK_COUNT,
  CHART_INACTIVE_OPACITY,
  CHART_MARGIN,
  CHART_MARKER_RADIUS,
  CHART_MARKER_RING_WIDTH,
} from "../lib/chart-geometry";
import { cn } from "../lib/cn";
import { IconButton } from "./button";
import { Legend } from "./chart-legend";
import { ChartTooltip, toChartTooltipRows } from "./chart-tooltip";
import { EmptyState } from "./empty-state";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type LineSeries = {
  key: string;
  label: string;
  /** Variável CSS da cor (ex.: "--chart-1", "--st-success"). */
  colorVar: string;
  values: number[];
};

export type LineChartProps = {
  /** Rótulos do eixo X, na mesma ordem dos valores de cada série. */
  categories: string[];
  series: LineSeries[];
  label: string;
  className?: string;
};

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") (document.activeElement as HTMLElement | null)?.blur();
}

export function LineChart({ categories, series, label, className }: LineChartProps) {
  const [showTable, setShowTable] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const captionId = useId();

  // Hook sempre na mesma ordem, mesmo com categories=[] (regra dos hooks do React): o `return` do
  // estado vazio vem depois dele.
  const rows = useMemo(
    () =>
      categories.map((c, i) => {
        const row: Record<string, string | number> = { label: c };
        for (const s of series) row[s.key] = s.values[i] ?? 0;
        return row;
      }),
    [categories, series],
  );

  if (categories.length === 0) {
    return (
      <EmptyState icon={ChartNoAxesCombined} title="No cycles yet" className={className}>
        Lines appear here once there are cycles with data.
      </EmptyState>
    );
  }

  const legendItems = series.map((s) => ({
    key: s.key,
    label: s.label,
    value: s.values.at(-1),
    colorVar: s.colorVar,
    mark: "line" as const,
  }));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <Legend items={legendItems} activeKey={hoveredKey} onItemHover={setHoveredKey} />
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
        <Table label={label} aria-describedby={captionId}>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {series.map((s) => (
                <TableHead key={s.key}>{s.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c, i) => (
              <TableRow key={c}>
                <TableCell className="text-primary">{c}</TableCell>
                {series.map((s) => (
                  <TableCell key={s.key} className="tabular-nums">
                    {s.values[i]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
        <div onKeyDown={closeOnEscape} className="h-45 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={rows} margin={CHART_MARGIN}>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" syncWithTicks />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--fg-secondary)", style: { fontSize: "var(--text-body-sm)" } }}
              />
              <YAxis hide domain={[0, "auto"]} tickCount={CHART_GRID_TICK_COUNT} />
              <Tooltip
                cursor={{ stroke: "var(--border-default)" }}
                content={({ active, label: tickLabel, payload }) => (
                  <ChartTooltip
                    active={active}
                    label={tickLabel}
                    rows={toChartTooltipRows(payload)}
                  />
                )}
              />
              {series.map((s) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stroke={`var(${s.colorVar})`}
                  strokeOpacity={hoveredKey && hoveredKey !== s.key ? CHART_INACTIVE_OPACITY : 1}
                  style={{ strokeWidth: "var(--chart-line-width)" }}
                  dot={false}
                  activeDot={{
                    r: CHART_MARKER_RADIUS,
                    stroke: "var(--bg-panel)",
                    strokeWidth: CHART_MARKER_RING_WIDTH,
                  }}
                  isAnimationActive={false}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p id={captionId} className="sr-only">
        {label}: value per date in each series.
      </p>
    </div>
  );
}
