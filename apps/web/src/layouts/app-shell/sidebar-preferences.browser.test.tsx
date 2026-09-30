/**
 * A sidebar real obedece o Customize sidebar (spec `customize-sidebar-preferences.md`): ordem,
 * visibilidade ("Don't show" e "Show when badged") e estilo do badge, vindos da API.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { AppShell } from "./index";
import type { SidebarPreferencesData } from "./sidebar-items";

const prefs = (
  items: Partial<Record<string, ["always" | "when-badged" | "hidden", number]>>,
  badgeStyle: "count" | "dot" = "count",
): SidebarPreferencesData => {
  const keys = [
    "inbox",
    "reviews",
    "my-issues",
    "agent",
    "drafts",
    "projects",
    "views",
    "members",
    "teams",
  ] as const;
  const defaults: Record<string, "always" | "when-badged" | "hidden"> = {
    drafts: "when-badged",
    members: "hidden",
    teams: "hidden",
  };
  return {
    badgeStyle,
    items: keys.map((key, index) => ({
      key,
      visibility: items[key]?.[0] ?? defaults[key] ?? "always",
      sortOrder: items[key]?.[1] ?? index,
    })),
  };
};

function Harness(props: { preferences?: SidebarPreferencesData; drafts?: number; inbox?: number }) {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={["/projects"]}>
        <Routes>
          <Route
            path="/"
            element={
              <AppShell
                sidebarPreferences={props.preferences}
                draftsCount={props.drafts}
                inboxUnreadCount={props.inbox}
              />
            }
          >
            <Route path="projects" element={<p>Projects page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

const labels = (name: string) =>
  Array.from(
    document.querySelectorAll(
      `nav[aria-label="Sidebar do workspace"] ul[aria-label="${name}"] > li`,
    ),
  ).map((li) => li.querySelector("a,button")?.textContent?.replace(/\d+$/, "").trim());

beforeEach(async () => {
  localStorage.clear();
  await page.viewport(1280, 720);
});
afterEach(() => localStorage.clear());

describe("Sidebar obedece o Customize sidebar", () => {
  it("sem preferências, mostra o padrão do Linear (sem Drafts, Members nem Teams)", async () => {
    await render(<Harness />);
    await expect.element(page.getByRole("link", { name: "Inbox" })).toBeVisible();
    expect(labels("Navegação principal")).toEqual(["Inbox", "Reviews", "My issues", "Agent"]);
    expect(labels("Workspace")).toEqual(["Projects", "Views", "More"]);
  });

  it("respeita a ordem guardada e o Don't show", async () => {
    await render(
      <Harness
        preferences={prefs({ agent: ["always", 0], inbox: ["hidden", 1], reviews: ["always", 2] })}
      />,
    );
    await expect.element(page.getByRole("link", { name: "Agent" })).toBeVisible();
    expect(labels("Navegação principal")).toEqual(["Agent", "Reviews", "My issues"]);
  });

  it("Show when badged: Drafts aparece só com rascunhos, e Members e Teams quando ligados", async () => {
    const preferences = prefs({ members: ["always", 7], teams: ["always", 8] });
    const { unmount } = await render(<Harness preferences={preferences} drafts={0} />);
    await expect.element(page.getByRole("link", { name: "Members" })).toBeVisible();
    expect(labels("Navegação principal")).not.toContain("Drafts");
    expect(labels("Workspace")).toEqual(["Projects", "Views", "Members", "Teams", "More"]);
    await unmount();

    await render(<Harness preferences={preferences} drafts={2} />);
    await expect.element(page.getByRole("link", { name: /^Drafts/ })).toBeVisible();
    expect(labels("Navegação principal")).toContain("Drafts");
  });

  it("badge Dot troca o número por um ponto", async () => {
    await render(<Harness preferences={prefs({}, "dot")} inbox={3} />);
    await expect.element(page.getByRole("link", { name: /^Inbox/ })).toBeVisible();
    const inbox = page.getByRole("link", { name: /^Inbox/ }).element();
    expect(inbox.textContent).not.toMatch(/3/);
    expect(inbox.querySelector('[aria-label="3 unread"]')).not.toBeNull();
  });
});
