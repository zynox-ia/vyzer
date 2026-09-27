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
  { token: "overline", className: "type-overline", sample: "Workspace", family: "sans" },
  {
    token: "label-caps",
    className: "type-label-caps",
    sample: "Your teams",
    family: "sans",
  },
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
          <span
            aria-hidden
            className={cn(cls, "w-16 rounded-control border border-default bg-control")}
          />
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

const densityRows = ["Executar automação", "Conectar integração", "Pesquisar conversas"];

function DensityColumn({ density }: { density: "comfortable" | "compact" }) {
  return (
    <div data-density={density} className="flex flex-col gap-3">
      <p className="type-label-caps text-secondary">
        {density === "comfortable" ? "Confortável" : "Compacta"}
      </p>
      <ul className="rounded-container border border-default bg-panel">
        {densityRows.map((r, i) => (
          <li
            key={r}
            className={cn(
              "flex h-row items-center px-cell-x text-body-md text-primary",
              i > 0 && "border-t border-subtle",
            )}
          >
            {r}
          </li>
        ))}
      </ul>
      <div className="flex flex-col rounded-overlay border border-strong bg-popover p-1 shadow-md">
        {["Renomear", "Duplicar", "Arquivar"].map((m, i) => (
          <span
            key={m}
            className={cn(
              "flex h-menu-item items-center rounded-control px-2 text-body-md text-primary",
              i === 0 && "bg-hover",
            )}
          >
            {m}
          </span>
        ))}
      </div>
      <span className="flex h-field items-center rounded-control border border-control bg-input px-3 text-body-md text-placeholder">
        Pesquisar conversas
      </span>
    </div>
  );
}

/** Mesmo conteúdo nas duas densidades, lado a lado. O toolbar muda a densidade da página inteira. */
export function DensityCompare() {
  return (
    <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
      <DensityColumn density="comfortable" />
      <DensityColumn density="compact" />
    </div>
  );
}

function DensityRow({ name, cls, usage }: { name: string; cls: string; usage: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [height, setHeight] = useState("");
  // A densidade muda pelo atributo no <html>: observa e relê o valor.
  useLayoutEffect(() => {
    const read = () => {
      if (ref.current) setHeight(getComputedStyle(ref.current).height);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributeFilter: ["data-density"] });
    return () => observer.disconnect();
  }, []);
  return (
    <tr className="border-t border-subtle">
      <td className="py-1">
        <code className="text-code text-primary">h-{name}</code>
      </td>
      <td className="py-1 text-secondary">{usage}</td>
      <td className="py-1 text-secondary">
        {height}
        <span ref={ref} aria-hidden className={cn(cls, "absolute w-0 opacity-0")} />
      </td>
    </tr>
  );
}

export function DensityScale() {
  return (
    <table className="w-full text-left text-body-sm">
      <thead className="text-secondary">
        <tr>
          <th scope="col" className="py-1 font-medium">
            Token
          </th>
          <th scope="col" className="py-1 font-medium">
            Uso
          </th>
          <th scope="col" className="py-1 font-medium">
            Valor na densidade atual
          </th>
        </tr>
      </thead>
      <tbody>
        {densityTokens.map(([name, cls, usage]) => (
          <DensityRow key={name} name={name} cls={cls} usage={usage} />
        ))}
      </tbody>
    </table>
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

/** Papéis de raio aplicados a peças reais: troque o preset no toolbar (Raio). */
export function RadiusRoles() {
  return (
    <div className="flex flex-col gap-4 rounded-container border border-default bg-panel p-4">
      <p className="text-caption text-secondary">rounded-container (card, painel)</p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-inline border border-control px-1 font-mono text-kbd text-secondary">
          ⌘K
        </span>
        <span className="text-caption text-secondary">rounded-inline</span>
        <span className="flex h-control-md items-center rounded-control bg-inverse px-3 text-label-md text-inverse">
          Salvar alterações
        </span>
        <span className="flex h-control-md items-center rounded-control border border-control bg-input px-3 text-body-md text-placeholder">
          Pesquisar conversas
        </span>
        <span className="text-caption text-secondary">rounded-control</span>
      </div>
      <div className="flex w-56 flex-col rounded-overlay border border-strong bg-popover p-1 shadow-md">
        {["Renomear", "Duplicar"].map((m, i) => (
          <span
            key={m}
            className={cn(
              "flex h-menu-item items-center rounded-control px-2 text-body-md text-primary",
              i === 0 && "bg-hover",
            )}
          >
            {m}
          </span>
        ))}
        <span className="px-2 pt-1 text-caption text-secondary">rounded-overlay</span>
      </div>
      <div className="flex items-center gap-3">
        <span aria-hidden className="size-control-md rounded-full bg-inverse" />
        <span className="text-caption text-secondary">
          rounded-full só em avatar, radio e status
        </span>
      </div>
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-8 rounded-container bg-panel p-8">
        {shadows.map((s) => (
          <div key={s} className="flex flex-col items-center gap-3">
            <span
              aria-hidden
              className={cn(
                shadowClass[s],
                "size-20 rounded-overlay border border-strong bg-popover",
              )}
            />
            <code className="text-code text-primary">shadow-{s}</code>
          </div>
        ))}
      </div>
      <div className="relative h-56 rounded-container border border-default bg-panel p-6">
        <p className="text-body-md text-secondary">Uso real: menu e modal sobre o painel</p>
        <div className="absolute top-14 left-6 flex w-56 flex-col rounded-overlay border border-strong bg-popover p-1 shadow-md">
          {["Renomear", "Duplicar", "Arquivar"].map((m, i) => (
            <span
              key={m}
              className={cn(
                "flex h-menu-item items-center rounded-control px-2 text-body-md text-primary",
                i === 0 && "bg-hover",
              )}
            >
              {m}
            </span>
          ))}
        </div>
        <div className="absolute top-10 right-6 flex w-72 flex-col gap-2 rounded-dialog border border-strong bg-surface p-4 shadow-xl">
          <p className="type-heading-4 text-primary">Salvar alterações?</p>
          <p className="text-body-sm text-secondary">Modal com shadow-xl; o menu usa shadow-md.</p>
        </div>
      </div>
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
            className="group flex h-control-lg items-center gap-3 rounded-control border border-default bg-control px-3 text-left focus-ring"
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
            className="group flex h-control-lg items-center gap-3 rounded-control border border-default bg-control px-3 text-left focus-ring"
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

const focusTargets = [
  ["Com borda", "border-control bg-input text-primary"],
  ["Sem borda (ghost)", "border-transparent text-secondary"],
  ["Salvar alterações", "border-transparent bg-inverse text-inverse"],
] as const;

/**
 * Interativo: Tab nos botões ou clique no campo (campos mostram foco também no clique).
 * Estático: o mesmo indicador desenhado sempre, para comparar A e B sem teclado.
 */
export function FocusDemo() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="type-label-caps text-secondary">Interativo</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            aria-label="Pesquisar conversas"
            placeholder="Pesquisar conversas"
            className="h-control-md w-56 rounded-control border border-control bg-input px-3 text-body-md text-primary placeholder:text-placeholder focus-ring"
          />
          {focusTargets.map(([label, cls]) => (
            <button
              key={label}
              type="button"
              className={cn(
                "h-control-md rounded-control border px-3 text-label-md focus-ring",
                cls,
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
        {(["a", "b"] as const).map((v) => (
          <div
            key={v}
            data-focus={v}
            className="flex flex-col gap-3 rounded-container border border-default bg-panel p-4"
          >
            <p className="type-label-caps text-secondary">
              {v === "a" ? "Estático: variante A (comparação)" : "Estático: variante B (padrão)"}
            </p>
            <span className="flex h-control-md items-center rounded-control border border-control bg-input px-3 text-body-md text-primary focus-ring-shown">
              Conectar integração
            </span>
            <div className="flex flex-wrap gap-3">
              {focusTargets.map(([label, cls]) => (
                <span
                  key={label}
                  className={cn(
                    "flex h-control-md items-center rounded-control border px-3 text-label-md focus-ring-shown",
                    cls,
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
