import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";

/* ---------- Tipografia ---------- */

type TypeLevel = {
  token: string;
  className: string;
  sample: string;
  family: "display" | "sans" | "mono";
};

export const typeLevels: TypeLevel[] = [
  {
    token: "display",
    className: "type-display",
    sample: "Novo agente",
    family: "display",
  },
  {
    token: "heading-1",
    className: "type-heading-1",
    sample: "Conectar integração",
    family: "display",
  },
  {
    token: "heading-2",
    className: "type-heading-2",
    sample: "Executar automação",
    family: "display",
  },
  {
    token: "heading-3",
    className: "type-heading-3",
    sample: "Selecionar modelo",
    family: "display",
  },
  {
    token: "heading-4",
    className: "type-heading-4",
    sample: "Pesquisar conversas",
    family: "display",
  },
  {
    token: "body-lg",
    className: "text-body-lg",
    sample: "Descreva o que o agente deve fazer quando a automação rodar.",
    family: "sans",
  },
  {
    token: "body-md",
    className: "text-body-md",
    sample: "Texto padrão da interface: linhas, menus e descrições.",
    family: "sans",
  },
  {
    token: "body-sm",
    className: "text-body-sm",
    sample: "Metadados, datas e informações secundárias.",
    family: "sans",
  },
  { token: "label-lg", className: "text-label-lg", sample: "Salvar alterações", family: "sans" },
  {
    token: "label-md",
    className: "text-label-md",
    sample: "Issues (cabeçalho de painel)",
    family: "sans",
  },
  { token: "label-sm", className: "text-label-sm", sample: "Rótulo de campo", family: "sans" },
  {
    token: "caption",
    className: "text-caption",
    sample: "Atualizado há 3 minutos",
    family: "sans",
  },
  { token: "overline", className: "text-overline uppercase", sample: "Workspace", family: "sans" },
  {
    token: "code",
    className: "font-mono text-code",
    sample: "await agent.run({ model })",
    family: "mono",
  },
  { token: "kbd", className: "font-mono text-kbd", sample: "⌘ K", family: "mono" },
];

function TypeRow({ level }: { level: TypeLevel }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [spec, setSpec] = useState("");
  useLayoutEffect(() => {
    if (!ref.current) return;
    const s = getComputedStyle(ref.current);
    setSpec(`${s.fontSize} / ${s.lineHeight} · ${s.fontWeight} · ${s.letterSpacing}`);
  }, []);
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-subtle py-3 desktop:grid-cols-[12rem_1fr]">
      <div className="flex flex-col">
        <code className="text-code text-primary">{level.token}</code>
        <span className="text-caption text-secondary">
          {level.family === "display"
            ? "Inter Tight"
            : level.family === "mono"
              ? "JetBrains Mono"
              : "Inter"}{" "}
          · {spec}
        </span>
      </div>
      <p ref={ref} className={cn(level.className, "text-primary")}>
        {level.sample}
      </p>
    </div>
  );
}

export function TypeScale() {
  return (
    <div className="flex flex-col">
      {typeLevels.map((l) => (
        <TypeRow key={l.token} level={l} />
      ))}
    </div>
  );
}

/* ---------- Spacing, tamanhos e densidade ---------- */

const spacingSteps = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];

export function SpacingScale() {
  return (
    <div className="flex flex-col gap-2">
      {spacingSteps.map((n) => (
        <div key={n} className="flex items-center gap-3">
          <code className="w-12 text-code text-primary">{n}</code>
          <span className="w-12 text-caption text-secondary">{n * 4}px</span>
          <span
            aria-hidden
            className="h-2 bg-inverse"
            style={{ width: `calc(var(--spacing) * ${n})` }}
          />
        </div>
      ))}
    </div>
  );
}

const sizeTokens = [
  ["control-xs", "h-control-xs", "20px"],
  ["control-sm", "h-control-sm", "24px"],
  ["control-md", "h-control-md", "28px"],
  ["control-lg", "h-control-lg", "32px"],
  ["control-xl", "h-control-xl", "40px"],
] as const;

export function SizeScale() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      {sizeTokens.map(([name, cls, px]) => (
        <div key={name} className="flex flex-col items-center gap-1">
          <span aria-hidden className={cn(cls, "w-16 border border-default bg-control")} />
          <code className="text-code text-primary">{name}</code>
          <span className="text-caption text-secondary">{px}</span>
        </div>
      ))}
    </div>
  );
}

const densityTokens = [
  ["row", "h-row", "linha de lista e tabela"],
  ["menu-item", "h-menu-item", "item de menu"],
  ["nav-item", "h-nav-item", "item da sidebar"],
  ["field", "h-field", "campo de formulário"],
  ["command-item", "h-command-item", "item do command menu"],
] as const;

export function DensityScale() {
  return (
    <div className="flex flex-col gap-2">
      {densityTokens.map(([name, cls, usage]) => (
        <div key={name} className="flex items-center gap-3">
          <span aria-hidden className={cn(cls, "w-40 border border-default bg-control")} />
          <code className="text-code text-primary">{name}</code>
          <span className="text-caption text-secondary">{usage}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Raio ---------- */

const radii = ["none", "xs", "sm", "md", "lg", "xl", "2xl", "full"] as const;
const radiusClass: Record<(typeof radii)[number], string> = {
  none: "rounded-none",
  xs: "rounded-xs",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export function RadiusScale() {
  return (
    <div className="flex flex-wrap gap-4">
      {radii.map((r) => (
        <div key={r} className="flex flex-col items-center gap-2">
          <span
            aria-hidden
            className={cn(radiusClass[r], "size-16 border border-strong bg-surface")}
          />
          <code className="text-code text-primary">{r}</code>
        </div>
      ))}
    </div>
  );
}

/* ---------- Sombras ---------- */

const shadows = ["xs", "sm", "md", "lg", "xl", "overlay"] as const;
const shadowClass: Record<(typeof shadows)[number], string> = {
  xs: "shadow-xs",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  overlay: "shadow-overlay",
};

export function ShadowScale() {
  return (
    <div className="flex flex-wrap gap-8 bg-panel p-8">
      {shadows.map((s) => (
        <div key={s} className="flex flex-col items-center gap-3">
          <span
            aria-hidden
            className={cn(shadowClass[s], "size-20 border border-strong bg-popover")}
          />
          <code className="text-code text-primary">shadow-{s}</code>
        </div>
      ))}
    </div>
  );
}

/* ---------- Movimento ---------- */

const durations = [
  ["instant", "duration-instant", "50 ms"],
  ["fast", "duration-fast", "100 ms"],
  ["normal", "duration-normal", "150 ms"],
  ["slow", "duration-slow", "250 ms"],
] as const;

const easings = [
  ["standard", "ease-standard"],
  ["enter", "ease-enter"],
  ["exit", "ease-exit"],
  ["emphasized", "ease-emphasized"],
] as const;

/** Passe o mouse ou foque cada trilho para ver a transição (zerada com reduced motion). */
export function MotionDemo() {
  return (
    <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Duração (ease-standard)</p>
        {durations.map(([name, cls, ms]) => (
          <button
            key={name}
            type="button"
            className="group flex h-control-lg items-center gap-3 border border-default bg-control px-3 text-left focus-ring"
          >
            <code className="w-20 text-code text-primary">{name}</code>
            <span className="text-caption text-secondary">{ms}</span>
            <span className="relative ml-auto h-1 w-24 bg-subtle">
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-0 left-0 w-2 bg-inverse transition-[width] ease-standard group-hover:w-24 group-focus-visible:w-24",
                  cls,
                )}
              />
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Curva (duration-slow)</p>
        {easings.map(([name, cls]) => (
          <button
            key={name}
            type="button"
            className="group flex h-control-lg items-center gap-3 border border-default bg-control px-3 text-left focus-ring"
          >
            <code className="w-20 text-code text-primary">{name}</code>
            <span className="relative ml-auto h-1 w-24 bg-subtle">
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-0 left-0 w-2 bg-inverse transition-[width] duration-slow group-hover:w-24 group-focus-visible:w-24",
                  cls,
                )}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Foco ---------- */

/** Mostra o indicador de foco em controles com e sem borda. Use Tab para ver a variante ativa. */
export function FocusDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="h-control-md border border-control bg-input px-3 text-label-md focus-ring"
      >
        Com borda
      </button>
      <button
        type="button"
        className="h-control-md border border-transparent px-3 text-label-md text-secondary focus-ring"
      >
        Sem borda (ghost)
      </button>
      <button
        type="button"
        className="h-control-md border border-transparent bg-inverse px-3 text-label-md text-inverse focus-ring"
      >
        Salvar alterações
      </button>
    </div>
  );
}
