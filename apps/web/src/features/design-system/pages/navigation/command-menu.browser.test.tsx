/**
 * Testes de navegador da página /design-system/navigation/command-menu: o catálogo inteiro do
 * Linear (kit/command-catalog) dentro do CommandMenu real (cmdk num Dialog), nos dois temas.
 */
import axe from "axe-core";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "@/index.css";
import { DesignSystemApp } from "../..";
import { FOCUS_CHIP } from "../../kit/command-catalog";

const PATH = "/design-system/navigation/command-menu";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/design-system/*" element={<DesignSystemApp />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function violations(root: Element) {
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => {})),
  );
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

type Screen = Awaited<ReturnType<typeof renderAt>>;

/** Abre o menu pelo botão "Command menu" do playground (a página é longa; evita rolar até ela). */
async function openMenu(screen: Screen) {
  await screen.getByRole("button", { name: "Command menu" }).click();
  return {
    dialog: screen.getByRole("dialog", { name: "Command menu" }),
    search: screen.getByRole("combobox", { name: "Command menu" }),
  };
}

describe.each(["dark", "light"] as const)("Command Menu (⌘K) no tema %s", (theme) => {
  it("a busca encontra itens de grupos diferentes e a busca profunda das páginas de valor", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await renderAt(PATH);
    const { dialog, search } = await openMenu(screen);

    await search.fill("inbox");
    await expect.element(dialog.getByRole("option", { name: /^Go to inbox/ })).toBeVisible();

    await search.fill("theme");
    await expect
      .element(dialog.getByRole("option", { name: "Change interface theme…", exact: true }))
      .toBeVisible();

    await search.fill("dark");
    await expect
      .element(dialog.getByRole("option", { name: /^Change interface theme › ?Dark/ }))
      .toBeVisible();
  });

  it("navega para uma página e volta ao início com Backspace", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await renderAt(PATH);
    const { dialog, search } = await openMenu(screen);

    await dialog.getByRole("option", { name: /^Open settings…/ }).click();
    await expect.element(search).toHaveAttribute("placeholder", "Open settings…");
    await expect.element(dialog.getByText("Open settings", { exact: true })).toBeVisible();
    await expect
      .element(dialog.getByRole("option", { name: "Preferences", exact: true }))
      .toBeVisible();

    await search.click();
    await userEvent.keyboard("{Backspace}");
    await expect
      .element(dialog.getByText("Open settings", { exact: true }))
      .not.toBeInTheDocument();
    await expect.element(dialog.getByRole("option", { name: /^Create new issue…/ })).toBeVisible();
  });

  it("navega duas páginas aninhadas e volta nível a nível com Backspace", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await renderAt(PATH);
    const { dialog, search } = await openMenu(screen);

    await dialog.getByRole("option", { name: "Display options…", exact: true }).click();
    await expect.element(search).toHaveAttribute("placeholder", "Display options…");

    await dialog.getByRole("option", { name: /^Grouping…/ }).click();
    await expect.element(search).toHaveAttribute("placeholder", "Group by…");
    await expect.element(dialog.getByText("Display options", { exact: true })).toBeVisible();
    await expect.element(dialog.getByText("Grouping", { exact: true })).toBeVisible();
    await expect
      .element(dialog.getByRole("option", { name: "Focus", exact: true }))
      .toHaveAttribute("aria-checked", "true");

    await search.click();
    await userEvent.keyboard("{Backspace}");
    await expect.element(search).toHaveAttribute("placeholder", "Display options…");
    await expect.element(dialog.getByText("Grouping", { exact: true })).not.toBeInTheDocument();
    await expect.element(dialog.getByRole("option", { name: /^Grouping…/ })).toBeVisible();

    await search.click();
    await userEvent.keyboard("{Backspace}");
    await expect.element(search).toHaveAttribute("placeholder", "Type a command or search…");
    await expect.element(dialog.getByRole("option", { name: /^Create new issue…/ })).toBeVisible();
  });

  it("mostra os atalhos em <kbd>: sequência (then) e combinação (plus)", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await renderAt(PATH);
    const { dialog } = await openMenu(screen);

    const inbox = dialog.getByRole("option", { name: /^Go to inbox/ });
    await expect.element(inbox).toBeVisible();
    const inboxKeys = [...inbox.element().querySelectorAll("kbd")].map((k) => k.textContent);
    expect(inboxKeys).toEqual(["G", "I"]);

    // "Open sidebar details" só existe no contexto "My issues" (view).
    const sidebar = dialog.getByRole("option", { name: /^Open sidebar details/ });
    await expect.element(sidebar).toBeVisible();
    const sidebarKeys = [...sidebar.element().querySelectorAll("kbd")].map((k) => k.textContent);
    expect(sidebarKeys).toEqual(["Ctrl", "I"]);
  });

  it("contexto da issue: aria-checked no valor atual e execução mostra a última ação", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await renderAt(PATH);
    await screen.getByRole("radio", { name: "ZYN-45 aberta" }).click();
    const { dialog } = await openMenu(screen);

    await expect.element(dialog.getByText(FOCUS_CHIP, { exact: true })).toBeVisible();

    await dialog.getByRole("option", { name: /^Change status…/ }).click();
    await expect
      .element(dialog.getByRole("option", { name: "In Review", exact: true }))
      .toHaveAttribute("aria-checked", "true");

    await dialog.getByRole("option", { name: "In Review", exact: true }).click();
    await expect.element(screen.getByText("Última ação: Change status: In Review")).toBeVisible();
  });

  it("o chip da issue aberta não sai com Backspace na página inicial", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await renderAt(PATH);
    await screen.getByRole("radio", { name: "ZYN-45 aberta" }).click();
    const { dialog, search } = await openMenu(screen);

    await expect.element(dialog.getByText(FOCUS_CHIP, { exact: true })).toBeVisible();
    await search.click();
    await userEvent.keyboard("{Backspace}");
    await expect.element(dialog.getByText(FOCUS_CHIP, { exact: true })).toBeVisible();
    await expect.element(dialog.getByRole("option", { name: /^Assign to…/ })).toBeVisible();
  });

  it("axe sem violações no Dialog aberto, na página inicial e numa página", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await renderAt(PATH);
    const { dialog } = await openMenu(screen);
    expect(await violations(dialog.element())).toEqual([]);

    await dialog.getByRole("option", { name: /^Open settings…/ }).click();
    expect(await violations(dialog.element())).toEqual([]);
  });
});
