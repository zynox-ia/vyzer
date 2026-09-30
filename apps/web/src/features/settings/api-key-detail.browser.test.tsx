/** API key detail page interaction in a real Chromium browser. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import type { ApiKey } from "./api-key-shared";
import { ApiKeyDetailPage } from "./api-key-detail";

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
const MISSING_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

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
    makeKey({ id: CI_ID, name: "CI deploy" }),
    makeKey({
      id: SCRIPT_ID,
      name: "Reporting script",
      permissions: ["read", "write"],
      createdAt: "2026-03-01T12:00:00.000Z",
    }),
    makeKey({
      id: OLD_ID,
      name: "Old integration",
      createdAt: "2025-11-20T12:00:00.000Z",
      revokedAt: "2026-04-09T12:00:00.000Z",
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

function Harness({ keyId }: { keyId: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/settings/security/api-keys/${keyId}`]}>
          <main>
            <Routes>
              <Route path="/settings/security/api-keys/:keyId" element={<ApiKeyDetailPage />} />
              <Route path="/settings/security/api-keys/:keyId/edit" element={<p>Edit page</p>} />
              <Route path="/settings/security" element={<p>Security page</p>} />
            </Routes>
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

describe("ApiKeyDetailPage", () => {
  it("shows a loading notice while the keys load", async () => {
    fetchKeys.mockReturnValue(new Promise(() => {}));
    const screen = await render(<Harness keyId={CI_ID} />);

    await expect.element(screen.getByText("Loading API key.")).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expect.element(screen.getByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("shows the key name as title with the creation date, name and permissions", async () => {
    fetchKeys.mockResolvedValue(makeKeys());
    const screen = await render(<Harness keyId={SCRIPT_ID} />);

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Reporting script" }))
      .toBeVisible();
    await expect.element(screen.getByText("Created Mar 1, 2026")).toBeVisible();
    await expect.element(screen.getByText("Key name", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Permissions", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Read, Write", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Status", { exact: true })).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("link", { name: "Security settings", exact: true }))
      .toHaveAttribute("href", "/settings/security");
  });

  it("shows Full access for a full-permission key", async () => {
    fetchKeys.mockResolvedValue(makeKeys());
    const screen = await render(<Harness keyId={CI_ID} />);

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "CI deploy" }))
      .toBeVisible();
    await expect.element(screen.getByText("Full access", { exact: true })).toBeVisible();
  });

  describe("menu", () => {
    it("lists Edit API key and Revoke API key", async () => {
      fetchKeys.mockResolvedValue(makeKeys());
      const screen = await render(<Harness keyId={CI_ID} />);
      await expect
        .element(screen.getByRole("heading", { level: 1, name: "CI deploy" }))
        .toBeVisible();

      await screen.getByRole("button", { name: "Open menu" }).click();

      await expect.element(page.getByRole("menuitem", { name: "Edit API key" })).toBeVisible();
      await expect.element(page.getByRole("menuitem", { name: "Revoke API key" })).toBeVisible();
      expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
    });

    it("Edit API key navigates to the edit page without revoking", async () => {
      fetchKeys.mockResolvedValue(makeKeys());
      const screen = await render(<Harness keyId={SCRIPT_ID} />);
      await expect
        .element(screen.getByRole("heading", { level: 1, name: "Reporting script" }))
        .toBeVisible();

      await screen.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("menuitem", { name: "Edit API key" }).click();

      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent(`/settings/security/api-keys/${SCRIPT_ID}/edit`);
      await expect.element(screen.getByText("Edit page")).toBeVisible();
      await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
      expect(revokeKey).not.toHaveBeenCalled();
    });
  });

  describe("revoke", () => {
    it("confirming revokes the key, shows the toast and goes back to Security settings", async () => {
      const keys = makeKeys();
      fetchKeys.mockImplementation(async () => keys.map((key) => ({ ...key })));
      revokeKey.mockImplementation(async ({ id }) => {
        const target = keys.find((key) => key.id === id);
        if (target) target.revokedAt = "2026-04-01T12:00:00.000Z";
      });
      const screen = await render(<Harness keyId={CI_ID} />);
      await expect
        .element(screen.getByRole("heading", { level: 1, name: "CI deploy" }))
        .toBeVisible();

      await screen.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      const dialog = page.getByRole("alertdialog");
      await expect.element(dialog).toBeVisible();
      await expect.element(dialog.getByRole("button", { name: "Cancel" })).toHaveFocus();
      await dialog.getByRole("button", { name: "Revoke API key" }).click();

      await vi.waitFor(() => expect(revokeKey).toHaveBeenCalledWith({ id: CI_ID }));
      expect(revokeKey).toHaveBeenCalledTimes(1);
      await expect.element(screen.getByText("API key revoked")).toBeVisible();
      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent("/settings/security");
      await expect.element(screen.getByText("Security page")).toBeVisible();
    });

    it("cancelling does not revoke or leave the page", async () => {
      fetchKeys.mockResolvedValue(makeKeys());
      const screen = await render(<Harness keyId={CI_ID} />);
      await expect
        .element(screen.getByRole("heading", { level: 1, name: "CI deploy" }))
        .toBeVisible();

      await screen.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();

      await expect.element(page.getByRole("alertdialog")).not.toBeInTheDocument();
      expect(revokeKey).not.toHaveBeenCalled();
      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent(`/settings/security/api-keys/${CI_ID}`);
    });

    it("stays on the page and shows the error toast when revoking fails", async () => {
      fetchKeys.mockResolvedValue(makeKeys());
      revokeKey.mockRejectedValue(new Error("boom"));
      const screen = await render(<Harness keyId={CI_ID} />);
      await expect
        .element(screen.getByRole("heading", { level: 1, name: "CI deploy" }))
        .toBeVisible();

      await screen.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("menuitem", { name: "Revoke API key" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Revoke API key" }).click();

      await expect.element(screen.getByText("Could not revoke API key")).toBeVisible();
      await expect
        .element(screen.getByRole("heading", { level: 1, name: "CI deploy" }))
        .toBeVisible();
      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent(`/settings/security/api-keys/${CI_ID}`);
    });
  });

  it("shows the revoked status and no menu for a revoked key", async () => {
    fetchKeys.mockResolvedValue(makeKeys());
    const screen = await render(<Harness keyId={OLD_ID} />);

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Old integration" }))
      .toBeVisible();
    await expect.element(screen.getByText("Created Nov 20, 2025")).toBeVisible();
    await expect.element(screen.getByText("Status", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Revoked Apr 9, 2026")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Open menu" })).not.toBeInTheDocument();
  });

  it("shows API key not found for an unknown id and goes back to Security settings", async () => {
    fetchKeys.mockResolvedValue(makeKeys());
    const screen = await render(<Harness keyId={MISSING_ID} />);

    await expect.element(screen.getByText("API key not found")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Open menu" })).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "Back to Security settings" }).click();

    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/security");
    await expect.element(screen.getByText("Security page")).toBeVisible();
  });

  it("shows an error alert and Retry reloads the key", async () => {
    fetchKeys.mockRejectedValueOnce(new Error("network error"));
    const screen = await render(<Harness keyId={CI_ID} />);

    await expect.element(screen.getByRole("alert")).toHaveTextContent("Could not load the API key");
    fetchKeys.mockResolvedValue(makeKeys());
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "CI deploy" }))
      .toBeVisible();
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });
});
