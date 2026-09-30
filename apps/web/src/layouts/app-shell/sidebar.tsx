/**
 * Sidebar do workspace (Figma 27:6905 → 1:6569): seletor de workspace, busca (⌘K) e criar issue
 * ("C") no topo, itens de navegação, seções recolhíveis (Workspace, Favorites, Your teams, Try)
 * e o botão de ajuda no rodapé. Recolhe com "[" (some por completo; um controle discreto reabre),
 * redimensiona por arraste na borda (200–360 px, guardado em localStorage) e vira gaveta abaixo de
 * `tablet:` (768 px, foundations/grid.tsx).
 */
import {
  CircleHelp,
  GitPullRequest,
  Layers,
  PanelLeft,
  Plus,
  RefreshCcw,
  Search,
  Target,
  House,
  ListChecks,
  Inbox as InboxIcon,
  Box,
  Ellipsis,
  Bot,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  IconButton,
  ProjectIcon,
  dialogStyles,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { cn } from "@vyzer/design-system/cn";
// TEAMS de `features/projects`: mesma fonte da lista de Projects do time e do breadcrumb, para
// o ícone e a cor do time (Navigation/cyan no Zynox, medido ao vivo no Linear) baterem nos três
// lugares em vez de três cópias divergentes.
import { TEAMS, type Team } from "@/features/projects/project-data";
import { NavAction, NavItem, NavList, SidebarSection, TeamNavGroup } from "./sidebar-nav";
import { WorkspaceMenu } from "./workspace-menu";
import { useAppShell } from "./use-app-shell";

/** Exportado para a documentação mostrar a gaveta aberta de forma estática (sem Dialog modal). */
export function SidebarContent({
  workspaceName = "Zynox",
  workspaceIcon,
  workspaceLogoUrl,
  teams = TEAMS,
  workspaceStatus,
  onWorkspaceRetry,
  inboxUnreadCount = 0,
}: {
  workspaceName?: string;
  workspaceIcon?: ProjectIconValue;
  workspaceLogoUrl?: string | null;
  /** Teams da seção "Your teams"; sem a prop, os de exemplo (a documentação em /design-system). */
  teams?: Team[];
  workspaceStatus?: string;
  onWorkspaceRetry?: () => void;
  /** Não lidas da Inbox; o contador só aparece com pelo menos uma. */
  inboxUnreadCount?: number;
}) {
  const { setCommandMenuOpen, setCreateIssueOpen } = useAppShell();
  return (
    <div className="flex h-full flex-col">
      {/* items-start + pt-4: medido ao vivo no Linear (x=12, y=16 até os botões do cabeçalho,
          contra x=8/y=10 daqui) — 16 px de topo, não centralização vertical num h-11. */}
      <div className="flex h-11 shrink-0 items-start gap-1 px-3 pt-4">
        <WorkspaceMenu
          name={workspaceName}
          icon={workspaceIcon}
          logoUrl={workspaceLogoUrl}
          onRetry={onWorkspaceRetry}
        />
        {workspaceStatus && (
          <output aria-live="polite" className="sr-only">
            {workspaceStatus}
          </output>
        )}
        <div className="ml-auto flex items-center gap-1">
          {/* iconSize="14": pedido do responsável, 28/09 — o ícone de 16 (padrão do sm) ficava
              grande na linha do seletor de workspace; o botão continua 24 px (size="sm"). */}
          <IconButton
            icon={Search}
            label="Search workspace"
            variant="ghost"
            size="sm"
            iconSize="14"
            onClick={() => setCommandMenuOpen(true)}
          />
          <IconButton
            icon={Plus}
            label="Create new issue"
            variant="ghost"
            size="sm"
            iconSize="14"
            onClick={() => setCreateIssueOpen(true)}
          />
        </div>
      </div>

      {/* px-3/pt-4: medido ao vivo no Linear (12 px de cada lado, primeiro item em y=60 — 16 px
          depois do fim da linha do seletor de workspace, não colado nela). */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pt-4 pb-2">
        <NavList label="Navegação principal">
          <NavItem
            to="/inbox"
            icon={<Icon icon={InboxIcon} size="14" />}
            count={inboxUnreadCount > 0 ? inboxUnreadCount : undefined}
            countTone="accent"
          >
            Inbox
          </NavItem>
          <NavItem to="/reviews" icon={<Icon icon={GitPullRequest} size="14" />} count={5}>
            Reviews
          </NavItem>
          <NavItem to="/my-issues" icon={<Icon icon={UserRound} size="14" />}>
            My issues
          </NavItem>
          <NavItem to="/agent" icon={<Icon icon={Bot} size="14" />}>
            Agent
          </NavItem>
        </NavList>

        <SidebarSection title="Workspace">
          <NavList label="Workspace">
            <NavItem to="/projects" icon={<Icon icon={Box} size="14" />}>
              Projects
            </NavItem>
            <NavItem to="/views" icon={<Icon icon={Layers} size="14" />}>
              Views
            </NavItem>
            <NavAction icon={<Icon icon={Ellipsis} size="14" />}>More</NavAction>
          </NavList>
        </SidebarSection>

        {/* Favorites: sem exemplo populado no Figma; oculta enquanto vazia, como no Linear. */}
        <SidebarSection title="Favorites" hidden={true} />

        <SidebarSection title="Your teams" hidden={teams.length === 0}>
          <NavList label="Your teams">
            {teams.map((team) => (
              <TeamNavGroup
                key={team.slug}
                name={team.name}
                slug={team.slug}
                icon={<ProjectIcon value={team.icon} className="size-icon-14" />}
              >
                <NavItem
                  to={`/teams/${team.slug}`}
                  end
                  icon={<Icon icon={House} size="14" />}
                  indent
                >
                  Home
                </NavItem>
                <NavItem
                  to={`/teams/${team.slug}/issues`}
                  icon={<Icon icon={ListChecks} size="14" />}
                  indent
                >
                  Issues
                </NavItem>
                <NavItem
                  to={`/teams/${team.slug}/projects`}
                  icon={<Icon icon={Box} size="14" />}
                  indent
                >
                  Projects
                </NavItem>
                <NavItem
                  to={`/teams/${team.slug}/views`}
                  icon={<Icon icon={Layers} size="14" />}
                  indent
                >
                  Views
                </NavItem>
              </TeamNavGroup>
            ))}
          </NavList>
        </SidebarSection>

        {/* "Connect Cursor"/"Connect Codex" (Linear) tirados a pedido do responsável, 28/09 — a
            seção não esvaziou (Invite people/Initiatives/Cycles ficam), então continua com o
            título. Divergência deliberada, registrada em .figma/01-design-tokens.md. */}
        <SidebarSection title="Try">
          <NavList label="Try">
            <NavAction icon={<Icon icon={UserRoundPlus} size="14" />}>Invite people</NavAction>
            <NavItem to="/initiatives" icon={<Icon icon={Target} size="14" />}>
              Initiatives
            </NavItem>
            <NavItem to="/cycles" icon={<Icon icon={RefreshCcw} size="14" />}>
              Cycles
            </NavItem>
          </NavList>
        </SidebarSection>
      </div>

      {/* p-2.5 (10 px): medido ao vivo no Linear, x=10 e ~10 px do fundo (contra 8 px daqui). */}
      <div className="shrink-0 p-2.5">
        <IconButton
          icon={CircleHelp}
          label="Open help menu"
          variant="secondary"
          size="sm"
          className="rounded-full"
        />
      </div>
    </div>
  );
}

/** Alça de 7 px na borda direita da sidebar: arraste redimensiona (200–360 px, só de mouse). */
function ResizeHandle() {
  const { sidebarWidth, setSidebarWidth } = useAppShell();
  const startRef = useRef<{ x: number; width: number } | null>(null);

  const onPointerDown = (event: ReactPointerEvent) => {
    event.preventDefault();
    startRef.current = { x: event.clientX, width: sidebarWidth };
    const onMove = (e: PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      setSidebarWidth(start.width + (e.clientX - start.x));
    };
    const onUp = () => {
      startRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    // Só de mouse (pedido do responsável): sem alvo de teclado, o recolhimento cobre esse caso.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      onPointerDown={onPointerDown}
      // 8 px (w-2): o degrau da grade de 4 mais perto dos 7 px confirmados ao vivo no Linear
      // (divergência registrada em .figma/01-design-tokens.md — sem token novo).
      className="absolute top-0 right-0 h-full w-2 shrink-0 cursor-col-resize select-none"
      aria-hidden
    />
  );
}

export function Sidebar({
  label = "Sidebar do workspace",
  workspaceName = "Zynox",
  workspaceIcon,
  workspaceLogoUrl,
  teams,
  workspaceStatus,
  onWorkspaceRetry,
  inboxUnreadCount,
}: {
  label?: string;
  workspaceName?: string;
  workspaceIcon?: ProjectIconValue;
  workspaceLogoUrl?: string | null;
  /** Teams da seção "Your teams"; sem a prop, os de exemplo (a documentação em /design-system). */
  teams?: Team[];
  workspaceStatus?: string;
  onWorkspaceRetry?: () => void;
  inboxUnreadCount?: number;
}) {
  const { sidebarCollapsed, toggleSidebar, sidebarWidth, sidebarDrawerOpen, setSidebarDrawerOpen } =
    useAppShell();

  return (
    <>
      {/* Rail fixo (tablet e acima) */}
      {!sidebarCollapsed && (
        <nav
          aria-label={label}
          style={{ width: sidebarWidth }}
          // Sem fundo nem borda próprios: a sidebar fica no canvas do app (bg-app, herdado da
          // raiz do AppShell) — a separação visual do painel de conteúdo é a borda dele, não uma
          // segunda aqui (refinamento, medido ao vivo no Linear, 28/09).
          className="relative hidden shrink-0 tablet:block"
        >
          <SidebarContent
            workspaceName={workspaceName}
            workspaceIcon={workspaceIcon}
            workspaceLogoUrl={workspaceLogoUrl}
            teams={teams}
            workspaceStatus={workspaceStatus}
            onWorkspaceRetry={onWorkspaceRetry}
            inboxUnreadCount={inboxUnreadCount}
          />
          <ResizeHandle />
        </nav>
      )}

      {/* Controle discreto para reabrir, com a sidebar recolhida (desktop) */}
      {sidebarCollapsed && (
        <div className="hidden shrink-0 items-start p-2 tablet:flex">
          <IconButton
            icon={PanelLeft}
            label="Expand sidebar"
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
          />
        </div>
      )}

      {/* Gaveta (abaixo de tablet:): Radix Dialog, como em foundations/grid.tsx. O gatilho precisa
          ser um DialogPrimitive.Trigger — sem ele, o Radix não sabe para onde devolver o foco ao
          fechar (só volta ao gatilho registrado; ver packages/design-system/src/components/dialog.tsx). */}
      <DialogPrimitive.Root open={sidebarDrawerOpen} onOpenChange={setSidebarDrawerOpen}>
        <div className="flex shrink-0 items-start p-2 tablet:hidden">
          <DialogPrimitive.Trigger asChild>
            <IconButton icon={PanelLeft} label="Open sidebar" variant="ghost" size="sm" />
          </DialogPrimitive.Trigger>
        </div>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={cn(dialogStyles.overlay, "p-0")}>
            <DialogPrimitive.Content
              className="h-dvh w-70 border-r border-default bg-app outline-none data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
              aria-describedby={undefined}
            >
              <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
              <SidebarContent
                workspaceName={workspaceName}
                workspaceIcon={workspaceIcon}
                workspaceLogoUrl={workspaceLogoUrl}
                teams={teams}
                workspaceStatus={workspaceStatus}
                onWorkspaceRetry={onWorkspaceRetry}
                inboxUnreadCount={inboxUnreadCount}
              />
            </DialogPrimitive.Content>
          </DialogPrimitive.Overlay>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
