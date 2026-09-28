/**
 * Testes de teclado e foco do padrão Inline Editing (título, descrição) e testes de fumaça dos
 * dois sites de reuso do mesmo hook (`useInlineEdit`): Issue Detail (título) e Milestone Detail
 * (nome). A página de Inline Editing repete os mesmos valores nas seções "Estados" e "Temas" (o
 * template PatternPage), então os testes escopam sempre a instância "Ao vivo" — a primeira do
 * template, por isso `.first()` — para não colidir com as cópias estáticas/duplicadas.
 */
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

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

type Screen = Awaited<ReturnType<typeof renderAt>>;

const PATH = "/design-system/patterns/inline-editing";
const INITIAL_TITLE = "Sync Linear webhooks with the issue feed";
const INITIAL_DESCRIPTION =
  "Webhook events from Linear should update the issue feed within a few seconds, without a manual refresh.";

/** A seção "Ao vivo" é sempre a primeira do template PatternPage: `.first()` pega a instância
 * interativa, não as repetições em Estados (mesmo valor inicial) e Temas (duas cópias completas). */
function liveTitle(screen: Screen) {
  return screen.getByRole("button", { name: /^Edit title:/ }).first();
}
function liveDescription(screen: Screen) {
  return screen.getByRole("button", { name: /^Edit description:/ }).first();
}
function titleField(screen: Screen) {
  return screen.getByRole("textbox", { name: "Title" }).first();
}
function descriptionField(screen: Screen) {
  return screen.getByRole("textbox", { name: "Description" }).first();
}
/** Alvo neutro para "clicar em outro lugar" (blur): o h1 da página, fora do exemplo ao vivo. */
function pageHeading(screen: Screen) {
  return screen.getByRole("heading", { name: "Inline Editing", level: 1 });
}

describe("Inline Editing: título", () => {
  it("clique entra em edição e foca o campo", async () => {
    const screen = await renderAt(PATH);
    await liveTitle(screen).click();
    await expect.element(titleField(screen)).toHaveFocus();
  });

  it("Tab até o texto estático e Enter também entram em edição", async () => {
    const screen = await renderAt(PATH);
    liveTitle(screen).element().focus();
    await expect.element(liveTitle(screen)).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(titleField(screen)).toHaveFocus();
  });

  it("Enter salva e devolve o foco ao texto estático", async () => {
    const screen = await renderAt(PATH);
    await liveTitle(screen).click();
    await titleField(screen).fill("New title");
    await userEvent.keyboard("{Enter}");

    const updated = screen.getByRole("button", { name: "Edit title: New title" }).first();
    await expect.element(updated).toBeVisible();
    await expect.element(updated).toHaveFocus();
    await expect.element(screen.getByText("Title saved: “New title”").first()).toBeVisible();
  });

  it("Esc cancela e restaura o valor anterior, com foco no texto estático", async () => {
    const screen = await renderAt(PATH);
    await liveTitle(screen).click();
    await titleField(screen).fill("Discarded title");
    await userEvent.keyboard("{Escape}");

    const restored = screen.getByRole("button", { name: `Edit title: ${INITIAL_TITLE}` }).first();
    await expect.element(restored).toBeVisible();
    await expect.element(restored).toHaveFocus();
  });

  it("blur salva o título", async () => {
    const screen = await renderAt(PATH);
    await liveTitle(screen).click();
    await titleField(screen).fill("Saved on blur");
    await pageHeading(screen).click();

    const updated = screen.getByRole("button", { name: "Edit title: Saved on blur" }).first();
    await expect.element(updated).toBeVisible();
  });

  it("o texto estático e o campo nunca coexistem no DOM (para a mesma instância)", async () => {
    const screen = await renderAt(PATH);
    const staticButtons = () => screen.getByRole("button", { name: /^Edit title:/ });
    // A seção "Estados" mostra um TextInput sempre em edição ("título · editando") como
    // exemplo visual, entao ja existe 1 campo "Title" na pagina antes de qualquer interacao;
    // a assercao confirma a troca 1-para-1 na instancia ao vivo, nao que a pagina comeca sem
    // nenhum campo.
    const field = () => screen.getByRole("textbox", { name: "Title" });

    const staticBefore = staticButtons().elements().length;
    const fieldBefore = field().elements().length;

    await liveTitle(screen).click();

    expect(field().elements().length).toBe(fieldBefore + 1);
    expect(staticButtons().elements().length).toBe(staticBefore - 1);
  });
});

describe("Inline Editing: descrição", () => {
  it("Enter insere quebra de linha e não sai do modo de edição (submitOnEnter: false)", async () => {
    const screen = await renderAt(PATH);
    await liveDescription(screen).click();
    const field = descriptionField(screen);
    await expect.element(field).toHaveFocus();

    await userEvent.keyboard("Line one{Enter}Line two");

    await expect.element(field).toBeVisible();
    expect((field.element() as HTMLTextAreaElement).value).toBe(
      `${INITIAL_DESCRIPTION}Line one\nLine two`,
    );
  });

  it("blur salva a descrição", async () => {
    const screen = await renderAt(PATH);
    await liveDescription(screen).click();
    await descriptionField(screen).fill("Updated description");
    await pageHeading(screen).click();

    const updated = screen
      .getByRole("button", { name: "Edit description: Updated description" })
      .first();
    await expect.element(updated).toBeVisible();
    await expect.element(screen.getByText("Description saved").first()).toBeVisible();
  });

  it("Esc cancela e restaura o valor anterior", async () => {
    const screen = await renderAt(PATH);
    await liveDescription(screen).click();
    await descriptionField(screen).fill("Discarded description");
    await userEvent.keyboard("{Escape}");

    const restored = screen
      .getByRole("button", { name: `Edit description: ${INITIAL_DESCRIPTION}` })
      .first();
    await expect.element(restored).toBeVisible();
    await expect.element(restored).toHaveFocus();
  });
});

describe("Inline Editing: reuso no Issue Detail (título grande)", () => {
  it("clique edita, Enter salva e devolve o foco ao texto estático", async () => {
    const screen = await renderAt("/design-system/patterns/issue-detail");
    const staticTitle = screen.getByRole("button", { name: /^Edit title:/ }).first();
    await staticTitle.click();
    const field = screen.getByRole("textbox", { name: "Title" }).first();
    await expect.element(field).toHaveFocus();

    await field.fill("Renamed issue");
    await userEvent.keyboard("{Enter}");

    const updated = screen.getByRole("button", { name: "Edit title: Renamed issue" }).first();
    await expect.element(updated).toBeVisible();
    await expect.element(updated).toHaveFocus();
  });
});

describe("Inline Editing: reuso no Milestone Detail (nome)", () => {
  it("clique edita, Enter salva e devolve o foco ao texto estático", async () => {
    const screen = await renderAt("/design-system/patterns/milestone-detail");
    const staticName = screen.getByRole("button", { name: /^Edit milestone name:/ }).first();
    await staticName.click();
    const field = screen.getByRole("textbox", { name: "Milestone name" }).first();
    await expect.element(field).toHaveFocus();

    await field.fill("Beta launch v2");
    await userEvent.keyboard("{Enter}");

    const updated = screen
      .getByRole("button", { name: "Edit milestone name: Beta launch v2" })
      .first();
    await expect.element(updated).toBeVisible();
    await expect.element(updated).toHaveFocus();
  });
});
