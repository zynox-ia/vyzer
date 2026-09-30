/**
 * Menu "···" da linha de Team na sidebar (spec `settings-administration.md`, 2.3), num Chromium
 * real: o botão "Team menu" é irmão do gatilho que recolhe o grupo, aparece no hover/foco/aberto,
 * abre com teclado, tem só Team settings e Copy URL, navega, copia o link e não passa em branco
 * pelo axe. Monta o `AppShell` de verdade (a sidebar usa os Teams de exemplo de `project-data`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import axe from "axe-core";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { AppShell } from "./index";

function LocationProbe() {
  const { pathname } = useLocation();
  return <output data-testid="location">{pathname}</output>;
}

function Harness() {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={["/projects"]}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="*" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

const menuButtons = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[aria-label="Team menu"]'));
/** Escopo na lista "Your teams": o gatilho do WorkspaceMenu também se chama "Zynox". */
const zynoxTrigger = (screen: { getByRole: typeof page.getByRole }) =>
  screen
    .getByRole("list", { name: "Your teams" })
    .getByRole("button", { name: "Zynox", exact: true });
const opacity = (el: Element) => Number(getComputedStyle(el).opacity);
const teamTrigger = (name: string) => {
  const el = Array.from(document.querySelectorAll<HTMLElement>("button[data-nav-item]")).find(
    (b) => b.textContent?.trim() === name,
  );
  if (!el) throw new Error(`Gatilho do time ${name} não encontrado`);
  return el;
};

beforeEach(async () => {
  localStorage.clear();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("Team menu na sidebar", () => {
  it("cada Team tem um botão Team menu, irmão do gatilho, de ~24×24 e totalmente redondo", async () => {
    const screen = await render(<Harness />);
    await expect.element(zynoxTrigger(screen)).toBeVisible();

    const buttons = menuButtons();
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.closest("button[data-nav-item]")).toBeNull();
      const rect = button.getBoundingClientRect();
      expect(Math.abs(rect.width - 24)).toBeLessThanOrEqual(1);
      expect(Math.abs(rect.height - 24)).toBeLessThanOrEqual(1);
      expect(parseFloat(getComputedStyle(button).borderRadius)).toBeGreaterThanOrEqual(12);
    }
  });

  it("fica invisível por padrão e aparece com hover na linha, foco nele e menu aberto", async () => {
    const screen = await render(<Harness />);
    await expect.element(zynoxTrigger(screen)).toBeVisible();
    const [zynoxMenu, vyzerMenu] = menuButtons() as [HTMLElement, HTMLElement];

    expect(opacity(zynoxMenu)).toBe(0);
    expect(opacity(vyzerMenu)).toBe(0);

    await userEvent.hover(teamTrigger("Zynox"));
    await vi.waitFor(() => expect(opacity(zynoxMenu)).toBe(1));
    expect(opacity(vyzerMenu)).toBe(0);

    await userEvent.unhover(teamTrigger("Zynox"));
    await vi.waitFor(() => expect(opacity(zynoxMenu)).toBe(0));

    vyzerMenu.focus();
    await vi.waitFor(() => expect(opacity(vyzerMenu)).toBe(1));
    vyzerMenu.blur();
    await vi.waitFor(() => expect(opacity(vyzerMenu)).toBe(0));

    // Por Tab: do gatilho do time o próximo foco é o "···" da mesma linha.
    teamTrigger("Zynox").focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(zynoxMenu);
    await vi.waitFor(() => expect(opacity(zynoxMenu)).toBe(1));

    // Aberto, continua visível mesmo sem hover nem foco na linha.
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("menu")).toBeVisible();
    // (o mouse já saiu da linha e o foco foi para dentro do menu.)
    expect(zynoxMenu.matches(":hover")).toBe(false);
    expect(document.activeElement).not.toBe(zynoxMenu);
    expect(opacity(zynoxMenu)).toBe(1);
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Espaço", " "],
  ])("abre com %s, mostra só 2 itens e Esc fecha devolvendo o foco", async (_label, key) => {
    const screen = await render(<Harness />);
    await expect.element(zynoxTrigger(screen)).toBeVisible();
    const button = menuButtons()[0]!;

    button.focus();
    await userEvent.keyboard(key);
    const menu = page.getByRole("menu");
    await expect.element(menu).toBeVisible();

    const items = menu.getByRole("menuitem").elements();
    expect(items.map((el) => el.textContent?.trim())).toEqual(["Team settings", "Copy URL"]);
    for (const absent of ["Favorite", "Open archive", "Archive", "Subscribe", "Slack", "Leave"]) {
      expect(document.body.textContent).not.toContain(`${absent} team`);
      expect(items.some((el) => el.textContent?.includes(absent))).toBe(false);
    }

    await userEvent.keyboard("{Escape}");
    await expect.element(menu).not.toBeInTheDocument();
    await vi.waitFor(() => expect(document.activeElement).toBe(button));
  });

  it("abre com clique", async () => {
    const screen = await render(<Harness />);
    await expect.element(zynoxTrigger(screen)).toBeVisible();
    await userEvent.click(menuButtons()[1]!);
    await expect.element(page.getByRole("menuitem", { name: "Team settings" })).toBeVisible();
    await expect.element(page.getByRole("menuitem", { name: "Copy URL" })).toBeVisible();
  });

  it("Team settings navega para /settings/teams/<slug>", async () => {
    const screen = await render(<Harness />);
    await expect.element(screen.getByTestId("location")).toHaveTextContent("/projects");

    await userEvent.click(menuButtons()[1]!);
    await page.getByRole("menuitem", { name: "Team settings" }).click();

    await expect.element(screen.getByTestId("location")).toHaveTextContent("/settings/teams/vyzer");
  });

  it("Copy URL escreve o link do Team no clipboard e mostra o toast", async () => {
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const screen = await render(<Harness />);
    await expect.element(zynoxTrigger(screen)).toBeVisible();

    await userEvent.click(menuButtons()[0]!);
    await page.getByRole("menuitem", { name: "Copy URL" }).click();

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/teams/zynox`);
    await expect.element(screen.getByText("Link copied")).toBeVisible();
  });

  it("Copy URL mostra o erro quando o clipboard rejeita", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    const screen = await render(<Harness />);
    await expect.element(zynoxTrigger(screen)).toBeVisible();

    await userEvent.click(menuButtons()[0]!);
    await page.getByRole("menuitem", { name: "Copy URL" }).click();

    await expect.element(screen.getByText("Could not copy link")).toBeVisible();
  });

  it("clicar no botão do time ainda recolhe e expande o grupo", async () => {
    const screen = await render(<Harness />);
    const trigger = zynoxTrigger(screen);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    const links = () => Array.from(document.querySelectorAll('a[href="/teams/zynox/issues"]'));
    expect(links()).toHaveLength(1);

    await trigger.click();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await vi.waitFor(() => expect(links()).toHaveLength(0));

    await trigger.click();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await vi.waitFor(() => expect(links()).toHaveLength(1));
  });

  it("não tem violações axe com o menu aberto", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<Harness />);
    await expect.element(zynoxTrigger(screen)).toBeVisible();
    await userEvent.click(menuButtons()[0]!);
    await expect.element(page.getByRole("menu")).toBeVisible();
    // Espera o fim da animação de entrada antes de medir contraste.
    await new Promise((resolve) => setTimeout(resolve, 300));

    const result = await axe.run(page.getByRole("menu").element(), {
      resultTypes: ["violations"],
      // Escopo no menu (como o teste de Milestones): o Radix esconde o resto da página com
      // aria-hidden enquanto ele está aberto; e num portal a regra de região não se aplica.
      rules: { region: { enabled: false } },
    });
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
});
