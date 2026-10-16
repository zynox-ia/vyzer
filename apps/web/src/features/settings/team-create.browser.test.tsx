/** Create team form in a real Chromium browser (spec settings-administration 2.1). */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import axe from "axe-core";
import { ToastProvider, type ProjectIconValue } from "@zynox/design-system/components";
import "@/index.css";
import { TeamCreatePage } from "./team-create";

type CreateInput = { name: string; key: string; icon: ProjectIconValue };

const createTeam = vi.fn<(input: CreateInput) => Promise<{ name: string; slug: string }>>();
let client: QueryClient;

vi.mock("@/services/teams", () => ({
  teamsQueryOptions: () => queryOptions({ queryKey: ["teams"], queryFn: () => [] }),
  createTeamMutationOptions: () =>
    mutationOptions({ mutationFn: (input: CreateInput) => createTeam(input) }),
}));

function LocationOutput() {
  const location = useLocation();
  return (
    <output aria-label="Current URL">
      {location.pathname}
      {location.search}
    </output>
  );
}

function Harness() {
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/settings/teams/new"]}>
          <main>
            <Routes>
              <Route path="/settings/teams/new" element={<TeamCreatePage />} />
              <Route path="/settings/teams/:team" element={<h1>Team settings page</h1>} />
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

const withCode = (code: string, message = code) => Object.assign(new Error(message), { code });

type Screen = Awaited<ReturnType<typeof render>>;
const nameField = (screen: Screen) => screen.getByRole("textbox", { name: "Icon & name" });
const keyField = (screen: Screen) => screen.getByRole("textbox", { name: "Identifier" });
const submit = (screen: Screen) => screen.getByRole("button", { name: "Create team" });

beforeEach(async () => {
  createTeam.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // A lista de Teams em cache: o sucesso precisa marcá-la como invalidada.
  client.setQueryData(["teams"], []);
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("TeamCreatePage", () => {
  it("mostra Icon & name (com o seletor de ícone) e Identifier; submit começa desabilitado", async () => {
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("heading", { name: "Create a new team" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Choose team icon" })).toBeVisible();
    await expect.element(nameField(screen)).toBeVisible();
    await expect.element(keyField(screen)).toBeVisible();
    await expect.element(submit(screen)).toBeDisabled();
  });

  it("a key sugerida acompanha o nome até a pessoa editá-la", async () => {
    const screen = await render(<Harness />);

    await nameField(screen).fill("Platform");
    await expect.element(keyField(screen)).toHaveValue("PLA");
    await nameField(screen).fill("Growth");
    await expect.element(keyField(screen)).toHaveValue("GRO");
    await expect.element(submit(screen)).toBeEnabled();

    // Editada à mão: a key deixa de acompanhar o nome e o que se digita vira maiúscula.
    await keyField(screen).fill("gx");
    await expect.element(keyField(screen)).toHaveValue("GX");
    await nameField(screen).fill("Infrastructure");
    await expect.element(keyField(screen)).toHaveValue("GX");
  });

  it("key inválida mostra o erro e desabilita o envio", async () => {
    const screen = await render(<Harness />);

    await nameField(screen).fill("Platform");
    await keyField(screen).fill("1AB");

    await expect
      .element(screen.getByText("Use capital letters and numbers, starting with a letter."))
      .toBeVisible();
    await expect.element(submit(screen)).toBeDisabled();
  });

  it("envia name com trim, invalida a lista, avisa e navega para o Team", async () => {
    createTeam.mockResolvedValue({ name: "Platform", slug: "platform" });
    const screen = await render(<Harness />);

    await nameField(screen).fill("  Platform  ");
    await expect.element(keyField(screen)).toHaveValue("PLA");
    await submit(screen).click();

    await vi.waitFor(() => expect(createTeam).toHaveBeenCalledTimes(1));
    expect(createTeam).toHaveBeenCalledWith({
      name: "Platform",
      key: "PLA",
      icon: { kind: "icon", name: "Users", color: "purple" },
    });
    await expect.element(screen.getByText("Platform created")).toBeVisible();
    expect(client.getQueryState(["teams"])?.isInvalidated).toBe(true);
    await expect.element(screen.getByRole("heading", { name: "Team settings page" })).toBeVisible();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/platform");
  });

  it("Enter no campo Name envia o formulário", async () => {
    createTeam.mockResolvedValue({ name: "Platform", slug: "platform" });
    const screen = await render(<Harness />);

    await nameField(screen).fill("Platform");
    await userEvent.keyboard("{Enter}");

    await vi.waitFor(() =>
      expect(createTeam).toHaveBeenCalledWith(expect.objectContaining({ name: "Platform" })),
    );
  });

  it("CONFLICT vira erro no Identifier e não navega", async () => {
    createTeam.mockRejectedValue(withCode("CONFLICT"));
    const screen = await render(<Harness />);

    await nameField(screen).fill("Platform");
    await submit(screen).click();

    await expect.element(screen.getByText("This identifier is already taken.")).toBeVisible();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/new");
    await expect.element(screen.getByText("Platform created")).not.toBeInTheDocument();

    // Editar a key limpa o erro do servidor.
    await keyField(screen).fill("PLT");
    await expect
      .element(screen.getByText("This identifier is already taken."))
      .not.toBeInTheDocument();
  });

  it("BAD_REQUEST mostra a mensagem no campo do nome", async () => {
    createTeam.mockRejectedValue(withCode("BAD_REQUEST", "Name is not allowed"));
    const screen = await render(<Harness />);

    await nameField(screen).fill("Platform");
    await submit(screen).click();

    await expect.element(screen.getByText("Name is not allowed")).toBeVisible();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/new");
  });

  it("outro erro mostra o toast Could not create team", async () => {
    createTeam.mockRejectedValue(new Error("network"));
    const screen = await render(<Harness />);

    await nameField(screen).fill("Platform");
    await submit(screen).click();

    await expect.element(screen.getByText("Could not create team")).toBeVisible();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/teams/new");
  });

  it.each(["dark", "light"] as const)("não tem violações axe no tema %s", async (theme) => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(<Harness />);
    await expect.element(nameField(screen)).toBeVisible();

    const root = document.querySelector("main");
    if (!root) throw new Error("main não encontrado");
    expect(await axeViolations(root)).toEqual([]);
  });
});
