/**
 * Hover Card (Figma 25:6786, pessoa; 25:6683, milestones): prévia de um objeto ao passar o ponteiro
 * ou focar o gatilho (link, chip, avatar). Abre depois de --tooltip-delay e fecha ao sair. Radix
 * HoverCard: o conteúdo é complementar e não recebe foco; o que for essencial precisa estar
 * também no destino do gatilho.
 *
 * Superfície dos popovers (raio 12, borda forte, sombra md), sempre para baixo, como o Popover.
 * Para mostrar o cartão aberto numa documentação, use PopoverSurface.
 */
import { HoverCard as HoverCardPrimitive } from "radix-ui";
import { useState, type ComponentProps } from "react";
import { cn } from "../lib/cn";
import { popoverSurface } from "./listbox";
import { themeDuration } from "./tooltip";

/** Raiz: atraso de abertura pelo token --tooltip-delay (o mesmo do Tooltip). */
export function HoverCard({ openDelay, ...rest }: ComponentProps<typeof HoverCardPrimitive.Root>) {
  const [themeDelay] = useState(() => themeDuration("--tooltip-delay"));
  return <HoverCardPrimitive.Root openDelay={openDelay ?? themeDelay} {...rest} />;
}

/** Gatilho: um elemento focável (link, botão, chip clicável), com asChild. */
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

export type HoverCardContentProps = ComponentProps<typeof HoverCardPrimitive.Content> & {
  /** Renderiza num portal no body (padrão). Sem portal, herda o tema do contêiner. */
  portal?: boolean;
};

export function HoverCardContent({
  portal = true,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  avoidCollisions = false,
  collisionPadding = 8,
  className,
  ...rest
}: HoverCardContentProps) {
  const content = (
    <HoverCardPrimitive.Content
      side={side}
      sideOffset={sideOffset}
      align={align}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      className={cn(
        popoverSurface,
        "max-h-(--radix-hover-card-content-available-height) origin-(--radix-hover-card-content-transform-origin) overflow-y-auto",
        className,
      )}
      {...rest}
    />
  );
  return portal ? <HoverCardPrimitive.Portal>{content}</HoverCardPrimitive.Portal> : content;
}
