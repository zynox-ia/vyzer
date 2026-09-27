import { createBrowserRouter, type RouteObject } from "react-router";
import { AppShell } from "@/layouts/app-shell";
import { HealthPage } from "@/features/health";
import { ProjectsPage } from "@/features/projects";

/** Rotas só de desenvolvimento: ficam fora do build de produção. */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: "/_design",
        lazy: async () => ({ Component: (await import("@/features/design-preview")).DesignPage }),
      },
    ]
  : [];

export const router = createBrowserRouter([
  { path: "/_health", Component: HealthPage },
  ...devRoutes,
  {
    path: "/",
    Component: AppShell,
    children: [{ path: "projects", Component: ProjectsPage }],
  },
]);
