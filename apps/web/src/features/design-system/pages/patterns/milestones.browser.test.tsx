/**
 * Testes de teclado e foco do padrão Milestones: o menu "…" de cada linha (fora da role="option",
 * de propósito — ver comentário em milestones.tsx), o submenu Copy, a navegação por seta/Home/End
 * da lista (smoke test — a navegação em si é do IssueList, já testada em selection.browser.test.tsx)
 * e o formulário "+ Add milestone". A página repete a lista e os gatilhos em Estados/Temas (template
 * PatternPage); os testes escopam sempre a instância "Ao vivo" (a primeira do template, `.first()`).
 */
import axe from "axe-core";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "@/index.css";
import { DesignSystemApp } from "../../index";

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
  await Promise.all(root.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

type Screen = Awaited<ReturnType<typeof renderAt>>;

const PATH = "/design-system/patterns/milestones";

/** A lista "Ao vivo" é sempre a primeira do template PatternPage: `.first()` pega a lista
 * interativa (rótulo "Milestones"), não as duas cópias completas da seção Temas. As linhas
 * estáticas da seção Estados usam o rótulo "Milestone {nome}" (singular), sem colisão. */
function liveList(screen: Screen) {
  return screen.getByRole("listbox", { name: "Milestones" }).first();
}
/** O botão "…" de "Private alpha" (primeira linha do vivo): também existe 1x em Estados
 * ("concluído") e 2x em Temas, sempre depois do vivo no DOM — `.first()` pega o do vivo. */
function liveMenuTrigger(screen: Screen) {
  return screen.getByRole("button", { name: /^Milestone actions: Private alpha/ }).first();
}
/** O gatilho "+ Add milestone" funcional: também existe (não funcional) no EmptyState de Estados
 * e 2x em Temas, sempre depois do vivo no DOM — `.first()` pega o do vivo. */
function liveAddMilestoneTrigger(screen: Screen) {
  return screen.getByRole("button", { name: "Add milestone" }).first();
}

describe('Milestones: menu "…"', () => {
  it("abre por clique e fecha com Esc, devolvendo o foco ao gatilho", async () => {
    const screen = await renderAt(PATH);
    const trigger = liveMenuTrigger(screen);
    await trigger.click();

    const menu = screen.getByRole("menu");
    await expect.element(menu).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("abre com Enter e com Espaço quando o gatilho está focado", async () => {
    const screen = await renderAt(PATH);
    const trigger = liveMenuTrigger(screen);

    trigger.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByRole("menu")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();

    trigger.element().focus();
    await userEvent.keyboard(" ");
    await expect.element(screen.getByRole("menu")).toBeVisible();
  });

  it("o submenu Copy abre com seta direita e seus itens são alcançáveis", async () => {
    const screen = await renderAt(PATH);
    const trigger = liveMenuTrigger(screen);
    await trigger.click();

    const menu = screen.getByRole("menu");
    await userEvent.keyboard("{ArrowDown}"); // Edit…
    await userEvent.keyboard("{ArrowDown}"); // Edit target date…
    await userEvent.keyboard("{ArrowDown}"); // Copy (gatilho do submenu)
    const copyTrigger = menu.getByRole("menuitem", { name: "Copy" });
    await expect.element(copyTrigger).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    const copyLink = screen.getByRole("menuitem", { name: "Copy link", exact: true });
    await expect.element(copyLink).toBeVisible();
    await expect.element(screen.getByRole("menuitem", { name: "Copy name as link" })).toBeVisible();
    await expect
      .element(screen.getByRole("menuitem", { name: "Copy link to issues" }))
      .toBeVisible();

    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByText("Copy link", { exact: true }).first()).toBeVisible();
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  });
});

describe("Milestones: navegação da lista (smoke)", () => {
  it("↑ ↓ Home End navegam entre as linhas", async () => {
    const screen = await renderAt(PATH);
    const list = liveList(screen);
    const first = list.getByRole("option", { name: /Private alpha/ });
    const second = list.getByRole("option", { name: /Beta launch/ });
    const last = list.getByRole("option", { name: /Public release/ });

    await first.click();
    await expect.element(first).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(second).toHaveFocus();

    await userEvent.keyboard("{End}");
    await expect.element(last).toHaveFocus();

    await userEvent.keyboard("{Home}");
    await expect.element(first).toHaveFocus();
  });
});

describe('Milestones: formulário "+ Add milestone"', () => {
  it("abre com o foco no campo Name; nome vazio mantém Add milestone desabilitado", async () => {
    const screen = await renderAt(PATH);
    const trigger = liveAddMilestoneTrigger(screen);
    await trigger.click();

    const form = screen.getByRole("form", { name: "New milestone" });
    const name = form.getByRole("textbox", { name: "Name" });
    await expect.element(name).toHaveFocus();

    const submit = form.getByRole("button", { name: "Add milestone" });
    await expect.element(submit).toBeDisabled();

    await name.fill("Docs launch");
    await expect.element(submit).toBeEnabled();
  });

  it("Esc fecha o formulário e devolve o foco ao gatilho", async () => {
    const screen = await renderAt(PATH);
    const trigger = liveAddMilestoneTrigger(screen);
    await trigger.click();

    const form = screen.getByRole("form", { name: "New milestone" });
    await expect.element(form).toBeVisible();
    await userEvent.keyboard("{Escape}");

    await expect.element(form).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("Cancel fecha o formulário e devolve o foco ao gatilho", async () => {
    const screen = await renderAt(PATH);
    const trigger = liveAddMilestoneTrigger(screen);
    await trigger.click();

    const form = screen.getByRole("form", { name: "New milestone" });
    await form.getByRole("button", { name: "Cancel" }).click();

    await expect.element(form).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });
});

describe.each(["dark", "light"] as const)(
  "Milestones no tema %s: acessibilidade com o menu aberto",
  (theme) => {
    it('sem violações axe com o menu "…" aberto', async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await renderAt(PATH);
      const trigger = liveMenuTrigger(screen);
      await trigger.click();

      const menu = screen.getByRole("menu");
      await expect.element(menu).toBeVisible();
      expect(await violations(menu.element())).toEqual([]);
    });
  },
);
