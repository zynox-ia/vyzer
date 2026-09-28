/** Testes de teclado, foco, confirmação e acessibilidade do Creation Composer. */
import axe from "axe-core";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "@/index.css";
import { DesignSystemApp } from "../../index";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/design-system/forms/creation-composer"]}>
      <Routes>
        <Route path="/design-system/*" element={<DesignSystemApp />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function accessibilityViolations() {
  const result = await axe.run(document.body, { resultTypes: ["violations"] });
  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} → ${violation.nodes
        .map((node) => `${node.target.join(" ")} ${node.failureSummary ?? ""}`)
        .join(" | ")}`,
  );
}

async function fillComposer(screen: Awaited<ReturnType<typeof renderPage>>, name = "Roadmap") {
  await screen
    .getByRole("form", { name: "New view", exact: true })
    .getByRole("textbox", { name: "View name" })
    .fill(name);
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("Creation Composer: teclado e foco", () => {
  it("não rouba o foco ao carregar; Cancel fecha e o chip reabre com foco no nome", async () => {
    const screen = await renderPage();
    const form = screen.getByRole("form", { name: "New view", exact: true });
    const name = form.getByRole("textbox", { name: "View name" });
    const trigger = screen.getByRole("button", { name: "New view", exact: true });

    await expect.element(form).toBeVisible();
    expect(document.activeElement).not.toBe(name.element());

    await form.getByRole("button", { name: "Cancel" }).click();
    await expect.element(form).not.toBeInTheDocument();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect.element(name).toHaveFocus();
  });

  it("Enter no nome move o foco para a descrição", async () => {
    const screen = await renderPage();
    const form = screen.getByRole("form", { name: "New view", exact: true });
    const name = form.getByRole("textbox", { name: "View name" });
    const description = form.getByRole("textbox", { name: "Description" });

    await userEvent.click(name);
    await userEvent.keyboard("{Enter}");

    await expect.element(description).toHaveFocus();
  });

  it.each([
    { key: "Control+Enter", field: "name" },
    { key: "Meta+Enter", field: "name" },
    { key: "Control+Enter", field: "description" },
    { key: "Meta+Enter", field: "description" },
  ])("$key no campo $field confirma, anuncia e devolve o foco ao chip", async ({ key, field }) => {
    const screen = await renderPage();
    await fillComposer(screen);
    const form = screen.getByRole("form", { name: "New view", exact: true });
    const input = form.getByRole("textbox", {
      name: field === "name" ? "View name" : "Description",
    });
    const trigger = screen.getByRole("button", { name: "New view", exact: true });

    await userEvent.click(input);
    await userEvent.keyboard(
      key === "Control+Enter" ? "{Control>}{Enter}{/Control}" : "{Meta>}{Enter}{/Meta}",
    );

    await expect
      .element(screen.getByRole("form", { name: "New view", exact: true }))
      .not.toBeInTheDocument();
    await expect.element(screen.getByText("View “Roadmap” created")).toBeVisible();
    await expect.element(trigger).toHaveFocus();
  });

  it.each([
    { target: "nome", focusTarget: "View name" },
    { target: "botão do cartão", focusTarget: "Create view" },
  ])("Esc no $target cancela e devolve o foco ao chip", async ({ focusTarget }) => {
    const screen = await renderPage();
    await fillComposer(screen);
    const form = screen.getByRole("form", { name: "New view", exact: true });
    const scopedTarget = form.getByRole(focusTarget === "View name" ? "textbox" : "button", {
      name: focusTarget,
      exact: true,
    });
    const trigger = screen.getByRole("button", { name: "New view", exact: true });

    await userEvent.click(scopedTarget);
    await userEvent.keyboard("{Escape}");

    await expect
      .element(screen.getByRole("form", { name: "New view", exact: true }))
      .not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it.each([
    { trigger: "Add filter", panel: "Add Filter" },
    { trigger: "Display options", panel: "Display options" },
    { trigger: "Choose icon", panel: "Project icon" },
  ])("Esc fecha só o popover $trigger", async ({ trigger: triggerName, panel }) => {
    const screen = await renderPage();
    const form = screen.getByRole("form", { name: "New view", exact: true });
    const trigger = form.getByRole("button", { name: triggerName, exact: true });
    await trigger.click();
    const popover = screen.getByRole("dialog", { name: panel });
    await expect.element(popover).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(popover).not.toBeInTheDocument();
    await expect.element(screen.getByRole("form", { name: "New view", exact: true })).toBeVisible();
  });

  it("desabilita Create view com nome vazio ou em branco e ignora Ctrl+Enter vazio", async () => {
    const screen = await renderPage();
    const form = screen.getByRole("form", { name: "New view", exact: true });
    const name = form.getByRole("textbox", { name: "View name" });
    const submit = form.getByRole("button", { name: "Create view" });

    await expect.element(submit).toBeDisabled();
    await name.fill("   ");
    await expect.element(submit).toBeDisabled();
    await userEvent.click(name);
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await expect.element(form).toBeVisible();

    await name.fill("Roadmap");
    await expect.element(submit).toBeEnabled();
  });

  it("mantém a ordem de Tab do nome à descrição, ações e ferramentas", async () => {
    const screen = await renderPage();
    const form = screen.getByRole("form", { name: "New view", exact: true });
    const name = form.getByRole("textbox", { name: "View name" });
    const description = form.getByRole("textbox", { name: "Description" });
    const cancel = form.getByRole("button", { name: "Cancel" });
    const submit = form.getByRole("button", { name: "Create view" });
    const filter = form.getByRole("button", { name: "Add filter" });
    const display = form.getByRole("button", { name: "Display options" });

    await name.fill("Roadmap");
    await userEvent.click(name);
    for (const next of [description, cancel, submit, filter, display]) {
      await userEvent.tab();
      await expect.element(next).toHaveFocus();
    }
  });

  it("mostra os controles próprios de New project", async () => {
    const screen = await renderPage();
    const project = screen.getByRole("form", { name: "New project", exact: true });

    await expect.element(project).toBeVisible();
    await expect.element(project.getByRole("button", { name: "Create project" })).toBeVisible();
    await expect.element(project.getByRole("button", { name: "Lead" })).toBeVisible();
    await expect.element(project.getByRole("button", { name: "Choose icon" })).toBeVisible();
  });
});

describe("Creation Composer: New issue", () => {
  it("Enter no nome move o foco para a descrição", async () => {
    const screen = await renderPage();
    const form = screen.getByRole("form", { name: "New issue", exact: true });
    const title = form.getByRole("textbox", { name: "Issue title" });
    const description = form.getByRole("textbox", { name: "Description" });

    await userEvent.click(title);
    await userEvent.keyboard("{Enter}");

    await expect.element(description).toHaveFocus();
  });

  it.each(["Control", "Meta"] as const)(
    "%s+Enter confirma, anuncia a issue e devolve o foco ao gatilho",
    async (modifier) => {
      const screen = await renderPage();
      const form = screen.getByRole("form", { name: "New issue", exact: true });
      const title = form.getByRole("textbox", { name: "Issue title" });
      const trigger = screen.getByRole("button", { name: "New issue", exact: true });

      await title.fill("Fix navigation");
      await userEvent.click(title);
      await userEvent.keyboard(`{${modifier}>}{Enter}{/${modifier}}`);

      await expect.element(form).not.toBeInTheDocument();
      await expect.element(screen.getByText("Issue “Fix navigation” created")).toBeVisible();
      await expect.element(trigger).toHaveFocus();
    },
  );

  it("Esc no nome cancela e devolve o foco ao gatilho", async () => {
    const screen = await renderPage();
    const form = screen.getByRole("form", { name: "New issue", exact: true });
    const title = form.getByRole("textbox", { name: "Issue title" });
    const trigger = screen.getByRole("button", { name: "New issue", exact: true });

    await userEvent.click(title);
    await userEvent.keyboard("{Escape}");

    await expect.element(form).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("desabilita Create com nome vazio ou em branco e habilita ao digitar", async () => {
    const screen = await renderPage();
    const form = screen.getByRole("form", { name: "New issue", exact: true });
    const title = form.getByRole("textbox", { name: "Issue title" });
    const submit = form.getByRole("button", { name: "Create" });

    await expect.element(submit).toBeDisabled();
    await title.fill("   ");
    await expect.element(submit).toBeDisabled();
    await title.fill("Fix navigation");
    await expect.element(submit).toBeEnabled();
  });

  it("More actions abre o menu e Esc fecha só o menu", async () => {
    const screen = await renderPage();
    const form = screen.getByRole("form", { name: "New issue", exact: true });

    await form.getByRole("button", { name: "More actions" }).click();
    const menu = screen.getByRole("menu");
    await expect.element(menu).toBeVisible();
    await expect.element(menu.getByRole("menuitem", { name: "Project" })).toBeVisible();
    await expect.element(menu.getByRole("menuitem", { name: "Due date" })).toBeVisible();
    await expect.element(menu.getByRole("menuitem", { name: "Estimate" })).toBeVisible();

    await userEvent.keyboard("{Escape}");

    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(form).toBeVisible();
  });
});

describe.each(["dark", "light"] as const)("Creation Composer no tema %s", (theme) => {
  it("não tem violações axe com Display options aberto e cartão preenchido", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await renderPage();
    await fillComposer(screen);
    const form = screen.getByRole("form", { name: "New view", exact: true });
    await form.getByRole("button", { name: "Display options", exact: true }).click();
    await expect.element(screen.getByRole("dialog", { name: "Display options" })).toBeVisible();

    // Espera o fim das animações de entrada e a estabilização das medições do axe.
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await accessibilityViolations()).toEqual([]);
  });
});
