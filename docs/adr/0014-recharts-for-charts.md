---
status: accepted
---

# Recharts for charts

The design system's charts (BurnUpChart, Sparkline, StackedBarChart, LineChart, with ChartLegend and ChartTooltip) are built on **Recharts 3**, a dependency of `packages/design-system` only. The owner approved it on 2026-09-28, after a first version of Phase 9 (VYZ-36) had drawn the charts in hand-made SVG.

## Why

- **The owner prefers a proven chart library** to charts we maintain ourselves. Recharts is the most widely used React chart library and the base of the shadcn/ui charts.
- **Scales, axes, tooltips, responsive sizing and keyboard navigation** (`accessibilityLayer`) come ready. The hand-made version had to keep all of this itself.
- **It renders SVG and takes colors as props,** so the semantic tokens pass straight in as CSS variables (`var(--chart-1)`, `var(--border-default)`). No theme object runs in parallel with the tokens.

## Rules

- **Recharts stays behind the design system's own components.** Screens import `BurnUpChart`, `LineChart` and the rest from `@zynox/design-system`, never from `recharts`. The component APIs don't expose Recharts types.
- **Every color, stroke, font and radius comes from a semantic token,** passed as a CSS variable. Recharts' default palette, fonts and shadows are never used.
- **The categorical palette is the 8 `--chart-*` tokens** approved in Phase 9. Workflow state keeps the status tokens.
- **Accessibility does not depend on the library alone.** Every chart keeps its alternative text table, the tooltip opens by keyboard and Esc closes it, and color is never the only channel.
- **Motion follows the motion tokens,** or is off. Animation is disabled under `prefers-reduced-motion`.
- **Stroke widths are tokens too.** `--chart-line-width` (1.5px), `--chart-sparkline-width` (1.25px), `--chart-sparkline-bar-radius` (1px) and `--chart-weekend-hatch-width` (3px), approved by the owner on 2026-09-28 (redesign r2), live in `theme.css` next to the rest of the design system. Components pass them through `style` (`style={{ strokeWidth: "var(--chart-line-width)" }}`), since SVG only resolves `var()` inside `style`, never in a presentation attribute — `strokeWidth={CHART_LINE_WIDTH}` doesn't work. `packages/design-system/src/lib/chart-geometry.ts` documents the one exception: Recharts computes a `Bar`'s rounded-corner path from a plain JavaScript number, not a CSS property, so `--chart-sparkline-bar-radius` is read once from `document.documentElement`'s computed style instead of being duplicated as a literal.

## Alternatives considered

| Option                                | Why not                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Hand-made SVG (first Phase 9 version) | Owner preference. It also means maintaining scales, axes, tooltips and keyboard handling ourselves |
| visx                                  | Low-level primitives: full control, but most of the chart is still written by us                   |
| Nivo, Tremor                          | Their own theme or styling competes with the design system as the visual source of truth           |
| ECharts, Chart.js                     | Canvas: weaker accessibility, and no theming through CSS variables                                 |

## Consequences

- One new runtime dependency in `packages/design-system`. The first Phase 9 version is rewritten on top of it, keeping the public API, the tokens, the documentation pages and the tests.
- A chart type Recharts can't express is added only with a new decision.
