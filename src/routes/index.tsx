import { createBrowserRouter } from "react-router";
import { AppShell } from "@/layouts/app-shell";
import { ProjectsPage } from "@/features/projects";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [{ path: "projects", Component: ProjectsPage }],
  },
]);
