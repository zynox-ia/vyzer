/** Create API key page interaction in a real Chromium browser. */
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
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import type { ApiKey } from "./api-key-shared";
import { ApiKeyCreatePage } from "./api-key-create";

type CreateInput = { name: string; permissions: "full" | string[] };
type CreateResult = { key: ApiKey; token: string };
type Current = {
  workspace: { id: string; name: string; apiKeyPolicy: "all_members" | "admins" };
  member: { id: string; name: string; email: string; role: string };
};

const fetchCurrent = vi.fn<() => Promise<Current>>();
const createKey = vi.fn<(input: CreateInput) => Promise<CreateResult>>();

vi.mock("@/services/api", () => ({ api: { apiKey: { key: () => ["apiKey"] } } }));

vi.mock("@/services/api-keys", () => ({
  createApiKeyMutationOptions: () =>
    mutationOptions({ mutationFn: (input: CreateInput) => createKey(input) }),
  // Importado por api-key-shared (menu de revogar), que esta tela não usa.
  revokeApiKeyMutationOptions: () => mutationOptions({ mutationFn: async () => {} }),
}));

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({ queryKey: ["workspace", "current"], queryFn: () => fetchCurrent() }),
}));

const MEMBER_ID = "22222222-2222-4222-8222-222222222222";
const TOKEN = "vyz_secret_token_0123456789";

function makeCurrent(
  role = "admin",
  apiKeyPolicy: Current["workspace"]["apiKeyPolicy"] = "all_members",
): Current {
  return {
    workspace: { id: "11111111-1111-4111-8111-111111111111", name: "Zynox", apiKeyPolicy },
    member: { id: MEMBER_ID, name: "Andre", email: "andre@example.com", role },
  };
}

function makeResult(input: CreateInput): CreateResult {
  return {
    token: TOKEN,
    key: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      memberId: MEMBER_ID,
      memberName: "Andre",
      memberEmail: "andre@example.com",
      name: input.name,
      tokenPrefix: "vyz_secre",
      permissions: input.permissions as ApiKey["permissions"],
      createdAt: "2026-01-05T12:00:00.000Z",
      lastUsedAt: null,
      revokedAt: null,
    },
  };
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

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/settings/security/api-keys/new"]}>
          <main>
            <ApiKeyCreatePage />
            <LocationOutput />
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

type Screen = Awaited<ReturnType<typeof render>>;

const nameField = (screen: Screen) => screen.getByLabelText("Key name");
const createButton = (screen: Screen) =>
  screen.getByRole("button", { name: "Create", exact: true });
const permissionBox = (screen: Screen, name: string) =>
  screen.getByRole("checkbox", { name, exact: true });

async function fillAndCreate(screen: Screen, name = "CI deploy") {
  await nameField(screen).fill(name);
  await createButton(screen).click();
}

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

beforeEach(async () => {
  fetchCurrent.mockReset();
  createKey.mockReset();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  // Remove o stub de clipboard e volta ao getter do protótipo.
  delete (navigator as unknown as { clipboard?: unknown }).clipboard;
});

describe("ApiKeyCreatePage", () => {
  describe("as Admin", () => {
    it("defaults to Full access and enables Create once the name is written", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);

      await expect.element(screen.getByRole("heading", { name: "Create API key" })).toBeVisible();
      await expect.element(screen.getByRole("radio", { name: "Full access" })).toBeChecked();
      await expect.element(screen.getByRole("radio", { name: "Full access" })).toBeEnabled();
      await expect.element(createButton(screen)).toBeDisabled();

      await nameField(screen).fill("CI deploy");
      await expect.element(createButton(screen)).toBeEnabled();
      // Só espaços não contam como nome.
      await nameField(screen).fill("   ");
      await expect.element(createButton(screen)).toBeDisabled();
    });

    it("creates with the trimmed name and full permissions", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      createKey.mockImplementation(async (input) => makeResult(input));
      const screen = await render(<Harness />);

      await fillAndCreate(screen, "  CI deploy  ");

      await vi.waitFor(() =>
        expect(createKey).toHaveBeenCalledWith({ name: "CI deploy", permissions: "full" }),
      );
      expect(createKey).toHaveBeenCalledTimes(1);
    });

    it("shows the five permission checkboxes with descriptions; Create waits for one", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);
      await expect.element(permissionBox(screen, "Read")).not.toBeInTheDocument();

      await screen.getByRole("radio", { name: "Only select permissions…" }).click();

      for (const [label, description] of [
        ["Read", "Read all workspace data available to you"],
        ["Write", "Read and write all workspace data available to you"],
        ["Create issues", "Create and update issues"],
        ["Create comments", "Create issue comments"],
        ["Admin", "Access admin-only API features"],
      ] as const) {
        await expect.element(permissionBox(screen, label)).toBeVisible();
        await expect.element(permissionBox(screen, label)).toBeEnabled();
        await expect.element(permissionBox(screen, label)).not.toBeChecked();
        await expect.element(screen.getByText(description, { exact: true })).toBeVisible();
      }
      expect(document.querySelectorAll('[role="checkbox"]')).toHaveLength(5);

      await nameField(screen).fill("Reporting script");
      await expect.element(createButton(screen)).toBeDisabled();
      await permissionBox(screen, "Read").click();
      await expect.element(createButton(screen)).toBeEnabled();
      await permissionBox(screen, "Read").click();
      await expect.element(createButton(screen)).toBeDisabled();
    });

    it("sends the selected permissions in the order they were checked", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      createKey.mockImplementation(async (input) => makeResult(input));
      const screen = await render(<Harness />);

      await screen.getByRole("radio", { name: "Only select permissions…" }).click();
      await nameField(screen).fill("Reporting script");
      await permissionBox(screen, "Read").click();
      await permissionBox(screen, "Write").click();
      await expect.element(permissionBox(screen, "Read")).toBeChecked();
      await expect.element(permissionBox(screen, "Write")).toBeChecked();
      await createButton(screen).click();

      await vi.waitFor(() =>
        expect(createKey).toHaveBeenCalledWith({
          name: "Reporting script",
          permissions: ["read", "write"],
        }),
      );
    });

    it("keeps the checked order when the first choice is unchecked and rechecked", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      createKey.mockImplementation(async (input) => makeResult(input));
      const screen = await render(<Harness />);

      await screen.getByRole("radio", { name: "Only select permissions…" }).click();
      await nameField(screen).fill("Reporting script");
      await permissionBox(screen, "Read").click();
      await permissionBox(screen, "Write").click();
      await permissionBox(screen, "Read").click();
      await permissionBox(screen, "Read").click();
      await createButton(screen).click();

      await vi.waitFor(() =>
        expect(createKey).toHaveBeenCalledWith({
          name: "Reporting script",
          permissions: ["write", "read"],
        }),
      );
    });

    it("Cancel goes back to Security settings without calling the mutation", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      const screen = await render(<Harness />);
      await nameField(screen).fill("CI deploy");

      await screen.getByRole("button", { name: "Cancel" }).click();

      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent("/settings/security");
      await expect
        .element(screen.getByLabelText("Current URL"))
        .not.toHaveTextContent("api-keys/new");
      expect(createKey).not.toHaveBeenCalled();
    });

    it("Enter in the name field submits once, even when pressed again while pending", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      createKey.mockReturnValue(new Promise(() => {}));
      const screen = await render(<Harness />);

      await nameField(screen).fill("CI deploy");
      await userEvent.keyboard("{Enter}");
      await vi.waitFor(() => expect(createKey).toHaveBeenCalledTimes(1));
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard("{Enter}");

      expect(createKey).toHaveBeenCalledTimes(1);
      expect(createKey).toHaveBeenCalledWith({ name: "CI deploy", permissions: "full" });
    });

    it("keeps the form and shows the error toast when creating fails", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent());
      createKey.mockRejectedValue(new Error("boom"));
      const screen = await render(<Harness />);

      await fillAndCreate(screen);

      await expect.element(screen.getByText("Could not create API key")).toBeVisible();
      await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
      await expect.element(nameField(screen)).toHaveValue("CI deploy");
      await expect.element(createButton(screen)).toBeEnabled();
      await expect
        .element(screen.getByLabelText("Current URL"))
        .toHaveTextContent("/settings/security/api-keys/new");
    });

    describe("one-time token dialog", () => {
      async function createAndOpenDialog(screen: Screen) {
        await fillAndCreate(screen);
        const dialog = page.getByRole("dialog", { name: "Your API key" });
        await expect.element(dialog).toBeVisible();
        return dialog;
      }

      it("shows the token in a read-only field that Escape and outside clicks cannot close", async () => {
        fetchCurrent.mockResolvedValue(makeCurrent());
        createKey.mockImplementation(async (input) => makeResult(input));
        const screen = await render(<Harness />);

        const dialog = await createAndOpenDialog(screen);
        const field = dialog.getByRole("textbox", { name: "API key" });
        await expect.element(field).toHaveValue(TOKEN);
        await expect.element(field).toHaveAttribute("readonly");
        await expect.element(dialog).toHaveTextContent("It won't be shown again.");

        await userEvent.keyboard("{Escape}");
        await expect.element(dialog).toBeVisible();

        // O fundo do Dialog é o pai da janela; o clique cai na folga de 16 px ao redor dela.
        const overlay = (dialog.element() as HTMLElement).parentElement as HTMLElement;
        await page.elementLocator(overlay).click({ position: { x: 4, y: 4 } });
        await expect.element(dialog).toBeVisible();
        await expect
          .element(screen.getByLabelText("Current URL"))
          .toHaveTextContent("/settings/security/api-keys/new");
      });

      it("Copy writes the token to the clipboard and shows Copied", async () => {
        fetchCurrent.mockResolvedValue(makeCurrent());
        createKey.mockImplementation(async (input) => makeResult(input));
        const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue();
        stubClipboard(writeText);
        const screen = await render(<Harness />);

        const dialog = await createAndOpenDialog(screen);
        await dialog.getByRole("button", { name: "Copy" }).click();

        await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(TOKEN));
        await expect.element(screen.getByText("Copied", { exact: true })).toBeVisible();
        await expect.element(dialog).toBeVisible();
      });

      it("shows the error toast when the clipboard rejects", async () => {
        fetchCurrent.mockResolvedValue(makeCurrent());
        createKey.mockImplementation(async (input) => makeResult(input));
        stubClipboard(
          vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new Error("denied")),
        );
        const screen = await render(<Harness />);

        const dialog = await createAndOpenDialog(screen);
        await dialog.getByRole("button", { name: "Copy" }).click();

        await expect.element(screen.getByText("Could not copy the key")).toBeVisible();
        await expect.element(screen.getByText("Copied", { exact: true })).not.toBeInTheDocument();
      });

      it("Done navigates to Security settings", async () => {
        fetchCurrent.mockResolvedValue(makeCurrent());
        createKey.mockImplementation(async (input) => makeResult(input));
        const screen = await render(<Harness />);

        const dialog = await createAndOpenDialog(screen);
        await dialog.getByRole("button", { name: "Done" }).click();

        await expect
          .element(screen.getByLabelText("Current URL"))
          .toHaveTextContent("/settings/security");
        await expect
          .element(screen.getByLabelText("Current URL"))
          .not.toHaveTextContent("api-keys/new");
      });
    });
  });

  describe("as a regular Member", () => {
    it("disables Full access and Admin, defaulting to select permissions", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("member"));
      createKey.mockImplementation(async (input) => makeResult(input));
      const screen = await render(<Harness />);

      await expect.element(screen.getByRole("radio", { name: "Full access" })).toBeDisabled();
      await expect.element(screen.getByRole("radio", { name: "Full access" })).not.toBeChecked();
      await expect
        .element(screen.getByRole("radio", { name: "Only select permissions…" }))
        .toBeChecked();
      await expect.element(permissionBox(screen, "Admin")).toBeDisabled();
      for (const label of ["Read", "Write", "Create issues", "Create comments"]) {
        await expect.element(permissionBox(screen, label)).toBeEnabled();
      }

      await nameField(screen).fill("Personal script");
      await expect.element(createButton(screen)).toBeDisabled();
      await permissionBox(screen, "Create issues").click();
      await createButton(screen).click();

      await vi.waitFor(() =>
        expect(createKey).toHaveBeenCalledWith({
          name: "Personal script",
          permissions: ["issues:create"],
        }),
      );
    });

    it("cannot tick Admin by clicking it", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("member"));
      const screen = await render(<Harness />);
      await expect.element(permissionBox(screen, "Admin")).toBeDisabled();

      await screen.getByText("Access admin-only API features").click({ force: true });

      await expect.element(permissionBox(screen, "Admin")).not.toBeChecked();
    });

    it("sees why they cannot create keys when the policy is admins only", async () => {
      fetchCurrent.mockResolvedValue(makeCurrent("member", "admins"));
      const screen = await render(<Harness />);

      await expect.element(screen.getByText("Only admins can create API keys")).toBeVisible();
      await expect.element(screen.getByRole("heading", { name: "Create API key" })).toBeVisible();
      await expect.element(nameField(screen)).not.toBeInTheDocument();
      await expect.element(createButton(screen)).not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("radio", { name: "Full access" }))
        .not.toBeInTheDocument();
    });
  });

  it("an Admin still sees the form when the policy is admins only", async () => {
    fetchCurrent.mockResolvedValue(makeCurrent("admin", "admins"));
    const screen = await render(<Harness />);

    await expect.element(nameField(screen)).toBeVisible();
    await expect
      .element(screen.getByText("Only admins can create API keys"))
      .not.toBeInTheDocument();
  });

  it("shows a loading notice while the workspace loads", async () => {
    fetchCurrent.mockReturnValue(new Promise(() => {}));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Loading.")).toBeInTheDocument();
    await expect.element(createButton(screen)).not.toBeInTheDocument();
  });

  it("shows an error alert and Retry reloads the workspace", async () => {
    fetchCurrent.mockRejectedValueOnce(new Error("network error"));
    const screen = await render(<Harness />);

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Could not load your settings");
    fetchCurrent.mockResolvedValue(makeCurrent());
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(nameField(screen)).toBeVisible();
  });
});
