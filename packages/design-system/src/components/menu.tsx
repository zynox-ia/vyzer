/**
 * Menu (Figma 1:4653, menu "/" do editor): popover de raio 10 com linhas de ícone, rótulo e
 * atalho, separadores e destaque de raio 6 (10 − 4 de folga, regra de aninhamento §5).
 * Radix DropdownMenu: teclado, foco, typeahead e fechamento com Esc.
 */
import type { LucideIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;
export const MenuGroup = DropdownMenu.Group;

export type MenuContentProps = ComponentProps<typeof DropdownMenu.Content> & {
  /**
   * Renderiza num portal no body (padrão). Sem portal, o menu herda o tema do contêiner
   * (útil para mostrar claro e escuro lado a lado).
   */
  portal?: boolean;
};

export function MenuContent({
  portal = true,
  sideOffset = 4,
  align = "start",
  className,
  ...rest
}: MenuContentProps) {
  const content = (
    <DropdownMenu.Content
      sideOffset={sideOffset}
      align={align}
      className={cn(
        "z-dropdown min-w-56 overflow-hidden rounded-container border border-strong bg-popover p-1 text-primary shadow-md outline-none",
        "origin-(--radix-dropdown-menu-content-transform-origin) data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
        className,
      )}
      {...rest}
    />
  );
  return portal ? <DropdownMenu.Portal>{content}</DropdownMenu.Portal> : content;
}

export type MenuItemProps = ComponentProps<typeof DropdownMenu.Item> & {
  icon?: LucideIcon;
  /** Teclas do atalho, na ordem (ex.: ["Ctrl", "Alt", "1"]). */
  shortcut?: string[];
  children: ReactNode;
};

/** Linha do menu: slot de ícone de 20 px, rótulo de 13 px e atalho à direita. */
export function MenuItem({ icon, shortcut, className, children, ...rest }: MenuItemProps) {
  return (
    <DropdownMenu.Item
      className={cn(
        "flex h-command-item cursor-default items-center gap-2 rounded-sm px-2.5 text-body-md text-primary outline-none select-none",
        "data-highlighted:bg-selected data-disabled:cursor-not-allowed data-disabled:opacity-disabled",
        className,
      )}
      {...rest}
    >
      <span className="flex w-5 shrink-0 justify-center text-secondary">
        {icon && <Icon icon={icon} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && (
        <span className="ml-3 flex shrink-0 gap-1.5 text-label-sm text-secondary">
          {shortcut.map((k) => (
            <kbd key={k} className="font-sans">
              {k}
            </kbd>
          ))}
        </span>
      )}
    </DropdownMenu.Item>
  );
}

/** Divisória de largura total entre grupos (Figma: 1 px com folga vertical). */
export function MenuSeparator({
  className,
  ...rest
}: ComponentProps<typeof DropdownMenu.Separator>) {
  return (
    <DropdownMenu.Separator
      className={cn("-mx-1 my-1 border-t border-strong", className)}
      {...rest}
    />
  );
}

/** Rótulo de seção dentro do menu. */
export function MenuLabel({ className, ...rest }: ComponentProps<typeof DropdownMenu.Label>) {
  return (
    <DropdownMenu.Label
      className={cn("px-2.5 pt-2 pb-1 text-label-sm text-secondary", className)}
      {...rest}
    />
  );
}
