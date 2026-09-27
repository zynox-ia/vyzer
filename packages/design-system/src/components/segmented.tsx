/**
 * Segmented Control (Figma 1:6366, "Comment / Update"): trilho em pílula com borda e a opção
 * ativa em relevo. Escolha exclusiva entre 2 a 5 visões ou modos. Radix ToggleGroup.
 */
import type { LucideIcon } from "lucide-react";
import { ToggleGroup } from "radix-ui";
import type { ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
};

export type SegmentedSize = "sm" | "md";

const itemSize: Record<SegmentedSize, string> = {
  sm: "h-control-sm px-2 text-label-sm",
  md: "h-control-md px-2.5 text-label-sm",
};

export type SegmentedControlProps<T extends string> = {
  /** Nome acessível do grupo. */
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: SegmentedSize;
  className?: string;
};

export function SegmentedControl<T extends string>({
  label,
  value,
  onValueChange,
  options,
  size = "sm",
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      // Sempre há uma opção ativa: clicar na atual não desmarca.
      onValueChange={(v) => {
        if (v) onValueChange(v as T);
      }}
      className={cn(
        "inline-flex items-center rounded-full border border-default bg-control",
        className,
      )}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          disabled={o.disabled}
          className={cn(
            "inline-flex min-w-control-sm items-center justify-center gap-1 rounded-full whitespace-nowrap text-secondary transition-colors select-none focus-ring hovered:text-primary disabled:cursor-not-allowed disabled:opacity-disabled",
            "data-[state=on]:bg-control-strong data-[state=on]:text-primary data-[state=on]:shadow-raised",
            itemSize[size],
          )}
        >
          {o.icon && <Icon icon={o.icon} size="xs" />}
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
