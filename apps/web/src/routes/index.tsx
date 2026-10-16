import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@zynox/design-system/components";
import { HomeRedirect } from "./home-redirect";
import { AppShell } from "@/layouts/app-shell";
import { SITEMAP, type NavLink } from "@/layouts/app-shell/navigation";
import { AgentPage } from "@/features/agent";
import { AgentPersonalizationPage } from "@/features/agent/personalization";
import { HealthPage } from "@/features/health";
import { InboxPage } from "@/features/inbox";
import { PlaceholderPage } from "@/features/placeholder";
import { ProjectDetailPage, ProjectsListPage } from "@/features/projects";
import {
  MembersPage,
  PreferencesPage,
  CodeReviewsPage,
  NotificationChannelPage,
  NotificationsPage,
  ProfilePage,
  SettingsRoute,
  TeamCreatePage,
  TeamGeneralPage,
  TeamMembersPage,
  TeamPlaceholderPage,
  teamPlaceholderPages,
  TeamOverviewPage,
  TeamSettingsLayout,
  TeamsPage,
  TeamStatusesPage,
} from "@/features/settings";
import { useApplyMemberPreferences } from "@/features/settings/use-apply-member-preferences";
import { SettingsPlaceholderPage } from "@/features/settings/settings-placeholder";
import { CustomerRequestsPage } from "@/features/settings/customer-requests";
import { WorkspaceSettingsPage } from "@/features/settings/workspace-settings";
import { ApiKeysTablePage } from "@/features/settings/api-keys-table";
import { ApiSettingsPage } from "@/features/settings/api-settings";
import { ApiKeyCreatePage } from "@/features/settings/api-key-create";
import { ApiKeyDetailPage } from "@/features/settings/api-key-detail";
import { ApiKeyEditPage } from "@/features/settings/api-key-edit";
import { SecurityAccessPage } from "@/features/settings/security-access";
import { createIssueDraftMutationOptions, issueDraftsQueryOptions } from "@/services/issue-drafts";
import { unreadNotificationsCountQueryOptions } from "@/services/notifications";
import { sidebarPreferencesQueryOptions } from "@/services/sidebar-preferences";
import { teamsQueryOptions } from "@/services/teams";
import { currentWorkspaceQueryOptions } from "@/services/workspace";

/** Rotas só de desenvolvimento: ficam fora do build de produção. */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: "/design-system/*",
        lazy: () => import("@/features/design-system"),
      },
    ]
  : [];

/**
 * Rotas do sitemap sem tela própria ainda (Missão 02, navegação — PlaceholderPage "Coming soon"):
 * geradas do mesmo `SITEMAP` que a sidebar usa, para as duas nunca saírem de sincronia. Só os
 * destinos reaproveitados (Inbox, AI Chat, Projects › Projects; Settings é rota irmã, fora desta
 * árvore) ficam de fora — o resto, rota nova mínima em kebab-case do rótulo.
 */
const REUSED_PATHS = new Set(["/inbox", "/agent", "/projects", "/settings"]);

function sitemapPlaceholderRoutes(): RouteObject[] {
  const routes: RouteObject[] = [];
  for (const section of SITEMAP) {
    for (const item of section.items) {
      const links: NavLink[] = item.kind === "group" ? item.children : [item];
      for (const link of links) {
        if (REUSED_PATHS.has(link.to)) continue;
        routes.push({
          path: link.to.slice(1),
          element: (
            <PlaceholderPage
              title={link.label}
              section={item.kind === "group" ? item.label : undefined}
            />
          ),
        });
      }
    }
  }
  return routes;
}

const placeholderRoutes: RouteObject[] = sitemapPlaceholderRoutes();

/** Páginas de Settings fora de Preferences: fora do escopo desta fase (spec, "Fora do escopo"). */
const settingsPlaceholderPages: { path: string; title: string }[] = [
  { path: "connected-accounts", title: "Connected accounts" },
  { path: "issues/labels", title: "Issue labels" },
  { path: "issues/templates", title: "Issue templates" },
  { path: "issues/slas", title: "SLAs" },
  { path: "projects/labels", title: "Project labels" },
  { path: "projects/templates", title: "Project templates" },
  { path: "projects/statuses", title: "Statuses" },
  { path: "projects/updates", title: "Updates" },
  { path: "ai-agents", title: "AI & Agents" },
  { path: "loops", title: "Loops" },
  { path: "initiatives", title: "Initiatives" },
  { path: "documents", title: "Documents" },
  { path: "releases", title: "Releases" },
  { path: "pulse", title: "Pulse" },
  { path: "asks", title: "Asks" },
  { path: "emojis", title: "Emojis" },
  { path: "integrations", title: "Integrations" },
  { path: "security-admin", title: "Security" },
  { path: "applications", title: "Applications" },
  { path: "usage", title: "Usage & limits" },
];

/** Product-only data wrapper; the `/design-system` documentation keeps its static sidebar. */
function WorkspaceAppShell() {
  useApplyMemberPreferences();
  const currentWorkspace = useQuery(currentWorkspaceQueryOptions());
  const teams = useQuery(teamsQueryOptions());
  // Sem SSE (spec D1): o contador se atualiza a cada 60 s e ao voltar o foco à janela.
  const unreadCount = useQuery({
    ...unreadNotificationsCountQueryOptions(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const sidebarPreferences = useQuery(sidebarPreferencesQueryOptions());
  const queryClient = useQueryClient();
  const toast = useToast();
  const saveDraft = useMutation({
    ...createIssueDraftMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: issueDraftsQueryOptions().queryKey });
      toast({ title: "Draft saved" });
    },
    onError: () =>
      toast({
        title: "Could not save draft",
        description: "What you wrote was not saved. Check your connection and try again.",
        variant: "error",
      }),
  });
  const workspaceStatus = currentWorkspace.isPending
    ? "Loading workspace name."
    : currentWorkspace.isError
      ? "Could not load workspace name."
      : undefined;

  return (
    <AppShell
      workspaceName={
        currentWorkspace.data?.workspace.name ??
        (currentWorkspace.isError ? "Workspace unavailable" : "Workspace")
      }
      workspaceIcon={currentWorkspace.data?.workspace.icon}
      workspaceLogoUrl={currentWorkspace.data?.workspace.logoUrl}
      teams={teams.data ?? []}
      inboxUnreadCount={unreadCount.data}
      onSaveIssueDraft={({ title, description }) =>
        saveDraft.mutate({ title, description: description === "" ? null : description })
      }
      sidebarPreferences={sidebarPreferences.data}
      workspaceStatus={workspaceStatus}
      onWorkspaceRetry={
        currentWorkspace.isError ? () => void currentWorkspace.refetch() : undefined
      }
    />
  );
}

export const router = createBrowserRouter([
  { path: "/_health", Component: HealthPage },
  ...devRoutes,
  {
    // Settings troca a sidebar do shell pela própria nav (Figma 33:20122): rota irmã do AppShell,
    // não uma tela dentro dele. "Back to app" volta para a última tela do shell (spec).
    path: "/settings",
    Component: SettingsRoute,
    children: [
      { index: true, element: <Navigate to="/settings/preferences" replace /> },
      { path: "preferences", Component: PreferencesPage },
      { path: "profile", Component: ProfilePage },
      { path: "code-reviews", Component: CodeReviewsPage },
      { path: "notifications", Component: NotificationsPage },
      { path: "notifications/:channel", Component: NotificationChannelPage },
      { path: "agent-personalization", Component: AgentPersonalizationPage },
      { path: "workspace", Component: WorkspaceSettingsPage },
      { path: "members", Component: MembersPage },
      { path: "api", Component: ApiSettingsPage },
      { path: "api/keys", Component: ApiKeysTablePage },
      { path: "security", Component: SecurityAccessPage },
      { path: "security/api-keys/new", Component: ApiKeyCreatePage },
      { path: "security/api-keys/:keyId", Component: ApiKeyDetailPage },
      { path: "security/api-keys/:keyId/edit", Component: ApiKeyEditPage },
      { path: "customer-requests", Component: CustomerRequestsPage },
      { path: "teams", Component: TeamsPage },
      { path: "teams/new", Component: TeamCreatePage },
      {
        path: "teams/:team",
        Component: TeamSettingsLayout,
        children: [
          { index: true, Component: TeamOverviewPage },
          { path: "general", Component: TeamGeneralPage },
          { path: "members", Component: TeamMembersPage },
          { path: "statuses", Component: TeamStatusesPage },
          ...teamPlaceholderPages.map(({ path, title }) => ({
            path,
            element: <TeamPlaceholderPage title={title} />,
          })),
        ],
      },
      ...settingsPlaceholderPages.map(({ path, title }) => ({
        path,
        element: <SettingsPlaceholderPage title={title} />,
      })),
    ],
  },
  {
    path: "/",
    Component: WorkspaceAppShell,
    children: [
      // A tela inicial é a "Default home view" das Preferences (spec preferences-persistence).
      { index: true, Component: HomeRedirect },
      { path: "projects", Component: ProjectsListPage },
      { path: "projects/:projectId", Component: ProjectDetailPage },
      { path: "agent", Component: AgentPage },
      { path: "inbox/:notificationId?", Component: InboxPage },
      ...placeholderRoutes,
    ],
  },
]);
