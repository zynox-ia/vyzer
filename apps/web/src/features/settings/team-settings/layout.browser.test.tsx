/** Team settings layout in a real Chromium browser (spec settings-administration 2.2). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { queryOptions, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type { Team } from "@vyzer/contract";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { TeamSettingsLayout, useTeam } from "./layout";

const fetchTeam = vi.fn<(slug: string) => Promise<Team>>();

vi.mock("@/services/teams", () => ({
  teamQueryOptions: (slug: string) =>
    queryOptions({ queryKey: ["team", slug], queryFn: () => fetchTeam(slug) }),
}));

const TEAM: Team = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Vyzer",
  slug: "vyzer",
  key: "VYZ",
  icon: { kind: "icon", name: "Layers", color: "purple" },
  description: null,
  createdAt: "2026-08-15T12:00:00.000Z",
  updatedAt: "2026-08-15T12:00:00.000Z",
};

function TeamName() {
  return <p>Team page: {useTeam().name}</p>;
}

function LocationOutput() {
  const location = useLocation();
  return <output aria-label="Current URL">{location.pathname}</output>;
}

function Harness({ slug = "vyzer" }: { slug?: string }) {
  // retryDelay 0: o layout tenta erros de rede até 3 vezes, sem esperar o backoff padrão.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/settings/teams/${slug}`]}>
          <main>
            <Routes>
              <Route path="/settings/teams" element={<h1>Teams list</h1>} />
              <Route path="/settings/teams/:team" element={<TeamSettingsLayout />}>
                <Route index element={<TeamName />} />
              </Route>
            </Routes>
            <LocationOutput />
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  fetchTeam.mockReset();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("TeamSettingsLayout", () => {
  it("mostra Loading Team. e depois a subpágina com o Team do slug", async () => {
    let resolve: (team: Team) => void = () => {};
    fetchTeam.mockReturnValue(new Promise((r) => (resolve = r)));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Loading Team.")).toBeInTheDocument();
    resolve(TEAM);

    await expect.element(screen.getByText("Team page: Vyzer")).toBeVisible();
    expect(fetchTeam).toHaveBeenCalledWith("vyzer");
    await expect.element(screen.getByText("Loading Team.")).not.toBeInTheDocument();
  });

  it("slug inexistente mostra Team not found, sem repetir, e Back to Teams volta à lista", async () => {
    fetchTeam.mockRejectedValue(Object.assign(new Error("not found"), { code: "NOT_FOUND" }));
    const screen = await render(<Harness slug="ghost" />);

    await expect.element(screen.getByText("Team not found")).toBeVisible();
    await screen.getByRole("button", { name: "Back to Teams" }).click();
    await expect.element(screen.getByLabelText("Current URL")).toHaveTextContent("/settings/teams");
    await expect.element(screen.getByRole("heading", { name: "Teams list" })).toBeVisible();
    expect(fetchTeam).toHaveBeenCalledTimes(1);
  });

  it("erro de rede mostra Could not load Team e o Retry refaz a query", async () => {
    fetchTeam.mockRejectedValue(new Error("network"));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Could not load Team")).toBeVisible();
    // Não é "não encontrado".
    await expect.element(screen.getByText("Team not found")).not.toBeInTheDocument();
    fetchTeam.mockResolvedValue(TEAM);
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(screen.getByText("Team page: Vyzer")).toBeVisible();
    await expect.element(screen.getByText("Could not load Team")).not.toBeInTheDocument();
  });
});
