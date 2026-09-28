/**
 * Tabs (Radix Tabs; Figma 1:1404, "Icons / Emojis"): lista com hairline embaixo e a aba ativa
 * sublinhada em 1 px, em texto primário. O Figma usa o acento do Linear no sublinhado; aqui o
 * acento fica só para foco e indicador da sidebar (ADR-0013), então o sublinhado é neutro.
 *
 * Variante pills (Figma 18:729 "List / Board", 18:1132 "Assignees / … / Projects"): pílulas de
 * 28 px lado a lado dividindo a largura, todas em relevo; a ativa ganha a camada de pressionado e
 * o texto primário, como o Segmented Control em pílulas.
 */
import { Tabs as RadixTabs } from "radix-ui";
import { createContext, use, type ComponentProps } from "react";
import { cn } from "../lib/cn";

export type TabsVariant = "underline" | "pills";

const VariantContext = createContext<TabsVariant>("underline");

export const Tabs = RadixTabs.Root;

export type TabsListProps = ComponentProps<typeof RadixTabs.List> & {
  /** underline: sublinhado (padrão). pills: pílulas em relevo que dividem a largura. */
  variant?: TabsVariant;
};

export function TabsList({ variant = "underline", className, ...rest }: TabsListProps) {
  return (
    <VariantContext value={variant}>
      <RadixTabs.List
        className={cn(
          variant === "pills"
            ? "flex items-center gap-1.5 p-0.5"
            : "flex items-stretch gap-1 border-b border-strong px-2",
          className,
        )}
        {...rest}
      />
    </VariantContext>
  );
}

const triggerClass: Record<TabsVariant, string> = {
  underline: cn(
    "flex h-8 items-center px-2 text-label-md text-secondary transition-colors select-none focus-ring hovered:text-primary",
    "data-[state=active]:text-primary data-[state=active]:shadow-underline",
  ),
  // Hover só no fundo (camada bg-hover) e só na inativa: a ativa já tem a camada de pressionado.
  pills: cn(
    "flex h-control-md min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-control-strong px-3 text-label-sm whitespace-nowrap text-secondary shadow-raised select-none focus-ring",
    "transition-[color,background-color,background-image] duration-fast ease-standard",
    "data-[state=inactive]:hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))]",
    "data-[state=active]:[background-image:linear-gradient(var(--bg-pressed),var(--bg-pressed))] data-[state=active]:text-primary",
  ),
};

export function TabsTrigger({ className, ...rest }: ComponentProps<typeof RadixTabs.Trigger>) {
  const variant = use(VariantContext);
  return <RadixTabs.Trigger className={cn(triggerClass[variant], className)} {...rest} />;
}

export function TabsContent({ className, ...rest }: ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn("outline-none", className)} {...rest} />;
}
