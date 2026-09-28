/**
 * Badge (rótulo de estado em pílula), Counter (contagem, Figma 1:3214 e 1:6598) e HealthBadge
 * (saúde do projeto, Figma 1:5143). Cor nunca é o único indicador: sempre há texto e/ou ícone.
 */
import {
  CircleAlert,
  CircleDashed,
  CircleCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

export type BadgeTone = "neutral" | "success" | "info" | "warning" | "danger" | "accent";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-neutral-subtle text-secondary",
  success: "bg-success-subtle text-success-strong",
  info: "bg-info-subtle text-info-strong",
  warning: "bg-warning-subtle text-warning-strong",
  danger: "bg-danger-subtle text-danger-strong",
  accent: "bg-accent-subtle text-accent",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  icon?: LucideIcon;
  children: ReactNode;
};

/** Pílula de 20 px com texto -strong sobre a cor a 15% (≥ 4,5:1 nos dois temas). */
export function Badge({ tone = "neutral", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-control-xs shrink-0 items-center gap-1 rounded-full px-2.5 text-label-sm whitespace-nowrap",
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {icon && <Icon icon={icon} size="xs" />}
      {children}
    </span>
  );
}

export type CounterProps = HTMLAttributes<HTMLSpanElement> & {
  count: number;
  /** accent: contador de destaque (inbox com não lidos), o único uso do terracota em texto. */
  tone?: "neutral" | "accent";
  /** Acima do limite mostra "99+". */
  max?: number;
};

/** Contagem ao lado de um rótulo (sidebar, grupo, aba). Algarismos tabulares. */
export function Counter({ count, tone = "neutral", max = 99, className, ...rest }: CounterProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-4 items-center justify-center rounded-inline text-body-sm tabular-nums",
        tone === "accent" ? "text-accent" : "text-secondary",
        className,
      )}
      {...rest}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}

export type Health = "on-track" | "at-risk" | "off-track" | "none";

const health: Record<Health, { label: string; icon: LucideIcon; className: string }> = {
  "on-track": { label: "On track", icon: CircleCheck, className: "text-success-strong" },
  "at-risk": { label: "At risk", icon: TriangleAlert, className: "text-warning-strong" },
  "off-track": { label: "Off track", icon: CircleAlert, className: "text-danger-strong" },
  none: { label: "No updates", icon: CircleDashed, className: "text-secondary" },
};

export type HealthBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  health: Health;
  /** Texto no lugar do rótulo padrão (ex.: data do último update). */
  children?: ReactNode;
};

/** Saúde do projeto: ícone de 16 px + rótulo de 12 px/500, gap de 8 (Figma 1:5143). */
export function HealthBadge({ health: h, className, children, ...rest }: HealthBadgeProps) {
  const item = health[h];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full text-label-sm whitespace-nowrap",
        item.className,
        className,
      )}
      {...rest}
    >
      <Icon icon={item.icon} />
      {children ?? item.label}
    </span>
  );
}
