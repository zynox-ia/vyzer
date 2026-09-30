/** A rota "/" abre na "Default home view" das Preferences (spec preferences-persistence). */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { queryOptions, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { HomeRedirect, homePath } from "./home-redirect";

let view = "agent";
let failPreferences = false;
let teams: { slug: string }[] = [{ slug: "zynox" }, { slug: "vyzer" }];

vi.mock("@/services/member-preferences", () => ({
  memberPreferencesQueryOptions: () =>
    queryOptions({
      queryKey: ["member-preferences"],
      queryFn: async () => {
        if (failPreferences) throw new Error("boom");
        return { defaultHomeView: view };
      },
    }),
}));
vi.mock("@/services/teams", () => ({
  teamsQueryOptions: () => queryOptions({ queryKey: ["teams"], queryFn: async () => teams }),
}));

function Where() {
  return <output aria-label="Current URL">{useLocation().pathname}</output>;
}

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  view = "agent";
  failPreferences = false;
  teams = [{ slug: "zynox" }, { slug: "vyzer" }];
});

describe("HomeRedirect", () => {
  it.each([
    ["agent", "/agent"],
    ["inbox", "/inbox"],
    ["my-issues", "/my-issues"],
    ["reviews", "/reviews"],
    ["current-cycle", "/cycles"],
    ["projects", "/projects"],
    ["all-issues", "/teams/zynox/issues"],
    ["active-issues", "/teams/zynox/issues"],
  ])("%s abre em %s", async (chosen, path) => {
    view = chosen;
    await render(<Harness />);
    await expect.element(page.getByLabelText("Current URL")).toHaveTextContent(path);
  });

  it("sem Teams, All issues cai em /projects", async () => {
    view = "all-issues";
    teams = [];
    await render(<Harness />);
    await expect.element(page.getByLabelText("Current URL")).toHaveTextContent("/projects");
  });

  it("se as preferências não carregam, abre em /projects", async () => {
    failPreferences = true;
    await render(<Harness />);
    await expect.element(page.getByLabelText("Current URL")).toHaveTextContent("/projects");
  });

  it("homePath cobre todas as opções", () => {
    expect(homePath("agent")).toBe("/agent");
    expect(homePath("all-issues", "vyzer")).toBe("/teams/vyzer/issues");
  });
});
