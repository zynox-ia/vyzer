/**
 * Display Options (Figma 18:722 "List", 18:930 "Board"): popover de 300 px com as opções de
 * exibição de uma vista. Peças para compor: seções separadas por hairline, linhas de rótulo e
 * controle (Select em botão, Switch, Icon Button), título de grupo, chips de propriedades
 * visíveis e rodapé de ações.
 *
 * DisplayOptions = Radix Popover + gatilho + DisplayOptionsPanel. O painel sozinho serve para
 * mostrar o popover aberto numa documentação ou embuti-lo numa tela.
 */
import { Label, Popover } from "radix-ui";
import { useId, useState, type ReactElement, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { popoverSurface } from "./listbox";
import { ToggleGroup } from "./toggle-group";

/** Superfície do painel (Figma: 300 px, raio 12, borda #323336, 8 px de folga no topo). */
const panelClass = cn(popoverSurface, "flex w-75 flex-col pt-2");

export type DisplayOptionsProps = {
  /** Gatilho (normalmente um Button "Display"). */
  trigger: ReactElement;
  /** Nome acessível do painel (ex.: "Display options"). */
  label: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Alinhamento com o gatilho; o painel abre sempre para baixo. */
  align?: "start" | "end";
  /** Sem portal, o popover herda o tema do contêiner. */
  portal?: boolean;
};

export function DisplayOptions({
  trigger,
  label,
  children,
  open: openProp,
  onOpenChange,
  align = "end",
  portal = true,
}: DisplayOptionsProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (next: boolean) => {
    setInnerOpen(next);
    onOpenChange?.(next);
  };
  // Abre sempre para baixo (pedido do responsável, como o Menu): sem virada automática, com a
  // altura limitada ao espaço abaixo do gatilho e rolagem interna.
  const content = (
    <Popover.Content
      side="bottom"
      align={align}
      sideOffset={4}
      avoidCollisions={false}
      collisionPadding={8}
      aria-label={label}
      className={cn(
        panelClass,
        "max-h-(--radix-popover-content-available-height) origin-(--radix-popover-content-transform-origin) overflow-y-auto",
      )}
    >
      {children}
    </Popover.Content>
  );
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      {portal ? <Popover.Portal>{content}</Popover.Portal> : content}
    </Popover.Root>
  );
}

/** O painel aberto, fixo na página (sem posicionamento flutuante). */
export function DisplayOptionsPanel({
  label,
  className,
  children,
}: {
  /** Nome acessível do painel. */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className={cn(panelClass, "relative", className)}>
      {children}
    </section>
  );
}

/**
 * Seção do painel (Figma 18:725, 18:827): 16 px nas laterais, 8 px em cima e embaixo, hairline
 * #292a2d (border-default) entre seções.
 */
export function DisplayOptionsSection({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("flex flex-col border-t border-default px-4 py-2 first:border-t-0", className)}
    >
      {children}
    </div>
  );
}

/** Título de grupo dentro de uma seção (Figma 18:839, "List options": 12 px/500, primário). */
export function DisplayOptionsHeading({ children }: { children: ReactNode }) {
  return <p className="pt-2 pb-0.5 text-label-sm text-primary">{children}</p>;
}

/**
 * Linha de rótulo e controle (Figma 18:751: mín. 32 px, rótulo de 12 px/500 secundário, controles
 * alinhados à direita com 4 px entre eles). O rótulo aponta para o controle pelo id recebido.
 */
export function DisplayOptionsRow({
  label,
  children,
}: {
  label: string;
  /** Controles da linha; passe o id ao controle que o rótulo nomeia (Select, Switch). */
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex min-h-8 items-center gap-2">
      <Label.Root
        htmlFor={id}
        className="min-w-0 truncate text-label-sm text-secondary select-none"
      >
        {label}
      </Label.Root>
      <div className="ml-auto flex shrink-0 items-center gap-1">{children(id)}</div>
    </div>
  );
}

export type DisplayProperty = { value: string; label: string };

export type DisplayPropertiesProps = {
  /** Rótulo visível do grupo (ex.: "Display properties"). */
  label: string;
  options: DisplayProperty[];
  value: string[];
  onValueChange: (value: string[]) => void;
};

/**
 * Chips de propriedades visíveis (Figma 18:870): o Toggle Group do design system, nomeado pelo
 * rótulo visível acima dele.
 */
export function DisplayProperties({
  label,
  options,
  value,
  onValueChange,
}: DisplayPropertiesProps) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-3 pt-2 pb-1">
      <span id={labelId} className="text-label-sm text-secondary">
        {label}
      </span>
      <ToggleGroup
        labelledBy={labelId}
        value={value}
        onValueChange={onValueChange}
        options={options}
      />
    </div>
  );
}

/**
 * Rodapé de ações (Figma 18:1120): hairline #323336 (border-strong), 8 px. A primeira ação
 * (Reset) fica à esquerda e as demais à direita (pedido do responsável; no Figma, todas à direita).
 */
export function DisplayOptionsFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto flex items-center gap-1 border-t border-strong p-2 [&>*:first-child]:mr-auto">
      {children}
    </div>
  );
}
