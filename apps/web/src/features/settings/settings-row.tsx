/**
 * Linha de preferência (Figma 33:20615, Preferences): rótulo + texto de ajuda à esquerda,
 * controle à direita (Select ou Switch do design system). Composição de página (AGENTS.md), não
 * um componente novo — reaproveita FormLabel e HelperText do Field.
 */
import { useId, type ReactNode } from "react";
import { FormLabel, FormMessage, HelperText } from "@vyzer/design-system/components";
import { cn } from "@vyzer/design-system/cn";

export function SettingsRow({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  /** Erro de validação do controle: substitui a ajuda, como no Field (FormMessage). */
  error?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-4 border-b border-subtle py-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <FormLabel htmlFor={id}>{label}</FormLabel>
        <div aria-live="polite">
          {error ? (
            <FormMessage>{error}</FormMessage>
          ) : (
            description && <HelperText>{description}</HelperText>
          )}
        </div>
      </div>
      <div className="shrink-0">{children(id)}</div>
    </div>
  );
}

export function SettingsGroup({
  title,
  description,
  children,
}: {
  title?: string;
  /** Subtítulo do grupo, sob o título (ex.: "Used for team schedules, dates…"). */
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1 pt-8 first:pt-0">
      {title && (
        <h2 className={cn("type-heading-3 text-primary", description ? "pb-0" : "pb-2")}>
          {title}
        </h2>
      )}
      {description && <p className="pb-2 text-body-sm text-secondary">{description}</p>}
      <div className="flex flex-col rounded-container border border-subtle px-4">{children}</div>
    </section>
  );
}
