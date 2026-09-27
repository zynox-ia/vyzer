/**
 * Controles da documentação (toolbar e playground), montados sobre o ToggleGroup do Radix.
 * Provisórios até o design system ter Segmented Control (Fase 3); então passam a usá-lo.
 */
import { cn } from "@vyzer/design-system/cn";
import { ToggleGroup } from "radix-ui";
import type { ReactNode } from "react";

export type Option<T extends string> = { value: T; label: string };

/**
 * Grupo de opções exclusivas. Raio concêntrico (skill §5): contêiner 8 px com padding 2 px,
 * então os itens usam 6 px.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as T);
      }}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-control border border-default bg-control p-0.5",
        className,
      )}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className="inline-flex h-control-xs items-center rounded-sm px-2 text-label-sm whitespace-nowrap text-secondary transition-colors hover:bg-hover hover:text-primary data-[state=on]:bg-selected data-[state=on]:text-primary"
        >
          {o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

/** Controle com rótulo visível acima (skill §14: label sempre visível). */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-sm text-secondary">{label}</span>
      {children}
    </div>
  );
}
