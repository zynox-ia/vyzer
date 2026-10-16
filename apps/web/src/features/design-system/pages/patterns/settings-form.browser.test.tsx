/**
 * Testes de teclado e foco do padrão Settings Form: Save habilita com alterações, Enter num campo
 * de texto não submete a seção e o estado de carregamento ao salvar. A página repete o formulário
 * (linhas soltas) em Estados e duas cópias completas em Temas (template PatternPage); os testes
 * escopam sempre o formulário "Ao vivo" (o primeiro do template, por isso `.first()`).
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

const PATH = "/design-system/patterns/settings-form";

/** A seção "Ao vivo" é sempre a primeira do template PatternPage: `.first()` pega o formulário
 * interativo, não as linhas soltas de Estados nem as duas cópias completas de Temas. */
function liveName(screen: Screen) {
  return screen.getByRole("textbox", { name: "Name" }).first();
}
function liveIdentifier(screen: Screen) {
  return screen.getByRole("textbox", { name: "Identifier" }).first();
}
function liveSave(screen: Screen) {
  return screen.getByRole("button", { name: "Save" }).first();
}

describe("Settings Form: Save e alterações pendentes", () => {
  it("Save começa desabilitado sem alterações", async () => {
    const screen = await renderAt(PATH);
    await expect.element(liveSave(screen)).toBeDisabled();
  });

  it("alterar o campo Name habilita o Save", async () => {
    const screen = await renderAt(PATH);
    await liveName(screen).fill("Zynox Labs");
    await expect.element(liveSave(screen)).toBeEnabled();
  });

  it("Enter no campo Name não submete a seção (sem carregamento, sem salvar)", async () => {
    const screen = await renderAt(PATH);
    const name = liveName(screen);
    const save = liveSave(screen);

    await name.fill("Zynox Labs");
    await expect.element(save).toBeEnabled();

    await userEvent.click(name.element());
    await userEvent.keyboard("{Enter}");

    await expect.element(save).not.toHaveAttribute("aria-busy", "true");
    await expect.element(save).toBeEnabled();
    await expect.element(name).toHaveValue("Zynox Labs");
  });

  it("Enter no campo Identifier também não submete a seção", async () => {
    const screen = await renderAt(PATH);
    const identifier = liveIdentifier(screen);
    const save = liveSave(screen);

    await identifier.fill("VYZR");
    await expect.element(save).toBeEnabled();

    await userEvent.click(identifier.element());
    await userEvent.keyboard("{Enter}");

    await expect.element(save).not.toHaveAttribute("aria-busy", "true");
    await expect.element(save).toBeEnabled();
  });

  it("clicar em Save com alterações pendentes mostra o carregamento e volta a desabilitado ao salvar", async () => {
    const screen = await renderAt(PATH);
    const name = liveName(screen);
    const save = liveSave(screen);

    await name.fill("Zynox Labs");
    await save.click();

    await expect.element(save).toHaveAttribute("aria-busy", "true");
    await expect.element(save).toBeDisabled();

    await expect.element(save).not.toHaveAttribute("aria-busy", "true");
    await expect.element(save).toBeDisabled();
  });
});
