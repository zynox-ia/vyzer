/**
 * StackedBarChart (VYZ-36, item 5; ADR-0014 — sem frame no Figma, segue o Insights do Linear
 * hoje): barras empilhadas por categoria (ex.: issues por status, por ciclo). Cada segmento
 * recebe a cor certa pelo tipo de dado — status usa os tokens de status (st-*), identidade livre
 * usa a paleta categórica (--chart-1…8) — nunca embutida aqui: o chamador decide via `colorVar`.
 * Miolo em Recharts (BarChart). Grade horizontal mínima (3 marcas do eixo Y oculto), sem grade
 * vertical. Hover num item da Legend esmaece as outras séries (skill dataviz, interaction.md) —
 * não na barra em si: o Recharts (3.x) mostra um tooltip fantasma no primeiro ponto, no mount,
 * quando um `Bar` recebe `onMouseEnter`/`onMouseLeave` próprios (achado da bateria de testes
 * deste redesenho).
 */
import { ChartNoAxesCombined, Ellipsis, Table2 } from "lucide-react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CHART_GRID_TICK_COUNT,
  CHART_INACTIVE_OPACITY,
  CHART_MARGIN,
  STACKED_BAR_MAX_SIZE,
  STACKED_BAR_SEGMENT_GAP,
  STACKED_BAR_TOP_RADIUS,
} from "../lib/chart-geometry";
import { cn } from "../lib/cn";
import { IconButton } from "./button";
import { Legend } from "./chart-legend";
import { ChartTooltip, toChartTooltipRows } from "./chart-tooltip";
import { EmptyState } from "./empty-state";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type StackedBarSegment = {
  key: string;
  label: string;
  value: number;
  /** Variável CSS da cor (ex.: "--st-success", "--chart-1"). */
  colorVar: string;
};

export type StackedBarGroup = {
  key: string;
  /** Categoria do eixo X (ex.: nome do ciclo). */
  label: string;
  segments: StackedBarSegment[];
};

export type StackedBarChartProps = {
  data: StackedBarGroup[];
  label: string;
  className?: string;
};

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") (document.activeElement as HTMLElement | null)?.blur();
}

export function StackedBarChart({ data, label, className }: StackedBarChartProps) {
  const [showTable, setShowTable] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const captionId = useId();

  // Hook sempre na mesma ordem, mesmo com data=[] (regra dos hooks do React): o `return` do
  // estado vazio vem depois dele.
  const rows = useMemo(
    () =>
      data.map((g) => {
        const row: Record<string, string | number> = { label: g.label };
        for (const s of g.segments) row[s.key] = s.value;
        return row;
      }),
    [data],
  );

  if (data.length === 0) {
    return (
      <EmptyState icon={ChartNoAxesCombined} title="No issues yet" className={className}>
        Bars appear here once there are issues in the period.
      </EmptyState>
    );
  }

  const segments = data[0]?.segments ?? [];
  const legendItems = segments.map((s) => ({ key: s.key, label: s.label, colorVar: s.colorVar }));

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
              <TableHead>Category</TableHead>
              {legendItems.map((item) => (
                <TableHead key={item.key}>{item.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((g) => (
              <TableRow key={g.key}>
                <TableCell className="text-primary">{g.label}</TableCell>
                {g.segments.map((s) => (
                  <TableCell key={s.key} className="tabular-nums">
                    {s.value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
        <div onKeyDown={closeOnEscape} className="h-50 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={CHART_MARGIN}>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--fg-secondary)", style: { fontSize: "var(--text-body-sm)" } }}
              />
              <YAxis hide domain={[0, "auto"]} tickCount={CHART_GRID_TICK_COUNT} />
              <Tooltip
                cursor={{ fill: "var(--bg-hover)" }}
                content={({ active, label: tickLabel, payload }) => (
                  <ChartTooltip
                    active={active}
                    label={tickLabel}
                    rows={toChartTooltipRows(payload)}
                  />
                )}
              />
              {segments.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stackId="stack"
                  fill={`var(${s.colorVar})`}
                  fillOpacity={hoveredKey && hoveredKey !== s.key ? CHART_INACTIVE_OPACITY : 1}
                  stroke="var(--bg-panel)"
                  strokeWidth={STACKED_BAR_SEGMENT_GAP}
                  maxBarSize={STACKED_BAR_MAX_SIZE}
                  radius={
                    i === segments.length - 1
                      ? [STACKED_BAR_TOP_RADIUS, STACKED_BAR_TOP_RADIUS, 0, 0]
                      : 0
                  }
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p id={captionId} className="sr-only">
        {label}: value per segment in each category.
      </p>
    </div>
  );
}
