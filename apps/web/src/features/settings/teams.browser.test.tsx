/** Teams Administration interaction in a real Chromium browser (spec settings-administration 2.1). */
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
import type { TeamListItem } from "@vyzer/contract";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { TeamsPage } from "./teams";

const fetchTeams = vi.fn<() => Promise<TeamListItem[]>>();
const deleteTeam = vi.fn<(input: { id: string }) => Promise<unknown>>();

vi.mock("@/services/teams", () => ({
  teamsQueryOptions: () => queryOptions({ queryKey: ["teams"], queryFn: () => fetchTeams() }),
  deleteTeamMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => deleteTeam(input) }),
}));

const ZYNOX_ID = "11111111-1111-4111-8111-111111111111";
const VYZER_ID = "22222222-2222-4222-8222-222222222222";
const ALPHA_ID = "33333333-3333-4333-8333-333333333333";

function makeTeams(): TeamListItem[] {
  return [
    {
      id: ZYNOX_ID,
      name: "Zynox",
      slug: "zynox",
      key: "ZYN",
      icon: { kind: "icon", name: "Navigation", color: "cyan" },
      description: null,
      createdAt: "2026-09-29T12:00:00.000Z",
      updatedAt: "2026-09-29T12:00:00.000Z",
      memberCount: 5,
      issueCount: 0,
    },
    {
      id: VYZER_ID,
      name: "Vyzer",
      slug: "vyzer",
      key: "VYZ",
      icon: { kind: "icon", name: "Layers", color: "purple" },
      description: null,
      createdAt: "2026-08-15T12:00:00.000Z",
      updatedAt: "2026-08-15T12:00:00.000Z",
      memberCount: 12,
      issueCount: 3,
    },
    {
      id: ALPHA_ID,
      name: "Alpha",
      slug: "alpha",
      key: "ALP",
      icon: { kind: "icon", name: "Zap", color: "red" },
      description: null,
      createdAt: "2026-07-01T12:00:00.000Z",
      updatedAt: "2026-07-01T12:00:00.000Z",
      memberCount: 2,
      issueCount: 1,
    },
  ];
}

function LocationOutput() {
  const location = useLocation();
  return (
    <output aria-label="Current URL">
      {location.pathname}
      {location.search}
    </output>
  );
}

function Harness({ initialPath = "/settings/teams" }: { initialPath?: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <main>
            <Routes>
              <Route path="/settings/teams" element={<TeamsPage />} />
              <Route path="*" element={null} />
            </Routes>
            <LocationOutput />
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

const conflict = () => Object.assign(new Error("Team has Projects"), { code: "CONFLICT" });

async function axeViolations(root: Element) {
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

type Screen = Awaited<ReturnType<typeof render>>;

function bodyRows(screen: Screen) {
  return screen.getByRole("table", { name: "Teams" }).getByRole("row");
}

async function openDeleteConfirm(screen: Screen, name = "Zynox") {
  await screen.getByRole("row", { name: new RegExp(name) }).hover();
  await screen.getByRole("button", { name: `Open menu for ${name}` }).click();
  await screen.getByRole("menuitem", { name: /Delete team/ }).click();
  await expect.element(screen.getByRole("alertdialog", { name: "Delete team?" })).toBeVisible();
}

beforeEach(async () => {
  fetchTeams.mockReset();
  deleteTeam.mockReset();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("TeamsPage", () => {
  it("mostra o carregamento e depois a tabela com colunas, contagens e data curta", async () => {
    let resolve: (teams: TeamListItem[]) => void = () => {};
    fetchTeams.mockReturnValue(new Promise((r) => (resolve = r)));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Loading Teams.")).toBeInTheDocument();
    resolve(makeTeams());

    await expect.element(screen.getByRole("link", { name: "Vyzer" })).toBeVisible();
    const table = screen.getByRole("table", { name: "Teams" });
    for (const name of ["Name", "Members", "Issues", "Created"]) {
      await expect.element(table.getByRole("columnheader", { name })).toBeVisible();
    }
    const zynox = screen.getByRole("row", { name: /Zynox/ });
    await expect.element(zynox).toHaveTextContent("ZYN");
    await expect.element(zynox).toHaveTextContent("5");
    await expect.element(zynox).toHaveTextContent("Sep 29");
    const vyzer = screen.getByRole("row", { name: /Vyzer/ });
    await expect.element(vyzer).toHaveTextContent("12");
    await expect.element(vyzer).toHaveTextContent("Aug 15");
    await expect.element(screen.getByText("Loading Teams.")).not.toBeInTheDocument();
  });

  it("ordena por search param: Name asc→desc e Members numericamente", async () => {
    fetchTeams.mockResolvedValue(makeTeams());
    const screen = await render(<Harness />);

    const rows = bodyRows(screen);
    await expect.element(rows.nth(1)).toHaveTextContent("Alpha");
    await expect.element(rows.nth(2)).toHaveTextContent("Vyzer");
    await expect.element(rows.nth(3)).toHaveTextContent("Zynox");

    await screen
      .getByRole("columnheader", { name: "Name" })
      .getByRole("button", { name: "Name" })
      .click();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams?sort=name&dir=desc");
    await expect.element(rows.nth(1)).toHaveTextContent("Zynox");
    await expect.element(rows.nth(3)).toHaveTextContent("Alpha");

    await screen
      .getByRole("columnheader", { name: "Members" })
      .getByRole("button", { name: "Members" })
      .click();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams?sort=members&dir=asc");
    // Numérico: 2, 5, 12 (textual seria 12, 2, 5).
    await expect.element(rows.nth(1)).toHaveTextContent("Alpha");
    await expect.element(rows.nth(2)).toHaveTextContent("Zynox");
    await expect.element(rows.nth(3)).toHaveTextContent("Vyzer");
  });

  it("sort inválido cai em name", async () => {
    fetchTeams.mockResolvedValue(makeTeams());
    const screen = await render(<Harness initialPath="/settings/teams?sort=bogus&dir=asc" />);

    const rows = bodyRows(screen);
    await expect.element(rows.nth(1)).toHaveTextContent("Alpha");
    await expect.element(rows.nth(3)).toHaveTextContent("Zynox");
  });

  it("clicar na linha, fora do menu, navega para a configuração do Team", async () => {
    fetchTeams.mockResolvedValue(makeTeams());
    const screen = await render(<Harness />);

    await screen.getByRole("cell", { name: "12" }).click();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/vyzer");
  });

  it("o link do nome navega para a configuração do Team", async () => {
    fetchTeams.mockResolvedValue(makeTeams());
    const screen = await render(<Harness />);

    await screen.getByRole("link", { name: "Zynox" }).click();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/zynox");
  });

  it("o menu da linha tem dois itens e Team settings navega", async () => {
    fetchTeams.mockResolvedValue(makeTeams());
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("link", { name: "Vyzer" })).toBeVisible();
    await screen.getByRole("row", { name: /Vyzer/ }).hover();
    await screen.getByRole("button", { name: "Open menu for Vyzer" }).click();
    await expect.element(screen.getByRole("menuitem")).toHaveLength(2);
    await expect.element(screen.getByRole("menuitem", { name: "Team settings" })).toBeVisible();
    await expect.element(screen.getByRole("menuitem", { name: "Delete team…" })).toBeVisible();
    await screen.getByRole("menuitem", { name: "Team settings" }).click();

    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/vyzer");
  });

  it("Delete team… abre o Confirm com foco em Cancel; Cancel não exclui", async () => {
    fetchTeams.mockResolvedValue(makeTeams());
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("link", { name: "Zynox" })).toBeVisible();
    await openDeleteConfirm(screen);
    await expect.element(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await screen.getByRole("button", { name: "Cancel" }).click();

    await expect.element(screen.getByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteTeam).not.toHaveBeenCalled();
  });

  it("confirmar exclui, recarrega a lista e mostra o toast", async () => {
    let teams = makeTeams();
    fetchTeams.mockImplementation(async () => teams);
    deleteTeam.mockImplementation(async ({ id }) => {
      teams = teams.filter((team) => team.id !== id);
      return {};
    });
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("link", { name: "Zynox" })).toBeVisible();
    await openDeleteConfirm(screen);
    await screen.getByRole("button", { name: "Delete team" }).click();

    await vi.waitFor(() => expect(deleteTeam).toHaveBeenCalledWith({ id: ZYNOX_ID }));
    await expect.element(screen.getByText("Zynox deleted")).toBeVisible();
    await expect.element(screen.getByRole("link", { name: "Zynox" })).not.toBeInTheDocument();
    expect(fetchTeams.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("CONFLICT mostra o toast de Projects e mantém o Team na lista", async () => {
    fetchTeams.mockResolvedValue(makeTeams());
    deleteTeam.mockRejectedValue(conflict());
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("link", { name: "Zynox" })).toBeVisible();
    await openDeleteConfirm(screen);
    await screen.getByRole("button", { name: "Delete team" }).click();

    await expect.element(screen.getByText("Could not delete team")).toBeVisible();
    await expect.element(screen.getByText(/This team still has Projects/)).toBeVisible();
    await expect.element(screen.getByRole("link", { name: "Zynox" })).toBeVisible();
    await expect.element(screen.getByText("Zynox deleted")).not.toBeInTheDocument();
  });

  it("erro genérico na exclusão mostra o texto de conexão", async () => {
    fetchTeams.mockResolvedValue(makeTeams());
    deleteTeam.mockRejectedValue(new Error("network"));
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("link", { name: "Zynox" })).toBeVisible();
    await openDeleteConfirm(screen);
    await screen.getByRole("button", { name: "Delete team" }).click();

    await expect.element(screen.getByText("Could not delete team")).toBeVisible();
    await expect.element(screen.getByText(/Check your connection and try again/)).toBeVisible();
    await expect.element(screen.getByRole("link", { name: "Zynox" })).toBeVisible();
  });

  it("o botão Create team do cabeçalho navega para o formulário", async () => {
    fetchTeams.mockResolvedValue(makeTeams());
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("link", { name: "Zynox" })).toBeVisible();
    await screen.getByRole("button", { name: "Create team" }).click();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/new");
  });

  it("lista vazia mostra o EmptyState com Create team", async () => {
    fetchTeams.mockResolvedValue([]);
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("No teams yet")).toBeVisible();
    // Dois botões "Create team": o do cabeçalho e o do EmptyState.
    await expect.element(screen.getByRole("button", { name: "Create team" })).toHaveLength(2);
    await screen.getByRole("button", { name: "Create team" }).last().click();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/new");
  });

  it("erro de leitura oferece Retry e recarrega os Teams", async () => {
    fetchTeams.mockRejectedValueOnce(new Error("network error"));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Could not load Teams")).toBeVisible();
    fetchTeams.mockResolvedValue(makeTeams());
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(screen.getByRole("link", { name: "Vyzer" })).toBeVisible();
    await expect.element(screen.getByText("Could not load Teams")).not.toBeInTheDocument();
  });

  it.each(["dark", "light"] as const)("não tem violações axe no tema %s", async (theme) => {
    document.documentElement.dataset.theme = theme;
    fetchTeams.mockResolvedValue(makeTeams());
    const screen = await render(<Harness />);
    await expect.element(screen.getByRole("link", { name: "Vyzer" })).toBeVisible();

    const root = document.querySelector("main");
    if (!root) throw new Error("main não encontrado");
    expect(await axeViolations(root)).toEqual([]);
  });
});
