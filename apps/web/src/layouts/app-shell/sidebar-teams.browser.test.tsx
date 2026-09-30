/** Sidebar recebe os Teams por prop (spec settings-administration 2.1): só eles, ou nada. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter } from "react-router";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { AppShellProvider } from "./context";
import { Sidebar } from "./sidebar";

const TEAMS = [
  { slug: "alpha", name: "Alpha", icon: { kind: "icon", name: "Zap", color: "red" } },
  { slug: "beta", name: "Beta", icon: { kind: "icon", name: "Layers", color: "purple" } },
] as const;

function Harness({ teams }: { teams: Parameters<typeof Sidebar>[0]["teams"] }) {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={["/projects"]}>
        <AppShellProvider shortcuts={false}>
          <Sidebar teams={teams} />
        </AppShellProvider>
      </MemoryRouter>
    </ToastProvider>
  );
}

beforeEach(async () => {
  localStorage.clear();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("Sidebar: seção Your teams", () => {
  it("mostra só os Teams recebidos", async () => {
    const screen = await render(<Harness teams={[...TEAMS]} />);
    const list = screen.getByRole("list", { name: "Your teams" });

    await expect.element(list.getByRole("button", { name: "Alpha", exact: true })).toBeVisible();
    await expect.element(list.getByRole("button", { name: "Beta", exact: true })).toBeVisible();
    // "Zynox" também é o nome do Workspace no topo, por isso a checagem é dentro da lista.
    await expect.element(list.getByText("Zynox", { exact: true })).not.toBeInTheDocument();
    await expect.element(list.getByText("Vyzer", { exact: true })).not.toBeInTheDocument();
  });

  it("sem Teams a seção some", async () => {
    const screen = await render(<Harness teams={[]} />);

    await expect.element(screen.getByRole("navigation").first()).toBeVisible();
    await expect.element(screen.getByText("Your teams")).not.toBeInTheDocument();
    await expect.element(screen.getByRole("list", { name: "Your teams" })).not.toBeInTheDocument();
  });
});
