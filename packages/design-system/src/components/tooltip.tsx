/**
 * Tooltip (sem desenho no Figma; segue o Linear): rótulo curto que nomeia um controle, com o
 * atalho opcional em Kbd. Abre no hover depois de --tooltip-delay e no foco por teclado sem
 * atraso; Esc fecha. Nunca contém conteúdo interativo (para isso, use Popover). Radix Tooltip:
 * o texto vira aria-describedby do gatilho.
 */
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { createContext, use, useState, type ComponentProps, type ReactElement } from "react";
import { cn } from "../lib/cn";
import { KbdSequence } from "./kbd";

/**
 * Classes do tooltip, exportadas para montar a aparência fora do Radix (documentação). Raio de
 * contêiner, borda forte, sombra sm (a menor elevação de overlay, §9) e 28 px de altura mínima,
 * a mesma com ou sem atalho (o Kbd de 20 px cabe com 3 px de folga).
 */
export const tooltipStyles = {
  content:
    "z-tooltip flex min-h-control-md max-w-60 items-center gap-2 rounded-container border border-strong bg-popover px-2.5 py-1 text-body-sm text-primary shadow-sm",
  // Entra deslizando 4 px a partir do gatilho só quando abre com atraso; entre tooltips
  // vizinhos (instant-open) aparece na hora (§8). Sai com um fade.
  motion:
    "origin-(--radix-tooltip-content-transform-origin) data-[state=delayed-open]:data-[side=bottom]:animate-slide-down data-[state=delayed-open]:data-[side=top]:animate-slide-up data-[state=delayed-open]:data-[side=left]:animate-fade-in data-[state=delayed-open]:data-[side=right]:animate-fade-in data-[state=closed]:animate-fade-out",
};

/** Lê uma duração do tema (ex.: "500ms"). Sem o token, o Radix usa o próprio padrão. */
export function themeDuration(name: string): number | undefined {
  if (typeof document === "undefined") return undefined;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return undefined;
  return raw.endsWith("ms") ? value : raw.endsWith("s") ? value * 1000 : value;
}

const ProviderContext = createContext(false);

/**
 * Provedor dos tooltips: atraso de abertura pelo token --tooltip-delay e abertura instantânea
 * entre tooltips vizinhos. Coloque um na raiz da aplicação; um Tooltip sem provedor cria o seu.
 */
export function TooltipProvider({
  delayDuration,
  ...rest
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  const [themeDelay] = useState(() => themeDuration("--tooltip-delay"));
  return (
    <ProviderContext value>
      <TooltipPrimitive.Provider delayDuration={delayDuration ?? themeDelay} {...rest} />
    </ProviderContext>
  );
}

export type TooltipBodyProps = {
  /** Texto curto, sem ponto final (ex.: "Create issue"). */
  content: string;
  /** Teclas do atalho, na ordem (ex.: ["C"], ["Ctrl", "K"]). */
  shortcut?: string[];
  /** then: teclas em sequência (G, depois I). plus: juntas (Ctrl + K). */
  shortcutMode?: "then" | "plus";
};

function TooltipBody({ content, shortcut, shortcutMode }: TooltipBodyProps) {
  return (
    <>
      <span className="min-w-0">{content}</span>
      {/* Margem negativa: o Kbd de 20 px não aumenta a altura (28 px com ou sem atalho). */}
      {shortcut && <KbdSequence keys={shortcut} mode={shortcutMode} className="-my-0.5" />}
    </>
  );
}

export type TooltipProps = TooltipBodyProps &
  Pick<
    ComponentProps<typeof TooltipPrimitive.Root>,
    "open" | "defaultOpen" | "onOpenChange" | "delayDuration"
  > & {
    /** Gatilho: um elemento focável (IconButton, Button). */
    children: ReactElement;
    /** Lado preferido (padrão: embaixo); vira para o lado oposto se faltar espaço. */
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    /** Renderiza num portal no body (padrão). Sem portal, herda o tema do contêiner. */
    portal?: boolean;
  };

export function Tooltip({
  content,
  shortcut,
  shortcutMode,
  children,
  side = "bottom",
  align = "center",
  portal = true,
  ...root
}: TooltipProps) {
  const hasProvider = use(ProviderContext);
  const body = (
    <TooltipPrimitive.Content
      side={side}
      align={align}
      sideOffset={4}
      collisionPadding={8}
      className={cn(tooltipStyles.content, tooltipStyles.motion)}
    >
      <TooltipBody content={content} shortcut={shortcut} shortcutMode={shortcutMode} />
    </TooltipPrimitive.Content>
  );
  const tooltip = (
    <TooltipPrimitive.Root {...root}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      {portal ? <TooltipPrimitive.Portal>{body}</TooltipPrimitive.Portal> : body}
    </TooltipPrimitive.Root>
  );
  return hasProvider ? tooltip : <TooltipProvider>{tooltip}</TooltipProvider>;
}

/**
 * O tooltip aberto, fixo na página (sem posicionamento flutuante nem Radix): para documentar a
 * aparência sem roubar o foco.
 */
export function TooltipSurface({ className, ...body }: TooltipBodyProps & { className?: string }) {
  return (
    <div className={cn(tooltipStyles.content, "relative z-base w-max", className)}>
      <TooltipBody {...body} />
    </div>
  );
}
