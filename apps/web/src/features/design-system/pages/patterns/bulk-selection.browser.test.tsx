/**
 * Testes de teclado e foco do padrão Bulk Selection: marcar linhas (teclado e Ctrl/Shift+clique),
 * a SelectionBar que aparece/some do DOM, o menu "Actions" sem perder a seleção e o botão de
 * fechar. A página repete a lista "Issues" em Estados e Temas (template PatternPage); os testes
 * escopam sempre a lista "Ao vivo" (a primeira do template, por isso `.first()`).
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

const PATH = "/design-system/patterns/bulk-selection";

/** A lista "Ao vivo" é sempre a primeira do template PatternPage: `.first()` pega a lista
 * interativa, não as repetições em Estados/Temas (mesmo aria-label "Issues"). */
function liveList(screen: Screen) {
  return screen.getByRole("listbox", { name: "Issues" }).first();
}
/** A barra só existe depois de marcar uma linha; ainda assim, DOM-primeiro é sempre a do vivo. */
function liveBar(screen: Screen) {
  return screen.getByRole("toolbar", { name: "Bulk actions" }).first();
}

describe("Bulk Selection: marcar e desmarcar", () => {
  it("Espaço marca uma linha e mostra a SelectionBar com a contagem", async () => {
    const screen = await renderAt(PATH);
    const list = liveList(screen);
    const first = list.getByRole("option", { name: /ZYN-41/ });

    // A seção "Estados" já mostra exemplos estáticos da barra desde o carregamento da página
    // (fora do exemplo ao vivo), então a asserção é sobre a contagem certa aparecer ao marcar, não
    // sobre "nenhuma barra na página inteira" antes de marcar.
    await first.click();
    await expect.element(first).toHaveFocus();
    await userEvent.keyboard(" ");

    await expect.element(first).toHaveAttribute("aria-selected", "true");
    const bar = liveBar(screen);
    await expect.element(bar).toBeVisible();
    await expect.element(bar).toHaveTextContent("1 selected");
  });

  it("marcar uma segunda linha atualiza a contagem", async () => {
    const screen = await renderAt(PATH);
    const list = liveList(screen);
    const first = list.getByRole("option", { name: /ZYN-41/ });
    const second = list.getByRole("option", { name: /ZYN-38/ });

    await first.click();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(second).toHaveFocus();
    await userEvent.keyboard(" ");

    await expect.element(second).toHaveAttribute("aria-selected", "true");
    await expect.element(liveBar(screen)).toHaveTextContent("2 selected");
  });

  it("Ctrl+clique também marca (alternativa documentada ao Espaço)", async () => {
    const screen = await renderAt(PATH);
    const list = liveList(screen);
    const first = list.getByRole("option", { name: /ZYN-41/ });

    first.element().dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: true }));

    await expect.element(first).toHaveAttribute("aria-selected", "true");
    await expect.element(liveBar(screen)).toHaveTextContent("1 selected");
  });

  it("Esc limpa a seleção e a barra some do DOM (não fica só escondida)", async () => {
    const screen = await renderAt(PATH);
    const list = liveList(screen);
    const first = list.getByRole("option", { name: /ZYN-41/ });

    await first.click();
    await userEvent.keyboard(" ");
    const bar = liveBar(screen);
    await expect.element(bar).toBeVisible();
    // A seção "Estados" mostra cópias estáticas da barra o tempo todo, com o mesmo aria-label;
    // depois que a barra ao vivo some,  passaria a apontar para uma dessas cópias em
    // vez de "nada". Por isso a checagem usa a identidade do nó capturado agora (isConnected),
    // não uma nova consulta de locator (que reavaliaria e encontraria outra barra).
    const barElement = bar.element();

    await userEvent.keyboard("{Escape}");

    await expect.poll(() => barElement.isConnected).toBe(false);
    await expect.element(first).toHaveAttribute("aria-selected", "false");
  });
});

describe("Bulk Selection: barra de ações", () => {
  it('"Actions" abre por clique, navega por seta e Esc fecha sem perder a seleção', async () => {
    const screen = await renderAt(PATH);
    const list = liveList(screen);
    const first = list.getByRole("option", { name: /ZYN-41/ });
    const second = list.getByRole("option", { name: /ZYN-38/ });

    await first.click();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard(" ");
    const bar = liveBar(screen);
    await expect.element(bar).toHaveTextContent("2 selected");

    await bar.getByRole("button", { name: "Actions" }).click();
    const menu = screen.getByRole("menu");
    await expect.element(menu).toBeVisible();

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("menuitem", { name: "Change status…" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(bar).toBeVisible();
    await expect.element(bar).toHaveTextContent("2 selected");
    await expect.element(first).toHaveAttribute("aria-selected", "true");
    await expect.element(second).toHaveAttribute("aria-selected", "true");
  });

  it('"Actions" também abre com Enter no gatilho focado', async () => {
    const screen = await renderAt(PATH);
    const list = liveList(screen);
    const first = list.getByRole("option", { name: /ZYN-41/ });

    await first.click();
    await userEvent.keyboard(" ");
    const bar = liveBar(screen);
    const actions = bar.getByRole("button", { name: "Actions" });
    actions.element().focus();
    await userEvent.keyboard("{Enter}");

    await expect.element(screen.getByRole("menu")).toBeVisible();
  });

  it("o botão de fechar (✕) limpa a seleção", async () => {
    const screen = await renderAt(PATH);
    const list = liveList(screen);
    const first = list.getByRole("option", { name: /ZYN-41/ });

    await first.click();
    await userEvent.keyboard(" ");
    const bar = liveBar(screen);
    await expect.element(bar).toBeVisible();
    // Mesmo cuidado do teste do Esc: a identidade do no, nao uma nova consulta de locator.
    const barElement = bar.element();

    await bar.getByRole("button", { name: "Clear selection" }).click();

    await expect.poll(() => barElement.isConnected).toBe(false);
    await expect.element(first).toHaveAttribute("aria-selected", "false");
  });
});

describe.each(["dark", "light"] as const)(
  "Bulk Selection no tema %s: acessibilidade com a SelectionBar aberta",
  (theme) => {
    it("sem violações axe com a barra visível", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await renderAt(PATH);
      const list = liveList(screen);
      const first = list.getByRole("option", { name: /ZYN-41/ });

      await first.click();
      await userEvent.keyboard(" ");
      const bar = liveBar(screen);
      await expect.element(bar).toBeVisible();

      expect(await violations(bar.element())).toEqual([]);
    });
  },
);
