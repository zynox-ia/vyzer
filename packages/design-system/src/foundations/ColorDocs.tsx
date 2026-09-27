import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { contrast, over, readVar, toHex, toRgba, type Rgba } from "./color";
import { ThemeFrame, type ThemeName } from "./ThemeFrame";

/* ---------- Amostras ---------- */

export type Swatch = { token: string; cssVar: string; usage: string };

function useResolved(ref: RefObject<HTMLElement | null>, vars: string[]) {
  const [values, setValues] = useState<Record<string, string>>({});
  // A chave em texto evita refazer a leitura a cada render (a lista é recriada pelo chamador).
  const key = vars.join("|");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next: Record<string, string> = {};
    for (const v of key.split("|")) {
      const raw = readVar(el, v);
      next[v] = raw ? toHex(toRgba(raw)) : "—";
    }
    setValues(next);
  }, [ref, key]);
  return values;
}

function SwatchList({ swatches }: { swatches: Swatch[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const values = useResolved(
    ref,
    swatches.map((s) => s.cssVar),
  );
  return (
    <ul ref={ref} className="flex flex-col gap-2">
      {swatches.map((s) => (
        <li key={s.token} className="flex items-center gap-3">
          <span
            aria-hidden
            className="size-control-lg shrink-0 border border-default"
            style={{ background: `var(${s.cssVar})` }}
          />
          <span className="flex min-w-0 flex-col">
            <code className="text-code text-primary">{s.token}</code>
            <span className="text-caption text-secondary">
              {values[s.cssVar]} · {s.usage}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Amostras de um grupo de tokens nos dois temas, com o valor resolvido de cada um. */
export function SwatchGroup({ swatches }: { swatches: Swatch[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
      {(["dark", "light"] as ThemeName[]).map((t) => (
        <ThemeFrame key={t} theme={t}>
          <SwatchList swatches={swatches} />
        </ThemeFrame>
      ))}
    </div>
  );
}

/* ---------- Contraste ---------- */

/** Uma verificação: cor de frente contra cada superfície listada, com meta mínima. */
export type ContrastCheck = {
  label: string;
  /** Variável da cor de frente. */
  fg: string;
  /** Opacidade da frente (ex.: 0.25 para o foco A). */
  fgAlpha?: number;
  /** Se definido, o fundo é esta variável a 15% sobre cada superfície (badges). */
  tintedBy?: string;
  target: number;
};

const SURFACES = [
  "--bg-app",
  "--bg-sidebar",
  "--bg-panel",
  "--bg-surface",
  "--bg-subtle",
  "--bg-popover",
  "--bg-input",
  "--bg-hover",
  "--bg-selected",
];

type Row = { label: string; target: number; onPanel: number; min: number; worst: string };

function measure(el: HTMLElement, checks: ContrastCheck[]): Row[] {
  return checks.map((c) => {
    let min = Infinity;
    let worst = "";
    let onPanel = 0;
    for (const s of SURFACES) {
      const surface = toRgba(readVar(el, s));
      const bg = c.tintedBy
        ? over(withAlpha(toRgba(readVar(el, c.tintedBy)), 0.15), surface)
        : surface;
      const fg = over(withAlpha(toRgba(readVar(el, c.fg)), c.fgAlpha ?? 1), bg);
      const ratio = contrast(fg, bg);
      if (s === "--bg-panel") onPanel = ratio;
      if (ratio < min) {
        min = ratio;
        worst = s.replace("--", "");
      }
    }
    return { label: c.label, target: c.target, onPanel, min, worst };
  });
}

function withAlpha(c: Rgba, alpha: number): Rgba {
  return [c[0], c[1], c[2], c[3] * alpha];
}

function ContrastTable({ checks }: { checks: ContrastCheck[] }) {
  const ref = useRef<HTMLTableElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  useLayoutEffect(() => {
    if (ref.current) setRows(measure(ref.current, checks));
  }, [checks]);
  return (
    <table ref={ref} className="w-full text-left text-body-sm">
      <thead className="text-secondary">
        <tr>
          <th scope="col" className="py-1 font-medium">
            Par
          </th>
          <th scope="col" className="py-1 font-medium">
            Painel
          </th>
          <th scope="col" className="py-1 font-medium">
            Mínimo (pior fundo)
          </th>
          <th scope="col" className="py-1 font-medium">
            Meta
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const pass = r.min >= r.target;
          return (
            <tr key={r.label} className="border-t border-subtle">
              <td className="py-1 text-primary">{r.label}</td>
              <td className="py-1 text-secondary">{r.onPanel.toFixed(2)}</td>
              <td className="py-1 text-secondary">
                {r.min.toFixed(2)} <span className="text-secondary">({r.worst})</span>
              </td>
              <td className={pass ? "py-1 text-success-strong" : "py-1 text-danger-strong"}>
                {pass ? "✓" : "✗"} {r.target}:1
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Contraste medido ao vivo, no navegador, nos dois temas. */
export function ContrastReport({ checks }: { checks: ContrastCheck[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
      {(["dark", "light"] as ThemeName[]).map((t) => (
        <ThemeFrame key={t} theme={t}>
          <ContrastTable checks={checks} />
        </ThemeFrame>
      ))}
    </div>
  );
}

/* ---------- Conjuntos usados na página ---------- */

export const surfaceSwatches: Swatch[] = [
  { token: "bg-app", cssVar: "--bg-app", usage: "janela, calha" },
  { token: "bg-sidebar", cssVar: "--bg-sidebar", usage: "sidebar" },
  { token: "bg-panel", cssVar: "--bg-panel", usage: "conteúdo" },
  { token: "bg-surface", cssVar: "--bg-surface", usage: "cards, modal" },
  { token: "bg-subtle", cssVar: "--bg-subtle", usage: "cabeçalho de grupo" },
  { token: "bg-popover", cssVar: "--bg-popover", usage: "menus, popovers" },
  { token: "bg-input", cssVar: "--bg-input", usage: "campos" },
  { token: "bg-hover", cssVar: "--bg-hover", usage: "hover" },
  { token: "bg-pressed", cssVar: "--bg-pressed", usage: "pressionado" },
  { token: "bg-selected", cssVar: "--bg-selected", usage: "seleção" },
  { token: "bg-inverse", cssVar: "--bg-inverse", usage: "botão primário" },
];

export const textSwatches: Swatch[] = [
  { token: "text-primary", cssVar: "--fg-primary", usage: "texto, links, controles ativos" },
  { token: "text-secondary", cssVar: "--fg-secondary", usage: "metadados, ícones" },
  {
    token: "text-tertiary",
    cssVar: "--fg-tertiary",
    usage: "placeholder, desabilitado (no claro, não é texto de leitura)",
  },
  { token: "text-accent", cssVar: "--accent-text", usage: "contadores de destaque" },
];

export const borderSwatches: Swatch[] = [
  { token: "border-subtle", cssVar: "--line-subtle", usage: "divisórias" },
  { token: "border-default", cssVar: "--line-default", usage: "cards, modal" },
  { token: "border-strong", cssVar: "--line-strong", usage: "popovers" },
  { token: "border-control", cssVar: "--line-control", usage: "campos e controles (3:1)" },
  { token: "accent / focus", cssVar: "--accent", usage: "foco, item ativo" },
];

export const statusSwatches: Swatch[] = [
  { token: "success", cssVar: "--st-success", usage: "verde" },
  { token: "info", cssVar: "--st-info", usage: "azul" },
  { token: "warning", cssVar: "--st-warning", usage: "âmbar" },
  { token: "danger", cssVar: "--st-danger", usage: "vermelho" },
];

export const hueSwatches: Swatch[] = [
  "green",
  "blue",
  "amber",
  "red",
  "purple",
  "pink",
  "cyan",
  "orange",
  "lime",
  "indigo",
].map((h, i) => ({
  token: `${h} · chart-${i + 1}`,
  cssVar: `--hue-${h}`,
  usage: "labels e data viz",
}));

export const textChecks: ContrastCheck[] = [
  { label: "text-primary", fg: "--fg-primary", target: 4.5 },
  { label: "text-secondary", fg: "--fg-secondary", target: 4.5 },
  { label: "text-tertiary", fg: "--fg-tertiary", target: 4.5 },
  { label: "text-accent (contador)", fg: "--accent-text", target: 4.5 },
];

export const indicatorChecks: ContrastCheck[] = [
  { label: "Foco B (padrão): terracota 100%", fg: "--accent", target: 3 },
  { label: "Foco A: terracota 25%", fg: "--accent", fgAlpha: 0.25, target: 3 },
  { label: "border-control", fg: "--line-control", target: 3 },
  { label: "border-default (hairline)", fg: "--line-default", target: 3 },
  { label: "controle ativo (text-primary)", fg: "--fg-primary", target: 3 },
];

export const iconChecks: ContrastCheck[] = [
  ...["success", "info", "warning", "danger"].map((s) => ({
    label: `ícone ${s}`,
    fg: `--st-${s}`,
    target: 3,
  })),
  ...["green", "blue", "amber", "red", "purple", "pink", "cyan", "orange", "lime", "indigo"].map(
    (h) => ({ label: `label ${h}`, fg: `--hue-${h}`, target: 3 }),
  ),
];

export const badgeChecks: ContrastCheck[] = ["success", "info", "warning", "danger"].map((s) => ({
  label: `badge ${s}`,
  fg: `--st-${s}-text`,
  tintedBy: `--st-${s}`,
  target: 4.5,
}));
