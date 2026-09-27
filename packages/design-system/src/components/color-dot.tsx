/**
 * Cores de label e de ícone de projeto (Figma 1:1132 e 1:1412: Grey, Dark Grey, Purple, Teal,
 * Green, Yellow, Orange, Pink, Red), mapeadas para a paleta OKLCH do Vyzer (ADR-0013).
 * ColorDot: bolinha de 9 px (label) ou amostra de 22 px (seletor de cor).
 */
import { Check } from "lucide-react";
import type { HTMLAttributes } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { isHexColor, type HexColor } from "../lib/color-value";

export type LabelColor =
  | "grey"
  | "slate"
  | "purple"
  | "cyan"
  | "green"
  | "amber"
  | "orange"
  | "pink"
  | "red";

/** Ordem e nomes do Figma; o valor é o token do Vyzer. */
export const LABEL_COLORS: { value: LabelColor; label: string }[] = [
  { value: "grey", label: "Grey" },
  { value: "slate", label: "Dark Grey" },
  { value: "purple", label: "Purple" },
  { value: "cyan", label: "Teal" },
  { value: "green", label: "Green" },
  { value: "amber", label: "Yellow" },
  { value: "orange", label: "Orange" },
  { value: "pink", label: "Pink" },
  { value: "red", label: "Red" },
];

const bg: Record<LabelColor, string> = {
  grey: "bg-grey",
  slate: "bg-slate",
  purple: "bg-purple",
  cyan: "bg-cyan",
  green: "bg-green",
  amber: "bg-amber",
  orange: "bg-orange",
  pink: "bg-pink",
  red: "bg-red",
};

/** Classe de cor de texto (ícones de projeto coloridos). */
export const labelTextClass: Record<LabelColor, string> = {
  grey: "text-grey",
  slate: "text-slate",
  purple: "text-purple",
  cyan: "text-cyan",
  green: "text-green",
  amber: "text-amber",
  orange: "text-orange",
  pink: "text-pink",
  red: "text-red",
};

export type ColorDotProps = HTMLAttributes<HTMLSpanElement> & {
  /** Cor da paleta ou uma cor personalizada (#rrggbb, escolhida no Icon Picker). */
  color: LabelColor | HexColor;
  /** sm: 9 px (label). md: 14 px (status de projeto). lg: 22 px (amostra do seletor). */
  size?: "sm" | "md" | "lg";
  /** Marca de selecionado (amostra do seletor de cor). */
  checked?: boolean;
};

const sizeClass = { sm: "size-2.25", md: "size-3.5", lg: "size-5.5" };

export function ColorDot({
  color,
  size = "sm",
  checked,
  className,
  style,
  ...rest
}: ColorDotProps) {
  const custom = isHexColor(color);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-inverse",
        !custom && bg[color as LabelColor],
        sizeClass[size],
        className,
      )}
      // Cor personalizada é dado da pessoa, não token: entra pelo estilo.
      style={custom ? { ...style, backgroundColor: color } : style}
      {...rest}
    >
      {checked && <Icon icon={Check} size="xs" />}
    </span>
  );
}
