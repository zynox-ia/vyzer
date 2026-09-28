/**
 * Peças de navegação da sidebar (Figma 27:6905 → 1:6569): lista com roving tabindex (um alvo de
 * Tab por lista, setas navegam dentro dela, Fase 5), item de link com ícone e contador opcional,
 * e seção recolhível (Workspace, Favorites, Your teams, Try). Item ativo em `text-accent`
 * (terracota) — testamos `text-selected` (bege) nesta mesma rodada, mas o responsável decidiu
 * manter o terracota; o token foi removido (ver ADR-0012, ADR-0013 e .figma/01-design-tokens.md).
 *
 * Item não selecionado: `text-nav-idle`, um cinza quase neutro aprovado pelo responsável em
 * 28/09, não o `text-secondary` global — ver `--fg-nav` em themes.css.
 */
import { ChevronRight } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { NavLink } from "react-router";
import { Counter, type CounterProps } from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { cn } from "@vyzer/design-system/cn";
import { nextIndex, useRovingFocus } from "@vyzer/design-system/roving-focus";

const NAV_ITEM_SELECTOR = "a[data-nav-item], button[data-nav-item]";

/** Lista de itens de navegação com roving tabindex: um só alvo de Tab, setas navegam dentro dela. */
export function NavList({
  label,
  children,
  className,
}: {
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  const { ref, onFocus, items, itemFrom, rootProps } =
    useRovingFocus<HTMLUListElement>(NAV_ITEM_SELECTOR);

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const item = itemFrom(event.target);
    if (!item || event.altKey) return;
    const list = items();
    const next = nextIndex(event.key, list.indexOf(item), list.length);
    if (next !== undefined) {
      event.preventDefault();
      list[next]?.focus();
    }
  };

  return (
    // Roving tabindex (WAI-ARIA APG): o foco fica nos links/itens, não na lista.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <ul
      ref={ref}
      aria-label={label}
      {...rootProps}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      // gap-px: o mesmo 1 px entre linhas do ListGroup (list-group.tsx, Fase 5) — não é um valor
      // novo desta fase, é o padrão já usado para empilhar itens de lista bem juntos.
      className={cn("flex flex-col gap-px", className)}
    >
      {children}
    </ul>
  );
}

export type NavItemProps = {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  count?: number;
  countTone?: CounterProps["tone"];
  /** Recuo extra para subitens (Your teams › Home, Issues, Projects, Views). */
  indent?: boolean;
  end?: boolean;
};

/**
 * Item de navegação (Figma: 36 px, ícone 16 px + rótulo, contador à direita). Texto 13 px
 * (`text-label-md`) e ícone de 14 px (`size-icon-14`), 6 px de gap — igual ao Linear medido ao
 * vivo. Passou por várias combinações na mesma tarde (12/14, 13/12, 14/15) antes de fechar aqui;
 * o texto 14 (`text-nav`) foi reaproveitado como `text-sidebar-title` (nome do workspace,
 * `workspace-menu.tsx`), não apagado. Cor do texto/ícone não selecionado: `text-nav-idle`
 * (cinza quase neutro, aprovado); selecionado continua `text-accent` (terracota).
 *
 * Linha de 26 px (`h-6.5`), não os 28 do `h-nav-item` — divergência deliberada do Linear (28),
 * a pedido do responsável em 28/09 (passo mínimo, não os 24 do `h-nav-item` compacto). Não uso
 * `h-nav-item` aqui de propósito: o token é compartilhado com Settings e a nav do
 * `/design-system`, que não devem mudar de altura por causa disto.
 */
export function NavItem({ to, icon, children, count, countTone, indent, end }: NavItemProps) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        data-nav-item
        className={cn(
          "flex h-6.5 items-center gap-1.5 rounded-control text-label-md text-nav-idle no-underline transition-colors select-none focus-ring hovered:bg-hover hovered:text-primary",
          "aria-[current=page]:bg-selected aria-[current=page]:text-accent",
          // pl-5 (20 px): medido ao vivo no Linear (item de subtime em x=31, lista em 12 px de
          // borda → recuo de ~19 px; 20 é o degrau de 4 mais perto). Era pl-7.5 (30 px).
          indent ? "pl-5 pr-2.5" : "px-2.5",
        )}
      >
        <span aria-hidden className="flex size-3.5 shrink-0 items-center justify-center">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {count !== undefined && <Counter count={count} tone={countTone} />}
      </NavLink>
    </li>
  );
}

/** Botão de ação simples na lista (ex.: "More", "Invite people"), mesma forma do NavItem. */
export function NavAction({
  icon,
  children,
  onClick,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        data-nav-item
        onClick={onClick}
        className="flex h-6.5 w-full items-center gap-1.5 rounded-control px-2.5 text-left text-label-md text-nav-idle transition-colors select-none focus-ring hovered:bg-hover hovered:text-primary"
      >
        <span aria-hidden className="flex size-3.5 shrink-0 items-center justify-center">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{children}</span>
      </button>
    </li>
  );
}

/** Seção recolhível da sidebar (Workspace, Favorites, Your teams, Try): rótulo + chevron. */
export function SidebarSection({
  title,
  defaultOpen = true,
  hidden,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  /** Some por completo quando não há itens (ex.: Favorites vazio). */
  hidden?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (hidden) return null;
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="flex flex-col pt-2">
      {/* text-label-sm (12 px): volta ao que já era antes desta rodada — pedido do responsável,
          28/09, depois de reverter os itens de 12 para 13. */}
      <Collapsible.Trigger className="group flex h-7 shrink-0 items-center gap-1 rounded-control px-2.5 text-left text-label-sm text-secondary select-none focus-ring hovered:text-primary">
        {title}
        <Icon
          icon={ChevronRight}
          size="xs"
          className="transition-transform duration-fast ease-standard group-data-[state=open]:rotate-90"
        />
      </Collapsible.Trigger>
      <Collapsible.Content className="flex flex-col gap-px pt-0.5">{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}

/** Time dentro de "Your teams": ícone + nome + chevron, com Home/Issues/Projects/Views dentro. */
export function TeamNavGroup({
  icon,
  name,
  defaultOpen = true,
  children,
}: {
  icon: ReactNode;
  name: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <li>
      <Collapsible.Root open={open} onOpenChange={setOpen} className="flex flex-col">
        <Collapsible.Trigger
          data-nav-item
          className="group flex h-6.5 items-center gap-1.5 rounded-control px-2.5 text-left text-label-md text-nav-idle select-none focus-ring hovered:bg-hover hovered:text-primary"
        >
          <span aria-hidden className="flex size-3.5 shrink-0 items-center justify-center">
            {icon}
          </span>
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <Icon
            icon={ChevronRight}
            size="xs"
            className="text-secondary transition-transform duration-fast ease-standard group-data-[state=open]:rotate-90"
          />
        </Collapsible.Trigger>
        <Collapsible.Content asChild>
          <ul className="flex flex-col gap-px pt-0.5">{children}</ul>
        </Collapsible.Content>
      </Collapsible.Root>
    </li>
  );
}
