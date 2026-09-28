/**
 * Toggle Group (Figma 18:870, chips de "Display properties" em 18:722 e 18:930): conjunto de
 * chips que ligam e desligam de forma independente (multisseleção). Ligado: camada de
 * pressionado e texto primário; desligado: relevo e texto secundário. Radix ToggleGroup
 * type="multiple": aria-pressed em cada item, setas movem entre eles.
 *
 * Escolha exclusiva entre visões: use o Segmented Control.
 */
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { chipStyles } from "./chip";

export type ToggleGroupOption<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

export type ToggleGroupProps<T extends string> = {
  value: T[];
  onValueChange: (value: T[]) => void;
  options: ToggleGroupOption<T>[];
  /** Desabilita o grupo inteiro. */
  disabled?: boolean;
  className?: string;
} & (
  | { /** Nome acessível do grupo. */ label: string; labelledBy?: never }
  | { label?: never; /** Id do rótulo visível que nomeia o grupo. */ labelledBy: string }
);

/** Item: o chip preenchido de 24 px (chipStyles), com o estado vindo do Radix (data-state). */
const itemClass = cn(
  chipStyles.base,
  chipStyles.size.sm,
  chipStyles.variant.filled,
  chipStyles.interactive,
);

export function ToggleGroup<T extends string>({
  value,
  onValueChange,
  options,
  disabled,
  className,
  label,
  labelledBy,
}: ToggleGroupProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="multiple"
      aria-label={label}
      aria-labelledby={labelledBy}
      value={value}
      onValueChange={(next) => onValueChange(next as T[])}
      disabled={disabled}
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className={itemClass}
        >
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
