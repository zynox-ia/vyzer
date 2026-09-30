import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/layouts/app-shell";
import { AgentPage } from "@/features/agent";
import { AgentPersonalizationPage } from "@/features/agent/personalization";
import { HealthPage } from "@/features/health";
import { InboxPage } from "@/features/inbox";
import { PlaceholderPage } from "@/features/placeholder";
import { ProjectDetailPage, ProjectsListPage, TeamProjectsListPage } from "@/features/projects";
import {
  MembersPage,
  PreferencesPage,
  SettingsRoute,
  TeamCreatePage,
  TeamGeneralPage,
  TeamMembersPage,
  TeamOverviewPage,
  TeamSettingsLayout,
  TeamsPage,
  TeamStatusesPage,
} from "@/features/settings";
import { SettingsPlaceholderPage } from "@/features/settings/settings-placeholder";
import { CustomerRequestsPage } from "@/features/settings/customer-requests";
import { WorkspaceSettingsPage } from "@/features/settings/workspace-settings";
import { ApiKeysTablePage } from "@/features/settings/api-keys-table";
import { ApiSettingsPage } from "@/features/settings/api-settings";
import { ApiKeyCreatePage } from "@/features/settings/api-key-create";
import { ApiKeyDetailPage } from "@/features/settings/api-key-detail";
import { ApiKeyEditPage } from "@/features/settings/api-key-edit";
import { SecurityAccessPage } from "@/features/settings/security-access";
import { unreadNotificationsCountQueryOptions } from "@/services/notifications";
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

/** Rotas do shell sem conteúdo nesta fase: dados reais ficam para quando cada área for construída. */
const placeholderRoutes: RouteObject[] = [
  { path: "reviews", element: <PlaceholderPage title="Reviews" /> },
  { path: "my-issues", element: <PlaceholderPage title="My issues" /> },
  { path: "views", element: <PlaceholderPage title="Views" /> },
  { path: "initiatives", element: <PlaceholderPage title="Initiatives" /> },
  { path: "cycles", element: <PlaceholderPage title="Cycles" /> },
  { path: "teams/:team", element: <PlaceholderPage title="Team" /> },
  { path: "teams/:team/issues", element: <PlaceholderPage title="Team issues" /> },
  { path: "teams/:team/views", element: <PlaceholderPage title="Team views" /> },
];

/** Páginas de Settings fora de Preferences: fora do escopo desta fase (spec, "Fora do escopo"). */
const settingsPlaceholderPages: { path: string; title: string }[] = [
  { path: "profile", title: "Profile" },
  { path: "notifications", title: "Notifications" },
  { path: "code-reviews", title: "Code & reviews" },
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
  const currentWorkspace = useQuery(currentWorkspaceQueryOptions());
  const teams = useQuery(teamsQueryOptions());
  // Sem SSE (spec D1): o contador se atualiza a cada 60 s e ao voltar o foco à janela.
  const unreadCount = useQuery({
    ...unreadNotificationsCountQueryOptions(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
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
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: "projects", Component: ProjectsListPage },
      { path: "projects/:projectId", Component: ProjectDetailPage },
      { path: "teams/:team/projects", Component: TeamProjectsListPage },
      { path: "agent", Component: AgentPage },
      { path: "inbox/:notificationId?", Component: InboxPage },
      ...placeholderRoutes,
    ],
  },
]);
