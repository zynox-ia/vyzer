/**
 * A sidebar real obedece o Customize sidebar (spec `customize-sidebar-preferences.md`) só nos 3
 * itens que o sitemap da Missão 02 também tem: Inbox, AI Chat e a micro "Projects" dentro do
 * macro Projects — visibilidade e badge style; a ordem salva e as chaves sem equivalente no
 * sitemap (reviews, my-issues, drafts, views, members, teams) são ignoradas (decisão da Missão
 * 02; `sidebar-items.ts` e a página Customize sidebar continuam intocados).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ToastProvider } from "@zynox/design-system/components";
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

function Harness(props: {
  preferences?: SidebarPreferencesData;
  inbox?: number;
  initialPath?: string;
}) {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={[props.initialPath ?? "/projects"]}>
        <Routes>
          <Route
            path="/"
            element={
              <AppShell sidebarPreferences={props.preferences} inboxUnreadCount={props.inbox} />
            }
          >
            <Route path="projects" element={<p>Projects page</p>} />
            <Route path="crm" element={<p>CRM page</p>} />
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

/** Filhos de um macro (ex. "Projects"): sem aria-label próprio, acha pelo gatilho e lê o `li`. */
const groupChildren = (groupLabel: string) => {
  const trigger = Array.from(
    document.querySelectorAll<HTMLElement>(
      'nav[aria-label="Sidebar do workspace"] button[data-nav-item]',
    ),
  ).find((button) => button.textContent?.trim() === groupLabel);
  const li = trigger?.closest("li");
  return Array.from(li?.querySelectorAll<HTMLElement>("a[data-nav-item]") ?? []).map((a) =>
    a.textContent?.replace(/\d+$/, "").trim(),
  );
};

beforeEach(async () => {
  localStorage.clear();
  await page.viewport(1280, 720);
});
afterEach(() => localStorage.clear());

describe("Sidebar obedece o Customize sidebar só nos 3 itens mapeáveis", () => {
  it("sem preferências, Inbox, AI Chat e a micro Projects aparecem (padrão)", async () => {
    await render(<Harness />);
    await expect.element(page.getByRole("link", { name: "Inbox" })).toBeVisible();
    await expect.element(page.getByRole("link", { name: "AI Chat" })).toBeVisible();
    // /projects (initialPath padrão) é descendente da micro "Projects": o macro abre sozinho.
    expect(labels("Home")).toEqual(["Dashboard", "Inbox", "AI Chat"]);
    expect(groupChildren("Projects")).toEqual([
      "Portfolio",
      "Projects",
      "Tasks",
      "Milestones",
      "Calendar",
    ]);
  });

  it("'Don't show' esconde só o item mapeável, sem afetar o resto do sitemap", async () => {
    const preferences = prefs({ inbox: ["hidden", 0], agent: ["hidden", 1] });
    const first = await render(<Harness preferences={preferences} />);

    await expect.element(page.getByRole("link", { name: "Inbox" })).not.toBeInTheDocument();
    await expect.element(page.getByRole("link", { name: "AI Chat" })).not.toBeInTheDocument();
    expect(labels("Home")).toEqual(["Dashboard"]);
    await first.unmount();

    // A micro "Projects" some, os irmãos do macro ficam.
    const projectsHidden = prefs({ projects: ["hidden", 0] });
    await render(<Harness preferences={projectsHidden} />);
    expect(groupChildren("Projects")).toEqual(["Portfolio", "Tasks", "Milestones", "Calendar"]);
  });

  it("a ordem salva é ignorada: o sitemap sempre renderiza em Dashboard, Inbox, AI Chat", async () => {
    // Troca a ordem salva de Inbox e AI Chat (sortOrder invertido): não deve mudar nada na sidebar.
    const preferences = prefs({ inbox: ["always", 9], agent: ["always", 0] });
    await render(<Harness preferences={preferences} />);
    expect(labels("Home")).toEqual(["Dashboard", "Inbox", "AI Chat"]);
  });

  it("chaves sem equivalente no sitemap (reviews, my-issues, drafts, views, members, teams) não renderizam nada", async () => {
    const preferences = prefs({
      reviews: ["always", 0],
      members: ["always", 1],
      teams: ["always", 2],
    });
    await render(<Harness preferences={preferences} />);
    const sidebar = document.querySelector('nav[aria-label="Sidebar do workspace"]');
    for (const ghost of ["Reviews", "My issues", "Drafts", "Views", "Members", "Teams"]) {
      expect(sidebar?.textContent).not.toContain(ghost);
    }
  });

  it("badge Dot troca o número da Inbox por um ponto", async () => {
    await render(<Harness preferences={prefs({}, "dot")} inbox={3} />);
    await expect.element(page.getByRole("link", { name: /^Inbox/ })).toBeVisible();
    const inbox = page.getByRole("link", { name: /^Inbox/ }).element();
    expect(inbox.textContent).not.toMatch(/3/);
    expect(inbox.querySelector('[aria-label="3 unread"]')).not.toBeNull();
  });
});
