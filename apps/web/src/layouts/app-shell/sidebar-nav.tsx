/**
 * Peças de navegação da sidebar (Unifie Refinement):
 * - NavList: roving tabindex (um alvo de Tab por lista, setas navegam dentro dela)
 * - NavItem: item de link com ícone e rótulo (altura 40 px na raiz com shape rounded-[10px], fundo #151516 e borda rgba(44,44,48,0.7); subitens com linha guia contínua e ticks horizontais estilo árvore minimalista)
 * - NavGroup: macro com filhos (altura 40 px, chevron rotativo, conector de árvore contínuo a left-[20px])
 * - SidebarSection: seções Home, Business, Platform com legenda pequena muted
 */
import { ChevronRight } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { Counter, type CounterProps } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import { cn } from "@zynox/design-system/cn";
import { nextIndex, useRovingFocus } from "@zynox/design-system/roving-focus";

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
      className={cn("flex flex-col gap-1", className)}
    >
      {children}
    </ul>
  );
}

export type NavItemProps = {
  to: string;
  icon?: ReactNode;
  children: ReactNode;
  count?: number;
  countTone?: CounterProps["tone"];
  /** "dot": no lugar do número, só um ponto quando há algo (Customize sidebar → badge style). */
  badgeStyle?: "count" | "dot";
  /** Recuo extra para filhos com conector de árvore. */
  indent?: boolean;
  isLastChild?: boolean;
  end?: boolean;
  /** Ativação customizada (ex.: micro Projects ativo também em /projects/:projectId). */
  isActive?: boolean;
};

/**
 * Item de navegação (Unifie):
 * - Item raiz ativo: container rounded-[10px], fundo #151516, borda rgba(44,44,48,0.7), chevron ">" à direita.
 * - Subitem ativo: texto em tom âmbar / ouro (#f5d18d) conectado com tick horizontal à linha vertical.
 * - Alinhamento: o texto do subitem fica perfeitamente alinhado com o texto do item superior (pl-[41px]).
 */
export function NavItem({
  to,
  icon,
  children,
  count,
  countTone,
  badgeStyle = "count",
  indent,
  end,
  isActive: customIsActive,
}: NavItemProps) {
  const isChild = indent;

  return (
    <li className={cn(isChild && "relative flex h-[36px] items-center")}>
      {isChild && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-[24px] top-1/2 h-px w-[10px] -translate-y-1/2 bg-[var(--vz-sb-connector)]"
        />
      )}
      <NavLink
        to={to}
        end={end}
        data-nav-item
        ref={(el) => {
          if (el && customIsActive) {
            el.setAttribute("aria-current", "page");
          }
        }}
        className={({ isActive: navLinkActive }) => {
          const active = customIsActive !== undefined ? customIsActive : navLinkActive;
          if (isChild) {
            return cn(
              "flex h-full w-full items-center rounded-[6px] pl-[41px] pr-2.5 text-[13.5px] no-underline transition-colors select-none focus-ring",
              active
                ? "text-[var(--vz-sb-amber)] font-medium"
                : "text-[var(--vz-sb-secondary)] hover:text-white font-normal",
            );
          }
          return cn(
            "flex h-[40px] w-full items-center justify-between rounded-[10px] px-3 text-[13.5px] no-underline transition-colors select-none focus-ring",
            active
              ? "border border-[var(--vz-sb-active-border)] bg-[var(--vz-sb-active-bg)] text-white font-medium"
              : "border border-transparent text-[var(--vz-sb-secondary)] hover:bg-[var(--vz-sb-hover-bg)] hover:text-white",
          );
        }}
        {...(customIsActive ? { "aria-current": "page" } : {})}
      >
        {({ isActive: navLinkActive }) => {
          const active = customIsActive !== undefined ? customIsActive : navLinkActive;
          return (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {icon && (
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center",
                      active && !isChild ? "text-white" : "text-[var(--vz-sb-secondary)]",
                    )}
                  >
                    {icon}
                  </span>
                )}
                <span className="truncate">{children}</span>
              </div>
              {count !== undefined &&
                (badgeStyle === "dot" ? (
                  count > 0 && (
                    <span
                      aria-label={`${count} unread`}
                      className="size-1.5 shrink-0 rounded-full bg-accent"
                    />
                  )
                ) : (
                  <Counter count={count} tone={countTone} />
                ))}
              {active && !isChild && (
                <Icon
                  icon={ChevronRight}
                  size="xs"
                  className="shrink-0 text-[var(--vz-sb-muted)]"
                />
              )}
            </>
          );
        }}
      </NavLink>
    </li>
  );
}

/** Seção da sidebar (Home, Business, Platform): legenda pequena muted não colapsável. */
export function SidebarSection({
  title,
  hidden,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  hidden?: boolean;
  children?: ReactNode;
}) {
  if (hidden) return null;
  return (
    <div className="flex flex-col pt-2">
      <div className="flex h-6 items-center px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--vz-sb-muted)] select-none">
        {title}
      </div>
      <div className="flex flex-col gap-1 pt-0.5">{children}</div>
    </div>
  );
}

/**
 * Macro com filhos (Dashboard, Projects, CRM, Finance, AI Tools, Analytics):
 * Linha de 40 px, chevron rotativo, conector de árvore contínuo a left-[20px] com ticks horizontais.
 */
export function NavGroup({
  icon,
  label,
  childPaths,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  isActive: controlledIsActive,
  children,
}: {
  icon: ReactNode;
  label: string;
  childPaths?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isActive?: boolean;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const isActiveDescendant = childPaths?.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const [internalOpen, setInternalOpen] = useState(isActiveDescendant ?? false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
  const isActive = controlledIsActive !== undefined ? controlledIsActive : isActiveDescendant;

  return (
    <li>
      <Collapsible.Root open={open} onOpenChange={setOpen} className="flex flex-col">
        <Collapsible.Trigger
          data-nav-item
          aria-expanded={open}
          className={cn(
            "group flex h-[40px] w-full items-center justify-between rounded-[10px] px-3 text-left text-[13.5px] select-none transition-colors focus-ring",
            open || isActive
              ? "border border-[var(--vz-sb-active-border)] bg-[var(--vz-sb-active-bg)] text-white font-medium"
              : "border border-transparent text-[var(--vz-sb-secondary)] hover:bg-[var(--vz-sb-hover-bg)] hover:text-white",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              aria-hidden
              className={cn(
                "flex size-4 shrink-0 items-center justify-center",
                open || isActive ? "text-white" : "text-[var(--vz-sb-secondary)]",
              )}
            >
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </div>
          <Icon
            icon={ChevronRight}
            size="xs"
            className={cn(
              "shrink-0 text-[var(--vz-sb-muted)] transition-transform duration-fast ease-standard",
              open && "rotate-90",
            )}
          />
        </Collapsible.Trigger>
        <Collapsible.Content className="relative flex flex-col pt-1.5 pb-2.5">
          {/* Linha vertical contínua que desce pelo centro do ícone do pai (x=20px) */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1.5 bottom-3.5 left-[20px] w-px bg-[var(--vz-sb-connector)]"
          />
          <ul className="flex flex-col gap-0">{children}</ul>
        </Collapsible.Content>
      </Collapsible.Root>
    </li>
  );
}
