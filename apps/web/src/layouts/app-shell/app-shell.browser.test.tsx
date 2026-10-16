/**
 * Interação do App Shell (Unifie Refinement):
 * - Barra lateral única (276 px)
 * - Padrão expandido sem preferência salva, persistência do estado em localStorage ("0" expandido, "1" recolhido)
 * - Atalho "[" alterna entre recolhido e expandido
 * - Ações de busca (⌘K), criação de issue ("c") e navegação
 * - Cabeçalho com ações rápidas (criar issue, busca, menu de 3 pontinhos)
 * - Gaveta mobile abaixo de tablet (Radix Dialog)
 * - Atalhos globais ignoram alvos de digitação
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import { AppShell } from "./index";
import { AppShellProvider } from "./context";
import { RightPanel } from "./right-panel";
import { NavItem, NavList } from "./sidebar-nav";

const COLLAPSED_KEY = "zynox:sidebar:collapsed";

function LocationProbe() {
  return <output aria-label="Current URL">{useLocation().pathname}</output>;
}

function ShellHarness({ initialEntries = ["/projects"] }: { initialEntries?: string[] }) {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationProbe />
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
            <Route path="settings" element={<p>Settings page</p>} />
            <Route path="*" element={<p>Page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(async () => {
  localStorage.clear();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("Padrão de expansão e persistência da sidebar", () => {
  it("sem preferência salva, a sidebar inicia expandida", async () => {
    const screen = await render(<ShellHarness />);
    const sidebar = screen.getByRole("navigation", { name: "Sidebar do workspace" });
    await expect.element(sidebar).toBeInTheDocument();
  });

  it('"[" alterna entre expandido e recolhido e grava "1" e "0" no localStorage', async () => {
    const screen = await render(<ShellHarness />);
    const sidebar = () => screen.getByRole("navigation", { name: "Sidebar do workspace" });
    await expect.element(sidebar()).toBeInTheDocument();

    // 1º atalho: recolhe a sidebar
    await userEvent.keyboard("[[]");
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe("1");
    const expandButton = screen.getByRole("button", { name: "Expand sidebar" });
    await expect.element(expandButton).toBeVisible();

    // 2º atalho: expande a sidebar novamente
    await userEvent.keyboard("[[]");
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe("0");
    await expect.element(sidebar()).toBeInTheDocument();
  });

  it("iniciar com localStorage='1' abre a sidebar recolhida", async () => {
    localStorage.setItem(COLLAPSED_KEY, "1");
    const screen = await render(<ShellHarness />);
    const expandButton = screen.getByRole("button", { name: "Expand sidebar" });
    await expect.element(expandButton).toBeVisible();
  });
});

describe("Ações e navegação", () => {
  it("atalho de busca (⌘K) abre o Command Menu e 'c' abre diálogo de criar issue", async () => {
    const screen = await render(<ShellHarness />);
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect.element(screen.getByRole("combobox", { name: "Command menu" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect
      .element(screen.getByRole("combobox", { name: "Command menu" }))
      .not.toBeInTheDocument();

    await userEvent.keyboard("c");
    await expect.element(screen.getByRole("dialog", { name: "Create new issue" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
  });

  it("Settings na sidebar navega para /settings", async () => {
    const screen = await render(<ShellHarness />);
    const settingsLink = screen.getByRole("link", { name: "Settings" });
    await settingsLink.click();
    await expect.element(page.getByLabelText("Current URL")).toHaveTextContent("/settings");
  });
});

describe("Opções do workspace e atalhos do cabeçalho", () => {
  it("renderiza opções do cabeçalho e abre menu com opções de Workspace e Membros", async () => {
    const screen = await render(<ShellHarness />);
    const moreBtn = screen.getByRole("button", { name: "Workspace options" });
    await expect.element(moreBtn).toBeVisible();

    await moreBtn.click();
    await expect.element(screen.getByRole("menuitem", { name: "Profile settings" })).toBeVisible();
    await expect(screen.getByRole("menuitem", { name: "Workspace settings" })).toBeVisible();
    await expect.element(screen.getByRole("menuitem", { name: "Invite people" })).toBeVisible();
  });
});

describe("Painel direito e atalhos", () => {
  it('"]" e Ctrl/⌘+I abrem e fecham o painel direito, como sinônimos', async () => {
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
    localStorage.setItem(COLLAPSED_KEY, "0");
    const screen = await render(<ShellHarness />);
    await userEvent.keyboard("{Control>}k{/Control}");
    const search = screen.getByRole("combobox", { name: "Command menu" });
    await expect.element(search).toHaveFocus();

    await userEvent.keyboard("[[]");
    expect(document.querySelector('nav[aria-label="Sidebar do workspace"]')).not.toBeNull();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe("0");

    await userEvent.keyboard("{Escape}");
  });

  it('"[" não recolhe a sidebar com o foco no diálogo de criar issue', async () => {
    localStorage.setItem(COLLAPSED_KEY, "0");
    const screen = await render(<ShellHarness />);
    await userEvent.keyboard("c");
    const titleField = screen.getByRole("textbox", { name: "Issue title" });
    await expect.element(titleField).toBeVisible();
    await titleField.click();

    await userEvent.keyboard("[[]");
    expect(document.querySelector('nav[aria-label="Sidebar do workspace"]')).not.toBeNull();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe("0");
  });
});

describe("AppShellProvider: estado inicial explícito ignora localStorage", () => {
  it("defaultRightPanelOpen abre o painel sem precisar do atalho", async () => {
    const screen = await render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/"]}>
          <AppShellProvider defaultRightPanelOpen={true}>
            <RightPanel label="Painel padrão">
              <p>Conteúdo</p>
            </RightPanel>
          </AppShellProvider>
        </MemoryRouter>
      </ToastProvider>,
    );

    await expect
      .element(screen.getByRole("complementary", { name: "Painel padrão" }))
      .toBeInTheDocument();
  });
});
