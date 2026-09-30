/**
 * Interação de Settings → Customer requests (spec `documents-customer-requests.md`, C1), num
 * Chromium real. Os services são trocados por `queryOptions`/`mutationOptions` reais do TanStack
 * Query apoiados num banco em memória, então a página usa o mesmo QueryClient, o mesmo
 * `invalidateQueries` e o mesmo ToastProvider do app.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import axe from "axe-core";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { CustomerRequestsPage } from "./customer-requests";

type Label = { id: string; name: string; color: string; position: number };
type Rule = { id: string; kind: "excluded" | "generic"; value: string; createdAt: string };

const db = {
  role: "admin",
  settings: {
    enabled: false,
    defaultTeamId: null as string | null,
    revenuePeriod: "annual" as "annual" | "monthly",
    revenueCurrency: "USD",
    attributesDataSource: null as string | null,
    manualEditsEnabled: true,
  },
  statuses: [] as Label[],
  tiers: [] as Label[],
  rules: [] as Rule[],
};
let nextId = 1;
const id = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`;
const updateSettings = vi.fn<(patch: Partial<typeof db.settings>) => Promise<unknown>>();

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({
      queryKey: ["workspace", "current"],
      queryFn: async () => ({ workspace: { id: "w" }, member: { role: db.role } }),
    }),
}));
vi.mock("@/services/teams", () => ({
  teamsQueryOptions: () =>
    queryOptions({
      queryKey: ["teams"],
      queryFn: async () => [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Vyzer",
          icon: { kind: "icon", name: "briefcase", color: "orange" },
        },
      ],
    }),
}));
vi.mock("@/services/customer-settings", () => ({
  customerSettingsQueryOptions: () =>
    queryOptions({ queryKey: ["cs"], queryFn: async () => ({ ...db.settings }) }),
  updateCustomerSettingsMutationOptions: () =>
    mutationOptions({
      mutationFn: async (patch: Partial<typeof db.settings>) => {
        await updateSettings(patch);
        Object.assign(db.settings, patch);
        return { ...db.settings };
      },
    }),
  customerStatusesQueryOptions: () =>
    queryOptions({ queryKey: ["cs-status"], queryFn: async () => [...db.statuses] }),
  createCustomerStatusMutationOptions: () =>
    mutationOptions({
      mutationFn: async (input: { name: string; color: string }) => {
        if (db.statuses.some((s) => s.name.toLowerCase() === input.name.toLowerCase())) {
          throw new Error("A Customer status with this name already exists.");
        }
        db.statuses.push({ id: id(), ...input, position: db.statuses.length });
      },
    }),
  updateCustomerStatusMutationOptions: () =>
    mutationOptions({
      mutationFn: async (input: { id: string; name?: string; color?: string }) => {
        const row = db.statuses.find((s) => s.id === input.id)!;
        Object.assign(row, { name: input.name ?? row.name, color: input.color ?? row.color });
      },
    }),
  deleteCustomerStatusMutationOptions: () =>
    mutationOptions({
      mutationFn: async (input: { id: string }) => {
        db.statuses = db.statuses.filter((s) => s.id !== input.id);
      },
    }),
  reorderCustomerStatusesMutationOptions: () =>
    mutationOptions({
      mutationFn: async (input: { ids: string[] }) => {
        db.statuses = input.ids.map((sid, position) => ({
          ...db.statuses.find((s) => s.id === sid)!,
          position,
        }));
      },
    }),
  customerTiersQueryOptions: () =>
    queryOptions({ queryKey: ["cs-tier"], queryFn: async () => [...db.tiers] }),
  createCustomerTierMutationOptions: () =>
    mutationOptions({
      mutationFn: async (input: { name: string; color: string }) => {
        db.tiers.push({ id: id(), ...input, position: db.tiers.length });
      },
    }),
  updateCustomerTierMutationOptions: () => mutationOptions({ mutationFn: async () => {} }),
  deleteCustomerTierMutationOptions: () => mutationOptions({ mutationFn: async () => {} }),
  reorderCustomerTiersMutationOptions: () => mutationOptions({ mutationFn: async () => {} }),
  customerDomainRulesQueryOptions: (kind: "excluded" | "generic") =>
    queryOptions({
      queryKey: ["cs-rules", kind],
      queryFn: async () => db.rules.filter((r) => r.kind === kind),
    }),
  addCustomerDomainRuleMutationOptions: () =>
    mutationOptions({
      mutationFn: async (input: { kind: "excluded" | "generic"; value: string }) => {
        db.rules.push({ id: id(), ...input, createdAt: new Date().toISOString() });
      },
    }),
  removeCustomerDomainRuleMutationOptions: () =>
    mutationOptions({
      mutationFn: async (input: { id: string }) => {
        db.rules = db.rules.filter((r) => r.id !== input.id);
      },
    }),
}));

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <main>
          <CustomerRequestsPage />
        </main>
      </ToastProvider>
    </QueryClientProvider>
  );
}

async function axeViolations(root: Element) {
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

beforeEach(async () => {
  db.role = "admin";
  db.settings = {
    enabled: false,
    defaultTeamId: null,
    revenuePeriod: "annual",
    revenueCurrency: "USD",
    attributesDataSource: null,
    manualEditsEnabled: true,
  };
  db.statuses = [
    { id: id(), name: "Active", color: "purple", position: 0 },
    { id: id(), name: "Prospect", color: "green", position: 1 },
    { id: id(), name: "Churned", color: "red", position: 2 },
    { id: id(), name: "Lost", color: "orange", position: 3 },
  ];
  db.tiers = [];
  db.rules = [];
  updateSettings.mockReset();
  updateSettings.mockResolvedValue({});
  await page.viewport(1280, 900);
});

describe("CustomerRequestsPage", () => {
  it("mostra as linhas do Linear com o recurso desligado e tudo abaixo do switch desabilitado", async () => {
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("Enable Customer requests")).toBeVisible();

    await expect.element(screen.getByText("4 customer statuses")).toBeVisible();
    await expect.element(screen.getByText("No customer tiers")).toBeVisible();
    await expect.element(screen.getByText("No excluded domains and emails")).toBeVisible();
    await expect.element(screen.getByText("No custom generic domains and emails")).toBeVisible();
    await expect
      .element(screen.getByRole("switch", { name: "Enable Customer requests" }))
      .toBeEnabled();
    await expect
      .element(screen.getByRole("switch", { name: "Enable manual edits" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: "Add customer status" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: "Open menu for Excluded domains and emails" }))
      .toBeDisabled();
  });

  it("ligar grava na hora e libera os controles", async () => {
    const screen = await render(<Harness />);
    await screen.getByRole("switch", { name: "Enable Customer requests" }).click();

    await vi.waitFor(() => expect(updateSettings).toHaveBeenCalledWith({ enabled: true }));
    await expect.element(screen.getByText("Saved", { exact: true })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Add customer status" })).toBeEnabled();
  });

  it("desligar pede confirmação e Cancel não grava", async () => {
    db.settings.enabled = true;
    const screen = await render(<Harness />);
    await screen.getByRole("switch", { name: "Enable Customer requests" }).click();
    await expect
      .element(screen.getByText("Disable customer requests for entire workspace?"))
      .toBeVisible();

    await screen.getByRole("button", { name: "Cancel" }).click();
    expect(updateSettings).not.toHaveBeenCalled();

    await screen.getByRole("switch", { name: "Enable Customer requests" }).click();
    await screen.getByRole("button", { name: "Disable" }).click();
    await vi.waitFor(() => expect(updateSettings).toHaveBeenCalledWith({ enabled: false }));
  });

  it("Member lê, mas não altera nada", async () => {
    db.role = "member";
    db.settings.enabled = true;
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("4 customer statuses")).toBeVisible();
    await expect
      .element(screen.getByRole("switch", { name: "Enable Customer requests" }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: "Add customer status" }))
      .toBeDisabled();
  });

  it("cria um tier, e nome repetido de status volta como erro no campo", async () => {
    db.settings.enabled = true;
    const screen = await render(<Harness />);
    await screen.getByRole("button", { name: "Add customer tier" }).click();
    await screen.getByLabelText("Name").fill("Enterprise");
    await screen.getByRole("button", { name: "Create" }).click();
    await expect.element(screen.getByText("1 customer tier")).toBeVisible();
    await expect.element(screen.getByText("Enterprise")).toBeVisible();

    await screen.getByRole("button", { name: "Add customer status" }).click();
    await screen.getByLabelText("Name").fill("active");
    await screen.getByRole("button", { name: "Create" }).click();
    await expect
      .element(screen.getByText("A Customer status with this name already exists."))
      .toBeVisible();
  });

  it("Move down reordena os statuses", async () => {
    db.settings.enabled = true;
    const screen = await render(<Harness />);
    await screen.getByRole("button", { name: "Open menu for Active" }).click();
    await screen.getByRole("menuitem", { name: "Move down" }).click();
    await vi.waitFor(() => expect(db.statuses.map((s) => s.name)[0]).toBe("Prospect"));
    expect(db.statuses.map((s) => s.name).slice(0, 2)).toEqual(["Prospect", "Active"]);
  });

  it("adiciona e remove um domínio excluído, validando a entrada", async () => {
    db.settings.enabled = true;
    const screen = await render(<Harness />);
    await screen.getByRole("button", { name: "Open menu for Excluded domains and emails" }).click();
    await screen.getByRole("menuitem", { name: "Add domain or email…" }).click();
    await screen.getByRole("textbox", { name: "Domain or email" }).fill("not a domain");
    await screen.getByRole("button", { name: "Add", exact: true }).click();
    await expect.element(screen.getByText("Enter a valid domain or email address.")).toBeVisible();

    await screen.getByRole("textbox", { name: "Domain or email" }).fill("Acme.com");
    await screen.getByRole("button", { name: "Add", exact: true }).click();
    await expect.element(screen.getByText("acme.com")).toBeVisible();
    await screen.getByRole("button", { name: "Remove acme.com" }).click();
    await expect.element(screen.getByText("No excluded domains and emails")).toBeVisible();
  });

  it('"List of generic domains" abre a lista embutida, só leitura', async () => {
    const screen = await render(<Harness />);
    await screen.getByRole("button", { name: "List of generic domains" }).click();
    await expect.element(screen.getByRole("dialog", { name: "Generic domains" })).toBeVisible();
    await expect.element(screen.getByText("gmail.com")).toBeVisible();
  });

  it.each([
    ["dark", false],
    ["light", true],
  ] as const)("não tem violações axe no tema %s (recurso ligado: %s)", async (theme, enabled) => {
    document.documentElement.dataset.theme = theme;
    db.settings.enabled = enabled;
    db.tiers = [{ id: id(), name: "Enterprise", color: "cyan", position: 0 }];
    db.rules = [{ id: id(), kind: "excluded", value: "acme.com", createdAt: "2026-09-29" }];
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("Enable Customer requests")).toBeVisible();
    expect(await axeViolations(document.body)).toEqual([]);
    delete document.documentElement.dataset.theme;
  });
});
