/**
 * A rota "/" abre na "Default home view" das Preferences (spec preferences-persistence). Missão
 * 02: my-issues/reviews caem em /inbox, e current-cycle/all-issues/active-issues em /projects —
 * os destinos de antes não existem mais na sidebar.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { queryOptions, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { HomeRedirect, homePath } from "./home-redirect";

let view = "agent";
let failPreferences = false;

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
});

describe("HomeRedirect", () => {
  it.each([
    ["agent", "/agent"],
    ["inbox", "/inbox"],
    ["my-issues", "/inbox"],
    ["reviews", "/inbox"],
    ["current-cycle", "/projects"],
    ["all-issues", "/projects"],
    ["active-issues", "/projects"],
    ["projects", "/projects"],
  ])("%s abre em %s", async (chosen, path) => {
    view = chosen;
    await render(<Harness />);
    await expect.element(page.getByLabelText("Current URL")).toHaveTextContent(path);
  });

  it("se as preferências não carregam, abre em /projects", async () => {
    failPreferences = true;
    await render(<Harness />);
    await expect.element(page.getByLabelText("Current URL")).toHaveTextContent("/projects");
  });

  it("homePath cobre todas as opções", () => {
    expect(homePath("agent")).toBe("/agent");
    expect(homePath("inbox")).toBe("/inbox");
    expect(homePath("my-issues")).toBe("/inbox");
    expect(homePath("reviews")).toBe("/inbox");
    expect(homePath("current-cycle")).toBe("/projects");
    expect(homePath("all-issues")).toBe("/projects");
    expect(homePath("active-issues")).toBe("/projects");
    expect(homePath("projects")).toBe("/projects");
  });
});
