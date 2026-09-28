/**
 * Popover (superfície do Figma 1:935: raio 12, borda forte, sombra md): conteúdo livre preso a
 * um gatilho, como um formulário curto ou um resumo. Para escolher um valor numa lista use
 * Select ou Combobox; para ações, Menu. Radix Popover: Esc fecha e devolve o foco ao gatilho e
 * clique fora fecha. Ao abrir, o foco vai para o primeiro elemento focável, sem selecionar o
 * texto de um campo (pedido do responsável): o cursor fica no fim.
 *
 * Para mostrar o popover aberto numa documentação ou embuti-lo numa tela, use PopoverSurface.
 */
import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";
import { popoverSurface } from "./listbox";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

/** Elementos que recebem foco pelo Tab, na ordem do documento. */
const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Foco inicial: o primeiro elemento focável (ou o próprio conteúdo). O Radix faz o mesmo, mas
 * seleciona o texto do campo; aqui o cursor vai para o fim, pronto para continuar digitando.
 */
function focusFirst(event: Event) {
  event.preventDefault();
  const content = event.currentTarget as HTMLElement;
  // Pula os ocultos (hidden, display: none, inert): o foco neles não teria efeito.
  const target =
    [...content.querySelectorAll<HTMLElement>(FOCUSABLE)].find(
      (el) => el.checkVisibility() && !el.closest("[inert]"),
    ) ?? content;
  target.focus({ preventScroll: true });
  // Só campos de texto têm cursor (selectionStart é null em email, number etc.).
  if (
    (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
    target.selectionStart !== null
  ) {
    const end = target.value.length;
    target.setSelectionRange(end, end);
  }
}

export type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Nome acessível do popover (role="dialog"); ou aponte um título com aria-labelledby. */
  label?: string;
  /** Renderiza num portal no body (padrão). Sem portal, herda o tema do contêiner. */
  portal?: boolean;
};

/**
 * Abre sempre para baixo, como o Menu (pedido do responsável): sem a virada automática do
 * Radix, com a altura limitada ao espaço abaixo do gatilho (8 px de folga até a borda da
 * janela) e rolagem interna. O conteúdo define o próprio respiro.
 */
export function PopoverContent({
  label,
  portal = true,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  avoidCollisions = false,
  collisionPadding = 8,
  onOpenAutoFocus,
  className,
  ...rest
}: PopoverContentProps) {
  const content = (
    <PopoverPrimitive.Content
      aria-label={label}
      side={side}
      sideOffset={sideOffset}
      align={align}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event);
        if (!event.defaultPrevented) focusFirst(event);
      }}
      className={cn(
        popoverSurface,
        "max-h-(--radix-popover-content-available-height) origin-(--radix-popover-content-transform-origin) overflow-y-auto",
        className,
      )}
      {...rest}
    />
  );
  return portal ? <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal> : content;
}
