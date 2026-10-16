/**
 * `NotificationsPage` e `NotificationChannelPage` ligadas à API (em memória aqui): carregam, gravam
 * com volta e aviso se falha, e a Priority inbox e os tipos de um canal persistem.
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
import { MemoryRouter, Route, Routes } from "react-router";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import type {
  NotificationPreferences,
  NotificationTypePreferences,
} from "@/services/notification-preferences";
import { NOTIFICATION_TYPES } from "./notifications-model";
import { NotificationChannelPage, NotificationsPage } from "./notifications-page";

const IDS = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  memberId: "22222222-2222-4222-8222-222222222222",
};

const PREFS: NotificationPreferences = {
  ...IDS,
  priorityInboxEnabled: false,
  emailEnabled: true,
  emailFormat: "digest",
  emailDigestDelayLowPriority: true,
  emailDigestUrgentImmediate: true,
  showChangelogInSidebar: true,
  changelogNewsletter: false,
  marketingAndOnboarding: true,
  inviteAccepted: true,
  privacyAndLegalUpdates: true,
  dataProcessingAgreement: false,
};

type Channel = NotificationTypePreferences["channel"];

const matrixFor = (channel: Channel): NotificationTypePreferences => ({
  ...IDS,
  channel,
  items: NOTIFICATION_TYPES.map((type) => ({
    type: type.key,
    enabled: channel === "priority" ? type.key === "assignments" : true,
  })),
});

let prefs: NotificationPreferences;
let matrices: Record<string, NotificationTypePreferences>;
const prefUpdates: unknown[] = [];
const typeUpdates: unknown[] = [];
const state = { fail: false };

vi.mock("@/services/notification-preferences", () => ({
  notificationPreferencesQueryOptions: () =>
    queryOptions({ queryKey: ["np"], queryFn: async () => structuredClone(prefs) }),
  updateNotificationPreferencesMutationOptions: () =>
    mutationOptions({
      mutationFn: async (patch: Partial<NotificationPreferences>) => {
        prefUpdates.push(patch);
        if (state.fail) throw new Error("boom");
        prefs = { ...prefs, ...patch };
        return structuredClone(prefs);
      },
    }),
  notificationTypePreferencesQueryOptions: (channel: string) =>
    queryOptions({
      queryKey: ["ntp", channel],
      queryFn: async () => structuredClone(matrices[channel]!),
    }),
  updateNotificationTypePreferencesMutationOptions: () =>
    mutationOptions({
      mutationFn: async (input: {
        channel: string;
        items: { type: string; enabled: boolean }[];
      }) => {
        typeUpdates.push(input);
        if (state.fail) throw new Error("boom");
        const current = matrices[input.channel]!;
        matrices[input.channel] = {
          ...current,
          items: current.items.map(
            (item) => input.items.find((next) => next.type === item.type) ?? item,
          ) as NotificationTypePreferences["items"],
        };
        return structuredClone(matrices[input.channel]!);
      },
    }),
}));

vi.mock("@/services/profile", () => ({
  profileQueryOptions: () =>
    queryOptions({
      queryKey: ["profile"],
      queryFn: async () => ({ email: "andre@example.com" }),
    }),
}));

function Harness({ at }: { at: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[at]}>
          <main>
            <Routes>
              <Route path="/settings/notifications" element={<NotificationsPage />} />
              <Route
                path="/settings/notifications/:channel"
                element={<NotificationChannelPage />}
              />
            </Routes>
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  prefs = structuredClone(PREFS);
  matrices = Object.fromEntries(
    (["priority", "desktop", "mobile", "email", "slack"] as const).map((channel) => [
      channel,
      matrixFor(channel),
    ]),
  );
  prefUpdates.length = 0;
  typeUpdates.length = 0;
  state.fail = false;
  await page.viewport(1280, 1400);
});

describe("NotificationsPage", () => {
  it("carrega as flags e os resumos dos canais", async () => {
    await render(<Harness at="/settings/notifications" />);
    await expect.element(page.getByRole("switch", { name: "Priority inbox" })).not.toBeChecked();
    await expect
      .element(page.getByRole("link", { name: /Email/ }))
      .toHaveTextContent("Enabled for all notifications");
    await expect
      .element(page.getByRole("link", { name: /Priority notifications/ }))
      .toHaveTextContent("1 types");
  });

  it("ligar a Priority inbox grava priorityInboxEnabled", async () => {
    await render(<Harness at="/settings/notifications" />);
    await page.getByRole("switch", { name: "Priority inbox" }).click();
    await vi.waitFor(() => expect(prefs.priorityInboxEnabled).toBe(true));
    expect(prefUpdates).toEqual([{ priorityInboxEnabled: true }]);
  });

  it("falha ao gravar: volta o switch e avisa", async () => {
    state.fail = true;
    await render(<Harness at="/settings/notifications" />);
    await page.getByRole("switch", { name: "Changelog newsletter" }).click();
    await expect.element(page.getByText("Could not save notification settings")).toBeVisible();
    await expect
      .element(page.getByRole("switch", { name: "Changelog newsletter" }))
      .not.toBeChecked();
  });
});

describe("NotificationChannelPage", () => {
  it("um tipo grava o canal e o tipo", async () => {
    await render(<Harness at="/settings/notifications/priority" />);
    await page.getByRole("checkbox", { name: "Mentions" }).click();
    await vi.waitFor(() =>
      expect(typeUpdates).toEqual([
        { channel: "priority", items: [{ type: "mentions", enabled: true }] },
      ]),
    );
    await expect.element(page.getByRole("checkbox", { name: "Mentions" })).toBeChecked();
  });

  it("falha ao gravar um tipo: volta a caixa e avisa", async () => {
    state.fail = true;
    await render(<Harness at="/settings/notifications/email" />);
    await page.getByRole("checkbox", { name: "Reactions" }).click();
    await expect.element(page.getByText("Could not save notification settings")).toBeVisible();
    await expect.element(page.getByRole("checkbox", { name: "Reactions" })).toBeChecked();
  });

  it("Email mostra o endereço do perfil e grava o ajuste", async () => {
    await render(<Harness at="/settings/notifications/email" />);
    await expect.element(page.getByText("Email notifications to andre@example.com")).toBeVisible();
    await page.getByRole("switch", { name: "Enable email notifications" }).click();
    await vi.waitFor(() => expect(prefs.emailEnabled).toBe(false));
  });

  it("Only deliver priority notifications só habilita com a Priority inbox ligada", async () => {
    prefs = { ...prefs, priorityInboxEnabled: true };
    await render(<Harness at="/settings/notifications/email" />);
    await expect
      .element(page.getByRole("switch", { name: "Only deliver priority notifications" }))
      .toBeEnabled();
  });

  it("canal desconhecido volta para a página principal", async () => {
    await render(<Harness at="/settings/notifications/fax" />);
    await expect.element(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
  });
});
