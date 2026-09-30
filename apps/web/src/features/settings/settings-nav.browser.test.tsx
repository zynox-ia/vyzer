/** Settings nav: o grupo "Your teams" vem da API (spec settings-administration 2.1). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import type { TeamListItem } from "@vyzer/contract";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { SettingsRoute } from "./index";

const fetchTeams = vi.fn<() => Promise<TeamListItem[]>>();

vi.mock("@/services/teams", () => ({
  teamsQueryOptions: () => queryOptions({ queryKey: ["teams"], queryFn: () => fetchTeams() }),
  // SettingsRoute importa as páginas de Teams pelo mesmo módulo.
  deleteTeamMutationOptions: () => mutationOptions({ mutationFn: async () => ({}) }),
  createTeamMutationOptions: () => mutationOptions({ mutationFn: async () => ({}) }),
  updateTeamMutationOptions: () => mutationOptions({ mutationFn: async () => ({}) }),
  teamQueryOptions: (slug: string) =>
    queryOptions({ queryKey: ["team", slug], queryFn: async () => ({}) }),
  teamMembersQueryOptions: (id: string) =>
    queryOptions({ queryKey: ["team-members", id], queryFn: async () => [] }),
}));

function team(name: string, slug: string, color: "cyan" | "purple"): TeamListItem {
  return {
    id: crypto.randomUUID(),
    name,
    slug,
    key: name.slice(0, 3).toUpperCase(),
    icon: { kind: "icon", name: color === "cyan" ? "Navigation" : "Layers", color },
    description: null,
    createdAt: "2026-09-29T12:00:00.000Z",
    updatedAt: "2026-09-29T12:00:00.000Z",
    memberCount: 1,
    issueCount: 0,
  };
}

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/settings/preferences"]}>
          <Routes>
            <Route path="/settings" element={<SettingsRoute />}>
              <Route path="*" element={<p>Settings content</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  fetchTeams.mockReset();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("Settings nav: Your teams", () => {
  it("lista um link por Team, com ícone, e Create a team no fim", async () => {
    fetchTeams.mockResolvedValue([
      team("Zynox", "zynox", "cyan"),
      team("Vyzer", "vyzer", "purple"),
    ]);
    const screen = await render(<Harness />);
    const nav = screen.getByRole("navigation", { name: "Settings" });

    await expect.element(nav.getByText("Your teams")).toBeVisible();
    const zynox = nav.getByRole("link", { name: "Zynox" });
    const vyzer = nav.getByRole("link", { name: "Vyzer" });
    const create = nav.getByRole("link", { name: "Create a team" });
    await expect.element(zynox).toHaveAttribute("href", "/settings/teams/zynox");
    await expect.element(vyzer).toHaveAttribute("href", "/settings/teams/vyzer");
    await expect.element(create).toHaveAttribute("href", "/settings/teams/new");

    // Cada Team leva o próprio ícone (svg) e o "Create a team" o seu "+".
    for (const link of [zynox, vyzer, create]) {
      expect(link.element().querySelector("svg")).not.toBeNull();
    }

    // "Create a team" fica por último no grupo.
    const links = Array.from(
      nav.element().querySelectorAll<HTMLAnchorElement>('a[href^="/settings/teams/"]'),
    ).map((a) => a.getAttribute("href"));
    expect(links).toEqual([
      "/settings/teams/zynox",
      "/settings/teams/vyzer",
      "/settings/teams/new",
    ]);
  });

  it("sem Teams, só Create a team", async () => {
    fetchTeams.mockResolvedValue([]);
    const screen = await render(<Harness />);
    const nav = screen.getByRole("navigation", { name: "Settings" });

    await expect.element(nav.getByRole("link", { name: "Create a team" })).toBeVisible();
    await vi.waitFor(() => expect(fetchTeams).toHaveBeenCalled());
    const links = Array.from(
      nav.element().querySelectorAll<HTMLAnchorElement>('a[href^="/settings/teams/"]'),
    ).map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/settings/teams/new"]);
  });
});
