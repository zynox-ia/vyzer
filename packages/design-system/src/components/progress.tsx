/**
 * Progress (Figma 1:5161, 1:5137 e 1:6391, como referência geral): quanto de uma tarefa já foi
 * feito, em barra ou anel. Radix Progress: role="progressbar" com o valor em aria-valuenow e o
 * rótulo em porcentagem. Spinner: carregamento sem valor conhecido.
 */
import { LoaderCircle } from "lucide-react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { Icon, iconSizeClass, type IconSize } from "../icons/Icon";
import { cn } from "../lib/cn";

/**
 * neutral (padrão): texto primário, como os controles ligados (sem acento, ADR-0013). Os demais
 * usam a cor de status (st-*); o trilho é a mesma cor a 15%.
 */
export type ProgressTone = "neutral" | "success" | "warning" | "danger";

const toneClass: Record<ProgressTone, { track: string; fill: string }> = {
  neutral: { track: "bg-neutral-subtle", fill: "text-primary" },
  success: { track: "bg-success-subtle", fill: "text-success" },
  warning: { track: "bg-warning-subtle", fill: "text-warning" },
  danger: { track: "bg-danger-subtle", fill: "text-danger" },
};

export type ProgressProps = {
  /** Valor atual, de 0 a max. null: indeterminado (pulsa; prefira o Spinner). */
  value: number | null;
  max?: number;
  /** Nome acessível (ex.: "Project progress"). */
  label: string;
  tone?: ProgressTone;
  className?: string;
};

/** O Radix recusa valores fora de 0…max: o valor é limitado antes. */
function clamp(value: number | null, max: number) {
  return value === null ? null : Math.min(Math.max(value, 0), max);
}

/** Barra de 4 px de altura, pílula; o preenchimento anima a largura (240 ms). */
export function ProgressBar({
  value,
  max = 100,
  label,
  tone = "neutral",
  className,
}: ProgressProps) {
  const v = clamp(value, max);
  const percent = v === null ? 100 : (v / max) * 100;
  return (
    <ProgressPrimitive.Root
      value={v}
      max={max}
      aria-label={label}
      className={cn("h-1 w-full overflow-hidden rounded-full", toneClass[tone].track, className)}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full rounded-full bg-current transition-[width] duration-slow ease-standard data-[state=indeterminate]:animate-pulse motion-reduce:animate-none",
          toneClass[tone].fill,
        )}
        style={{ width: `${percent}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export type ProgressRingSize = Exclude<IconSize, "xs">;

export type ProgressRingProps = ProgressProps & {
  /** Tamanhos de ícone: sm 16 (padrão, ao lado do texto), md 20, lg 24, xl 32 px. */
  size?: ProgressRingSize;
};

/**
 * Anel: trilho a 15% e arco a partir das 12 h, no sentido horário. Desenho num quadro de 16
 * (raio 7, traço 2), escalado com o tamanho, como os ícones de status.
 */
export function ProgressRing({
  value,
  max = 100,
  label,
  tone = "neutral",
  size = "sm",
  className,
}: ProgressRingProps) {
  const v = clamp(value, max);
  const percent = v === null ? 25 : (v / max) * 100;
  return (
    <ProgressPrimitive.Root
      value={v}
      max={max}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0",
        iconSizeClass[size],
        toneClass[tone].fill,
        v === null && "animate-spin motion-reduce:animate-none",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-full -rotate-90">
        <circle
          cx="8"
          cy="8"
          r="7"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-subtle"
        />
        <ProgressPrimitive.Indicator asChild>
          <circle
            cx="8"
            cy="8"
            r="7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - percent}
            className="transition-[stroke-dashoffset] duration-slow ease-standard"
          />
        </ProgressPrimitive.Indicator>
      </svg>
    </ProgressPrimitive.Root>
  );
}

export type SpinnerProps = {
  /** Tamanhos de ícone: xs 12, sm 16 (padrão), md 20, lg 24, xl 32 px. */
  size?: IconSize;
  /** Texto lido pelo leitor de tela (padrão: "Loading"). */
  label?: string;
  className?: string;
};

/**
 * O mesmo glifo do Button em loading (LoaderCircle girando em 800 ms), na cor do texto ao redor
 * (text-secondary por padrão). <output> tem role="status": o rótulo é anunciado quando aparece.
 */
export function Spinner({ size = "sm", label = "Loading", className }: SpinnerProps) {
  return (
    <output className={cn("inline-flex shrink-0 text-secondary", className)}>
      <Icon icon={LoaderCircle} size={size} className="animate-spin motion-reduce:animate-none" />
      <span className="sr-only">{label}</span>
    </output>
  );
}
