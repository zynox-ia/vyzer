/**
 * Sitemap da sidebar (Missão 02/03): as três seções (Home, Business, Platform) e os
 * macros/micros na ordem de `navigation.ts`, um macro alterna sem navegar, o ancestral do item
 * ativo expande sozinho por deep link/refresh, o micro "Projects" fica ativo em /projects/:id,
 * e conteúdo recolhido não fica focável.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import { AppShell } from "./index";

function LocationProbe() {
  return <output aria-label="Current URL">{useLocation().pathname}</output>;
}

function Harness({ initialEntries = ["/projects"] }: { initialEntries?: string[] }) {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationProbe />
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route path="*" element={<p>Page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
}

const sidebar = () => document.querySelector('nav[aria-label="Sidebar do workspace"]')!;

const topLevelLabels = (sectionTitle: string) =>
  Array.from(sidebar().querySelectorAll(`ul[aria-label="${sectionTitle}"] > li`)).map((li) =>
    li.querySelector("a,button")?.textContent?.trim(),
  );

/** Leitura de atributos/estrutura do item no painel secundário (com data-nav-item). */
const triggerEl = (label: string) =>
  Array.from(sidebar().querySelectorAll<HTMLElement>("button[data-nav-item]")).find(
    (button) => button.textContent?.trim() === label,
  )!;

const panelButton = (label: string) => {
  if (label === "Dashboard") {
    return page.getByRole("list", { name: "Home" }).getByRole("button", { name: label });
  }
  if (label === "Projects" || label === "CRM" || label === "Finance") {
    return page.getByRole("list", { name: "Business" }).getByRole("button", { name: label });
  }
  return page.getByRole("list", { name: "Platform" }).getByRole("button", { name: label });
};

const childLabels = (groupLabel: string) =>
  Array.from(
    triggerEl(groupLabel).closest("li")!.querySelectorAll<HTMLElement>("a[data-nav-item]"),
  ).map((a) => a.textContent?.trim());

beforeEach(async () => {
  localStorage.clear();
  // Para testar o conteúdo do sitemap do painel, iniciamos com o painel expandido ("0")
  localStorage.setItem("zynox:sidebar:collapsed", "0");
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("Sitemap completo, na ordem de navigation.ts", () => {
  it("as três seções e os macros/folhas de cada uma, na ordem certa", async () => {
    await render(<Harness />);
    await expect.element(page.getByRole("link", { name: "AI Chat" })).toBeVisible();

    expect(topLevelLabels("Home")).toEqual(["Dashboard", "Inbox", "AI Chat"]);
    expect(topLevelLabels("Business")).toEqual(["Projects", "CRM", "Finance"]);
    expect(topLevelLabels("Platform")).toEqual(["AI Tools", "Analytics"]);
  });

  it.each([
    ["Dashboard", ["Overview", "My Activity"]],
    ["Projects", ["Portfolio", "Projects", "Tasks", "Milestones", "Calendar"]],
    ["CRM", ["Overview", "Leads", "Pipelines", "Deals", "Contacts", "Companies"]],
    ["Finance", ["Overview", "Cash Flow", "Accounts", "Transactions", "Invoices", "Recurring"]],
    ["AI Tools", ["Agents", "Workflows", "Tools", "Knowledge", "Executions"]],
    ["Analytics", ["Dashboards", "Reports", "Insights"]],
  ])("macro %s: filhos na ordem certa, depois de abrir", async (label, expected) => {
    await render(<Harness initialEntries={["/inbox"]} />);
    await expect.element(panelButton(label)).toBeVisible();
    expect(triggerEl(label).getAttribute("aria-expanded")).toBe("false");

    await panelButton(label).click();
    expect(childLabels(label)).toEqual(expected);
  });
});

describe("Macro alterna sem navegar", () => {
  it("clicar em CRM expande os filhos e não muda a URL", async () => {
    await render(<Harness initialEntries={["/projects"]} />);
    await expect.element(page.getByRole("link", { name: "Leads" })).not.toBeInTheDocument();
    await expect.element(page.getByLabelText("Current URL")).toHaveTextContent("/projects");
    expect(triggerEl("CRM").getAttribute("aria-expanded")).toBe("false");

    await panelButton("CRM").click();
    expect(triggerEl("CRM").getAttribute("aria-expanded")).toBe("true");
    await expect.element(page.getByRole("link", { name: "Leads" })).toBeVisible();
    // Continua em /projects: clicar no macro não navegou.
    await expect.element(page.getByLabelText("Current URL")).toHaveTextContent("/projects");

    await panelButton("CRM").click();
    expect(triggerEl("CRM").getAttribute("aria-expanded")).toBe("false");
  });
});

describe("Ancestral do item ativo expande por deep link/refresh", () => {
  it("abrir direto em /crm/leads já mostra CRM expandido, com Leads ativo", async () => {
    await render(<Harness initialEntries={["/crm/leads"]} />);
    await expect.element(page.getByRole("link", { name: "Leads" })).toBeVisible();
    expect(triggerEl("CRM").getAttribute("aria-expanded")).toBe("true");
    await expect
      .element(page.getByRole("link", { name: "Leads" }))
      .toHaveAttribute("aria-current", "page");
    // Só "Leads" está ativo: o irmão "Overview" (mesmo prefixo /crm) não fica ativo também.
    await expect
      .element(page.getByRole("link", { name: "Overview" }))
      .not.toHaveAttribute("aria-current", "page");
  });

  it("outros macros continuam fechados: cada um abre de forma independente", async () => {
    await render(<Harness initialEntries={["/crm/leads"]} />);
    await expect.element(page.getByRole("link", { name: "Leads" })).toBeVisible();
    expect(triggerEl("Finance").getAttribute("aria-expanded")).toBe("false");
    expect(triggerEl("Projects").getAttribute("aria-expanded")).toBe("false");
  });
});

describe("Micro Projects ativo em /projects/:id", () => {
  it("ao abrir /projects/prj-123, o micro Projects fica ativo", async () => {
    await render(<Harness initialEntries={["/projects/prj-123"]} />);
    // Projects macro expande pelo deep link
    expect(triggerEl("Projects").getAttribute("aria-expanded")).toBe("true");
    const projectsLink = page.getByRole("link", { name: "Projects" });
    await expect.element(projectsLink).toBeVisible();
    await expect.element(projectsLink).toHaveAttribute("aria-current", "page");
  });
});

describe("Conteúdo recolhido não fica focável (roving tabindex)", () => {
  it("↓ a partir de um macro fechado pula pro próximo macro, não para filhos inexistentes", async () => {
    await render(<Harness initialEntries={["/projects"]} />);
    await expect.element(page.getByRole("link", { name: "Inbox" })).toBeVisible();
    expect(triggerEl("CRM").getAttribute("aria-expanded")).toBe("false");
    await expect.element(page.getByRole("link", { name: "Leads" })).not.toBeInTheDocument();

    triggerEl("CRM").focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(panelButton("Finance")).toHaveFocus();
  });
});
