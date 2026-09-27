/**
 * Tabs (Radix Tabs; Figma 1:1404, "Icons / Emojis"): lista com hairline embaixo e a aba ativa
 * sublinhada em 1 px, em texto primário. O Figma usa o acento do Linear no sublinhado; aqui o
 * acento fica só para foco e indicador da sidebar (ADR-0013), então o sublinhado é neutro.
 */
import { Tabs as RadixTabs } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...rest }: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn("flex items-stretch gap-1 border-b border-strong px-2", className)}
      {...rest}
    />
  );
}

export function TabsTrigger({ className, ...rest }: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "flex h-8 items-center px-2 text-label-md text-secondary transition-colors select-none focus-ring hovered:text-primary",
        "data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_-1px_0_var(--fg-primary)]",
        className,
      )}
      {...rest}
    />
  );
}

export function TabsContent({ className, ...rest }: ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn("outline-none", className)} {...rest} />;
}
