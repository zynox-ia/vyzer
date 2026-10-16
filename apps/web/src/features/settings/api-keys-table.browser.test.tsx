/**
 * Settings → Administration → API → Issued keys (`/settings/api/keys`, spec
 * `settings-security-api-usage.md`, API.3) num Chromium real. `@/services/api-keys`,
 * `@/services/workspace` e `@/services/api` são trocados por `queryOptions` e `mutationOptions`
 * reais do TanStack Query apoiados em `vi.fn`, então a página roda com o mesmo QueryClient, o
 * mesmo `invalidateQueries` e o mesmo ToastProvider do app. Busca, filtro e ordenação ficam na URL
 * (regra 8): a sonda `useLocation` mostra o que a tela gravou em `MemoryRouter`.
 */
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router";
import axe from "axe-core";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import type { ApiKey } from "./api-key-shared";
import { ApiKeysTablePage } from "./api-keys-table";

type Current = {
  workspace: { id: string; name: string; apiKeyPolicy: "all_members" | "admins" };
  member: { id: string; name: string; email: string; role: string };
};

const fetchCurrent = vi.fn<() => Promise<Current>>();
const fetchKeys = vi.fn<(scope: string) => Promise<ApiKey[]>>();
const revokeKey = vi.fn<(input: { id: string }) => Promise<void>>();

vi.mock("@/services/api", () => ({ api: { apiKey: { key: () => ["apiKey"] } } }));

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({ queryKey: ["workspace", "current"], queryFn: () => fetchCurrent() }),
}));

vi.mock("@/services/api-keys", () => ({
  apiKeysQueryOptions: (scope: string) =>
    queryOptions({ queryKey: ["apiKey", "list", scope], queryFn: () => fetchKeys(scope) }),
  revokeApiKeyMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => revokeKey(input) }),
}));

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const BIANCA_ID = "22222222-2222-4222-8222-222222222222";
const CI_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SCRIPT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OLD_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const REVOKED_AT = "2026-05-01T12:00:00.000Z";

function makeCurrent(role = "admin"): Current {
  return {
    workspace: {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Zynox Dev",
      apiKeyPolicy: "all_members",
    },
    member: { id: ADMIN_ID, name: "Andre", email: "andre@example.com", role },
  };
}

function makeKey(overrides: Partial<ApiKey> & Pick<ApiKey, "id" | "name">): ApiKey {
  return {
    memberId: ADMIN_ID,
    memberName: "Andre",
    memberEmail: "andre@example.com",
    tokenPrefix: "vyz_abcd",
    permissions: "full",
    createdAt: "2026-01-05T12:00:00.000Z",
    lastUsedAt: null,
    revokedAt: null,
    ...overrides,
  };
}

/**
 * Ordem padrão (Created desc): Old (1 mar), CI (1 fev), Reporting (5 jan). Por Key: asc CI, Old,
 * Reporting; desc Reporting, Old, CI. Por Last used asc: Reporting (nunca), CI, Old.
 */
function makeKeys(): ApiKey[] {
  return [
    makeKey({
      id: CI_ID,
      name: "CI deploy",
      tokenPrefix: "vyz_ci01",
      createdAt: "2026-02-01T12:00:00.000Z",
      lastUsedAt: "2026-02-10T12:00:00.000Z",
    }),
    makeKey({
      id: SCRIPT_ID,
      name: "Reporting script",
      memberId: BIANCA_ID,
      memberName: "Bianca",
      memberEmail: "bia@corp.test",
      tokenPrefix: "vyz_rp02",
      permissions: ["read", "write"],
      createdAt: "2026-01-05T12:00:00.000Z",
    }),
    makeKey({
      id: OLD_ID,
      name: "Old integration",
      tokenPrefix: "vyz_ol03",
      permissions: ["admin", "issues:create"],
      createdAt: "2026-03-01T12:00:00.000Z",
      lastUsedAt: "2026-03-15T12:00:00.000Z",
      revokedAt: "2026-04-01T12:00:00.000Z",
    }),
  ];
}

/** Lista "viva": a revogação altera o servidor de mentira e a lista recarregada reflete isso. */
function serveKeys(keys: ApiKey[], failFor: string[] = []) {
  fetchKeys.mockImplementation(async () => keys.map((key) => ({ ...key })));
  revokeKey.mockImplementation(async ({ id }) => {
    if (failFor.includes(id)) throw new Error("boom");
    const target = keys.find((key) => key.id === id);
    if (target) target.revokedAt = REVOKED_AT;
  });
}

function LocationOutput() {
  const location = useLocation();
  return (
    <output aria-label="Current URL">
      {location.pathname}
      {location.search}
    </output>
  );
}

function Harness({ initialPath = "/settings/api/keys" }: { initialPath?: string }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          {/* No app, a página vive no <main> do AppShell/SettingsLayout. */}
          <main>
            <ApiKeysTablePage />
            <LocationOutput />
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

type Screen = Awaited<ReturnType<typeof render>>;

async function axeViolations(root: Element) {
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

const currentUrl = (screen: Screen) => screen.getByLabelText("Current URL");
const keyRow = (screen: Screen, name: string) =>
  screen.getByRole("row", { name: new RegExp(name) });
const rowCell = (screen: Screen, name: string, index: number) =>
  keyRow(screen, name).getByRole("cell").nth(index);
const checkboxFor = (screen: Screen, name: string) =>
  screen.getByRole("checkbox", { name: `Select ${name}` });
const filterInput = (screen: Screen) => screen.getByRole("searchbox", { name: "Filter API keys" });
const statusSelect = (screen: Screen) => screen.getByRole("combobox", { name: "API key status" });
const bulkBar = (screen: Screen) => screen.getByRole("toolbar", { name: "Bulk actions" });
const header = (screen: Screen, name: string) =>
  screen.getByRole("columnheader", { name, exact: true });

/** Nomes das chaves na ordem em que as linhas aparecem, pelo rótulo do checkbox de cada uma. */
const order = (screen: Screen) =>
  screen
    .getByRole("checkbox")
    .elements()
    .map((el) => (el.getAttribute("aria-label") ?? "").replace("Select ", ""));

async function pickStatus(label: string) {
  await page.getByRole("option", { name: label, exact: true }).click();
}

beforeEach(async () => {
  fetchCurrent.mockReset();
  fetchKeys.mockReset();
  revokeKey.mockReset();
  fetchCurrent.mockResolvedValue(makeCurrent());
  serveKeys(makeKeys());
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("ApiKeysTablePage", () => {
  describe("loading, error and empty", () => {
    it("shows an accessible loading notice while the workspace loads", async () => {
      fetchCurrent.mockReturnValue(new Promise(() => {}));
      const screen = await render(<Harness />);

      await expect
        .element(screen.getByRole("heading", { name: "API keys", exact: true, level: 1 }))
        .toBeVisible();
      await expect.element(screen.getByText("Loading API keys.")).toBeInTheDocument();
      expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
      await expect.element(screen.getByRole("link", { name: "API", exact: true })).toBeVisible();
      await expect
        .element(screen.getByRole("searchbox", { name: "Filter API keys" }))
        .not.toBeInTheDocument();
      expect(fetchKeys).not.toHaveBeenCalled();
    });

    it("shows the same loading notice while the keys load", async () => {
      fetchKeys.mockReturnValue(new Promise(() => {}));
      const screen = await render(<Harness />);

      await vi.waitFor(() => expect(fetchKeys).toHaveBeenCalled());
      await expect.element(screen.getByText("Loading API keys.")).toBeInTheDocument();
      expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
      await expect.element(screen.getByText("No API keys.")).not.toBeInTheDocument();
    });

    it("shows an error alert and Retry refetches the keys", async () => {
      fetchKeys.mockRejectedValueOnce(new Error("network error"));
      const screen = await render(<Harness />);

      await expect.element(screen.getByRole("alert")).toHaveTextContent("Could not load API keys");
      await expect
        .element(screen.getByRole("heading", { name: "API keys", exact: true, level: 1 }))
        .toBeVisible();
      expect(fetchKeys).toHaveBeenCalledTimes(1);

      await screen.getByRole("button", { name: "Retry" }).click();

      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      expect(fetchKeys).toHaveBeenCalledTimes(2);
      await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the error alert when the workspace fails, without listing keys", async () => {
      fetchCurrent.mockRejectedValueOnce(new Error("network error"));
      const screen = await render(<Harness />);

      await expect.element(screen.getByRole("alert")).toHaveTextContent("Could not load API keys");
      expect(fetchKeys).not.toHaveBeenCalled();

      await screen.getByRole("button", { name: "Retry" }).click();

      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      expect(fetchCurrent).toHaveBeenCalledTimes(2);
    });

    it("shows the empty state, still with the table headers", async () => {
      serveKeys([]);
      const screen = await render(<Harness />);

      await expect.element(screen.getByText("No API keys.", { exact: true })).toBeVisible();
      await expect
        .element(screen.getByText("No API keys match your filters."))
        .not.toBeInTheDocument();
      await expect.element(header(screen, "Key")).toBeVisible();
      expect(order(screen)).toEqual([]);
    });
  });

  describe("table", () => {
    it("has the columns Key, Created by, Permissions, Created, Last used and Status", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await expect.element(screen.getByRole("table", { name: "Issued API keys" })).toBeVisible();
      const titles = screen
        .getByRole("columnheader")
        .elements()
        .map((el) => el.textContent?.trim());
      expect(titles).toEqual([
        "Select",
        "Key",
        "Created by",
        "Permissions",
        "Created",
        "Last used",
        "Status",
        "Actions",
      ]);
    });

    it("shows name and token prefix, member, dates and status of a key that never ran", async () => {
      const screen = await render(<Harness />);

      const row = keyRow(screen, "Reporting script");
      await expect.element(row).toBeVisible();
      await expect
        .element(rowCell(screen, "Reporting script", 1))
        .toHaveTextContent("Reporting script");
      await expect.element(rowCell(screen, "Reporting script", 1)).toHaveTextContent("vyz_rp02…");
      await expect.element(rowCell(screen, "Reporting script", 2)).toHaveTextContent(/^Bianca$/);
      await expect.element(rowCell(screen, "Reporting script", 3)).toHaveTextContent("Read, Write");
      await expect.element(rowCell(screen, "Reporting script", 4)).toHaveTextContent(/^Jan 5$/);
      await expect.element(rowCell(screen, "Reporting script", 5)).toHaveTextContent(/^Never$/);
      await expect.element(rowCell(screen, "Reporting script", 6)).toHaveTextContent(/^Active$/);
    });

    it("shows the last used date, Full access as plain text and Inactive for a revoked key", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await expect.element(rowCell(screen, "CI deploy", 3)).toHaveTextContent(/^Full access$/);
      await expect.element(rowCell(screen, "CI deploy", 4)).toHaveTextContent(/^Feb 1$/);
      await expect.element(rowCell(screen, "CI deploy", 5)).toHaveTextContent(/^Feb 10$/);
      await expect
        .element(screen.getByRole("button", { name: "View permissions for CI deploy" }))
        .not.toBeInTheDocument();

      await expect.element(rowCell(screen, "Old integration", 1)).toHaveTextContent("vyz_ol03…");
      await expect.element(rowCell(screen, "Old integration", 5)).toHaveTextContent(/^Mar 15$/);
      await expect.element(rowCell(screen, "Old integration", 6)).toHaveTextContent(/^Inactive$/);
    });

    it("orders by Created, newest first, with revoked keys included", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      expect(order(screen)).toEqual(["Old integration", "CI deploy", "Reporting script"]);
      await expect.element(header(screen, "Created")).toHaveAttribute("aria-sort", "descending");
      await expect.element(header(screen, "Key")).not.toHaveAttribute("aria-sort");
    });

    it("View permissions opens a popover with each permission and its description", async () => {
      const screen = await render(<Harness />);

      const trigger = screen.getByRole("button", {
        name: "View permissions for Reporting script",
      });
      await expect.element(trigger).toHaveTextContent("Read, Write");
      await trigger.click();

      const popover = page.getByRole("dialog");
      await expect.element(popover).toBeVisible();
      await expect.element(popover).toHaveTextContent("Read all workspace data available to you");
      await expect
        .element(popover)
        .toHaveTextContent("Read and write all workspace data available to you");
      await expect.element(popover.getByText("Read", { exact: true })).toBeVisible();
      await expect.element(popover.getByText("Write", { exact: true })).toBeVisible();
      // Só o que a chave tem.
      await expect.element(popover).not.toHaveTextContent("Create issues");
      await expect.element(popover).not.toHaveTextContent("Access admin-only API features");

      await userEvent.keyboard("{Escape}");
      await expect.element(popover).not.toBeInTheDocument();
      await expect.element(trigger).toHaveFocus();
    });

    it("View permissions also works on a revoked key", async () => {
      const screen = await render(<Harness />);

      const trigger = screen.getByRole("button", {
        name: "View permissions for Old integration",
      });
      await expect.element(trigger).toHaveTextContent("Admin, Create issues");
      await trigger.click();

      const popover = page.getByRole("dialog");
      await expect.element(popover).toHaveTextContent("Access admin-only API features");
      await expect.element(popover).toHaveTextContent("Create and update issues");
      await expect.element(popover).not.toHaveTextContent("Create issue comments");
    });

    it("the API link at the top points to /settings/api", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      const link = screen.getByRole("link", { name: "API", exact: true });
      await expect.element(link).toHaveAttribute("href", "/settings/api");
      await link.click();

      await expect.element(currentUrl(screen)).toHaveTextContent("/settings/api");
      await expect.element(currentUrl(screen)).not.toHaveTextContent("/settings/api/keys");
    });
  });

  describe("scope", () => {
    it("an admin lists the keys of the Workspace", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      expect(fetchKeys).toHaveBeenCalledWith("workspace");
      expect(fetchKeys.mock.calls.every(([scope]) => scope === "workspace")).toBe(true);
    });

    it("a regular Member lists only their own keys, in the same table", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("member"));
      serveKeys([makeKey({ id: CI_ID, name: "CI deploy", tokenPrefix: "vyz_ci01" })]);
      const screen = await render(<Harness />);

      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await expect.element(header(screen, "Created by")).toBeVisible();
      expect(fetchKeys).toHaveBeenCalledWith("mine");
      expect(fetchKeys.mock.calls.every(([scope]) => scope === "mine")).toBe(true);
    });
  });

  describe("sorting (URL)", () => {
    it("clicking a header sorts by it, writes sort and dir to the URL, and clicking again flips it", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await header(screen, "Key").getByRole("button", { name: "Key" }).click();

      await expect
        .element(currentUrl(screen))
        .toHaveTextContent("/settings/api/keys?sort=name&dir=desc");
      await expect
        .poll(() => order(screen))
        .toEqual(["Reporting script", "Old integration", "CI deploy"]);
      await expect.element(header(screen, "Key")).toHaveAttribute("aria-sort", "descending");
      await expect.element(header(screen, "Created")).not.toHaveAttribute("aria-sort");

      await header(screen, "Key").getByRole("button", { name: "Key" }).click();

      await expect
        .element(currentUrl(screen))
        .toHaveTextContent("/settings/api/keys?sort=name&dir=asc");
      await expect
        .poll(() => order(screen))
        .toEqual(["CI deploy", "Old integration", "Reporting script"]);
      await expect.element(header(screen, "Key")).toHaveAttribute("aria-sort", "ascending");
    });

    it("clicking another header starts it in descending order", async () => {
      const screen = await render(<Harness initialPath="/settings/api/keys?sort=name&dir=asc" />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await header(screen, "Created").getByRole("button", { name: "Created" }).click();

      await expect
        .element(currentUrl(screen))
        .toHaveTextContent("/settings/api/keys?sort=created&dir=desc");
      await expect
        .poll(() => order(screen))
        .toEqual(["Old integration", "CI deploy", "Reporting script"]);
    });

    it("opens already sorted when the URL has sort and dir", async () => {
      const screen = await render(<Harness initialPath="/settings/api/keys?sort=name&dir=asc" />);

      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      expect(order(screen)).toEqual(["CI deploy", "Old integration", "Reporting script"]);
      await expect.element(header(screen, "Key")).toHaveAttribute("aria-sort", "ascending");
      await expect.element(header(screen, "Created")).not.toHaveAttribute("aria-sort");
      await expect
        .element(currentUrl(screen))
        .toHaveTextContent("/settings/api/keys?sort=name&dir=asc");
    });

    it("Last used ascending puts the keys that never ran first", async () => {
      const screen = await render(
        <Harness initialPath="/settings/api/keys?sort=lastUsed&dir=asc" />,
      );

      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      expect(order(screen)).toEqual(["Reporting script", "CI deploy", "Old integration"]);
    });

    it("keeps the other search params when sorting", async () => {
      const screen = await render(<Harness initialPath="/settings/api/keys?status=active" />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await header(screen, "Key").getByRole("button", { name: "Key" }).click();

      await expect
        .element(currentUrl(screen))
        .toHaveTextContent("/settings/api/keys?status=active&sort=name&dir=desc");
      await expect.poll(() => order(screen)).toEqual(["Reporting script", "CI deploy"]);
    });

    it("falls back to Created descending for an unknown sort key", async () => {
      const screen = await render(<Harness initialPath="/settings/api/keys?sort=bogus&dir=up" />);

      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      expect(order(screen)).toEqual(["Old integration", "CI deploy", "Reporting script"]);
      await expect.element(header(screen, "Created")).toHaveAttribute("aria-sort", "descending");
    });
  });

  describe("filter by key or member (URL)", () => {
    it("has an accessible search field with the placeholder from Linear", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await expect
        .element(filterInput(screen))
        .toHaveAttribute("placeholder", "Filter by key or member…");
      await expect.element(filterInput(screen)).toHaveValue("");
    });

    it("filters by key name, ignoring case, and writes q to the URL", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await filterInput(screen).fill("DEPLOY");

      await expect.element(currentUrl(screen)).toHaveTextContent("/settings/api/keys?q=DEPLOY");
      await expect.poll(() => order(screen)).toEqual(["CI deploy"]);
    });

    it("filters by member name", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await filterInput(screen).fill("bianca");

      await expect.element(currentUrl(screen)).toHaveTextContent("/settings/api/keys?q=bianca");
      await expect.poll(() => order(screen)).toEqual(["Reporting script"]);
    });

    it("filters by member e-mail", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await filterInput(screen).fill("corp.test");

      await expect.element(currentUrl(screen)).toHaveTextContent("/settings/api/keys?q=corp.test");
      await expect.poll(() => order(screen)).toEqual(["Reporting script"]);
    });

    it("opens filtered when the URL has q, and clearing the field removes q", async () => {
      const screen = await render(<Harness initialPath="/settings/api/keys?q=deploy" />);

      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await expect.element(filterInput(screen)).toHaveValue("deploy");
      expect(order(screen)).toEqual(["CI deploy"]);

      await filterInput(screen).fill("");

      await expect.element(currentUrl(screen)).toHaveTextContent(/^\/settings\/api\/keys$/);
      await expect
        .poll(() => order(screen))
        .toEqual(["Old integration", "CI deploy", "Reporting script"]);
    });

    it("shows the no-results message when nothing matches", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await filterInput(screen).fill("zzz");

      await expect.element(screen.getByText("No API keys match your filters.")).toBeVisible();
      await expect
        .element(screen.getByText("No API keys.", { exact: true }))
        .not.toBeInTheDocument();
      expect(order(screen)).toEqual([]);
      // A tabela e os controles continuam, para o usuário ajustar o filtro.
      await expect.element(filterInput(screen)).toHaveValue("zzz");
      await expect.element(header(screen, "Key")).toBeVisible();
    });
  });

  describe("status filter (URL)", () => {
    it("offers All API keys, Active and Inactive, starting on All API keys", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await expect.element(statusSelect(screen)).toHaveTextContent("All API keys");
      await statusSelect(screen).click();

      await expect.element(page.getByRole("option", { name: "All API keys" })).toBeVisible();
      await expect.element(page.getByRole("option", { name: "Active", exact: true })).toBeVisible();
      await expect
        .element(page.getByRole("option", { name: "Inactive", exact: true }))
        .toBeVisible();
      expect(document.querySelectorAll('[role="option"]')).toHaveLength(3);
    });

    it("Active writes status=active and hides revoked keys", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await statusSelect(screen).click();
      await pickStatus("Active");

      await expect
        .element(currentUrl(screen))
        .toHaveTextContent("/settings/api/keys?status=active");
      await expect.element(statusSelect(screen)).toHaveTextContent("Active");
      await expect.poll(() => order(screen)).toEqual(["CI deploy", "Reporting script"]);
    });

    it("Inactive writes status=inactive and shows only revoked keys", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await statusSelect(screen).click();
      await pickStatus("Inactive");

      await expect
        .element(currentUrl(screen))
        .toHaveTextContent("/settings/api/keys?status=inactive");
      await expect.poll(() => order(screen)).toEqual(["Old integration"]);
    });

    it("All API keys removes status from the URL", async () => {
      const screen = await render(<Harness initialPath="/settings/api/keys?status=inactive" />);

      await expect.element(keyRow(screen, "Old integration")).toBeVisible();
      await expect.element(statusSelect(screen)).toHaveTextContent("Inactive");
      expect(order(screen)).toEqual(["Old integration"]);

      await statusSelect(screen).click();
      await pickStatus("All API keys");

      await expect.element(currentUrl(screen)).toHaveTextContent(/^\/settings\/api\/keys$/);
      await expect
        .poll(() => order(screen))
        .toEqual(["Old integration", "CI deploy", "Reporting script"]);
    });

    it("keeps q when the status changes and combines both filters", async () => {
      const screen = await render(<Harness initialPath="/settings/api/keys?q=andre" />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      expect(order(screen)).toEqual(["Old integration", "CI deploy"]);

      await statusSelect(screen).click();
      await pickStatus("Inactive");

      await expect
        .element(currentUrl(screen))
        .toHaveTextContent("/settings/api/keys?q=andre&status=inactive");
      await expect.poll(() => order(screen)).toEqual(["Old integration"]);
    });

    it("shows the no-results message when the status leaves nothing", async () => {
      serveKeys([makeKey({ id: CI_ID, name: "CI deploy" })]);
      const screen = await render(<Harness initialPath="/settings/api/keys?status=inactive" />);

      await expect.element(screen.getByText("No API keys match your filters.")).toBeVisible();
      await expect
        .element(screen.getByText("No API keys.", { exact: true }))
        .not.toBeInTheDocument();
    });
  });

  describe("row menu", () => {
    async function openRowMenu(screen: Screen, name: string) {
      const row = keyRow(screen, name);
      await row.hover();
      await row.getByRole("button", { name: "Open menu" }).click();
    }

    it("has only Revoke API key, without Edit API key", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await openRowMenu(screen, "CI deploy");

      await expect.element(page.getByRole("menuitem", { name: "Revoke API key" })).toBeVisible();
      await expect
        .element(page.getByRole("menuitem", { name: "Edit API key" }))
        .not.toBeInTheDocument();
      expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(1);
    });

    it("a revoked key has no menu and its checkbox is disabled", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "Old integration")).toBeVisible();

      await expect
        .element(keyRow(screen, "Old integration").getByRole("button", { name: "Open menu" }))
        .not.toBeInTheDocument();
      await expect.element(checkboxFor(screen, "Old integration")).toBeDisabled();
      await expect.element(checkboxFor(screen, "CI deploy")).toBeEnabled();
      expect(screen.getByRole("button", { name: "Open menu" }).elements()).toHaveLength(2);
    });

    it("opens a Confirm focused on Cancel; cancelling does not revoke", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await openRowMenu(screen, "CI deploy");
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();

      const dialog = page.getByRole("alertdialog");
      await expect.element(dialog).toBeVisible();
      await expect.element(dialog).toHaveTextContent("Revoke API key?");
      await expect.element(dialog).toHaveTextContent("CI deploy");
      await expect.element(dialog.getByRole("button", { name: "Cancel" })).toHaveFocus();

      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect.element(dialog).not.toBeInTheDocument();
      expect(revokeKey).not.toHaveBeenCalled();
      await expect.element(rowCell(screen, "CI deploy", 6)).toHaveTextContent(/^Active$/);
    });

    it("confirming revokes that key with { id }, shows the toast and the row turns Inactive", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await openRowMenu(screen, "CI deploy");
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Revoke API key" }).click();

      await vi.waitFor(() => expect(revokeKey).toHaveBeenCalledWith({ id: CI_ID }));
      expect(revokeKey).toHaveBeenCalledTimes(1);
      await expect.element(screen.getByText("API key revoked")).toBeVisible();
      await expect.element(rowCell(screen, "CI deploy", 6)).toHaveTextContent(/^Inactive$/);
      await expect
        .element(keyRow(screen, "CI deploy").getByRole("button", { name: "Open menu" }))
        .not.toBeInTheDocument();
      await expect.element(checkboxFor(screen, "CI deploy")).toBeDisabled();
      // Só recarrega: continua na tabela.
      await expect.element(currentUrl(screen)).toHaveTextContent(/^\/settings\/api\/keys$/);
    });

    it("shows the error toast and keeps the key active when revoking fails", async () => {
      serveKeys(makeKeys(), [CI_ID]);
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await openRowMenu(screen, "CI deploy");
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Revoke API key" }).click();

      await expect.element(screen.getByText("Could not revoke API key")).toBeVisible();
      await expect.element(screen.getByText("API key revoked")).not.toBeInTheDocument();
      await expect.element(rowCell(screen, "CI deploy", 6)).toHaveTextContent(/^Active$/);
    });
  });

  describe("selection and bulk revoke", () => {
    it("shows no bar until a checkbox is marked", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await expect.element(bulkBar(screen)).not.toBeInTheDocument();
      await expect.element(checkboxFor(screen, "CI deploy")).not.toBeChecked();
    });

    it("marking one key shows the bar with 1 selected, Actions and Clear selected", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await checkboxFor(screen, "CI deploy").click();

      await expect.element(checkboxFor(screen, "CI deploy")).toBeChecked();
      await expect.element(keyRow(screen, "CI deploy")).toHaveAttribute("data-state", "selected");
      await expect.element(bulkBar(screen)).toBeVisible();
      await expect.element(bulkBar(screen)).toHaveTextContent("1 selected");
      await expect
        .element(bulkBar(screen).getByRole("button", { name: "Actions", exact: true }))
        .toBeVisible();
      await expect
        .element(bulkBar(screen).getByRole("button", { name: "Clear selected" }))
        .toBeVisible();
    });

    it("marking a second key shows 2 selected, and unmarking goes back down", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();

      await checkboxFor(screen, "CI deploy").click();
      await checkboxFor(screen, "Reporting script").click();
      await expect.element(bulkBar(screen)).toHaveTextContent("2 selected");

      await checkboxFor(screen, "CI deploy").click();
      await expect.element(bulkBar(screen)).toHaveTextContent("1 selected");
      await expect.element(checkboxFor(screen, "CI deploy")).not.toBeChecked();

      await checkboxFor(screen, "Reporting script").click();
      await expect.element(bulkBar(screen)).not.toBeInTheDocument();
    });

    it("Actions has only Revoke API key", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();

      await bulkBar(screen).getByRole("button", { name: "Actions", exact: true }).click();

      await expect.element(page.getByRole("menuitem", { name: "Revoke API key" })).toBeVisible();
      expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(1);
    });

    it("Clear selected clears the selection and removes the bar", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await checkboxFor(screen, "Reporting script").click();
      await expect.element(bulkBar(screen)).toHaveTextContent("2 selected");

      await bulkBar(screen).getByRole("button", { name: "Clear selected" }).click();

      await expect.element(bulkBar(screen)).not.toBeInTheDocument();
      await expect.element(checkboxFor(screen, "CI deploy")).not.toBeChecked();
      await expect.element(checkboxFor(screen, "Reporting script")).not.toBeChecked();
      expect(revokeKey).not.toHaveBeenCalled();
    });

    it("Escape clears the selection when nothing else is open", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await expect.element(bulkBar(screen)).toBeVisible();

      await userEvent.keyboard("{Escape}");

      await expect.element(bulkBar(screen)).not.toBeInTheDocument();
      await expect.element(checkboxFor(screen, "CI deploy")).not.toBeChecked();
    });

    // O listener do Esc roda na captura de window, antes do Radix tirar o menu do DOM.
    it("Escape closes the Actions menu first and only the next one clears the selection", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await bulkBar(screen).getByRole("button", { name: "Actions", exact: true }).click();
      const menu = page.getByRole("menu");
      await expect.element(menu).toBeVisible();

      await userEvent.keyboard("{Escape}");

      await expect.element(menu).not.toBeInTheDocument();
      await expect.element(bulkBar(screen), { timeout: 1000 }).toHaveTextContent("1 selected");
      await expect.element(checkboxFor(screen, "CI deploy")).toBeChecked();

      await userEvent.keyboard("{Escape}");

      await expect.element(bulkBar(screen)).not.toBeInTheDocument();
      await expect.element(checkboxFor(screen, "CI deploy")).not.toBeChecked();
    });

    it("the bulk Confirm names the count; Cancel does not revoke and keeps the selection", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await checkboxFor(screen, "Reporting script").click();

      await bulkBar(screen).getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();

      const dialog = page.getByRole("alertdialog");
      await expect.element(dialog).toBeVisible();
      await expect.element(dialog).toHaveTextContent("Revoke API keys?");
      await expect.element(dialog).toHaveTextContent("Anything using the selected keys");
      await expect.element(dialog.getByRole("button", { name: "Cancel" })).toHaveFocus();

      await dialog.getByRole("button", { name: "Cancel" }).click();

      await expect.element(dialog).not.toBeInTheDocument();
      expect(revokeKey).not.toHaveBeenCalled();
      await expect.element(bulkBar(screen)).toHaveTextContent("2 selected");
    });

    it("Escape closes the bulk Confirm without clearing the selection or revoking", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await bulkBar(screen).getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect.element(dialog).toBeVisible();

      await userEvent.keyboard("{Escape}");

      await expect.element(dialog).not.toBeInTheDocument();
      expect(revokeKey).not.toHaveBeenCalled();
      await expect.element(bulkBar(screen)).toHaveTextContent("1 selected");
    });

    it("confirming revokes each selected key once, shows the toast and clears the bar", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await checkboxFor(screen, "Reporting script").click();

      await bulkBar(screen).getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Revoke API key" }).click();

      await vi.waitFor(() => expect(revokeKey).toHaveBeenCalledTimes(2));
      expect(revokeKey.mock.calls.map(([input]) => input.id).sort()).toEqual(
        [CI_ID, SCRIPT_ID].sort(),
      );
      await expect.element(screen.getByText("2 API keys revoked")).toBeVisible();
      await expect.element(bulkBar(screen)).not.toBeInTheDocument();
      await expect.element(rowCell(screen, "CI deploy", 6)).toHaveTextContent(/^Inactive$/);
      await expect.element(rowCell(screen, "Reporting script", 6)).toHaveTextContent(/^Inactive$/);
      await expect.element(checkboxFor(screen, "CI deploy")).toBeDisabled();
    });

    it("one selected key gets the singular Confirm and toast", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();

      await bulkBar(screen).getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect.element(dialog).toHaveTextContent("Revoke API key?");
      await expect.element(dialog).not.toHaveTextContent("Revoke API keys?");
      await dialog.getByRole("button", { name: "Revoke API key" }).click();

      await vi.waitFor(() => expect(revokeKey).toHaveBeenCalledWith({ id: CI_ID }));
      expect(revokeKey).toHaveBeenCalledTimes(1);
      await expect.element(screen.getByText("API key revoked")).toBeVisible();
      await expect.element(screen.getByText("1 API keys revoked")).not.toBeInTheDocument();
    });

    it("when one revocation fails it says so, and the bar is still cleared", async () => {
      serveKeys(makeKeys(), [SCRIPT_ID]);
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await checkboxFor(screen, "Reporting script").click();

      await bulkBar(screen).getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Revoke API key" }).click();

      await expect.element(screen.getByText("Could not revoke every API key")).toBeVisible();
      await expect.element(screen.getByText(/1 of 2 were not revoked/)).toBeVisible();
      expect(revokeKey).toHaveBeenCalledTimes(2);
      await expect.element(screen.getByText("2 API keys revoked")).not.toBeInTheDocument();
      await expect.element(bulkBar(screen)).not.toBeInTheDocument();
      // A que foi revogada mudou; a que falhou continua ativa.
      await expect.element(rowCell(screen, "CI deploy", 6)).toHaveTextContent(/^Inactive$/);
      await expect.element(rowCell(screen, "Reporting script", 6)).toHaveTextContent(/^Active$/);
    });

    it("only counts and revokes the selected keys that are still in view", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await checkboxFor(screen, "Reporting script").click();
      await expect.element(bulkBar(screen)).toHaveTextContent("2 selected");

      await filterInput(screen).fill("deploy");

      await expect.poll(() => order(screen)).toEqual(["CI deploy"]);
      await expect.element(bulkBar(screen)).toHaveTextContent("1 selected");

      await bulkBar(screen).getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Revoke API key" }).click();

      await vi.waitFor(() => expect(revokeKey).toHaveBeenCalledTimes(1));
      expect(revokeKey).toHaveBeenCalledWith({ id: CI_ID });
      await expect.element(screen.getByText("API key revoked")).toBeVisible();
    });

    it("drops the bar when the selected key leaves the view", async () => {
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await expect.element(bulkBar(screen)).toBeVisible();

      await statusSelect(screen).click();
      await pickStatus("Inactive");

      await expect.poll(() => order(screen)).toEqual(["Old integration"]);
      await expect.element(bulkBar(screen)).not.toBeInTheDocument();
    });
  });

  it.each(["dark", "light"] as const)(
    "has no axe violations in the %s theme, with the selection bar open",
    async (theme) => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<Harness />);
      await expect.element(keyRow(screen, "CI deploy")).toBeVisible();
      await checkboxFor(screen, "CI deploy").click();
      await expect.element(bulkBar(screen)).toBeVisible();

      expect(await axeViolations(document.body)).toEqual([]);
    },
  );
});
