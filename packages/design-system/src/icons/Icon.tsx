import type { LucideIcon } from "lucide-react";
import type { Ref, SVGProps } from "react";
import { cn } from "../lib/cn";

/**
 * Tamanhos de ícone: xs 12 · 14 · sm 16 · md 20 · lg 24 · xl 32 px. O degrau "14" (entre xs e
 * sm) veio do Icon Button de 28 px (owner, 28/09): nem xs nem sm cabiam no ícone medido do
 * Linear ali, então ganhou o nome literal em vez de forçar um t-shirt size que não existe.
 * (Um degrau "15" foi testado para os itens de nav da sidebar na mesma tarde e revertido — os
 * itens voltaram para "14".)
 */
export type IconSize = "xs" | "14" | "sm" | "md" | "lg" | "xl";

export const iconSizeClass: Record<IconSize, string> = {
  xs: "size-icon-xs",
  "14": "size-icon-14",
  sm: "size-icon-sm",
  md: "size-icon-md",
  lg: "size-icon-lg",
  xl: "size-icon-xl",
};

/**
 * Traço padrão dos ícones de linha (lucide), em px reais (absoluteStrokeWidth). Era 1,5 px (peso
 * do Figma); o responsável pediu +1 px e, em 28/09, depois de comparar com 1,5 px, fixou +0,5 px.
 */
export const ICON_STROKE = 2;

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  icon: LucideIcon;
  size?: IconSize;
  /** Rótulo acessível. Sem ele, o ícone é decorativo (aria-hidden). */
  label?: string;
  ref?: Ref<SVGSVGElement>;
};

/**
 * Ícone de linha da biblioteca lucide com tamanhos e traço do Zynox.
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
