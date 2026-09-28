/**
 * Menu (Figma 1:4653, menu "/" do editor; 1:1256, "Add dependency"): popover com linhas de
 * ícone, rótulo e atalho, separadores, rótulos de seção e submenus. Radix DropdownMenu:
 * teclado, foco, typeahead e fechamento com Esc.
 *
 * Context Menu (sem desenho; segue o Linear): as mesmas peças abertas pelo clique direito, por
 * Shift+F10 ou pela tecla de menu. Radix ContextMenu. Itens, separadores, rótulos e submenus
 * são os do Menu: cada peça usa o primitivo da família em que está (KindContext).
 */
import { ChevronRight, type LucideIcon } from "lucide-react";
import { ContextMenu as ContextMenuPrimitive, DropdownMenu } from "radix-ui";
import {
  createContext,
  use,
  useEffect,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

/**
 * Classes do menu, exportadas para montar a mesma aparência fora do Radix (painéis estáticos
 * em documentação). Raio 10 com destaque de raio 6 a 4 px da borda (§5: 10 − 4 = 6).
 */
export const menuStyles = {
  content:
    "z-dropdown min-w-56 overflow-x-hidden overflow-y-auto rounded-container border border-strong bg-popover p-1 text-primary shadow-md outline-none",
  motion:
    "origin-(--radix-dropdown-menu-content-transform-origin) data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
  item: "flex h-command-item cursor-default items-center gap-2 rounded-sm px-2.5 text-body-md text-primary outline-none select-none data-highlighted:bg-selected data-disabled:cursor-not-allowed data-disabled:opacity-disabled",
  iconSlot: "flex w-5 shrink-0 justify-center text-secondary",
  shortcut: "ml-3 flex shrink-0 gap-1.5 text-label-sm text-secondary",
  separator: "-mx-1 my-1 border-t border-strong",
  label: "px-2.5 pt-2 pb-1 text-label-sm text-secondary",
};

/**
 * Família "dropdown" (Figma 1:1256, 1:904: menus de propriedade): raio 12, 6 px de folga,
 * linhas de 32 px com destaque de raio 8 e rótulo de seção a 14 px.
 */
export const dropdownMenuStyles = {
  content:
    "z-dropdown min-w-44 overflow-x-hidden overflow-y-auto rounded-xl border border-strong bg-popover p-1.5 text-primary shadow-md outline-none",
  item: "flex h-menu-item cursor-default items-center gap-2 rounded-control px-2 text-body-md text-primary outline-none select-none data-highlighted:bg-selected data-disabled:cursor-not-allowed data-disabled:opacity-disabled",
  iconSlot: "flex w-4 shrink-0 justify-center text-secondary",
  separator: "-mx-1.5 my-1.5 border-t border-strong",
  label: "px-2 pt-1 pb-1.5 text-label-sm text-secondary",
};

export type MenuVariant = "command" | "dropdown";

const VariantContext = createContext<MenuVariant>("command");

function styles(variant: MenuVariant) {
  return variant === "dropdown" ? { ...menuStyles, ...dropdownMenuStyles } : menuStyles;
}

/** Família do menu aberto: dropdown (Menu) ou contexto (Context Menu). */
const KindContext = createContext<"dropdown" | "context">("dropdown");

/**
 * Primitivos Radix da família atual. Os dois montam o mesmo Menu do Radix por baixo e as peças
 * internas (Item, Sub, SubTrigger, SubContent, Separator, Label, Group, Portal) têm as mesmas
 * props; só o escopo muda, por isso a peça precisa ser a da família certa.
 */
function usePrimitive() {
  return use(KindContext) === "context"
    ? (ContextMenuPrimitive as unknown as typeof DropdownMenu)
    : DropdownMenu;
}

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export function MenuGroup(props: ComponentProps<typeof DropdownMenu.Group>) {
  const P = usePrimitive();
  return <P.Group {...props} />;
}

export function MenuSub(props: ComponentProps<typeof DropdownMenu.Sub>) {
  const P = usePrimitive();
  return <P.Sub {...props} />;
}

export type MenuContentProps = ComponentProps<typeof DropdownMenu.Content> & {
  /** Renderiza num portal no body (padrão). Sem portal, herda o tema do contêiner. */
  portal?: boolean;
  /** command: menu "/" (raio 10, linhas de 36). dropdown: menus de propriedade (raio 12, 32). */
  variant?: MenuVariant;
};

/**
 * Abre sempre para baixo (pedido do responsável): sem a virada automática do Radix, que jogava o
 * menu para cima quando faltava espaço. A altura fica limitada ao espaço disponível abaixo do
 * gatilho (com 8 px de folga até a borda da janela), com rolagem interna.
 */
export function MenuContent({
  portal = true,
  variant = "command",
  side = "bottom",
  sideOffset = 4,
  align = "start",
  avoidCollisions = false,
  collisionPadding = 8,
  className,
  ...rest
}: MenuContentProps) {
  const content = (
    <VariantContext value={variant}>
      <DropdownMenu.Content
        side={side}
        sideOffset={sideOffset}
        align={align}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
        className={cn(
          styles(variant).content,
          "max-h-(--radix-dropdown-menu-content-available-height)",
          menuStyles.motion,
          className,
        )}
        {...rest}
      />
    </VariantContext>
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
  const s = styles(use(VariantContext));
  const P = usePrimitive();
  return (
    <P.Item className={cn(s.item, className)} {...rest}>
      <MenuItemContent icon={icon} shortcut={shortcut}>
        {children}
      </MenuItemContent>
    </P.Item>
  );
}

/** Conteúdo de uma linha (ícone, rótulo, atalho); reaproveitado nos painéis estáticos. */
export function MenuItemContent({
  icon,
  shortcut,
  trailing,
  children,
}: {
  icon?: LucideIcon;
  shortcut?: string[];
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const s = styles(use(VariantContext));
  return (
    <>
      <span className={s.iconSlot}>{icon && <Icon icon={icon} />}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && (
        <span className={menuStyles.shortcut}>
          {shortcut.map((k) => (
            <kbd key={k} className="font-sans">
              {k}
            </kbd>
          ))}
        </span>
      )}
      {trailing}
    </>
  );
}

export type MenuSubTriggerProps = ComponentProps<typeof DropdownMenu.SubTrigger> & {
  icon?: LucideIcon;
  children: ReactNode;
};

/** Item que abre um submenu (Figma: "Blocked by… ▸"). → ou Enter abre; ← fecha. */
export function MenuSubTrigger({ icon, className, children, ...rest }: MenuSubTriggerProps) {
  const s = styles(use(VariantContext));
  const P = usePrimitive();
  return (
    <P.SubTrigger className={cn(s.item, "data-[state=open]:bg-selected", className)} {...rest}>
      <MenuItemContent
        icon={icon}
        trailing={<Icon icon={ChevronRight} size="xs" className="text-secondary" />}
      >
        {children}
      </MenuItemContent>
    </P.SubTrigger>
  );
}

export type MenuSubContentProps = ComponentProps<typeof DropdownMenu.SubContent> & {
  portal?: boolean;
  /**
   * Quando o submenu hospeda um painel com busca (MenuPanel), o nome dele. O submenu deixa de
   * ser role="menu" (que só pode conter itens) e vira um diálogo com esse nome.
   */
  panelLabel?: string;
};

export function MenuSubContent({
  portal = true,
  sideOffset = 4,
  panelLabel,
  className,
  ...rest
}: MenuSubContentProps) {
  const s = styles(use(VariantContext));
  const kind = use(KindContext);
  const P = usePrimitive();
  const content = (
    <P.SubContent
      sideOffset={sideOffset}
      {...(panelLabel && {
        role: "dialog",
        "aria-label": panelLabel,
        "aria-orientation": undefined,
      })}
      className={cn(
        s.content,
        kind === "context"
          ? "origin-(--radix-context-menu-content-transform-origin)"
          : "origin-(--radix-dropdown-menu-content-transform-origin)",
        "data-[state=open]:animate-scale-in",
        className,
      )}
      {...rest}
    />
  );
  return portal ? <P.Portal>{content}</P.Portal> : content;
}

/**
 * Hospeda um painel com busca (ComboboxPanel) dentro de um submenu. Foca a busca ao abrir (o
 * Radix foca o submenu depois dos efeitos dos filhos, por isso no quadro seguinte) e isola as
 * teclas de busca e navegação do menu (typeahead e setas do Radix): só Esc e Tab chegam a ele.
 */
export function MenuPanel({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => ref.current?.querySelector("input")?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);
  const isolate = (e: KeyboardEvent) => {
    if (e.key !== "Escape" && e.key !== "Tab") e.stopPropagation();
  };
  return (
    // Só intercepta teclas que sobem dos controles de dentro; não é um alvo interativo.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div ref={ref} className={cn("-m-1.5", className)} onKeyDown={isolate}>
      {children}
    </div>
  );
}

/** Divisória de largura total entre grupos (Figma: 1 px com folga vertical). */
export function MenuSeparator({
  className,
  ...rest
}: ComponentProps<typeof DropdownMenu.Separator>) {
  const s = styles(use(VariantContext));
  const P = usePrimitive();
  return <P.Separator className={cn(s.separator, className)} {...rest} />;
}

/** Rótulo de seção dentro do menu. */
export function MenuLabel({ className, ...rest }: ComponentProps<typeof DropdownMenu.Label>) {
  const s = styles(use(VariantContext));
  const P = usePrimitive();
  return <P.Label className={cn(s.label, className)} {...rest} />;
}

export const ContextMenu = ContextMenuPrimitive.Root;
/**
 * Alvo do menu: passe um elemento focável com asChild (linha, cartão) para o menu abrir também
 * pelo teclado (Shift+F10 ou tecla de menu), perto do elemento.
 */
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

export type ContextMenuContentProps = ComponentProps<typeof ContextMenuPrimitive.Content> & {
  /** Renderiza num portal no body (padrão). Sem portal, herda o tema do contêiner. */
  portal?: boolean;
  /** dropdown (padrão): raio 12, linhas de 32, como os menus de propriedade. command: raio 10, 36. */
  variant?: MenuVariant;
};

/**
 * Abre no ponteiro e segue para baixo e à direita. Perto da borda direita vira para a esquerda do
 * ponteiro; perto da de baixo sobe só o necessário (sem virar), com 8 px de folga até a borda.
 */
export function ContextMenuContent({
  portal = true,
  variant = "dropdown",
  avoidCollisions = true,
  collisionPadding = 8,
  className,
  ...rest
}: ContextMenuContentProps) {
  const content = (
    <KindContext value="context">
      <VariantContext value={variant}>
        <ContextMenuPrimitive.Content
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          className={cn(
            styles(variant).content,
            "max-h-(--radix-context-menu-content-available-height) origin-(--radix-context-menu-content-transform-origin) data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
            className,
          )}
          {...rest}
        />
      </VariantContext>
    </KindContext>
  );
  return portal ? <ContextMenuPrimitive.Portal>{content}</ContextMenuPrimitive.Portal> : content;
}
