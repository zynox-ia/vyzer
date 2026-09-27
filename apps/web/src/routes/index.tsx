import { createBrowserRouter } from "react-router";
import { AppShell } from "@/layouts/app-shell";
import { HealthPage } from "@/features/health";
import { ProjectsPage } from "@/features/projects";

export const router = createBrowserRouter([
  { path: "/_health", Component: HealthPage },
  {
    path: "/",
    Component: AppShell,
    children: [{ path: "projects", Component: ProjectsPage }],
  },
]);
