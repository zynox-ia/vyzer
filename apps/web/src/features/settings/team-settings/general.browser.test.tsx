/** Team General settings (autosave) in a real Chromium browser (spec settings-administration 2.2). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import axe from "axe-core";
import type { Team } from "@zynox/contract";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import { TeamSettingsLayout } from "./layout";
import { TeamGeneralPage } from "./general";

type UpdateInput = { id: string } & Record<string, unknown>;
type Current = { workspace: { id: string }; member: { role: string } };

const updateTeam = vi.fn<(input: UpdateInput) => Promise<unknown>>();
const resetTeamIssueEmail = vi.fn<(input: { id: string }) => Promise<unknown>>();
const fetchCurrent = vi.fn<() => Promise<Current>>();
let team: Team;

vi.mock("@/services/teams", () => ({
  teamQueryOptions: (slug: string) =>
    queryOptions({ queryKey: ["team", slug], queryFn: async () => ({ ...team }) }),
  teamsQueryOptions: () => queryOptions({ queryKey: ["teams"], queryFn: async () => [] }),
  updateTeamMutationOptions: () =>
    mutationOptions({ mutationFn: (input: UpdateInput) => updateTeam(input) }),
  resetTeamIssueEmailMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => resetTeamIssueEmail(input) }),
}));

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({ queryKey: ["workspace", "current"], queryFn: () => fetchCurrent() }),
}));

const makeTeam = (): Team => ({
  id: "11111111-1111-4111-8111-111111111111",
  name: "Atlas",
  slug: "atlas",
  key: "VYZ",
  icon: { kind: "icon", name: "Layers", color: "purple" },
  description: "Ships the product",
  timezone: "America/Sao_Paulo",
  estimation: "none",
  detailedIssueHistory: false,
  issueEmailEnabled: false,
  issueEmailAddress: "atlas-4c7872ac31b0@intake.zynox.app.br",
  createdAt: "2026-08-15T12:00:00.000Z",
  updatedAt: "2026-08-15T12:00:00.000Z",
});

const current = (role: string): Current => ({ workspace: { id: "w" }, member: { role } });

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/settings/teams/atlas/general"]}>
          <main>
            <Routes>
              <Route path="/settings/teams/:team" element={<TeamSettingsLayout />}>
                <Route path="general" element={<TeamGeneralPage />} />
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

type Screen = Awaited<ReturnType<typeof render>>;
const nameField = (s: Screen) => s.getByRole("textbox", { name: "Name" });
const keyField = (s: Screen) => s.getByRole("textbox", { name: "Identifier" });
const descField = (s: Screen) => s.getByRole("textbox", { name: "Team description" });

/** Renderiza como Admin e espera o formulário editável. */
async function renderAdmin() {
  fetchCurrent.mockResolvedValue(current("admin"));
  const screen = await render(<Harness />);
  await expect.element(nameField(screen)).toHaveValue("Atlas");
  await expect.element(nameField(screen)).toBeEnabled();
  return screen;
}

beforeEach(async () => {
  team = makeTeam();
  updateTeam.mockReset();
  updateTeam.mockImplementation(async ({ id: _id, ...patch }) => {
    team = { ...team, ...patch } as Team;
    return team;
  });
  resetTeamIssueEmail.mockReset();
  resetTeamIssueEmail.mockResolvedValue({});
  fetchCurrent.mockReset();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("TeamGeneralPage", () => {
  it("mostra os campos, a ajuda e o botão de ícone, sem botão Save", async () => {
    const screen = await renderAdmin();

    await expect.element(keyField(screen)).toHaveValue("VYZ");
    await expect.element(descField(screen)).toHaveValue("Ships the product");
    await expect.element(screen.getByText("Used in issue IDs")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Choose team icon" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: /^Save/ })).not.toBeInTheDocument();
  });

  it("Name salva ao sair do campo, só { id, name } com trim", async () => {
    const screen = await renderAdmin();

    await nameField(screen).fill("  Platform  ");
    await userEvent.tab();

    await vi.waitFor(() => expect(updateTeam).toHaveBeenCalledTimes(1));
    expect(updateTeam).toHaveBeenCalledWith({ id: team.id, name: "Platform" });
    await expect.element(screen.getByText("Saved", { exact: true })).toBeVisible();
  });

  it("Enter no Name também salva", async () => {
    const screen = await renderAdmin();

    await nameField(screen).fill("Platform");
    await userEvent.keyboard("{Enter}");

    await vi.waitFor(() =>
      expect(updateTeam).toHaveBeenCalledWith({ id: team.id, name: "Platform" }),
    );
  });

  it("Name vazio mostra o erro e não chama a API", async () => {
    const screen = await renderAdmin();

    await nameField(screen).fill("");
    await userEvent.tab();

    await expect.element(screen.getByText("Name is required.")).toBeVisible();
    expect(updateTeam).not.toHaveBeenCalled();
  });

  it("Identifier vira maiúsculo e salva { id, key }", async () => {
    const screen = await renderAdmin();

    await keyField(screen).fill("plt2");
    await expect.element(keyField(screen)).toHaveValue("PLT2");
    await userEvent.tab();

    await vi.waitFor(() => expect(updateTeam).toHaveBeenCalledWith({ id: team.id, key: "PLT2" }));
  });

  it("Identifier inválido mostra o erro e não chama a API", async () => {
    const screen = await renderAdmin();

    await keyField(screen).fill("1AB");
    await userEvent.tab();

    await expect
      .element(screen.getByText("Use capital letters and numbers, starting with a letter."))
      .toBeVisible();
    expect(updateTeam).not.toHaveBeenCalled();
  });

  it("CONFLICT mostra o erro no Identifier e mantém o valor digitado", async () => {
    updateTeam.mockRejectedValue(Object.assign(new Error("taken"), { code: "CONFLICT" }));
    const screen = await renderAdmin();

    await keyField(screen).fill("ENG");
    await userEvent.tab();

    await expect.element(screen.getByText("This identifier is already taken.")).toBeVisible();
    await expect.element(keyField(screen)).toHaveValue("ENG");
    await expect.element(screen.getByText("Saved", { exact: true })).not.toBeInTheDocument();
  });

  it("Description salva { id, description } ao sair do campo", async () => {
    const screen = await renderAdmin();

    await descField(screen).fill("  New summary  ");
    await userEvent.tab();

    await vi.waitFor(() =>
      expect(updateTeam).toHaveBeenCalledWith({ id: team.id, description: "New summary" }),
    );
  });

  it("Description vazia envia description: null", async () => {
    const screen = await renderAdmin();

    await descField(screen).fill("");
    await userEvent.tab();

    await vi.waitFor(() =>
      expect(updateTeam).toHaveBeenCalledWith({ id: team.id, description: null }),
    );
  });

  it("escolher um ícone salva { id, icon } na hora", async () => {
    const screen = await renderAdmin();

    await screen.getByRole("button", { name: "Choose team icon" }).click();
    await expect.element(page.getByRole("button", { name: "Set custom color" })).toBeVisible();
    const other = document.querySelector<HTMLButtonElement>(
      'fieldset button[aria-pressed="false"]',
    );
    if (!other) throw new Error("Nenhum ícone alternativo no picker");
    other.click();

    await vi.waitFor(() => expect(updateTeam).toHaveBeenCalledTimes(1));
    const input = updateTeam.mock.calls[0]![0];
    expect(Object.keys(input).sort()).toEqual(["icon", "id"]);
    expect(input.icon).toMatchObject({ kind: "icon" });
  });

  it("o toast Saved tem Undo, que regrava o valor de antes", async () => {
    const screen = await renderAdmin();

    await nameField(screen).fill("Platform");
    await userEvent.tab();
    await expect.element(screen.getByText("Saved", { exact: true })).toBeVisible();
    await screen.getByRole("button", { name: "Undo" }).click();

    await vi.waitFor(() => expect(updateTeam).toHaveBeenCalledTimes(2));
    expect(updateTeam).toHaveBeenLastCalledWith({ id: team.id, name: "Atlas" });
  });

  it("erro genérico mostra o toast Could not save team", async () => {
    updateTeam.mockRejectedValue(new Error("network"));
    const screen = await renderAdmin();

    await nameField(screen).fill("Platform");
    await userEvent.tab();

    await expect.element(screen.getByText("Could not save team")).toBeVisible();
  });

  it("não-admin vê os campos desabilitados, sem botão de ícone e sem chamadas", async () => {
    fetchCurrent.mockResolvedValue(current("member"));
    const screen = await render(<Harness />);

    await expect.element(nameField(screen)).toHaveValue("Atlas");
    await expect.element(nameField(screen)).toBeDisabled();
    await expect.element(keyField(screen)).toBeDisabled();
    await expect.element(descField(screen)).toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: "Choose team icon" }))
      .not.toBeInTheDocument();
    expect(updateTeam).not.toHaveBeenCalled();
  });

  describe("Estimates", () => {
    it("o Select Issue estimation tem as 5 opções exatas", async () => {
      const screen = await renderAdmin();

      await screen.getByLabelText("Issue estimation").click();
      await expect.element(page.getByRole("option").first()).toBeVisible();
      const options = Array.from(document.querySelectorAll('[role="option"]')).map((o) =>
        o.textContent?.trim(),
      );
      expect(options).toEqual([
        "Not in use",
        "Exponential (1, 2, 4, 8, 16 Points)",
        "Fibonacci (1, 2, 3, 5, 8 Points)",
        "Linear (1, 2, 3, 4, 5 Points)",
        "T-Shirt (XS, S, M, L, XL)",
      ]);
    });

    it("escolher uma salva { id, estimation } e o Undo regrava none", async () => {
      const screen = await renderAdmin();

      await screen.getByLabelText("Issue estimation").click();
      await page.getByRole("option", { name: "Fibonacci (1, 2, 3, 5, 8 Points)" }).click();

      await vi.waitFor(() =>
        expect(updateTeam).toHaveBeenCalledWith({ id: team.id, estimation: "fibonacci" }),
      );
      await expect.element(screen.getByText("Saved", { exact: true })).toBeVisible();
      await screen.getByRole("button", { name: "Undo" }).click();
      await vi.waitFor(() => expect(updateTeam).toHaveBeenCalledTimes(2));
      expect(updateTeam).toHaveBeenLastCalledWith({ id: team.id, estimation: "none" });
    });
  });

  describe("Create issues by email", () => {
    const toggle = (s: Screen) => s.getByRole("switch", { name: "Enable issue creation by email" });
    const ADDRESS = "atlas-4c7872ac31b0@intake.zynox.app.br";

    it("desligado não mostra o endereço; ligar salva { issueEmailEnabled: true }", async () => {
      const screen = await renderAdmin();

      await expect.element(screen.getByText(ADDRESS)).not.toBeInTheDocument();
      await toggle(screen).click();

      await vi.waitFor(() =>
        expect(updateTeam).toHaveBeenCalledWith({ id: team.id, issueEmailEnabled: true }),
      );
      await expect.element(screen.getByText(ADDRESS)).toBeVisible();
      await expect.element(screen.getByText(/not available yet/)).toBeVisible();
    });

    it("Copy escreve o endereço na área de transferência e vira Copied", async () => {
      team = { ...team, issueEmailEnabled: true };
      const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
      const screen = await renderAdmin();

      await screen.getByRole("button", { name: "Copy" }).click();

      expect(writeText).toHaveBeenCalledWith(ADDRESS);
      await expect.element(screen.getByRole("button", { name: "Copied" })).toBeVisible();
      writeText.mockRestore();
    });

    it("Reset abre o Confirm com foco em Cancel; Cancel não chama", async () => {
      team = { ...team, issueEmailEnabled: true };
      const screen = await renderAdmin();

      await screen.getByRole("button", { name: "Reset", exact: true }).click();
      await expect
        .element(screen.getByRole("alertdialog", { name: "Reset email address?" }))
        .toBeVisible();
      await expect.element(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
      await screen.getByRole("button", { name: "Cancel" }).click();

      await expect.element(screen.getByRole("alertdialog")).not.toBeInTheDocument();
      expect(resetTeamIssueEmail).not.toHaveBeenCalled();
    });

    it("confirmar chama resetTeamIssueEmail({ id }) e mostra Email address reset", async () => {
      team = { ...team, issueEmailEnabled: true };
      const screen = await renderAdmin();

      await screen.getByRole("button", { name: "Reset", exact: true }).click();
      await screen.getByRole("button", { name: "Reset address" }).click();

      await vi.waitFor(() => expect(resetTeamIssueEmail).toHaveBeenCalledWith({ id: team.id }));
      await expect.element(screen.getByText("Email address reset")).toBeVisible();
    });
  });

  describe("Timezone", () => {
    it("mostra o fuso atual e troca por busca, salvando { id, timezone }", async () => {
      const screen = await renderAdmin();

      const trigger = screen.getByRole("button", { name: "Timezone" });
      await expect.element(trigger).toBeVisible();
      await expect.element(trigger).toHaveTextContent(/GMT-3:00 – Brasilia/);
      await trigger.click();
      await page.getByPlaceholder("Search timezones…").fill("Tokyo");
      // O rótulo é o fuso por extenso (GMT+9:00 – Japan Time); "Tokyo" só casa pelo nome IANA.
      await page.getByRole("option").first().click();

      await vi.waitFor(() =>
        expect(updateTeam).toHaveBeenCalledWith({ id: team.id, timezone: "Asia/Tokyo" }),
      );
    });
  });

  describe("Other", () => {
    it("Enable detailed issue history salva { id, detailedIssueHistory: true } com Saved", async () => {
      const screen = await renderAdmin();

      await screen.getByRole("switch", { name: "Enable detailed issue history" }).click();

      await vi.waitFor(() =>
        expect(updateTeam).toHaveBeenCalledWith({ id: team.id, detailedIssueHistory: true }),
      );
      await expect.element(screen.getByText("Saved", { exact: true })).toBeVisible();
    });
  });

  it("não-admin: os novos controles ficam desabilitados e o Reset some", async () => {
    team = { ...team, issueEmailEnabled: true };
    fetchCurrent.mockResolvedValue(current("member"));
    const screen = await render(<Harness />);

    await expect.element(nameField(screen)).toBeDisabled();
    await expect.element(screen.getByLabelText("Issue estimation")).toBeDisabled();
    await expect
      .element(screen.getByRole("switch", { name: "Enable issue creation by email" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("switch", { name: "Enable detailed issue history" }))
      .toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "Timezone" })).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "Copy" })).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Reset", exact: true }))
      .not.toBeInTheDocument();
    expect(updateTeam).not.toHaveBeenCalled();
  });

  it.each(["dark", "light"] as const)("não tem violações axe no tema %s", async (theme) => {
    document.documentElement.dataset.theme = theme;
    await renderAdmin();

    const root = document.querySelector("main");
    if (!root) throw new Error("main não encontrado");
    expect(await axeViolations(root)).toEqual([]);
  });
});
