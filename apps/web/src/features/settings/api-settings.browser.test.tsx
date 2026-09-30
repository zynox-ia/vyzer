/**
 * Settings → Administration → API (`/settings/api`, spec `settings-security-api-usage.md`, API.3)
 * num Chromium real. `@/services/workspace` e `@/services/api-keys` são trocados por `queryOptions`
 * e `mutationOptions` reais do TanStack Query apoiados em `vi.fn`, então a página roda com o mesmo
 * QueryClient, o mesmo `invalidateQueries` e o mesmo ToastProvider do app.
 */
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router";
import axe from "axe-core";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import type { ApiKey } from "./api-key-shared";
import { ApiSettingsPage } from "./api-settings";

type Policy = "all_members" | "admins";
type Current = {
  workspace: { id: string; name: string; apiKeyPolicy: Policy };
  member: { id: string; name: string; email: string; role: string };
};
type UpdateInput = { apiKeyPolicy?: Policy };

const fetchCurrent = vi.fn<() => Promise<Current>>();
const saveWorkspace = vi.fn<(input: UpdateInput) => Promise<unknown>>();
const fetchKeys = vi.fn<(scope: string) => Promise<ApiKey[]>>();
const revokeKey = vi.fn<(input: { id: string }) => Promise<void>>();

vi.mock("@/services/api", () => ({ api: { apiKey: { key: () => ["apiKey"] } } }));

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({ queryKey: ["workspace", "current"], queryFn: () => fetchCurrent() }),
  updateWorkspaceMutationOptions: () =>
    mutationOptions({ mutationFn: (input: UpdateInput) => saveWorkspace(input) }),
}));

vi.mock("@/services/api-keys", () => ({
  apiKeysQueryOptions: (scope: string) =>
    queryOptions({ queryKey: ["apiKey", "list", scope], queryFn: () => fetchKeys(scope) }),
  revokeApiKeyMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => revokeKey(input) }),
}));

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const CI_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SCRIPT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OLD_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function makeCurrent(role = "admin", apiKeyPolicy: Policy = "all_members"): Current {
  return {
    workspace: {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Zynox Dev",
      apiKeyPolicy,
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

function makeKeys(): ApiKey[] {
  return [
    makeKey({ id: CI_ID, name: "CI deploy" }),
    makeKey({ id: SCRIPT_ID, name: "Reporting script", permissions: ["read"] }),
    makeKey({ id: OLD_ID, name: "Old integration", revokedAt: "2026-04-01T12:00:00.000Z" }),
  ];
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

function Harness({ initialPath = "/settings/api" }: { initialPath?: string }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          {/* No app, a página vive no <main> do AppShell/SettingsLayout. */}
          <main>
            <ApiSettingsPage />
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

const policySelect = (screen: Screen) => screen.getByRole("combobox", { name: "API key creation" });
const issuedKeysLink = (screen: Screen) => screen.getByRole("link", { name: /Issued keys/ });

beforeEach(async () => {
  fetchCurrent.mockReset();
  saveWorkspace.mockReset();
  fetchKeys.mockReset();
  revokeKey.mockReset();
  fetchKeys.mockResolvedValue(makeKeys());
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("ApiSettingsPage", () => {
  describe("loading and errors", () => {
    it("shows an accessible loading notice under the title while the workspace loads", async () => {
      fetchCurrent.mockReturnValue(new Promise(() => {}));
      const screen = await render(<Harness />);

      await expect
        .element(screen.getByRole("heading", { name: "API", exact: true, level: 1 }))
        .toBeVisible();
      await expect.element(screen.getByText("Loading API settings.")).toBeInTheDocument();
      expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
      await expect
        .element(screen.getByRole("combobox", { name: "API key creation" }))
        .not.toBeInTheDocument();
      expect(fetchKeys).not.toHaveBeenCalled();
    });

    it("shows an error alert and Retry refetches the workspace", async () => {
      fetchCurrent.mockRejectedValueOnce(new Error("network error"));
      const screen = await render(<Harness />);

      await expect
        .element(screen.getByRole("alert"))
        .toHaveTextContent("Could not load API settings");
      await expect
        .element(screen.getByRole("heading", { name: "API", exact: true, level: 1 }))
        .toBeVisible();
      expect(fetchCurrent).toHaveBeenCalledTimes(1);
      await expect
        .element(screen.getByRole("combobox", { name: "API key creation" }))
        .not.toBeInTheDocument();

      fetchCurrent.mockResolvedValue(makeCurrent());
      await screen.getByRole("button", { name: "Retry" }).click();

      await expect.element(policySelect(screen)).toBeVisible();
      expect(fetchCurrent).toHaveBeenCalledTimes(2);
      await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("content", () => {
    it("shows the title, the opening sentence and the API keys section", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);

      await expect
        .element(screen.getByRole("heading", { name: "API", exact: true, level: 1 }))
        .toBeVisible();
      await expect
        .element(screen.getByText("Use API keys to connect integrations and tools to Vyzer"))
        .toBeVisible();
      await expect
        .element(screen.getByRole("heading", { name: "API keys", exact: true, level: 2 }))
        .toBeVisible();
      await expect.element(screen.getByText("API key creation", { exact: true })).toBeVisible();
      await expect
        .element(screen.getByText("Choose which members can create personal API keys"))
        .toBeVisible();
      await expect.element(screen.getByText("Issued keys", { exact: true })).toBeVisible();
    });

    it("links to Security & access, which opens /settings/security", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);

      const link = screen.getByRole("link", { name: "Security & access" });
      await expect.element(link).toBeVisible();
      await expect.element(link).toHaveAttribute("href", "/settings/security");
      await link.click();

      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent("/settings/security");
    });

    it("has no OAuth applications, no Webhooks, no Docs and no Slack link", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);
      await expect.element(policySelect(screen)).toBeVisible();

      await expect.element(screen.getByText(/OAuth/i)).not.toBeInTheDocument();
      await expect.element(screen.getByText(/Webhooks?/i)).not.toBeInTheDocument();
      await expect.element(screen.getByRole("link", { name: /docs/i })).not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("link", { name: /Join our Slack/i }))
        .not.toBeInTheDocument();
      await expect.element(screen.getByText(/Slack/i)).not.toBeInTheDocument();
    });
  });

  describe("API key creation", () => {
    it.each([
      ["all_members", "All members"],
      ["admins", "Only admins"],
    ] as const)("shows the current policy %s as %s", async (policy, label) => {
      fetchCurrent.mockResolvedValue(makeCurrent("admin", policy));
      const screen = await render(<Harness />);

      await expect.element(policySelect(screen)).toHaveTextContent(label);
      await expect.element(policySelect(screen)).toBeEnabled();
    });

    it("offers exactly All members and Only admins", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);

      await policySelect(screen).click();

      await expect.element(page.getByRole("option", { name: "All members" })).toBeVisible();
      await expect.element(page.getByRole("option", { name: "Only admins" })).toBeVisible();
      expect(document.querySelectorAll('[role="option"]')).toHaveLength(2);
      expect(saveWorkspace).not.toHaveBeenCalled();
    });

    it("an admin choosing Only admins saves { apiKeyPolicy } and shows the Saved toast", async () => {
      fetchCurrent.mockResolvedValueOnce(makeCurrent("admin", "all_members"));
      saveWorkspace.mockResolvedValue({});
      const screen = await render(<Harness />);
      await expect.element(policySelect(screen)).toHaveTextContent("All members");

      fetchCurrent.mockResolvedValue(makeCurrent("admin", "admins"));
      await policySelect(screen).click();
      await page.getByRole("option", { name: "Only admins" }).click();

      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
      expect(saveWorkspace.mock.calls[0]![0]).toEqual({ apiKeyPolicy: "admins" });
      await expect.element(screen.getByText("Saved", { exact: true })).toBeVisible();
      await vi.waitFor(() => expect(fetchCurrent).toHaveBeenCalledTimes(2));
      await expect.element(policySelect(screen)).toHaveTextContent("Only admins");
    });

    it("the Saved toast has Undo, which saves the previous policy again", async () => {
      fetchCurrent.mockResolvedValueOnce(makeCurrent("admin", "all_members"));
      saveWorkspace.mockResolvedValue({});
      const screen = await render(<Harness />);
      await expect.element(policySelect(screen)).toHaveTextContent("All members");

      fetchCurrent.mockResolvedValue(makeCurrent("admin", "admins"));
      await policySelect(screen).click();
      await page.getByRole("option", { name: "Only admins" }).click();
      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
      await expect.element(policySelect(screen)).toHaveTextContent("Only admins");

      fetchCurrent.mockResolvedValue(makeCurrent("admin", "all_members"));
      await screen.getByRole("button", { name: "Undo" }).click();

      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(2));
      expect(saveWorkspace.mock.calls[1]![0]).toEqual({ apiKeyPolicy: "all_members" });
      await expect.element(policySelect(screen)).toHaveTextContent("All members");
    });

    it("an admin can also go from Only admins back to All members", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("admin", "admins"));
      saveWorkspace.mockResolvedValue({});
      const screen = await render(<Harness />);
      await expect.element(policySelect(screen)).toHaveTextContent("Only admins");

      await policySelect(screen).click();
      await page.getByRole("option", { name: "All members" }).click();

      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
      expect(saveWorkspace.mock.calls[0]![0]).toEqual({ apiKeyPolicy: "all_members" });
    });

    it("choosing the value that is already selected does not call the mutation", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("admin", "all_members"));
      const screen = await render(<Harness />);
      await expect.element(policySelect(screen)).toHaveTextContent("All members");

      await policySelect(screen).click();
      const listbox = page.getByRole("listbox");
      await expect.element(listbox).toBeVisible();
      await page.getByRole("option", { name: "All members" }).click();

      await expect.element(listbox).not.toBeInTheDocument();
      expect(saveWorkspace).not.toHaveBeenCalled();
      await expect.element(screen.getByText("Saved", { exact: true })).not.toBeInTheDocument();
      await expect.element(policySelect(screen)).toHaveTextContent("All members");
    });

    it("a failed save shows an error toast and keeps the previous policy", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("admin", "all_members"));
      saveWorkspace.mockRejectedValue(new Error("boom"));
      const screen = await render(<Harness />);
      await expect.element(policySelect(screen)).toHaveTextContent("All members");

      await policySelect(screen).click();
      await page.getByRole("option", { name: "Only admins" }).click();

      await expect.element(screen.getByText("Could not save API key creation")).toBeVisible();
      await expect.element(screen.getByText("Saved", { exact: true })).not.toBeInTheDocument();
      await expect.element(policySelect(screen)).toHaveTextContent("All members");
      await expect.element(policySelect(screen)).toBeEnabled();
      expect(saveWorkspace).toHaveBeenCalledTimes(1);
    });

    it("a regular Member sees the policy but the Select is disabled", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("member", "admins"));
      const screen = await render(<Harness />);

      await expect.element(policySelect(screen)).toHaveTextContent("Only admins");
      await expect.element(policySelect(screen)).toBeDisabled();
      expect(saveWorkspace).not.toHaveBeenCalled();
    });
  });

  describe("Issued keys", () => {
    it("is a link to /settings/api/keys that opens the table", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);

      const link = issuedKeysLink(screen);
      await expect.element(link).toBeVisible();
      await expect.element(link).toHaveAttribute("href", "/settings/api/keys");
      await expect.element(link).toHaveTextContent("View and manage issued API keys");
      await link.click();

      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent("/settings/api/keys");
    });

    it("counts only the active keys", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);

      // Três chaves na lista, uma revogada.
      await expect.element(issuedKeysLink(screen)).toHaveTextContent("2 API keys");
    });

    it("uses the singular for one active key", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      fetchKeys.mockResolvedValue([
        makeKey({ id: CI_ID, name: "CI deploy" }),
        makeKey({ id: OLD_ID, name: "Old integration", revokedAt: "2026-04-01T12:00:00.000Z" }),
      ]);
      const screen = await render(<Harness />);

      await expect.element(issuedKeysLink(screen)).toHaveTextContent("1 API key");
      expect(issuedKeysLink(screen).element().textContent).not.toContain("1 API keys");
    });

    it("counts zero when all the keys are revoked", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      fetchKeys.mockResolvedValue([
        makeKey({ id: OLD_ID, name: "Old integration", revokedAt: "2026-04-01T12:00:00.000Z" }),
      ]);
      const screen = await render(<Harness />);

      await expect.element(issuedKeysLink(screen)).toHaveTextContent("0 API keys");
    });

    it("shows a placeholder, not a count, while the keys load", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      fetchKeys.mockReturnValue(new Promise(() => {}));
      const screen = await render(<Harness />);

      await expect.element(issuedKeysLink(screen)).toBeVisible();
      await expect.element(policySelect(screen)).toBeEnabled();
      expect(issuedKeysLink(screen).element().textContent).not.toMatch(/\d+ API keys?/);
      await expect.element(screen.getByText("Unavailable")).not.toBeInTheDocument();
    });

    it("an admin lists the keys with scope workspace", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("admin"));
      const screen = await render(<Harness />);
      await expect.element(issuedKeysLink(screen)).toHaveTextContent("2 API keys");

      expect(fetchKeys).toHaveBeenCalledWith("workspace");
      expect(fetchKeys.mock.calls.every(([scope]) => scope === "workspace")).toBe(true);
    });

    it("a regular Member lists only their own keys with scope mine", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("member"));
      fetchKeys.mockResolvedValue([makeKey({ id: CI_ID, name: "CI deploy" })]);
      const screen = await render(<Harness />);
      await expect.element(issuedKeysLink(screen)).toHaveTextContent("1 API key");

      expect(fetchKeys).toHaveBeenCalledWith("mine");
      expect(fetchKeys.mock.calls.every(([scope]) => scope === "mine")).toBe(true);
    });

    it("shows Unavailable when the list fails, without breaking the page", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      saveWorkspace.mockResolvedValue({});
      fetchKeys.mockRejectedValue(new Error("boom"));
      const screen = await render(<Harness />);

      await expect.element(screen.getByText("Unavailable")).toBeVisible();
      await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("heading", { name: "API", exact: true, level: 1 }))
        .toBeVisible();
      await expect.element(issuedKeysLink(screen)).toHaveAttribute("href", "/settings/api/keys");
      // O resto da página continua funcionando.
      await policySelect(screen).click();
      await page.getByRole("option", { name: "Only admins" }).click();
      await vi.waitFor(() => expect(saveWorkspace).toHaveBeenCalledTimes(1));
    });
  });

  it.each(["dark", "light"] as const)("has no axe violations in the %s theme", async (theme) => {
    document.documentElement.dataset.theme = theme;
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);
    await expect.element(issuedKeysLink(screen)).toHaveTextContent("2 API keys");

    expect(await axeViolations(document.body)).toEqual([]);
  });
});
