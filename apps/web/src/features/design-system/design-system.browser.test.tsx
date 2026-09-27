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
import { allPaths } from "./registry";

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

  it("mostra a seção vazia com a fase prevista", async () => {
    const screen = await renderAt("/design-system/ai");
    await expect.element(screen.getByText(/Fase 7/)).toBeVisible();
  });

  it("aplica a variante de foco da URL no documento", async () => {
    const screen = await renderAt("/design-system/foundations/colors?focus=a");
    await expect.element(screen.getByRole("heading", { level: 1 })).toBeVisible();
    expect(document.documentElement.dataset.focus).toBe("a");
  });
});
