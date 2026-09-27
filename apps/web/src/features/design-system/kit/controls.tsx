/**
 * Controles da documentação (toolbar e playground). Usam o Segmented Control do design
 * system: a documentação é a primeira cliente dele.
 */
import { SegmentedControl } from "@vyzer/design-system/components";
import type { ReactNode } from "react";

export type Option<T extends string> = { value: T; label: string };

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
    <SegmentedControl
      label={label}
      value={value}
      onValueChange={onChange}
      options={options}
      className={className}
    />
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
