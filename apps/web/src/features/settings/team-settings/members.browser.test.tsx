/** Team members page in a real Chromium browser (spec settings-administration 2.2). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { queryOptions, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import axe from "axe-core";
import type { Team } from "@vyzer/contract";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { TeamSettingsLayout } from "./layout";
import { TeamMembersPage } from "./members";

type TeamMember = { id: string; name: string; email: string; role: string; createdAt: string };

const fetchMembers = vi.fn<(teamId: string) => Promise<TeamMember[]>>();

const TEAM: Team = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Vyzer",
  slug: "vyzer",
  key: "VYZ",
  icon: { kind: "icon", name: "Layers", color: "purple" },
  description: null,
  timezone: "America/Sao_Paulo",
  estimation: "none",
  detailedIssueHistory: false,
  issueEmailEnabled: false,
  issueEmailAddress: "vyzer-4c7872ac31b0@intake.vyzer.app.br",
  createdAt: "2026-08-15T12:00:00.000Z",
  updatedAt: "2026-08-15T12:00:00.000Z",
};

vi.mock("@/services/teams", () => ({
  teamQueryOptions: (slug: string) =>
    queryOptions({ queryKey: ["team", slug], queryFn: async () => TEAM }),
  teamMembersQueryOptions: (teamId: string) =>
    queryOptions({ queryKey: ["team-members", teamId], queryFn: () => fetchMembers(teamId) }),
}));

const MEMBERS: TeamMember[] = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Andre",
    email: "andre@example.com",
    role: "admin",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Bianca",
    email: "bianca@example.com",
    role: "member",
    createdAt: "2026-01-02T00:00:00.000Z",
  },
];

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/settings/teams/vyzer/members"]}>
          <main>
            <Routes>
              <Route path="/settings/teams/:team" element={<TeamSettingsLayout />}>
                <Route path="members" element={<TeamMembersPage />} />
              </Route>
            </Routes>
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

async function axeViolations(root: Element) {
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

beforeEach(async () => {
  fetchMembers.mockReset();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("TeamMembersPage", () => {
  it("mostra a tabela Team members com Name, Email e Status capitalizado", async () => {
    fetchMembers.mockResolvedValue(MEMBERS);
    const screen = await render(<Harness />);

    const table = screen.getByRole("table", { name: "Team members" });
    for (const name of ["Name", "Email", "Status"]) {
      await expect.element(table.getByRole("columnheader", { name })).toBeVisible();
    }
    const rows = table.getByRole("row");
    await expect.element(rows.nth(1)).toHaveTextContent("Andre");
    await expect.element(rows.nth(1)).toHaveTextContent("andre@example.com");
    await expect.element(rows.nth(1)).toHaveTextContent("Admin");
    await expect.element(rows.nth(2)).toHaveTextContent("Bianca");
    await expect.element(rows.nth(2)).toHaveTextContent("Member");
    expect(fetchMembers).toHaveBeenCalledWith(TEAM.id);
    await expect
      .element(screen.getByRole("navigation", { name: "Breadcrumb" }).getByText("Members"))
      .toBeVisible();
  });

  it("time sem Members mostra a linha vazia", async () => {
    fetchMembers.mockResolvedValue([]);
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("No members in this team yet.")).toBeVisible();
  });

  it("mostra Loading Members. enquanto carrega", async () => {
    let resolve: (members: TeamMember[]) => void = () => {};
    fetchMembers.mockReturnValue(new Promise((r) => (resolve = r)));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Loading Members.")).toBeInTheDocument();
    resolve(MEMBERS);
    await expect.element(screen.getByText("Bianca", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Loading Members.")).not.toBeInTheDocument();
  });

  it("erro de leitura oferece Retry e recarrega", async () => {
    fetchMembers.mockRejectedValueOnce(new Error("network"));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Could not load Members")).toBeVisible();
    fetchMembers.mockResolvedValue(MEMBERS);
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(screen.getByText("Bianca", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Could not load Members")).not.toBeInTheDocument();
  });

  it.each(["dark", "light"] as const)("não tem violações axe no tema %s", async (theme) => {
    document.documentElement.dataset.theme = theme;
    fetchMembers.mockResolvedValue(MEMBERS);
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("Bianca", { exact: true })).toBeVisible();

    const root = document.querySelector("main");
    if (!root) throw new Error("main não encontrado");
    expect(await axeViolations(root)).toEqual([]);
  });
});
