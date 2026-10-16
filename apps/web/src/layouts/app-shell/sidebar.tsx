/**
 * Sidebar do workspace (Unifie Refinement):
 * - Barra lateral única (sem rail secundário) com fundo escuro #080808 e 276 px de largura (+15%)
 * - Cabeçalho: logotipo oficial Zynox (vetorial exclusivo) e ações rápidas (criar issue, busca e menu de 3 pontinhos)
 * - Navegação: Sitemap V3 (Home, Business, Platform) com linhas de árvore contínuas e destaque âmbar nos subitens ativos
 * - Card promocional: "Zynox workspace PRO", "Your team. Every conversation.", link com seta
 * - Rodapé: itens "Support" (badge "• Online") e "Settings"
 * - Gaveta mobile abaixo de tablet (Radix Dialog)
 */
import {
  ArrowUpRight,
  EllipsisVertical,
  Headphones,
  PanelLeft,
  Plus,
  Search,
  Settings,
  User,
  UserPlus,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  dialogStyles,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  type ProjectIconValue,
} from "@zynox/design-system/components";
import { cn } from "@zynox/design-system/cn";
import { SITEMAP, type NavEntry, type NavLink } from "./navigation";
import { useAppShell } from "./use-app-shell";
import { isSidebarItemShown, resolveSidebar, type SidebarPreferencesData } from "./sidebar-items";
import { NavGroup, NavItem, NavList, SidebarSection } from "./sidebar-nav";
import { ZynoxLogo } from "./zynox-logo";
import "./sidebar.css";

/** Descobre o id do grupo macro que contém o pathname ativo para auto-expansão. */
function findActiveAncestorGroupId(pathname: string): string | null {
  for (const section of SITEMAP) {
    for (const item of section.items) {
      if (item.kind === "group") {
        const matches = item.children.some((child) => {
          if (child.id === "projects-link" || child.to === "/projects") {
            return pathname === "/projects" || pathname.startsWith("/projects/");
          }
          return pathname === child.to || pathname.startsWith(`${child.to}/`);
        });
        if (matches) return item.id;
      }
    }
  }
  return null;
}

/** Cabeçalho da sidebar com logotipo Zynox oficial e ações rápidas (novo item, busca, opções). */
function SidebarHeader() {
  const { setCommandMenuOpen, setCreateIssueOpen } = useAppShell();
  const navigate = useNavigate();

  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--vz-sb-divider)] px-3.5">
      <Link
        to="/"
        aria-label="Zynox"
        className="ml-2.5 flex items-center text-white transition-opacity hover:opacity-90 focus-ring rounded-[6px]"
      >
        <ZynoxLogo className="h-[14.4px] w-auto max-w-[130px] text-white" />
      </Link>

      <div className="flex items-center gap-0.5">
        <IconButton
          icon={Plus}
          label="New issue"
          variant="ghost"
          size="sm"
          onClick={() => setCreateIssueOpen(true)}
          className="size-7 rounded-[6px] text-[var(--vz-sb-muted)] hover:bg-[var(--vz-sb-hover-bg)] hover:text-white"
        />
        <IconButton
          icon={Search}
          label="Search"
          variant="ghost"
          size="sm"
          onClick={() => setCommandMenuOpen(true)}
          className="size-7 rounded-[6px] text-[var(--vz-sb-muted)] hover:bg-[var(--vz-sb-hover-bg)] hover:text-white"
        />
        <Menu>
          <MenuTrigger asChild>
            <IconButton
              icon={EllipsisVertical}
              label="Workspace options"
              variant="ghost"
              size="sm"
              className="size-7 rounded-[6px] text-[var(--vz-sb-muted)] hover:bg-[var(--vz-sb-hover-bg)] hover:text-white"
            />
          </MenuTrigger>
          <MenuContent align="end" side="bottom" className="w-52">
            <MenuItem icon={Settings} onSelect={() => navigate("/settings")}>
              Workspace settings
            </MenuItem>
            <MenuItem icon={UserPlus} onSelect={() => navigate("/settings/members")}>
              Invite people
            </MenuItem>
            <MenuItem icon={User} onSelect={() => navigate("/settings/profile")}>
              Profile settings
            </MenuItem>
            <MenuSeparator />
            <MenuItem onSelect={() => navigate("/auth/sign-out")}>Log out</MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
}

/** Card promocional "Zynox workspace PRO" no rodapé da navegação. */
function SidebarPromoCard() {
  const navigate = useNavigate();

  return (
    <div className="mx-3 mt-1.5 mb-3.5 flex flex-col gap-1.5 rounded-[12px] border border-[var(--vz-sb-card-border)] bg-[var(--vz-sb-card-bg)] p-3.5 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[var(--vz-sb-amber-glow)]" />
          <span className="text-[13px] font-medium text-white">Zynox workspace</span>
        </div>
        <span className="text-[11px] font-semibold tracking-wider text-[var(--vz-sb-amber-glow)] uppercase">
          PRO
        </span>
      </div>
      <p className="text-[12px] leading-snug text-[var(--vz-sb-muted)]">
        Your team. Every conversation.
      </p>
      <div className="mt-1 flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => navigate("/inbox")}
          className="text-[12.5px] font-normal text-[var(--vz-sb-amber-glow)] transition-opacity hover:opacity-80"
        >
          Open support inbox
        </button>
        <button
          type="button"
          onClick={() => navigate("/inbox")}
          aria-label="Open support inbox link"
          className="flex size-6 items-center justify-center rounded-[6px] border border-[rgba(245,166,35,0.25)] bg-[rgba(245,166,35,0.08)] text-[var(--vz-sb-amber-glow)] hover:bg-[rgba(245,166,35,0.15)]"
        >
          <ArrowUpRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Conteúdo unificado da sidebar. */
export function SidebarContent({
  inboxUnreadCount,
  sidebarPreferences,
  onItemClick,
}: {
  onCollapse?: () => void;
  inboxUnreadCount?: number;
  draftsCount?: number;
  sidebarPreferences?: SidebarPreferencesData;
  onItemClick?: () => void;
}) {
  const { pathname } = useLocation();
  const activeAncestorGroupId = useMemo(() => findActiveAncestorGroupId(pathname), [pathname]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isGroupOpen = (groupId: string): boolean => {
    if (openGroups[groupId] !== undefined) return openGroups[groupId];
    return activeAncestorGroupId === groupId;
  };

  const setGroupOpen = (groupId: string, open: boolean) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: open }));
  };

  const resolved = useMemo(() => resolveSidebar(sidebarPreferences), [sidebarPreferences]);

  const shouldShowItem = (entry: NavEntry): boolean => {
    if (entry.kind === "link" && entry.prefKey) {
      const visibility = resolved.visibility[entry.prefKey] ?? "always";
      const badge = entry.prefKey === "inbox" ? (inboxUnreadCount ?? 0) : 0;
      return isSidebarItemShown(visibility, badge);
    }
    return true;
  };

  const shouldShowChild = (child: NavLink): boolean => {
    if (child.prefKey) {
      const visibility = resolved.visibility[child.prefKey] ?? "always";
      const badge = 0;
      return isSidebarItemShown(visibility, badge);
    }
    return true;
  };

  return (
    <div className="flex h-full flex-col bg-[var(--vz-sb-bg)] text-[var(--vz-sb-text)]">
      <SidebarHeader />

      {/* Navegação rolável do sitemap */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pt-3 pb-2">
        {SITEMAP.map((section) => (
          <SidebarSection key={section.id} title={section.title}>
            <NavList label={section.title}>
              {section.items.filter(shouldShowItem).map((item) => {
                if (item.kind === "link") {
                  const IconComp = item.icon;
                  const count = item.prefKey === "inbox" ? inboxUnreadCount : undefined;
                  return (
                    <NavItem
                      key={item.id}
                      to={item.to}
                      icon={<IconComp className="size-4" />}
                      count={count}
                      badgeStyle={resolved.badgeStyle}
                    >
                      {item.label}
                    </NavItem>
                  );
                }

                const GroupIcon = item.icon;
                const childPaths = item.children.map((c) => c.to);
                const isProjectsMacroActive =
                  item.id === "projects" &&
                  (pathname === "/projects" || pathname.startsWith("/projects/"));

                const visibleChildren = item.children.filter(shouldShowChild);

                return (
                  <NavGroup
                    key={item.id}
                    label={item.label}
                    icon={<GroupIcon className="size-4" />}
                    childPaths={childPaths}
                    open={isGroupOpen(item.id)}
                    onOpenChange={(open) => setGroupOpen(item.id, open)}
                    isActive={isProjectsMacroActive || undefined}
                  >
                    {visibleChildren.map((child, index) => {
                      const isProjectsMicroActive =
                        child.id === "projects-link" &&
                        (pathname === "/projects" || pathname.startsWith("/projects/"));

                      const isExact =
                        child.to === "/dashboard" ||
                        child.to === "/crm" ||
                        child.to === "/finance" ||
                        child.to === "/projects";

                      const isLastChild = index === visibleChildren.length - 1;

                      return (
                        <NavItem
                          key={child.id}
                          to={child.to}
                          end={isExact}
                          indent
                          isLastChild={isLastChild}
                          isActive={isProjectsMicroActive ? true : undefined}
                        >
                          {child.label}
                        </NavItem>
                      );
                    })}
                  </NavGroup>
                );
              })}
            </NavList>
          </SidebarSection>
        ))}
      </div>

      {/* Card promocional */}
      <SidebarPromoCard />

      {/* Rodapé: Support e Settings */}
      <div className="flex shrink-0 flex-col gap-1 px-3 pt-0 pb-3">
        <Link
          to="/inbox"
          onClick={onItemClick}
          className="flex h-[38px] w-full items-center justify-between rounded-[10px] px-3 text-[13.5px] text-[var(--vz-sb-secondary)] no-underline transition-colors select-none hover:bg-[var(--vz-sb-hover-bg)] hover:text-white"
        >
          <div className="flex items-center gap-3">
            <Headphones className="size-4 text-[var(--vz-sb-secondary)]" />
            <span>Support</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-[#163820] bg-[#0d1f14] px-2 py-0.5 text-[11px] font-medium text-[#34d399]">
            <span className="size-1.5 rounded-full bg-[#34d399]" />
            Online
          </span>
        </Link>

        <Link
          to="/settings"
          onClick={onItemClick}
          className={cn(
            "flex h-[38px] w-full items-center justify-between rounded-[10px] px-3 text-[13.5px] no-underline transition-colors select-none",
            pathname === "/settings" || pathname.startsWith("/settings/")
              ? "border border-[var(--vz-sb-active-border)] bg-[var(--vz-sb-active-bg)] text-white font-medium"
              : "border border-transparent text-[var(--vz-sb-secondary)] hover:bg-[var(--vz-sb-hover-bg)] hover:text-white",
          )}
        >
          <div className="flex items-center gap-3">
            <Settings className="size-4 text-[var(--vz-sb-secondary)]" />
            <span>Settings</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

/** Componente principal da Sidebar. */
export function Sidebar({
  label = "Sidebar do workspace",
  inboxUnreadCount,
  draftsCount,
  sidebarPreferences,
}: {
  label?: string;
  workspaceName?: string;
  workspaceIcon?: ProjectIconValue;
  workspaceLogoUrl?: string | null;
  workspaceStatus?: string;
  onWorkspaceRetry?: () => void;
  inboxUnreadCount?: number;
  draftsCount?: number;
  sidebarPreferences?: SidebarPreferencesData;
}) {
  const { sidebarCollapsed, toggleSidebar, sidebarDrawerOpen, setSidebarDrawerOpen } =
    useAppShell();

  return (
    <>
      {/* Sidebar Desktop (tablet e acima) */}
      {!sidebarCollapsed && (
        <nav
          aria-label={label}
          className="vz-sidebar relative hidden h-full w-[276px] shrink-0 flex-col border-r border-[var(--vz-sb-divider)] bg-[var(--vz-sb-bg)] tablet:flex"
        >
          <SidebarContent
            inboxUnreadCount={inboxUnreadCount}
            draftsCount={draftsCount}
            sidebarPreferences={sidebarPreferences}
          />
        </nav>
      )}

      {/* Botão discreto para reabrir a sidebar quando recolhida */}
      {sidebarCollapsed && (
        <div className="hidden shrink-0 items-start p-2 tablet:flex">
          <IconButton
            icon={PanelLeft}
            label="Expand sidebar"
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="size-8 rounded-[8px] text-[var(--vz-sb-muted)] hover:bg-[var(--vz-sb-hover-bg)] hover:text-white"
          />
        </div>
      )}

      {/* Gaveta mobile (abaixo de tablet) */}
      <DialogPrimitive.Root open={sidebarDrawerOpen} onOpenChange={setSidebarDrawerOpen}>
        <div className="flex shrink-0 items-start p-2 tablet:hidden">
          <DialogPrimitive.Trigger asChild>
            <IconButton
              icon={PanelLeft}
              label="Open sidebar"
              variant="ghost"
              size="sm"
              className="size-8 rounded-[8px] text-[var(--vz-sb-muted)] hover:bg-[var(--vz-sb-hover-bg)] hover:text-white"
            />
          </DialogPrimitive.Trigger>
        </div>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={dialogStyles.overlay} />
          <DialogPrimitive.Content
            aria-label={label}
            className={cn(
              dialogStyles.content,
              "vz-sidebar fixed inset-y-0 left-0 z-modal flex w-[280px] max-w-[85vw] flex-col border-r border-[var(--vz-sb-divider)] bg-[var(--vz-sb-bg)] p-0 shadow-2xl focus:outline-hidden",
            )}
          >
            <div className="sr-only">
              <DialogPrimitive.Title>{label}</DialogPrimitive.Title>
              <DialogPrimitive.Description>
                Navegação principal da aplicação com sitemap e atalhos rápidos.
              </DialogPrimitive.Description>
            </div>
            <SidebarContent
              inboxUnreadCount={inboxUnreadCount}
              draftsCount={draftsCount}
              sidebarPreferences={sidebarPreferences}
              onItemClick={() => setSidebarDrawerOpen(false)}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
