/** Security & access (Personal API keys) interaction in a real Chromium browser. */
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
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import type { ApiKey } from "./api-key-shared";
import { SecurityAccessPage } from "./security-access";

const fetchKeys = vi.fn<() => Promise<ApiKey[]>>();
const revokeKey = vi.fn<(input: { id: string }) => Promise<void>>();

vi.mock("@/services/api", () => ({ api: { apiKey: { key: () => ["apiKey"] } } }));

vi.mock("@/services/api-keys", () => ({
  apiKeysQueryOptions: (scope: string) =>
    queryOptions({ queryKey: ["apiKey", "list", scope], queryFn: () => fetchKeys() }),
  revokeApiKeyMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => revokeKey(input) }),
}));

const MEMBER_ID = "22222222-2222-4222-8222-222222222222";
const CI_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SCRIPT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OLD_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function makeKey(overrides: Partial<ApiKey> & Pick<ApiKey, "id" | "name">): ApiKey {
  return {
    memberId: MEMBER_ID,
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
    makeKey({ id: CI_ID, name: "CI deploy", lastUsedAt: "2026-02-10T12:00:00.000Z" }),
    makeKey({
      id: SCRIPT_ID,
      name: "Reporting script",
      permissions: ["read", "write"],
      createdAt: "2026-03-01T12:00:00.000Z",
    }),
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

function Harness({ initialPath = "/settings/security" }: { initialPath?: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <main>
            <SecurityAccessPage />
            <LocationOutput />
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  fetchKeys.mockReset();
  revokeKey.mockReset();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("SecurityAccessPage", () => {
  it("shows an accessible loading notice while the keys load", async () => {
    fetchKeys.mockReturnValue(new Promise(() => {}));
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("heading", { name: "Security & access" })).toBeVisible();
    await expect.element(screen.getByText("Loading API keys.")).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expect
      .element(screen.getByRole("list", { name: "Personal API keys" }))
      .not.toBeInTheDocument();
  });

  it("shows the empty state with the New API key button", async () => {
    fetchKeys.mockResolvedValue([]);
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("No API keys")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "New API key" })).toBeVisible();
    await expect
      .element(screen.getByRole("list", { name: "Personal API keys" }))
      .not.toBeInTheDocument();
  });

  it("lists the keys with count, dates and permissions", async () => {
    fetchKeys.mockResolvedValue(makeKeys());
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("heading", { name: "2 API keys" })).toBeVisible();
    const rows = screen.getByRole("list", { name: "Personal API keys" }).getByRole("listitem");
    await expect.element(rows.nth(0)).toHaveTextContent("CI deploy");
    await expect.element(rows.nth(0)).toHaveTextContent("Created Jan 5");
    await expect.element(rows.nth(0)).toHaveTextContent("Last used Feb 10");
    await expect.element(rows.nth(0)).toHaveTextContent("Full access");
    await expect.element(rows.nth(1)).toHaveTextContent("Reporting script");
    await expect.element(rows.nth(1)).toHaveTextContent("Created Mar 1");
    await expect.element(rows.nth(1)).toHaveTextContent("Never used");
    await expect.element(rows.nth(1)).toHaveTextContent("Read, Write");
    await expect.element(rows.nth(1)).not.toHaveTextContent("Last used");
  });

  it("uses the singular for a single key", async () => {
    fetchKeys.mockResolvedValue(makeKeys().slice(0, 1));
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("heading", { name: "1 API key" })).toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "1 API keys" }))
      .not.toBeInTheDocument();
  });

  it("hides revoked keys from the list and from the count", async () => {
    fetchKeys.mockResolvedValue([
      ...makeKeys(),
      makeKey({ id: OLD_ID, name: "Old integration", revokedAt: "2026-04-01T12:00:00.000Z" }),
    ]);
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("heading", { name: "2 API keys" })).toBeVisible();
    await expect.element(screen.getByText("CI deploy")).toBeVisible();
    await expect.element(screen.getByText("Old integration")).not.toBeInTheDocument();
    const rows = screen.getByRole("list", { name: "Personal API keys" }).getByRole("listitem");
    expect(rows.elements()).toHaveLength(2);
  });

  it("shows the empty state when every key is revoked", async () => {
    fetchKeys.mockResolvedValue([
      makeKey({ id: OLD_ID, name: "Old integration", revokedAt: "2026-04-01T12:00:00.000Z" }),
    ]);
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("No API keys")).toBeVisible();
    await expect.element(screen.getByText("Old integration")).not.toBeInTheDocument();
  });

  it("links each key name to its detail page", async () => {
    fetchKeys.mockResolvedValue(makeKeys());
    const screen = await render(<Harness />);

    const link = screen.getByRole("link", { name: "Reporting script" });
    await expect.element(link).toHaveAttribute("href", `/settings/security/api-keys/${SCRIPT_ID}`);
    await link.click();
    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent(`/settings/security/api-keys/${SCRIPT_ID}`);
  });

  it("shows an error alert and Retry refetches the keys", async () => {
    fetchKeys.mockRejectedValueOnce(new Error("network error"));
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("alert")).toHaveTextContent("Could not load API keys");
    expect(fetchKeys).toHaveBeenCalledTimes(1);
    fetchKeys.mockResolvedValue(makeKeys());
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(screen.getByText("CI deploy")).toBeVisible();
    expect(fetchKeys).toHaveBeenCalledTimes(2);
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  it("New API key navigates to the create page", async () => {
    fetchKeys.mockResolvedValue([]);
    const screen = await render(<Harness />);

    await screen.getByRole("button", { name: "New API key" }).click();

    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/security/api-keys/new");
  });

  describe("row menu", () => {
    const openRowMenu = async (screen: Awaited<ReturnType<typeof render>>, index: number) => {
      const row = screen
        .getByRole("list", { name: "Personal API keys" })
        .getByRole("listitem")
        .nth(index);
      await row.hover();
      await row.getByRole("button", { name: "Open menu" }).click();
    };

    it("lists Edit API key and Revoke API key", async () => {
      fetchKeys.mockResolvedValue(makeKeys());
      const screen = await render(<Harness />);
      await expect.element(screen.getByText("CI deploy")).toBeVisible();

      await openRowMenu(screen, 0);

      await expect.element(page.getByRole("menuitem", { name: "Edit API key" })).toBeVisible();
      await expect.element(page.getByRole("menuitem", { name: "Revoke API key" })).toBeVisible();
      expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
    });

    it("Edit API key navigates to the edit page of that row's key", async () => {
      fetchKeys.mockResolvedValue(makeKeys());
      const screen = await render(<Harness />);
      await expect.element(screen.getByText("Reporting script")).toBeVisible();

      await openRowMenu(screen, 1);
      await page.getByRole("menuitem", { name: "Edit API key" }).click();

      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent(`/settings/security/api-keys/${SCRIPT_ID}/edit`);
      await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
      expect(revokeKey).not.toHaveBeenCalled();
    });
  });

  describe("revoke", () => {
    async function openRevokeConfirm(screen: Awaited<ReturnType<typeof render>>) {
      const row = screen
        .getByRole("list", { name: "Personal API keys" })
        .getByRole("listitem")
        .nth(0);
      await row.hover();
      await row.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect.element(dialog).toBeVisible();
      return dialog;
    }

    it("opens a Confirm focused on Cancel; cancelling does not revoke", async () => {
      fetchKeys.mockResolvedValue(makeKeys());
      const screen = await render(<Harness />);
      await expect.element(screen.getByText("CI deploy")).toBeVisible();

      const dialog = await openRevokeConfirm(screen);
      await expect.element(dialog).toHaveTextContent("CI deploy");
      await expect.element(dialog.getByRole("button", { name: "Cancel" })).toHaveFocus();

      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect.element(dialog).not.toBeInTheDocument();
      expect(revokeKey).not.toHaveBeenCalled();
      await expect.element(screen.getByText("CI deploy")).toBeVisible();
    });

    it("confirming revokes the key, shows the toast and drops the row", async () => {
      const keys = makeKeys();
      fetchKeys.mockImplementation(async () => keys.map((key) => ({ ...key })));
      revokeKey.mockImplementation(async ({ id }) => {
        const target = keys.find((key) => key.id === id);
        if (target) target.revokedAt = "2026-04-01T12:00:00.000Z";
      });
      const screen = await render(<Harness />);
      await expect.element(screen.getByRole("heading", { name: "2 API keys" })).toBeVisible();

      const dialog = await openRevokeConfirm(screen);
      await dialog.getByRole("button", { name: "Revoke API key" }).click();

      await vi.waitFor(() => expect(revokeKey).toHaveBeenCalledWith({ id: CI_ID }));
      expect(revokeKey).toHaveBeenCalledTimes(1);
      await expect.element(screen.getByText("API key revoked")).toBeVisible();
      await expect.element(screen.getByRole("heading", { name: "1 API key" })).toBeVisible();
      await expect.element(screen.getByText("CI deploy")).not.toBeInTheDocument();
      await expect.element(screen.getByText("Reporting script")).toBeVisible();
      // A lista só recarrega: continua em Security & access.
      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent("/settings/security");
    });

    it("shows the error toast and keeps the row when revoking fails", async () => {
      fetchKeys.mockResolvedValue(makeKeys());
      revokeKey.mockRejectedValue(new Error("boom"));
      const screen = await render(<Harness />);
      await expect.element(screen.getByText("CI deploy")).toBeVisible();

      const dialog = await openRevokeConfirm(screen);
      await dialog.getByRole("button", { name: "Revoke API key" }).click();

      await expect.element(screen.getByText("Could not revoke API key")).toBeVisible();
      await expect.element(screen.getByText("API key revoked")).not.toBeInTheDocument();
      await expect.element(screen.getByRole("heading", { name: "2 API keys" })).toBeVisible();
      await expect.element(screen.getByText("CI deploy")).toBeVisible();
    });
  });
});
