/**
 * Interação de Settings → Administration → Workspace (spec `settings-administration.md`, 1.1), num
 * Chromium real. A camada de rede (`@/services/workspace`) é trocada por `queryOptions` e
 * `mutationOptions` reais do TanStack Query apoiados em `vi.fn`, então a página roda com o mesmo
 * QueryClient, o mesmo `invalidateQueries` e o mesmo ToastProvider do app.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import axe from "axe-core";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { WorkspaceSettingsPage } from "./workspace-settings";

type Icon = { kind: "icon"; name: string; color: "orange" } | { kind: "emoji"; emoji: string };
type Current = {
  workspace: {
    id: string;
    name: string;
    icon: Icon;
    slug: string;
    fiscalYearStartMonth: number;
    region: string;
  };
  member: { id: string; name: string; email: string; role: string };
};

const fetchCurrent = vi.fn<() => Promise<Current>>();
type UpdateInput = { name?: string; icon?: Icon; slug?: string; fiscalYearStartMonth?: number };
const saveWorkspace = vi.fn<(input: UpdateInput) => Promise<unknown>>();
const deleteWorkspace = vi.fn<() => Promise<unknown>>();

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({ queryKey: ["workspace", "current"], queryFn: () => fetchCurrent() }),
  updateWorkspaceMutationOptions: () =>
    mutationOptions({ mutationFn: (input: UpdateInput) => saveWorkspace(input) }),
  deleteWorkspaceMutationOptions: () => mutationOptions({ mutationFn: () => deleteWorkspace() }),
}));

function makeCurrent(name = "Zynox Dev", role = "admin"): Current {
  return {
    workspace: {
      id: "11111111-1111-4111-8111-111111111111",
      name,
      icon: { kind: "icon", name: "briefcase", color: "orange" },
      slug: "zynox-dev",
      fiscalYearStartMonth: 1,
      region: "United States",
    },
    member: {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Admin",
      email: "admin@example.com",
      role,
    },
  };
}

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        {/* No app, a página vive no <main> do AppShell/SettingsLayout. */}
        <main>
          <WorkspaceSettingsPage />
        </main>
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
  fetchCurrent.mockReset();
  saveWorkspace.mockReset();
  deleteWorkspace.mockReset();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("WorkspaceSettingsPage", () => {
  it("mostra o estado de loading e depois os campos com nome e ícone atuais", async () => {
    let resolve!: (value: Current) => void;
    fetchCurrent.mockReturnValue(new Promise<Current>((r) => (resolve = r)));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Loading workspace settings.")).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();

    resolve(makeCurrent());
    await expect.element(screen.getByLabelText("Name")).toHaveValue("Zynox Dev");
    await expect
      .element(screen.getByRole("button", { name: "Choose workspace icon" }))
      .toBeVisible();
    await expect.element(screen.getByText("Loading workspace settings.")).not.toBeInTheDocument();
  });

  it("não há botão Save nem formulário; nada é salvo sem editar", async () => {
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);
    await expect.element(screen.getByLabelText("Name")).toHaveValue("Zynox Dev");

    await expect.element(screen.getByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(document.querySelector("form")).toBeNull();
    await userEvent.click(screen.getByLabelText("Name").element());
    await userEvent.tab();
    expect(saveWorkspace).not.toHaveBeenCalled();
  });

  it("Name salva ao sair do campo, só { name } com trim, e mostra o toast Saved", async () => {
    fetchCurrent.mockResolvedValueOnce(makeCurrent());
    saveWorkspace.mockResolvedValue({});
    const screen = await render(<Harness />);
    const name = screen.getByLabelText("Name");
    await expect.element(name).toHaveValue("Zynox Dev");

    fetchCurrent.mockResolvedValue(makeCurrent("Acme"));
    await name.fill("  Acme  ");
    expect(saveWorkspace).not.toHaveBeenCalled();
    await userEvent.tab();

    await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
    expect(saveWorkspace.mock.calls[0]![0]).toEqual({ name: "Acme" });
    await vi.waitFor(() => expect(fetchCurrent).toHaveBeenCalledTimes(2));
    await expect.element(name).toHaveValue("Acme");
    await expect.element(screen.getByText("Saved", { exact: true })).toBeVisible();
  });

  it("o toast Saved tem Undo, que regrava o valor de antes", async () => {
    fetchCurrent.mockResolvedValueOnce(makeCurrent());
    saveWorkspace.mockResolvedValue({});
    const screen = await render(<Harness />);
    const name = screen.getByLabelText("Name");
    await expect.element(name).toHaveValue("Zynox Dev");

    fetchCurrent.mockResolvedValue(makeCurrent("Acme"));
    await name.fill("Acme");
    await userEvent.tab();
    await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));

    fetchCurrent.mockResolvedValue(makeCurrent("Zynox Dev"));
    await screen.getByRole("button", { name: "Undo" }).click();

    await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(2));
    expect(saveWorkspace.mock.calls[1]![0]).toEqual({ name: "Zynox Dev" });
    await expect.element(name).toHaveValue("Zynox Dev");
  });

  it("Enter no Name também salva, uma única vez", async () => {
    fetchCurrent.mockResolvedValueOnce(makeCurrent());
    saveWorkspace.mockResolvedValue({});
    const screen = await render(<Harness />);
    const name = screen.getByLabelText("Name");
    await expect.element(name).toHaveValue("Zynox Dev");

    fetchCurrent.mockResolvedValue(makeCurrent("Acme"));
    await name.fill("Acme");
    await userEvent.keyboard("{Enter}");

    await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
    expect(saveWorkspace.mock.calls[0]![0]).toEqual({ name: "Acme" });
    await vi.waitFor(() => expect(fetchCurrent).toHaveBeenCalledTimes(2));
    expect(saveWorkspace).toHaveBeenCalledTimes(1);
  });

  it("Name vazio mostra o erro e não chama a mutação", async () => {
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);
    const name = screen.getByLabelText("Name");
    await expect.element(name).toHaveValue("Zynox Dev");

    await name.fill("");
    await expect.element(screen.getByText("Name is required.")).toBeVisible();
    await userEvent.tab();
    expect(saveWorkspace).not.toHaveBeenCalled();
    await expect.element(screen.getByText("Name is required.")).toBeVisible();
    await expect.element(name).toHaveValue("");
  });

  it("trocar o ícone pelo IconPicker envia só { icon } na hora", async () => {
    fetchCurrent.mockResolvedValue(makeCurrent());
    saveWorkspace.mockResolvedValue({});
    const screen = await render(<Harness />);

    await screen.getByRole("button", { name: "Choose workspace icon" }).click();
    await expect.element(page.getByRole("button", { name: "Set custom color" })).toBeVisible();
    // Um ícone diferente do atual (aria-pressed=false) no primeiro grupo da paleta.
    const other = document.querySelector<HTMLButtonElement>(
      'fieldset button[aria-pressed="false"]',
    );
    if (!other) throw new Error("Nenhum ícone alternativo no picker");
    other.click();

    await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
    const input = saveWorkspace.mock.calls[0]![0];
    expect(Object.keys(input)).toEqual(["icon"]);
    expect(input.icon).toMatchObject({ kind: "icon" });
  });

  it("erro de leitura mostra o Alert e o Retry refaz a query", async () => {
    fetchCurrent.mockRejectedValueOnce(new Error("boom"));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Could not load workspace settings")).toBeVisible();

    fetchCurrent.mockResolvedValue(makeCurrent());
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(screen.getByLabelText("Name")).toHaveValue("Zynox Dev");
    await expect
      .element(screen.getByText("Could not load workspace settings"))
      .not.toBeInTheDocument();
  });

  it("erro na gravação mostra o toast e o valor digitado permanece", async () => {
    fetchCurrent.mockResolvedValue(makeCurrent());
    saveWorkspace.mockRejectedValue(new Error("boom"));
    const screen = await render(<Harness />);
    const name = screen.getByLabelText("Name");
    await expect.element(name).toHaveValue("Zynox Dev");

    await name.fill("Acme");
    await userEvent.tab();

    await expect.element(screen.getByText("Could not save workspace")).toBeVisible();
    await expect.element(name).toHaveValue("Acme");
  });

  it("Member que não é admin vê tudo somente leitura", async () => {
    fetchCurrent.mockResolvedValue(makeCurrent("Zynox Dev", "member"));
    const screen = await render(<Harness />);

    await expect.element(screen.getByLabelText("Name")).toHaveValue("Zynox Dev");
    await expect.element(screen.getByLabelText("Name")).toBeDisabled();
    await expect.element(screen.getByLabelText("URL")).toBeDisabled();
    await expect.element(screen.getByLabelText("First month of the fiscal year")).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "Delete workspace" })).toBeDisabled();
    await expect.element(screen.getByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(saveWorkspace).not.toHaveBeenCalled();
    await expect
      .element(screen.getByRole("button", { name: "Choose workspace icon" }))
      .not.toBeInTheDocument();
  });

  it("URL mostra o prefixo, salva só { slug } ao sair e rejeita slug inválido", async () => {
    fetchCurrent.mockResolvedValueOnce(makeCurrent());
    saveWorkspace.mockResolvedValue({});
    const screen = await render(<Harness />);
    const url = screen.getByLabelText("URL");
    await expect.element(url).toHaveValue("zynox-dev");
    await expect.element(screen.getByText("vyzer.app/")).toBeVisible();

    await url.fill("My Space");
    await expect.element(screen.getByText(/Use lowercase letters/)).toBeVisible();
    await userEvent.tab();
    expect(saveWorkspace).not.toHaveBeenCalled();
    await expect.element(screen.getByText(/Use lowercase letters/)).toBeVisible();

    fetchCurrent.mockResolvedValue({
      ...makeCurrent(),
      workspace: { ...makeCurrent().workspace, slug: "acme-co" },
    });
    await url.fill("  acme-co ");
    await userEvent.tab();

    await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
    expect(saveWorkspace.mock.calls[0]![0]).toEqual({ slug: "acme-co" });
    await expect.element(url).toHaveValue("acme-co");
  });

  it("o Select do ano fiscal envia só { fiscalYearStartMonth } numérico na hora", async () => {
    fetchCurrent.mockResolvedValue(makeCurrent());
    saveWorkspace.mockResolvedValue({});
    const screen = await render(<Harness />);

    await screen.getByLabelText("First month of the fiscal year").click();
    await page.getByRole("option", { name: "April" }).click();

    await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
    expect(saveWorkspace.mock.calls[0]![0]).toEqual({ fiscalYearStartMonth: 4 });
  });

  it("Region mostra o texto de workspace.region, sem controle editável", async () => {
    fetchCurrent.mockResolvedValue({
      ...makeCurrent(),
      workspace: { ...makeCurrent().workspace, region: "Brazil" },
    });
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Brazil")).toBeVisible();
    await expect.element(screen.getByLabelText("Region")).not.toBeInTheDocument();
    await expect.element(screen.getByRole("combobox", { name: "Region" })).not.toBeInTheDocument();
  });

  it("Member onboarding mostra as duas linhas como Available on Enterprise, desabilitadas", async () => {
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("Welcome message")).toBeVisible();
    await expect.element(screen.getByText("Default home view")).toBeVisible();

    const buttons = screen.getByRole("button", { name: "Available on Enterprise" });
    await expect.element(buttons.first()).toBeDisabled();
    expect(buttons.elements()).toHaveLength(2);
    for (const el of buttons.elements()) expect((el as HTMLButtonElement).disabled).toBe(true);
  });

  describe("Danger zone", () => {
    it("Delete abre o Confirm com foco em Cancel; Cancel não chama a mutação", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);

      await screen.getByRole("button", { name: "Delete workspace" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect.element(dialog).toBeVisible();
      await expect.element(dialog.getByRole("button", { name: "Cancel" })).toHaveFocus();

      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect.element(dialog).not.toBeInTheDocument();
      expect(deleteWorkspace).not.toHaveBeenCalled();
    });

    it("confirmar chama workspace.delete e mostra o toast", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      deleteWorkspace.mockResolvedValue({});
      const screen = await render(<Harness />);

      await screen.getByRole("button", { name: "Delete workspace" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Delete workspace" }).click();

      await vi.waitFor(() => expect(deleteWorkspace).toHaveBeenCalledTimes(1));
      await expect.element(screen.getByText("Workspace deleted")).toBeVisible();
    });

    it("erro na exclusão mostra o toast de falha", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      deleteWorkspace.mockRejectedValue(new Error("boom"));
      const screen = await render(<Harness />);

      await screen.getByRole("button", { name: "Delete workspace" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Delete workspace" }).click();

      await expect.element(screen.getByText("Could not delete workspace")).toBeVisible();
    });
  });

  it.each(["dark", "light"] as const)("não tem violações axe no tema %s", async (theme) => {
    document.documentElement.dataset.theme = theme;
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);
    await expect.element(screen.getByLabelText("Name")).toHaveValue("Zynox Dev");

    expect(await axeViolations(document.body)).toEqual([]);
  });
});
