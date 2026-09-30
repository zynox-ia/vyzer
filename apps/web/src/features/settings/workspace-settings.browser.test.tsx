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
    logoUrl: string | null;
  };
  member: { id: string; name: string; email: string; role: string };
};

const fetchCurrent = vi.fn<() => Promise<Current>>();
type UpdateInput = {
  name?: string;
  icon?: Icon;
  slug?: string;
  fiscalYearStartMonth?: number;
  logoUrl?: string | null;
};
const saveWorkspace = vi.fn<(input: UpdateInput) => Promise<unknown>>();
const uploadLogo = vi.fn<(file: File) => Promise<{ logoUrl: string }>>();
const deleteWorkspace = vi.fn<() => Promise<unknown>>();

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({ queryKey: ["workspace", "current"], queryFn: () => fetchCurrent() }),
  updateWorkspaceMutationOptions: () =>
    mutationOptions({ mutationFn: (input: UpdateInput) => saveWorkspace(input) }),
  uploadWorkspaceLogoMutationOptions: () =>
    mutationOptions({ mutationFn: (file: File) => uploadLogo(file) }),
  deleteWorkspaceMutationOptions: () => mutationOptions({ mutationFn: () => deleteWorkspace() }),
}));

function makeCurrent(name = "Zynox Dev", role = "admin", logoUrl: string | null = null): Current {
  return {
    workspace: {
      id: "11111111-1111-4111-8111-111111111111",
      name,
      icon: { kind: "icon", name: "briefcase", color: "orange" },
      slug: "zynox-dev",
      fiscalYearStartMonth: 1,
      region: "United States",
      logoUrl,
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

const logoButton = (screen: Awaited<ReturnType<typeof render>>) =>
  screen.getByRole("button", { name: "Workspace logo", exact: true });

/** Abre o menu do avatar e escolhe "Choose icon", que abre o painel do IconPicker. */
async function openIconPicker(screen: Awaited<ReturnType<typeof render>>) {
  await logoButton(screen).click();
  await page.getByRole("menuitem", { name: "Choose icon" }).click();
  await expect.element(page.getByRole("button", { name: "Set custom color" })).toBeVisible();
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
  uploadLogo.mockReset();
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
    await expect.element(logoButton(screen)).toBeVisible();
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

    await openIconPicker(screen);
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
    await expect.element(logoButton(screen)).not.toBeInTheDocument();
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

  it("Member onboarding mostra as duas linhas, sem etiqueta de plano", async () => {
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("Welcome message")).toBeVisible();
    await expect.element(screen.getByText("Default home view")).toBeVisible();
    await expect.element(screen.getByText(/Available on/)).not.toBeInTheDocument();

    const buttons = screen.getByRole("button", { name: "Configure" });
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

  describe("Logo", () => {
    const LOGO = "/api/workspace/logo/33333333-3333-4333-8333-333333333333.png";
    const menuItem = (name: string) => page.getByRole("menuitem", { name });

    it("um único avatar à direita do rótulo; o menu tem Upload logo e Choose icon", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);
      const avatar = logoButton(screen);
      await expect.element(avatar).toBeVisible();
      await expect.element(screen.getByRole("radio")).not.toBeInTheDocument();

      const label = screen.getByText("Logo", { exact: true }).first().element();
      expect(avatar.element().getBoundingClientRect().left).toBeGreaterThan(
        label.getBoundingClientRect().right,
      );

      await avatar.click();
      await expect.element(menuItem("Upload logo")).toBeVisible();
      await expect.element(menuItem("Choose icon")).toBeVisible();
      await expect.element(menuItem("Remove logo")).not.toBeInTheDocument();
    });

    it("com logo, o avatar mostra a imagem e o menu ganha Remove logo", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("Zynox Dev", "admin", LOGO));
      const screen = await render(<Harness />);
      await expect.element(logoButton(screen)).toBeVisible();
      expect(document.querySelector(`img[src="${LOGO}"]`)).not.toBeNull();

      await logoButton(screen).click();
      await expect.element(menuItem("Remove logo")).toBeVisible();
    });

    it("abrir o menu e o seletor de ícone não chama update", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);
      await openIconPicker(screen);
      expect(saveWorkspace).not.toHaveBeenCalled();
    });

    it("Upload logo escolhe um arquivo, envia o upload e grava { logoUrl } com o toast Saved", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      saveWorkspace.mockResolvedValue({});
      uploadLogo.mockResolvedValue({ logoUrl: LOGO });
      const screen = await render(<Harness />);

      const file = new File(["x"], "logo.png", { type: "image/png" });
      await userEvent.upload(screen.getByLabelText("Workspace logo file"), file);

      await vi.waitFor(() => expect(uploadLogo).toHaveBeenCalledTimes(1));
      expect(uploadLogo.mock.calls[0]![0].name).toBe("logo.png");
      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
      expect(saveWorkspace.mock.calls[0]![0]).toEqual({ logoUrl: LOGO });
      await expect.element(screen.getByText("Saved")).toBeVisible();
    });

    it("arrastar uma imagem para o avatar envia o upload", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      saveWorkspace.mockResolvedValue({});
      uploadLogo.mockResolvedValue({ logoUrl: LOGO });
      const screen = await render(<Harness />);

      await expect.element(logoButton(screen)).toBeVisible();
      const dropZone = logoButton(screen).element().parentElement!;
      const data = new DataTransfer();
      data.items.add(new File(["x"], "dropped.png", { type: "image/png" }));
      dropZone.dispatchEvent(
        new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }),
      );

      await vi.waitFor(() => expect(uploadLogo).toHaveBeenCalledTimes(1));
      expect(uploadLogo.mock.calls[0]![0].name).toBe("dropped.png");
      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
      expect(saveWorkspace.mock.calls[0]![0]).toEqual({ logoUrl: LOGO });
    });

    it("erro de upload mostra a mensagem na linha e não chama update", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      uploadLogo.mockRejectedValue(new Error("Choose a PNG, JPG, WebP, or SVG image."));
      const screen = await render(<Harness />);

      await userEvent.upload(
        screen.getByLabelText("Workspace logo file"),
        new File(["x"], "logo.gif", { type: "image/gif" }),
      );

      await expect
        .element(screen.getByText("Choose a PNG, JPG, WebP, or SVG image."))
        .toBeVisible();
      expect(saveWorkspace).not.toHaveBeenCalled();
    });

    it("Remove logo grava { logoUrl: null } e o Undo regrava a URL anterior", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("Zynox Dev", "admin", LOGO));
      saveWorkspace.mockResolvedValue({});
      const screen = await render(<Harness />);

      await logoButton(screen).click();
      await menuItem("Remove logo").click();
      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
      expect(saveWorkspace.mock.calls[0]![0]).toEqual({ logoUrl: null });

      await screen.getByRole("button", { name: "Undo" }).click();
      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(2));
      expect(saveWorkspace.mock.calls[1]![0]).toEqual({ logoUrl: LOGO });
    });

    it("com logo, escolher um ícone grava { icon, logoUrl: null }", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("Zynox Dev", "admin", LOGO));
      saveWorkspace.mockResolvedValue({});
      const screen = await render(<Harness />);

      await openIconPicker(screen);
      const other = document.querySelector<HTMLButtonElement>(
        'fieldset button[aria-pressed="false"]',
      );
      if (!other) throw new Error("Nenhum ícone alternativo no picker");
      other.click();

      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
      const input = saveWorkspace.mock.calls[0]![0];
      expect(Object.keys(input).sort()).toEqual(["icon", "logoUrl"]);
      expect(input.logoUrl).toBeNull();
    });

    it("não-admin não vê o avatar editável nem o input de arquivo", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("Zynox Dev", "member", LOGO));
      const screen = await render(<Harness />);
      await expect.element(screen.getByLabelText("Name")).toBeDisabled();

      await expect.element(logoButton(screen)).not.toBeInTheDocument();
      await expect.element(screen.getByLabelText("Workspace logo file")).not.toBeInTheDocument();
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
