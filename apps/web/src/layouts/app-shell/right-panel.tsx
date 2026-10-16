/**
 * Painel de detalhes à direita (Figma 1:6113, Project sidebar): largura fixa (~400 px, não
 * redimensionável no Figma), seções recolhíveis (Properties, Milestones, Progress, Activity no
 * Figma — o conteúdo de cada seção é Fase 10/Patterns, fora do escopo). Fecha com "]" e Ctrl/⌘+I
 * (sinônimos, aprovado em 28/09) ou pelo "×". Painel fixo ao lado do conteúdo, sem scrim (o nó do
 * Figma está vazio).
 */
import { ChevronRight, X } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useState, type ReactNode } from "react";
import { IconButton } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import { cn } from "@zynox/design-system/cn";
import { useAppShell } from "./use-app-shell";

/** Seção recolhível do painel: o mesmo cabeçalho do ListGroup (Fase 5), sem contador nem "+". */
export function RightPanelSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="flex flex-col gap-px">
      <Collapsible.Trigger className="group flex h-9 items-center gap-1 rounded-control px-2.5 text-left select-none focus-ring hovered:bg-hover">
        <Icon
          icon={ChevronRight}
          size="xs"
          className="text-secondary transition-transform duration-fast ease-standard group-data-[state=open]:rotate-90"
        />
        <span className="text-label-md text-secondary">{title}</span>
      </Collapsible.Trigger>
      <Collapsible.Content className="flex flex-col gap-2 px-2.5 pb-3">
        {children}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export function RightPanel({
  label,
  children,
  className,
  /**
   * Classes do corpo (o `div` sob o "×"), no lugar de `flex flex-col gap-2 px-2 pb-4`: o chat do
   * agente (Fase 7, spec item 5) precisa do próprio scroll interno com o composer fixo embaixo
   * (`flex-1 min-h-0`), não da pilha de seções com respiro do painel de detalhes. Omitido, o
   * painel de detalhes (Fase 8) fica pixel a pixel como antes.
   */
  bodyClassName,
  /** Nome do "×" (padrão "Close project details"): o chat do agente usa "Close agent chat". */
  closeLabel = "Close project details",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  closeLabel?: string;
}) {
  const { rightPanelOpen, setRightPanelOpen } = useAppShell();
  if (!rightPanelOpen) return null;
  return (
    <aside
      aria-label={label}
      className={cn(
        "flex h-full w-100 shrink-0 flex-col overflow-y-auto border-l border-default bg-sidebar",
        className,
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-end px-2">
        <IconButton
          icon={X}
          label={closeLabel}
          variant="ghost"
          onClick={() => setRightPanelOpen(false)}
        />
      </div>
      <div className={cn("flex flex-col gap-2 px-2 pb-4", bodyClassName)}>{children}</div>
    </aside>
  );
}
