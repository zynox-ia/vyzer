/**
 * Linha de preferência (Figma 33:20615, Preferences): rótulo + texto de ajuda à esquerda,
 * controle à direita (Select ou Switch do design system). Composição de página (AGENTS.md), não
 * um componente novo — reaproveita FormLabel e HelperText do Field.
 */
import { useId, type ReactNode } from "react";
import { FormLabel, HelperText } from "@vyzer/design-system/components";

export function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-4 border-b border-subtle py-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <FormLabel htmlFor={id}>{label}</FormLabel>
        {description && <HelperText>{description}</HelperText>}
      </div>
      <div className="shrink-0">{children(id)}</div>
    </div>
  );
}

export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1 pt-8 first:pt-0">
      <h2 className="type-heading-3 pb-2 text-primary">{title}</h2>
      <div className="flex flex-col rounded-container border border-subtle px-4">{children}</div>
    </section>
  );
}
