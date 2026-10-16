/**
 * PlaceholderPage (Missão 02, navegação): texto discreto "Coming soon." em inglês, e breadcrumb
 * de um nível (sem `section`) ou dois (com `section`, o macro do sitemap — ex. "CRM › Leads").
 */
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter } from "react-router";
import { PlaceholderPage } from "./index";

describe("PlaceholderPage", () => {
  it("sem section: breadcrumb de um nível e 'Coming soon.'", async () => {
    await render(
      <MemoryRouter>
        <PlaceholderPage title="Settings" />
      </MemoryRouter>,
    );
    const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]');
    expect(breadcrumb?.textContent?.trim()).toBe("Settings");
    await expect.element(page.getByText("Coming soon.")).toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Settings", level: 1 }))
      .toBeInTheDocument();
  });

  it("com section: breadcrumb de dois níveis (macro › destino)", async () => {
    await render(
      <MemoryRouter>
        <PlaceholderPage title="Leads" section="CRM" />
      </MemoryRouter>,
    );
    const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]');
    expect(breadcrumb?.textContent?.trim()).toBe("CRMLeads");
    await expect.element(page.getByText("Coming soon.")).toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "CRM Leads", level: 1 }))
      .toBeInTheDocument();
  });

  it("não mostra o texto antigo em português", async () => {
    await render(
      <MemoryRouter>
        <PlaceholderPage title="Reports" section="Analytics" />
      </MemoryRouter>,
    );
    expect(document.body.textContent).not.toContain("fora do escopo");
  });
});
