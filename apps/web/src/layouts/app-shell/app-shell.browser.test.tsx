/**
 * Interação do App Shell (Fase 8, VYZ-35), num Chromium real: atalhos globais ("[", "]", Ctrl/⌘+I),
 * redimensionamento da sidebar por ponteiro, gaveta mobile (Radix Dialog) e roving tabindex na
 * navegação (Fase 5). Testa os componentes reais de `@/layouts/app-shell` dentro do próprio
 * `AppShell`, não a página de documentação — ela tem sua própria cobertura de acessibilidade em
 * `features/design-system/design-system.browser.test.tsx`.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { AppShell } from "./index";
import { AppShellProvider } from "./context";
import { RightPanel } from "./right-panel";
import { NavItem, NavList } from "./sidebar-nav";

const WIDTH_KEY = "vyzer:sidebar:width";
const COLLAPSED_KEY = "vyzer:sidebar:collapsed";

/**
 * A mesma composição de `/projects`: AppShell de verdade + RightPanel na página, com o
 * ToastProvider que o app monta em `main.tsx` (o diálogo de criar issue usa `useToast`).
 */
function ShellHarness({ initialEntries = ["/projects"] }: { initialEntries?: string[] }) {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route
              path="projects"
              element={
                <>
                  <button type="button">Main content</button>
                  <RightPanel label="Project details">
                    <p>Details</p>
                  </RightPanel>
                </>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(async () => {
  localStorage.clear();
  // O viewport inicial do provider de browser é de celular; a maioria dos testes aqui é desktop
  // (tablet: 768 px+) — a gaveta mobile muda para o seu próprio viewport explicitamente.
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe.each(["dark", "light"] as const)("Atalhos globais do shell no tema %s", (theme) => {
  it('"[" recolhe a sidebar (o rail some) e expande de volta', async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(<ShellHarness />);
    const rail = screen.getByRole("navigation", { name: "Sidebar do workspace" });
    await expect.element(rail).toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Expand sidebar" }))
      .not.toBeInTheDocument();

    await userEvent.keyboard("[[]");
    await expect.element(rail).not.toBeInTheDocument();
    const expandButton = screen.getByRole("button", { name: "Expand sidebar" });
    await expect.element(expandButton).toBeVisible();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe("1");

    await userEvent.keyboard("[[]");
    await expect
      .element(screen.getByRole("navigation", { name: "Sidebar do workspace" }))
      .toBeInTheDocument();
    await expect.element(expandButton).not.toBeInTheDocument();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe("0");
  });

  it('"]" e Ctrl/⌘+I abrem e fecham o painel direito, como sinônimos', async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(<ShellHarness />);
    const panel = () => screen.getByRole("complementary", { name: "Project details" });
    await expect.element(panel()).not.toBeInTheDocument();

    await userEvent.keyboard("]");
    await expect.element(panel()).toBeInTheDocument();

    await userEvent.keyboard("{Control>}i{/Control}");
    await expect.element(panel()).not.toBeInTheDocument();

    await userEvent.keyboard("{Meta>}i{/Meta}");
    await expect.element(panel()).toBeInTheDocument();

    await userEvent.keyboard("]");
    await expect.element(panel()).not.toBeInTheDocument();
  });
});

describe("Redimensionamento da sidebar por ponteiro", () => {
  function handleOf(rail: HTMLElement) {
    const handle = rail.querySelector<HTMLElement>(".cursor-col-resize");
    if (!handle) throw new Error("Alça de redimensionar não encontrada");
    return handle;
  }

  function drag(handle: HTMLElement, clientX: number) {
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerId: 1, clientX: 0 }),
    );
    window.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX }));
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
  }

  it("arrasta dentro de 200–360 px e persiste em localStorage sob a chave vyzer:sidebar:*", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ShellHarness />);
    const railLocator = screen.getByRole("navigation", { name: "Sidebar do workspace" });
    const rail = railLocator.element() as HTMLElement;
    expect(rail.getBoundingClientRect().width).toBe(244);

    drag(handleOf(rail), 50);
    await expect.element(railLocator).toHaveStyle({ width: "294px" });
    expect(localStorage.getItem(WIDTH_KEY)).toBe("294");

    drag(handleOf(rail), 1000);
    await expect.element(railLocator).toHaveStyle({ width: "360px" });
    expect(localStorage.getItem(WIDTH_KEY)).toBe("360");

    drag(handleOf(rail), -1000);
    await expect.element(railLocator).toHaveStyle({ width: "200px" });
    expect(localStorage.getItem(WIDTH_KEY)).toBe("200");
  });

  it("a alça não é um alvo de teclado; recolher continua 100% por teclado", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ShellHarness />);
    const rail = screen.getByRole("navigation", { name: "Sidebar do workspace" }).element();
    const handle = handleOf(rail as HTMLElement);
    expect(handle.hasAttribute("tabindex")).toBe(false);
    expect(handle.getAttribute("role")).toBeNull();
    expect(handle.getAttribute("aria-hidden")).toBe("true");

    await userEvent.keyboard("[[]");
    await expect
      .element(screen.getByRole("navigation", { name: "Sidebar do workspace" }))
      .not.toBeInTheDocument();
  });
});

describe("Gaveta mobile (abaixo de tablet: 768 px)", () => {
  it("abre pelo botão, prende o foco dentro e fecha com Esc devolvendo o foco ao gatilho", async () => {
    await page.viewport(375, 800);
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ShellHarness />);
    const openButton = screen.getByRole("button", { name: "Open sidebar" });
    await expect.element(openButton).toBeVisible();

    await openButton.click();
    const dialog = screen.getByRole("dialog", { name: "Sidebar do workspace" });
    await expect.element(dialog).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Search workspace" })).toBeVisible();

    for (let i = 0; i < 15; i++) await userEvent.tab();
    expect(dialog.element().contains(document.activeElement)).toBe(true);

    await userEvent.keyboard("{Escape}");
    await expect.element(dialog).not.toBeInTheDocument();
    await expect.element(openButton).toHaveFocus();
  });
});

describe("Roving tabindex na navegação da sidebar (Fase 5)", () => {
  function NavListHarness() {
    return (
      <MemoryRouter initialEntries={["/a"]}>
        <div>
          <button type="button">Before</button>
          <NavList label="Nav de teste">
            <NavItem to="/a" icon={<span />}>
              Item A
            </NavItem>
            <NavItem to="/b" icon={<span />}>
              Item B
            </NavItem>
            <NavItem to="/c" icon={<span />}>
              Item C
            </NavItem>
          </NavList>
          <button type="button">After</button>
        </div>
      </MemoryRouter>
    );
  }

  it("Tab entra na lista uma vez, setas movem o foco dentro do grupo e Enter ativa o item", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<NavListHarness />);
    const items = ["Item A", "Item B", "Item C"].map((name) => screen.getByRole("link", { name }));

    await userEvent.tab();
    await expect.element(screen.getByRole("button", { name: "Before" })).toHaveFocus();
    await userEvent.tab();
    await expect.element(items[0]!).toHaveFocus();
    expect(items.map((item) => item.element().tabIndex)).toEqual([0, -1, -1]);

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(items[1]!).toHaveFocus();
    expect(items.map((item) => item.element().tabIndex)).toEqual([-1, 0, -1]);

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(items[2]!).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect.element(items[2]!).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect.element(items[0]!).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(items[1]!).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(items[1]!).toHaveAttribute("aria-current", "page");

    await userEvent.tab();
    await expect.element(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });
});

describe("Atalhos ignoram alvos de digitação", () => {
  it('"[" não recolhe a sidebar com o foco no campo de busca do Command Menu', async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ShellHarness />);
    await userEvent.keyboard("{Control>}k{/Control}");
    const search = screen.getByRole("combobox", { name: "Command menu" });
    await expect.element(search).toHaveFocus();

    // O Command Menu é modal: enquanto aberto, o resto da página (inclusive a sidebar) fica
    // aria-hidden de propósito (Radix), então a verificação aqui é no DOM puro, não por role.
    await userEvent.keyboard("[[]");
    expect(document.querySelector('nav[aria-label="Sidebar do workspace"]')).not.toBeNull();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBeNull();

    await userEvent.keyboard("{Escape}");
  });

  it('"[" não recolhe a sidebar com o foco no diálogo de criar issue', async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ShellHarness />);
    await userEvent.keyboard("c");
    const titleField = screen.getByRole("textbox", { name: "Issue title" });
    await expect.element(titleField).toBeVisible();
    await titleField.click();

    // Mesma observação: o diálogo de criar issue também é modal (sidebar fica aria-hidden).
    await userEvent.keyboard("[[]");
    expect(document.querySelector('nav[aria-label="Sidebar do workspace"]')).not.toBeNull();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBeNull();
  });
});

describe("AppShellProvider: estado inicial explícito ignora localStorage", () => {
  it("defaultRightPanelOpen abre o painel sem precisar do atalho", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(
      <MemoryRouter>
        <AppShellProvider defaultRightPanelOpen shortcuts={false}>
          <RightPanel label="Project details">
            <p>Details</p>
          </RightPanel>
        </AppShellProvider>
      </MemoryRouter>,
    );
    await expect
      .element(screen.getByRole("complementary", { name: "Project details" }))
      .toBeInTheDocument();
  });
});
