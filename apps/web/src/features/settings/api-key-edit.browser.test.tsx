/** Edit API key page interaction in a real Chromium browser. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import type { ApiKey } from "./api-key-shared";
import { ApiKeyEditPage } from "./api-key-edit";

type UpdateInput = { id: string; name: string; permissions: "full" | string[] };
type Current = {
  workspace: { id: string; name: string; apiKeyPolicy: "all_members" | "admins" };
  member: { id: string; name: string; email: string; role: string };
};

const fetchKeys = vi.fn<() => Promise<ApiKey[]>>();
const fetchCurrent = vi.fn<() => Promise<Current>>();
const updateKey = vi.fn<(input: UpdateInput) => Promise<void>>();

vi.mock("@/services/api", () => ({ api: { apiKey: { key: () => ["apiKey"] } } }));

vi.mock("@/services/api-keys", () => ({
  apiKeysQueryOptions: (scope: string) =>
    queryOptions({ queryKey: ["apiKey", "list", scope], queryFn: () => fetchKeys() }),
  updateApiKeyMutationOptions: () =>
    mutationOptions({ mutationFn: (input: UpdateInput) => updateKey(input) }),
  // Importados por api-key-shared (menu da chave), que esta tela não usa.
  createApiKeyMutationOptions: () => mutationOptions({ mutationFn: async () => {} }),
  revokeApiKeyMutationOptions: () => mutationOptions({ mutationFn: async () => {} }),
}));

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({ queryKey: ["workspace", "current"], queryFn: () => fetchCurrent() }),
}));

const MEMBER_ID = "22222222-2222-4222-8222-222222222222";
const CI_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SCRIPT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OLD_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const MISSING_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function makeCurrent(role = "admin"): Current {
  return {
    workspace: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Zynox",
      apiKeyPolicy: "all_members",
    },
    member: { id: MEMBER_ID, name: "Andre", email: "andre@example.com", role },
  };
}

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
        <MemoryRouter initialEntries={[`/settings/security/api-keys/${keyId}/edit`]}>
          <main>
            <Routes>
              <Route path="/settings/security/api-keys/:keyId/edit" element={<ApiKeyEditPage />} />
              <Route path="/settings/security/api-keys/:keyId" element={<p>Key page</p>} />
              <Route path="/settings/security" element={<p>Security page</p>} />
            </Routes>
            <LocationOutput />
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

type Screen = Awaited<ReturnType<typeof render>>;

const nameField = (screen: Screen) => screen.getByLabelText("Key name");
const saveButton = (screen: Screen) => screen.getByRole("button", { name: "Save", exact: true });
const permissionBox = (screen: Screen, name: string) =>
  screen.getByRole("checkbox", { name, exact: true });
const currentUrl = (screen: Screen) => screen.getByLabelText("Current URL");

beforeEach(async () => {
  fetchKeys.mockReset();
  fetchCurrent.mockReset();
  updateKey.mockReset();
  fetchKeys.mockResolvedValue(makeKeys());
  fetchCurrent.mockResolvedValue(makeCurrent());
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("ApiKeyEditPage", () => {
  it("shows a loading notice while the keys load", async () => {
    fetchKeys.mockReturnValue(new Promise(() => {}));
    const screen = await render(<Harness keyId={CI_ID} />);

    await expect.element(screen.getByText("Loading API key.")).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expect.element(screen.getByRole("heading", { level: 1 })).not.toBeInTheDocument();
    await expect.element(saveButton(screen)).not.toBeInTheDocument();
  });

  it("shows a loading notice while the workspace loads", async () => {
    fetchCurrent.mockReturnValue(new Promise(() => {}));
    const screen = await render(<Harness keyId={CI_ID} />);

    await expect.element(screen.getByText("Loading API key.")).toBeInTheDocument();
    await expect.element(saveButton(screen)).not.toBeInTheDocument();
  });

  describe("with a Full access key", () => {
    it("shows the title, subtitle and the current name and permissions", async () => {
      const screen = await render(<Harness keyId={CI_ID} />);

      await expect
        .element(screen.getByRole("heading", { level: 1, name: "Edit API key" }))
        .toBeVisible();
      await expect
        .element(
          screen.getByText(
            "When using the API key all actions are attributed to you as an individual",
            { exact: true },
          ),
        )
        .toBeVisible();
      await expect.element(nameField(screen)).toHaveValue("CI deploy");
      await expect.element(screen.getByRole("radio", { name: "Full access" })).toBeChecked();
      await expect.element(screen.getByRole("radio", { name: "Full access" })).toBeEnabled();
      await expect
        .element(screen.getByRole("radio", { name: "Only select permissions…" }))
        .not.toBeChecked();
      await expect.element(permissionBox(screen, "Read")).not.toBeInTheDocument();
      await expect.element(saveButton(screen)).toBeEnabled();
      await expect
        .element(screen.getByRole("button", { name: "Cancel", exact: true }))
        .toBeEnabled();
    });

    it("saves the trimmed new name keeping full permissions", async () => {
      updateKey.mockResolvedValue();
      const screen = await render(<Harness keyId={CI_ID} />);
      await expect.element(nameField(screen)).toHaveValue("CI deploy");

      await nameField(screen).fill("  CI production  ");
      await saveButton(screen).click();

      await vi.waitFor(() =>
        expect(updateKey).toHaveBeenCalledWith({
          id: CI_ID,
          name: "CI production",
          permissions: "full",
        }),
      );
      expect(updateKey).toHaveBeenCalledTimes(1);
      await expect.element(screen.getByText("API key updated")).toBeVisible();
      await expect
        .element(currentUrl(screen))
        .toHaveTextContent(`/settings/security/api-keys/${CI_ID}`);
      await expect.element(currentUrl(screen)).not.toHaveTextContent("/edit");
      await expect.element(screen.getByText("Key page")).toBeVisible();
    });

    it("keeps Save disabled when switching to select permissions with none checked", async () => {
      const screen = await render(<Harness keyId={CI_ID} />);
      await expect.element(saveButton(screen)).toBeEnabled();

      await screen.getByRole("radio", { name: "Only select permissions…" }).click();
      await expect.element(permissionBox(screen, "Read")).toBeVisible();
      await expect.element(saveButton(screen)).toBeDisabled();

      await permissionBox(screen, "Create comments").click();
      await expect.element(saveButton(screen)).toBeEnabled();
    });

    it("saves the checked permissions after switching from Full access", async () => {
      updateKey.mockResolvedValue();
      const screen = await render(<Harness keyId={CI_ID} />);
      await expect.element(nameField(screen)).toHaveValue("CI deploy");

      await screen.getByRole("radio", { name: "Only select permissions…" }).click();
      await permissionBox(screen, "Create issues").click();
      await saveButton(screen).click();

      await vi.waitFor(() =>
        expect(updateKey).toHaveBeenCalledWith({
          id: CI_ID,
          name: "CI deploy",
          permissions: ["issues:create"],
        }),
      );
    });
  });

  describe("with a key that has selected permissions", () => {
    it("checks Only select permissions… and only the current permissions", async () => {
      const screen = await render(<Harness keyId={SCRIPT_ID} />);

      await expect.element(nameField(screen)).toHaveValue("Reporting script");
      await expect
        .element(screen.getByRole("radio", { name: "Only select permissions…" }))
        .toBeChecked();
      await expect.element(screen.getByRole("radio", { name: "Full access" })).not.toBeChecked();
      await expect.element(permissionBox(screen, "Read")).toBeChecked();
      await expect.element(permissionBox(screen, "Write")).toBeChecked();
      await expect.element(permissionBox(screen, "Create issues")).not.toBeChecked();
      await expect.element(permissionBox(screen, "Create comments")).not.toBeChecked();
      await expect.element(permissionBox(screen, "Admin")).not.toBeChecked();
      await expect.element(saveButton(screen)).toBeEnabled();
    });

    it("saves the edited name and the changed permission set", async () => {
      updateKey.mockResolvedValue();
      const screen = await render(<Harness keyId={SCRIPT_ID} />);
      await expect.element(nameField(screen)).toHaveValue("Reporting script");

      await nameField(screen).fill("Reporting v2");
      await permissionBox(screen, "Write").click();
      await permissionBox(screen, "Create comments").click();
      await saveButton(screen).click();

      await vi.waitFor(() =>
        expect(updateKey).toHaveBeenCalledWith({
          id: SCRIPT_ID,
          name: "Reporting v2",
          permissions: ["read", "comments:create"],
        }),
      );
      await expect.element(screen.getByText("API key updated")).toBeVisible();
      await expect
        .element(currentUrl(screen))
        .toHaveTextContent(`/settings/security/api-keys/${SCRIPT_ID}`);
    });

    it("saves the unchanged permissions in their current order", async () => {
      updateKey.mockResolvedValue();
      const screen = await render(<Harness keyId={SCRIPT_ID} />);
      await expect.element(nameField(screen)).toHaveValue("Reporting script");

      await saveButton(screen).click();

      await vi.waitFor(() =>
        expect(updateKey).toHaveBeenCalledWith({
          id: SCRIPT_ID,
          name: "Reporting script",
          permissions: ["read", "write"],
        }),
      );
    });

    it("keeps Save disabled once every permission is unchecked", async () => {
      const screen = await render(<Harness keyId={SCRIPT_ID} />);
      await expect.element(saveButton(screen)).toBeEnabled();

      await permissionBox(screen, "Read").click();
      await expect.element(saveButton(screen)).toBeEnabled();
      await permissionBox(screen, "Write").click();
      await expect.element(saveButton(screen)).toBeDisabled();
      expect(updateKey).not.toHaveBeenCalled();
    });
  });

  it("keeps Save disabled while the name is empty or only spaces", async () => {
    const screen = await render(<Harness keyId={CI_ID} />);
    await expect.element(saveButton(screen)).toBeEnabled();

    await nameField(screen).fill("");
    await expect.element(saveButton(screen)).toBeDisabled();
    await nameField(screen).fill("   ");
    await expect.element(saveButton(screen)).toBeDisabled();
    await nameField(screen).fill("CI deploy 2");
    await expect.element(saveButton(screen)).toBeEnabled();
    expect(updateKey).not.toHaveBeenCalled();
  });

  it("Cancel goes back to the key page without calling the mutation", async () => {
    const screen = await render(<Harness keyId={CI_ID} />);
    await expect.element(nameField(screen)).toHaveValue("CI deploy");
    await nameField(screen).fill("Changed but discarded");

    await screen.getByRole("button", { name: "Cancel", exact: true }).click();

    await expect.element(screen.getByText("Key page")).toBeVisible();
    await expect
      .element(currentUrl(screen))
      .toHaveTextContent(`/settings/security/api-keys/${CI_ID}`);
    await expect.element(currentUrl(screen)).not.toHaveTextContent("/edit");
    expect(updateKey).not.toHaveBeenCalled();
  });

  it("the Back link goes to the key page", async () => {
    const screen = await render(<Harness keyId={SCRIPT_ID} />);

    const back = screen.getByRole("link", { name: "Back", exact: true });
    await expect.element(back).toHaveAttribute("href", `/settings/security/api-keys/${SCRIPT_ID}`);
    await back.click();

    await expect.element(screen.getByText("Key page")).toBeVisible();
    await expect
      .element(currentUrl(screen))
      .toHaveTextContent(`/settings/security/api-keys/${SCRIPT_ID}`);
    await expect.element(currentUrl(screen)).not.toHaveTextContent("/edit");
    expect(updateKey).not.toHaveBeenCalled();
  });

  it("keeps the form and the URL and shows the error toast when saving fails", async () => {
    updateKey.mockRejectedValue(new Error("boom"));
    const screen = await render(<Harness keyId={CI_ID} />);
    await expect.element(nameField(screen)).toHaveValue("CI deploy");

    await nameField(screen).fill("CI production");
    await saveButton(screen).click();

    await expect.element(screen.getByText("Could not update API key")).toBeVisible();
    await expect.element(screen.getByText("API key updated")).not.toBeInTheDocument();
    await expect.element(nameField(screen)).toHaveValue("CI production");
    await expect.element(saveButton(screen)).toBeEnabled();
    await expect
      .element(currentUrl(screen))
      .toHaveTextContent(`/settings/security/api-keys/${CI_ID}/edit`);
    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Edit API key" }))
      .toBeVisible();
  });

  it("Enter in the name field saves once, even when pressed again while pending", async () => {
    updateKey.mockReturnValue(new Promise(() => {}));
    const screen = await render(<Harness keyId={CI_ID} />);
    await expect.element(nameField(screen)).toHaveValue("CI deploy");

    await nameField(screen).fill("CI production");
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => expect(updateKey).toHaveBeenCalledTimes(1));
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Enter}");

    expect(updateKey).toHaveBeenCalledTimes(1);
    expect(updateKey).toHaveBeenCalledWith({
      id: CI_ID,
      name: "CI production",
      permissions: "full",
    });
  });

  describe("as a regular Member", () => {
    it("disables Full access and the Admin permission", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("member"));
      const screen = await render(<Harness keyId={SCRIPT_ID} />);

      await expect.element(nameField(screen)).toHaveValue("Reporting script");
      await expect.element(screen.getByRole("radio", { name: "Full access" })).toBeDisabled();
      await expect
        .element(screen.getByRole("radio", { name: "Only select permissions…" }))
        .toBeChecked();
      await expect.element(permissionBox(screen, "Admin")).toBeDisabled();
      for (const label of ["Read", "Write", "Create issues", "Create comments"]) {
        await expect.element(permissionBox(screen, label)).toBeEnabled();
      }
    });

    it("saves changes to the name and the allowed permissions", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("member"));
      updateKey.mockResolvedValue();
      const screen = await render(<Harness keyId={SCRIPT_ID} />);
      await expect.element(nameField(screen)).toHaveValue("Reporting script");

      await nameField(screen).fill("Personal script");
      await permissionBox(screen, "Create issues").click();
      await saveButton(screen).click();

      await vi.waitFor(() =>
        expect(updateKey).toHaveBeenCalledWith({
          id: SCRIPT_ID,
          name: "Personal script",
          permissions: ["read", "write", "issues:create"],
        }),
      );
    });
  });

  it("shows API key not found for a revoked key", async () => {
    const screen = await render(<Harness keyId={OLD_ID} />);

    await expect.element(screen.getByText("API key not found")).toBeVisible();
    await expect.element(nameField(screen)).not.toBeInTheDocument();
    await expect.element(saveButton(screen)).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Edit API key" }))
      .not.toBeInTheDocument();
  });

  it("shows API key not found for an unknown id and goes back to Security settings", async () => {
    const screen = await render(<Harness keyId={MISSING_ID} />);

    await expect.element(screen.getByText("API key not found")).toBeVisible();
    await expect.element(nameField(screen)).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "Back to Security settings" }).click();

    await expect.element(currentUrl(screen)).toHaveTextContent("/settings/security");
    await expect.element(currentUrl(screen)).not.toHaveTextContent("api-keys");
    await expect.element(screen.getByText("Security page")).toBeVisible();
  });

  it("the Back link of the not-found state goes to Security settings", async () => {
    const screen = await render(<Harness keyId={MISSING_ID} />);
    await expect.element(screen.getByText("API key not found")).toBeVisible();

    const back = screen.getByRole("link", { name: "Back", exact: true });
    await expect.element(back).toHaveAttribute("href", "/settings/security");
    await back.click();

    await expect.element(screen.getByText("Security page")).toBeVisible();
  });

  it("shows an error alert and Retry reloads both the keys and the workspace", async () => {
    fetchKeys.mockRejectedValueOnce(new Error("network error"));
    const screen = await render(<Harness keyId={CI_ID} />);

    await expect.element(screen.getByRole("alert")).toHaveTextContent("Could not load the API key");
    await expect.element(nameField(screen)).not.toBeInTheDocument();
    expect(fetchKeys).toHaveBeenCalledTimes(1);
    expect(fetchCurrent).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(nameField(screen)).toHaveValue("CI deploy");
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
    expect(fetchKeys).toHaveBeenCalledTimes(2);
    expect(fetchCurrent).toHaveBeenCalledTimes(2);
  });

  it("shows the error alert when only the workspace fails to load", async () => {
    fetchCurrent.mockRejectedValueOnce(new Error("network error"));
    const screen = await render(<Harness keyId={CI_ID} />);

    await expect.element(screen.getByRole("alert")).toHaveTextContent("Could not load the API key");
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(nameField(screen)).toHaveValue("CI deploy");
    expect(fetchKeys).toHaveBeenCalledTimes(2);
    expect(fetchCurrent).toHaveBeenCalledTimes(2);
  });
});
