import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { AppShell } from "@/layouts/app-shell";
import { AgentPage } from "@/features/agent";
import { AgentPersonalizationPage } from "@/features/agent/personalization";
import { HealthPage } from "@/features/health";
import { PlaceholderPage } from "@/features/placeholder";
import { ProjectDetailPage, ProjectsListPage, TeamProjectsListPage } from "@/features/projects";
import { PreferencesPage, SettingsRoute } from "@/features/settings";
import { SettingsPlaceholderPage } from "@/features/settings/settings-placeholder";

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
  { path: "inbox", element: <PlaceholderPage title="Inbox" /> },
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
  { path: "security", title: "Security & access" },
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
  { path: "customer-requests", title: "Customer requests" },
  { path: "releases", title: "Releases" },
  { path: "pulse", title: "Pulse" },
  { path: "asks", title: "Asks" },
  { path: "emojis", title: "Emojis" },
  { path: "integrations", title: "Integrations" },
  { path: "workspace", title: "Workspace" },
  { path: "teams", title: "Teams" },
  { path: "members", title: "Members" },
  { path: "security-admin", title: "Security" },
  { path: "api", title: "API" },
  { path: "applications", title: "Applications" },
  { path: "billing", title: "Billing" },
  { path: "usage", title: "Usage & limits" },
  { path: "import-export", title: "Import & export" },
  { path: "teams/vyzer", title: "Vyzer" },
  { path: "teams/zynox", title: "Zynox" },
  { path: "teams/new", title: "Create a team" },
];

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
      ...settingsPlaceholderPages.map(({ path, title }) => ({
        path,
        element: <SettingsPlaceholderPage title={title} />,
      })),
    ],
  },
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: "projects", Component: ProjectsListPage },
      { path: "projects/:projectId", Component: ProjectDetailPage },
      { path: "teams/:team/projects", Component: TeamProjectsListPage },
      { path: "agent", Component: AgentPage },
      ...placeholderRoutes,
    ],
  },
]);
