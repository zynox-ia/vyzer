/**
 * "Create new issue" e rascunhos: fechar com texto escrito salva um rascunho (item Drafts da
 * sidebar); criar a issue ou fechar vazio não salva nada.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { AppShell } from "./index";

const onSaveIssueDraft = vi.fn();

function Harness() {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={["/projects"]}>
        <Routes>
          <Route path="/" element={<AppShell onSaveIssueDraft={onSaveIssueDraft} />}>
            <Route path="projects" element={<p>Projects page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

async function openComposer() {
  await render(<Harness />);
  await page.getByRole("button", { name: "Create new issue" }).click();
  await expect.element(page.getByRole("dialog", { name: "Create new issue" })).toBeVisible();
}

beforeEach(async () => {
  onSaveIssueDraft.mockReset();
  await page.viewport(1280, 720);
});

describe("Create new issue → rascunho", () => {
  it("fechar com Esc depois de escrever o título salva o rascunho", async () => {
    await openComposer();
    await page.getByLabelText("Issue title").fill("  Fix the login  ");
    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() =>
      expect(onSaveIssueDraft).toHaveBeenCalledWith({ title: "Fix the login", description: "" }),
    );
    await expect
      .element(page.getByRole("dialog", { name: "Create new issue" }))
      .not.toBeInTheDocument();
  });

  it("fechar sem escrever nada não salva", async () => {
    await openComposer();
    await userEvent.keyboard("{Escape}");
    await expect
      .element(page.getByRole("dialog", { name: "Create new issue" }))
      .not.toBeInTheDocument();
    expect(onSaveIssueDraft).not.toHaveBeenCalled();
  });

  it("criar a issue não salva rascunho", async () => {
    await openComposer();
    await page.getByLabelText("Issue title").fill("Ship it");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect
      .element(page.getByRole("dialog", { name: "Create new issue" }))
      .not.toBeInTheDocument();
    expect(onSaveIssueDraft).not.toHaveBeenCalled();
  });
});
