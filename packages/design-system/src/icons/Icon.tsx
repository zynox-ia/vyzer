import type { LucideIcon } from "lucide-react";
import type { Ref, SVGProps } from "react";
import { cn } from "../lib/cn";

/** Tamanhos de ícone: xs 12 · sm 16 · md 20 · lg 24 · xl 32 px. */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export const iconSizeClass: Record<IconSize, string> = {
  xs: "size-icon-xs",
  sm: "size-icon-sm",
  md: "size-icon-md",
  lg: "size-icon-lg",
  xl: "size-icon-xl",
};

/** Traço padrão dos ícones de linha (lucide), próximo do peso dos ícones do Figma. */
export const ICON_STROKE = 1.5;

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  icon: LucideIcon;
  size?: IconSize;
  /** Rótulo acessível. Sem ele, o ícone é decorativo (aria-hidden). */
  label?: string;
  ref?: Ref<SVGSVGElement>;
};

/**
 * Ícone de linha da biblioteca lucide com tamanhos e traço do Vyzer.
 * A cor vem de `currentColor`: use uma classe `text-*` no ícone ou no pai.
 */
export function Icon({ icon: Glyph, size = "sm", label, className, ...rest }: IconProps) {
  return (
    <Glyph
      strokeWidth={ICON_STROKE}
      absoluteStrokeWidth
      className={cn("shrink-0", iconSizeClass[size], className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...rest}
    />
  );
}
