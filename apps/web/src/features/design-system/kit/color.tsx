/**
 * Amostras de cor e relatório de contraste medidos ao vivo no navegador, nos dois temas.
 * WCAG 2.x é o critério de aprovação; APCA (Lc) é mostrado no tema escuro (skill §3).
 */
import {
  apcaContrast,
  over,
  toHex,
  toRgba,
  wcagContrast,
  withAlpha,
  type Rgba,
} from "@vyzer/design-system/contrast";
import { useEffectEvent, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { THEMES, ThemeFrame, type ThemeName } from "./theme-frame";

/** Lê o valor resolvido de uma variável CSS dentro de um elemento (que define o tema). */
export function readVar(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** Cor opaca de uma superfície; camadas translúcidas (hover, seleção) são compostas sobre o painel. */
export function resolveSurface(el: Element, name: string): Rgba {
  const c = toRgba(readVar(el, name));
  return c[3] < 1 ? over(c, toRgba(readVar(el, "--bg-panel"))) : c;
}

/** Mede depois da pintura, dentro do elemento de referência (a moldura do tema). */
export function useMeasure<T>(
  ref: RefObject<HTMLElement | null>,
  measure: (el: HTMLElement) => T,
  key: string,
): T | undefined {
  const [value, setValue] = useState<T>();
  const onMeasure = useEffectEvent((el: HTMLElement) => setValue(measure(el)));
  useLayoutEffect(() => {
    if (ref.current) onMeasure(ref.current);
  }, [ref, key]);
  return value;
}

/* ---------- Amostras ---------- */

export type Swatch = { token: string; cssVar: string; usage: string };

function SwatchList({ swatches }: { swatches: Swatch[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const values = useMeasure(
    ref,
    (el) =>
      Object.fromEntries(
        swatches.map((s) => {
          const raw = readVar(el, s.cssVar);
          if (!raw) return [s.cssVar, "—"];
          const c = toRgba(raw);
          const alpha = c[3] < 1 ? ` a ${Math.round(c[3] * 100)}%` : "";
          return [s.cssVar, `${toHex(c)}${alpha}`];
        }),
      ),
    swatches.map((s) => s.cssVar).join("|"),
  );
  return (
    <ul ref={ref} className="flex flex-col gap-2">
      {swatches.map((s) => (
        <li key={s.token} className="flex items-center gap-3">
          <span
            aria-hidden
            className="size-control-lg shrink-0 rounded-inline border border-default bg-panel"
          >
            <span
              className="block size-full rounded-inline"
              style={{ background: `var(${s.cssVar})` }}
            />
          </span>
          <span className="flex min-w-0 flex-col">
            <code className="font-mono text-code text-primary">{s.token}</code>
            <span className="text-caption text-secondary">
              {values?.[s.cssVar] ?? "…"} · {s.usage}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SwatchGroup({ swatches }: { swatches: Swatch[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
      {THEMES.map((t) => (
        <ThemeFrame key={t} theme={t}>
          <SwatchList swatches={swatches} />
        </ThemeFrame>
      ))}
    </div>
  );
}

/* ---------- Contraste ---------- */

export type ContrastCheck = {
  label: string;
  /** Variável da cor de frente. */
  fg: string;
  /** Opacidade da frente (ex.: 0.25 para o foco A). */
  fgAlpha?: number;
  /** Se definido, o fundo é esta variável a 15% sobre cada superfície (badges). */
  tintedBy?: string;
  /** Superfícies a medir; o padrão é a lista completa. */
  on?: string[];
  /** Meta WCAG (razão). */
  target: number;
  /** Meta APCA (|Lc|) no escuro, quando a skill define uma. */
  apca?: number;
};

export const SURFACES = [
  "--bg-app",
  "--bg-sidebar",
  "--bg-panel",
  "--bg-surface",
  "--bg-popover",
  "--bg-input",
  "--bg-hover",
  "--bg-selected",
];

export type ContrastRow = {
  label: string;
  target: number;
  apcaTarget?: number;
  onPanel: number;
  min: number;
  worst: string;
  apcaMin: number;
};

export function measureContrast(el: HTMLElement, checks: ContrastCheck[]): ContrastRow[] {
  return checks.map((c) => {
    let min = Infinity;
    let apcaMin = Infinity;
    let worst = "";
    let onPanel = Number.NaN;
    for (const s of c.on ?? SURFACES) {
      const surface = resolveSurface(el, s);
      const bg = c.tintedBy
        ? over(withAlpha(toRgba(readVar(el, c.tintedBy)), 0.15), surface)
        : surface;
      const fg = over(withAlpha(toRgba(readVar(el, c.fg)), c.fgAlpha ?? 1), bg);
      const ratio = wcagContrast(fg, bg);
      const lc = Math.abs(apcaContrast(fg, bg));
      if (s === "--bg-panel") onPanel = ratio;
      if (ratio < min) {
        min = ratio;
        worst = s.replace("--", "");
      }
      apcaMin = Math.min(apcaMin, lc);
    }
    return {
      label: c.label,
      target: c.target,
      apcaTarget: c.apca,
      onPanel,
      min,
      worst,
      apcaMin,
    };
  });
}

function Verdict({ pass, children }: { pass: boolean; children: string }) {
  return (
    <span className={pass ? "text-success-strong" : "text-danger-strong"}>
      {pass ? "✓" : "✗"} {children}
    </span>
  );
}

function ContrastTable({ checks, theme }: { checks: ContrastCheck[]; theme: ThemeName }) {
  const ref = useRef<HTMLTableElement>(null);
  const rows = useMeasure(
    ref,
    (el) => measureContrast(el, checks),
    checks.map((c) => c.label).join("|"),
  );
  const showApca = theme === "dark";
  return (
    <div>
      <table ref={ref} className="w-full text-left text-body-sm">
        <thead className="text-secondary">
          <tr>
            <th scope="col" className="py-1 pr-3 font-medium">
              Par
            </th>
            <th scope="col" className="py-1 pr-3 font-medium">
              Painel
            </th>
            <th scope="col" className="py-1 pr-3 font-medium">
              WCAG mínimo
            </th>
            {showApca && (
              <th scope="col" className="py-1 pr-3 font-medium">
                APCA mínimo
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows?.map((r) => (
            <tr key={r.label} className="border-t border-subtle">
              <th scope="row" className="py-1 pr-3 font-normal text-primary">
                {r.label}
              </th>
              <td className="py-1 pr-3 text-secondary">
                {Number.isNaN(r.onPanel) ? "—" : `${r.onPanel.toFixed(2)}:1`}
              </td>
              <td className="py-1 pr-3 text-secondary">
                {r.min.toFixed(2)}:1 ({r.worst}){" "}
                <Verdict pass={r.min >= r.target}>{`meta ${r.target}:1`}</Verdict>
              </td>
              {showApca && (
                <td className="py-1 pr-3 text-secondary">
                  Lc {r.apcaMin.toFixed(1)}{" "}
                  {r.apcaTarget !== undefined && (
                    <Verdict pass={r.apcaMin >= r.apcaTarget}>{`meta ${r.apcaTarget}`}</Verdict>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Contraste medido ao vivo nos dois temas, contra a pior superfície da lista. */
export function ContrastReport({ checks }: { checks: ContrastCheck[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 wide:grid-cols-2">
      {THEMES.map((t) => (
        <ThemeFrame key={t} theme={t}>
          <ContrastTable checks={checks} theme={t} />
        </ThemeFrame>
      ))}
    </div>
  );
}
