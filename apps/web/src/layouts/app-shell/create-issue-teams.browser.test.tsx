/** Seletor de Team do CreateIssueDialog recebe os Teams por prop (Team real da API). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter } from "react-router";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import type { Team } from "@/features/projects/project-data";
import { AppShellProvider } from "./context";
import { CreateIssueDialog } from "./create-issue-dialog";

const TEAMS: Team[] = [
  {
    slug: "zynox",
    name: "Zynox",
    icon: { kind: "icon", name: "Navigation", color: "cyan" },
    key: "ZYN",
  },
  {
    slug: "atlas",
    name: "Atlas",
    icon: { kind: "icon", name: "Layers", color: "purple" },
    key: "VYZ",
  },
] as Team[];

function Harness({ teams }: { teams?: Team[] }) {
  return (
    <ToastProvider>
      <MemoryRouter>
        <AppShellProvider>
          <CreateIssueDialog {...(teams ? { teams } : {})} />
        </AppShellProvider>
      </MemoryRouter>
    </ToastProvider>
  );
}

async function openDialog(teams?: Team[]) {
  const screen = await render(<Harness teams={teams} />);
  await userEvent.keyboard("c");
  await expect.element(screen.getByRole("textbox", { name: "Issue title" })).toBeVisible();
  return screen;
}

beforeEach(async () => {
  localStorage.clear();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("CreateIssueDialog: seletor de Team", () => {
  it("mostra o primeiro Team com a key e troca pelo Combobox", async () => {
    const screen = await openDialog(TEAMS);

    const button = screen.getByRole("button", { name: "Team: Zynox" });
    await expect.element(button).toBeVisible();
    await expect.element(button).toHaveTextContent("ZYN");

    await button.click();
    await expect.element(page.getByRole("option", { name: /Zynox/ })).toBeVisible();
    await expect.element(page.getByRole("option", { name: /Atlas/ })).toBeVisible();
    // O scrim do diálogo modal intercepta o ponteiro sobre o popover: escolhe pelo teclado.
    await userEvent.keyboard("Atlas{Enter}");

    const changed = screen.getByRole("button", { name: "Team: Atlas" });
    await expect.element(changed).toBeVisible();
    await expect.element(changed).toHaveTextContent("VYZ");
  });

  it("sem nenhum Team o seletor some", async () => {
    const screen = await openDialog([]);

    await expect.element(screen.getByRole("button", { name: /^Team:/ })).not.toBeInTheDocument();
  });

  it("sem a prop aparece o Team de exemplo", async () => {
    const screen = await openDialog();

    await expect.element(screen.getByRole("button", { name: "Team: Zynox" })).toBeVisible();
  });
});
