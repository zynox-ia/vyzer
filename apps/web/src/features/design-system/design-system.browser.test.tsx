/**
 * Todas as páginas de /design-system, nos dois temas, num Chromium real: a página abre e o
 * axe-core não encontra violações de acessibilidade (inclui contraste de texto).
 */
import axe from "axe-core";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import "@/index.css";
import { DesignSystemApp } from ".";
import { allPaths, sections } from "./registry";

/**
 * Uma seção sem itens (`plannedIn`), se sobrar alguma: dinâmico, não um slug fixo — revisão de
 * código pediu para o teste não depender de "patterns" continuar vazia (a Fase 10 a preenche).
 */
const emptySection = sections.find((s) => s.items.length === 0);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/design-system/*" element={<DesignSystemApp />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function violations() {
  const result = await axe.run(document.body, { resultTypes: ["violations"] });
  return result.violations.map(
    (v) =>
      `${v.id}: ${v.help} → ${v.nodes.map((n) => `${n.target.join(" ")} ${n.failureSummary ?? ""}`).join(" | ")}`,
  );
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe.each(["dark", "light"] as const)("/design-system no tema %s", (theme) => {
  it.each(allPaths)("%s abre sem violações de acessibilidade", async (path) => {
    document.documentElement.dataset.theme = theme;
    const screen = await renderAt(path);
    await expect.element(screen.getByRole("heading", { level: 1 })).toBeVisible();
    // Deixa as medições ao vivo (contraste, fontes) terminarem antes de auditar.
    // e as animações de entrada (≤ 240 ms).
    await new Promise((r) => setTimeout(r, 300));
    expect(await violations()).toEqual([]);
  });
});

describe("navegação", () => {
  it("abre em Foundations → Colors", async () => {
    const screen = await renderAt("/design-system");
    await expect.element(screen.getByRole("heading", { level: 1, name: "Colors" })).toBeVisible();
  });

  // Pula quando todas as seções já tiverem páginas — não força "patterns" a continuar vazia só
  // para este teste existir (a Fase 10 a preenche; nesse dia, nada mais precisa mostrar "planned").
  it.skipIf(!emptySection)("mostra a seção vazia com a fase prevista", async () => {
    const screen = await renderAt(`/design-system/${emptySection!.slug}`);
    const escaped = emptySection!.plannedIn!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect.element(screen.getByText(new RegExp(escaped))).toBeVisible();
  });
});
