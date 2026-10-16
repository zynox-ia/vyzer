/** Team overview in a real Chromium browser (spec settings-administration 2.2). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import axe from "axe-core";
import type { Team } from "@zynox/contract";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import { TeamSettingsLayout } from "./layout";
import { TeamOverviewPage } from "./overview";

const deleteTeam = vi.fn<(input: { id: string }) => Promise<unknown>>();

const TEAM: Team = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Atlas",
  slug: "atlas",
  key: "VYZ",
  icon: { kind: "icon", name: "Layers", color: "purple" },
  description: null,
  timezone: "America/Sao_Paulo",
  estimation: "none",
  detailedIssueHistory: false,
  issueEmailEnabled: false,
  issueEmailAddress: "atlas-4c7872ac31b0@intake.zynox.app.br",
  createdAt: "2026-08-15T12:00:00.000Z",
  updatedAt: "2026-08-15T12:00:00.000Z",
};

vi.mock("@/services/teams", () => ({
  teamQueryOptions: (slug: string) =>
    queryOptions({ queryKey: ["team", slug], queryFn: async () => TEAM }),
  teamsQueryOptions: () => queryOptions({ queryKey: ["teams"], queryFn: async () => [] }),
  deleteTeamMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => deleteTeam(input) }),
}));

function LocationOutput() {
  const location = useLocation();
  return <output aria-label="Current URL">{location.pathname}</output>;
}

let client: QueryClient;

function Harness() {
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/settings/teams/atlas"]}>
          <main>
            <Routes>
              <Route path="/settings/teams" element={<h1>Teams list</h1>} />
              <Route path="/settings/teams/:team" element={<TeamSettingsLayout />}>
                <Route index element={<TeamOverviewPage />} />
                <Route path="general" element={<h1>General page</h1>} />
                <Route path="members" element={<h1>Members page</h1>} />
                <Route path="project-labels" element={<h1>Project labels page</h1>} />
                <Route path="parent-team" element={<h1>Parent team page</h1>} />
              </Route>
            </Routes>
            <LocationOutput />
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

type Screen = Awaited<ReturnType<typeof render>>;

async function openConfirm(screen: Screen) {
  await screen.getByRole("button", { name: "Delete team" }).click();
  await expect.element(screen.getByRole("alertdialog", { name: "Delete team?" })).toBeVisible();
}

beforeEach(async () => {
  deleteTeam.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("TeamOverviewPage", () => {
  it("mostra o link Teams, título, acesso e o hub com General e Members", async () => {
    const screen = await render(<Harness />);

    const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    await expect
      .element(crumb.getByRole("link", { name: "Teams" }))
      .toHaveAttribute("href", "/settings/teams");
    await expect.element(screen.getByRole("heading", { name: "Atlas" })).toBeVisible();
    await expect.element(screen.getByText("Accessible to all workspace members")).toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: /^General/ }))
      .toHaveAttribute("href", "/settings/teams/atlas/general");
    await expect
      .element(screen.getByRole("link", { name: /^Members/ }))
      .toHaveAttribute("href", "/settings/teams/atlas/members");
  });

  it("mostra todas as seções do hub do Linear, com Project labels e Parent team liberados", async () => {
    const screen = await render(<Harness />);
    await expect.element(screen.getByRole("heading", { name: "Atlas" })).toBeVisible();

    for (const title of [
      "Issues, projects, and documents",
      "Workflow",
      "AI & Agents",
      "Team hierarchy",
      "Danger zone",
    ]) {
      await expect.element(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    for (const label of [
      "Slack notifications",
      "Issue labels",
      "Templates",
      "Recurring issues",
      "Issue statuses",
      "Workflows & automations",
      "Triage",
      "Cycles",
      "Team agents",
      "Agent skills",
      "Agent connectors",
      "Project updates",
      "Resolved thread summaries",
    ]) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(`^${label}`) }))
        .toBeInTheDocument();
    }
    // Nada é bloqueado por plano: nenhuma linha leva "Available on …" e todas são links.
    await expect.element(screen.getByText(/Available on/)).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("link", { name: /^Project statuses/ }))
      .toBeInTheDocument();
    await expect.element(screen.getByRole("link", { name: /^Parent team/ })).toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: "Leave team…" })).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "Retire…" })).toBeDisabled();

    await screen.getByRole("link", { name: /^Project labels/ }).click();
    await expect
      .element(screen.getByRole("heading", { name: "Project labels page" }))
      .toBeVisible();
  });

  it("Parent team abre a sua página", async () => {
    const screen = await render(<Harness />);
    await screen.getByRole("link", { name: /^Parent team/ }).click();
    await expect.element(screen.getByRole("heading", { name: "Parent team page" })).toBeVisible();
  });

  it("o link Teams do breadcrumb volta à lista", async () => {
    const screen = await render(<Harness />);

    await screen
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("link", { name: "Teams" })
      .click();
    await expect.element(screen.getByRole("heading", { name: "Teams list" })).toBeVisible();
  });

  it("o hub navega para General", async () => {
    const screen = await render(<Harness />);

    await screen.getByRole("link", { name: /^General/ }).click();
    await expect.element(screen.getByRole("heading", { name: "General page" })).toBeVisible();
  });

  it("Delete team abre o Confirm com foco em Cancel; Cancel não exclui", async () => {
    const screen = await render(<Harness />);

    await openConfirm(screen);
    await expect.element(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect.element(screen.getByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteTeam).not.toHaveBeenCalled();
  });

  it("confirmar exclui, mostra o toast e navega para a lista", async () => {
    deleteTeam.mockResolvedValue({});
    const screen = await render(<Harness />);

    await openConfirm(screen);
    await screen
      .getByRole("alertdialog", { name: "Delete team?" })
      .getByRole("button", { name: "Delete team" })
      .click();

    await vi.waitFor(() => expect(deleteTeam).toHaveBeenCalledWith({ id: TEAM.id }));
    await expect.element(screen.getByText("Atlas deleted")).toBeVisible();
    await expect.element(screen.getByRole("heading", { name: "Teams list" })).toBeVisible();
    await expect.element(screen.getByLabelText("Current URL")).toHaveTextContent("/settings/teams");
  });

  it("CONFLICT mostra o toast de Projects e não navega", async () => {
    deleteTeam.mockRejectedValue(Object.assign(new Error("has projects"), { code: "CONFLICT" }));
    const screen = await render(<Harness />);

    await openConfirm(screen);
    await screen
      .getByRole("alertdialog", { name: "Delete team?" })
      .getByRole("button", { name: "Delete team" })
      .click();

    await expect.element(screen.getByText("Could not delete team")).toBeVisible();
    await expect.element(screen.getByText(/This team still has Projects/)).toBeVisible();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/atlas");
    await expect.element(screen.getByText("Atlas deleted")).not.toBeInTheDocument();
  });

  it.each(["dark", "light"] as const)("não tem violações axe no tema %s", async (theme) => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(<Harness />);
    await expect.element(screen.getByRole("heading", { name: "Atlas" })).toBeVisible();

    const root = document.querySelector("main");
    if (!root) throw new Error("main não encontrado");
    expect(await axeViolations(root)).toEqual([]);
  });
});
