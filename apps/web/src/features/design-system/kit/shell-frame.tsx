/**
 * Moldura para documentar peças do App Shell (Fase 8): AppShellProvider (o mesmo estado real:
 * recolhimento, largura, painel direito, Command Menu, criação de issue) dentro do router já
 * ativo da página de documentação — react-router não aceita `<Router>` aninhado, então, em vez de
 * um `MemoryRouter` próprio, os cliques em link (Sidebar, Settings) são interceptados na captura
 * para não navegar para fora da documentação.
 */
import type { MouseEvent, ReactNode } from "react";
import { AppShellProvider } from "@/layouts/app-shell/context";
import { cn } from "@vyzer/design-system/cn";
import type { ThemeName } from "./theme-frame";

/** Evita que um link dentro de uma moldura de documentação navegue a página de verdade. */
export function suppressLinkNavigation(event: MouseEvent) {
  if (event.target instanceof Element && event.target.closest("a")) event.preventDefault();
}

export function ShellFrame({
  theme,
  height = "h-150",
  /** Só ligado numa moldura por página (evita que um atalho afete várias ao mesmo tempo). */
  shortcuts = false,
  defaultCollapsed,
  defaultRightPanelOpen,
  defaultDrawerOpen,
  children,
  className,
}: {
  theme: ThemeName;
  height?: string;
  shortcuts?: boolean;
  defaultCollapsed?: boolean;
  defaultRightPanelOpen?: boolean;
  defaultDrawerOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-theme={theme}
      onClickCapture={suppressLinkNavigation}
      className={cn(
        "flex overflow-hidden rounded-container border border-subtle bg-app text-primary",
        height,
        className,
      )}
    >
      <AppShellProvider
        shortcuts={shortcuts}
        defaultCollapsed={defaultCollapsed}
        defaultRightPanelOpen={defaultRightPanelOpen}
        defaultDrawerOpen={defaultDrawerOpen}
      >
        {children}
      </AppShellProvider>
    </div>
  );
}
