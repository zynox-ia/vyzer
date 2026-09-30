/** Inbox (etapa 4.1) num Chromium real: lista, seleção na URL, ler/não lida, apagar e a11y. */
import axe from "axe-core";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ToastProvider } from "@vyzer/design-system/components";
import type { Notification } from "@vyzer/contract";
import "@/index.css";
import { InboxPage } from ".";

const fetchList = vi.fn<() => Promise<{ items: Notification[]; nextCursor: null }>>();
const fetchCount = vi.fn<() => Promise<number>>();
const markRead = vi.fn<(input: { ids: string[] }) => Promise<void>>();
const markUnread = vi.fn<(input: { ids: string[] }) => Promise<void>>();
const archive = vi.fn<(input: { ids: string[] }) => Promise<void>>();
const archiveAll = vi.fn<(input: { onlyRead?: boolean }) => Promise<void>>();

vi.mock("@/services/notifications", () => ({
  notificationsQueryOptions: () =>
    queryOptions({ queryKey: ["notification", "list"], queryFn: () => fetchList() }),
  unreadNotificationsCountQueryOptions: () =>
    queryOptions({ queryKey: ["notification", "unreadCount"], queryFn: () => fetchCount() }),
  markNotificationsReadMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { ids: string[] }) => markRead(input) }),
  markNotificationsUnreadMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { ids: string[] }) => markUnread(input) }),
  archiveNotificationsMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { ids: string[] }) => archive(input) }),
  archiveAllNotificationsMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { onlyRead?: boolean }) => archiveAll(input) }),
  // Sem invalidar: o teste conduz o cache só pelas atualizações otimistas.
  invalidateNotificationQueries: () => Promise.resolve(),
}));

vi.mock("@/services/issues", () => ({
  issueQueryOptions: (identifier: string) =>
    queryOptions({
      queryKey: ["issue", identifier],
      queryFn: () => ({
        title: `Title of ${identifier}`,
        description: `Description of ${identifier}`,
        status: { id: "s", name: "In Progress", category: "started", color: "amber" },
        priority: 1,
        assignee: { id: "m", name: "Andre" },
      }),
    }),
}));

const ID_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ID_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ID_C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function makeNotification(id: string, number: number, readAt: string | null): Notification {
  return {
    id,
    type: "assigned",
    actor: { id: "44444444-4444-4444-8444-444444444444", name: "Marina" },
    issue: {
      id: `99999999-9999-4999-8999-99999999999${number}`,
      identifier: `ZYN-${number}`,
      title: `Issue ${number}`,
      priority: number === 1 ? 1 : 3,
      status: {
        id: "55555555-5555-4555-8555-555555555555",
        name: "Todo",
        category: "unstarted",
        color: "grey",
      },
    },
    projectId: null,
    payload: {},
    readAt,
    snoozedUntil: null,
    createdAt: new Date(Date.now() - number * 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - number * 3_600_000).toISOString(),
  };
}

function seed() {
  return [
    makeNotification(ID_A, 1, null),
    makeNotification(ID_B, 2, null),
    makeNotification(ID_C, 3, "2026-01-01T00:00:00.000Z"),
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

function Harness({ initialPath = "/inbox" }: { initialPath?: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/inbox/:notificationId?" element={<InboxPage />} />
          </Routes>
          <LocationOutput />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

async function violations() {
  const result = await axe.run(document.body, { resultTypes: ["violations"] });
  return result.violations.map((v) => `${v.id}: ${v.help}`);
}

beforeEach(async () => {
  for (const fn of [fetchList, fetchCount, markRead, markUnread, archive, archiveAll]) {
    fn.mockReset();
  }
  fetchList.mockImplementation(async () => ({ items: seed(), nextCursor: null }));
  fetchCount.mockResolvedValue(2);
  markRead.mockResolvedValue(undefined);
  markUnread.mockResolvedValue(undefined);
  archive.mockResolvedValue(undefined);
  archiveAll.mockResolvedValue(undefined);
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("InboxPage", () => {
  it("lista as notificações, diz Unread/Read e mostra a contagem no painel vazio", async () => {
    const screen = await render(<Harness />);

    const rows = screen.getByRole("option");
    await expect.element(rows.nth(0)).toHaveTextContent("Unread");
    await expect.element(rows.nth(0)).toHaveTextContent("ZYN-1");
    await expect.element(rows.nth(0)).toHaveTextContent("Marina assigned you");
    await expect.element(rows.nth(2)).toHaveTextContent("Read");
    await expect.element(screen.getByText("2 unread notifications")).toBeVisible();
  });

  it("abrir grava a seleção na URL, mostra a issue e marca como lida", async () => {
    const screen = await render(<Harness />);

    await screen.getByRole("option").nth(0).click();

    await expect.element(screen.getByLabelText("Current URL")).toHaveTextContent(`/inbox/${ID_A}`);
    await expect.element(screen.getByRole("heading", { name: "Title of ZYN-1" })).toBeVisible();
    await vi.waitFor(() => expect(markRead).toHaveBeenCalledWith({ ids: [ID_A] }));
    await expect.element(screen.getByRole("option").nth(0)).toHaveTextContent("Read");
  });

  it("U alterna lida e não lida sem reabrir a notificação", async () => {
    const screen = await render(<Harness initialPath={`/inbox/${ID_A}`} />);
    await vi.waitFor(() => expect(markRead).toHaveBeenCalledTimes(1));

    screen.getByRole("option").nth(0).element().focus();
    await userEvent.keyboard("u");

    await vi.waitFor(() => expect(markUnread).toHaveBeenCalledWith({ ids: [ID_A] }));
    await expect.element(screen.getByRole("option").nth(0)).toHaveTextContent("Unread");
    expect(markRead).toHaveBeenCalledTimes(1);
  });

  it("Backspace apaga e a seleção avança para a próxima", async () => {
    const screen = await render(<Harness initialPath={`/inbox/${ID_A}`} />);
    await vi.waitFor(() => expect(markRead).toHaveBeenCalledTimes(1));

    screen.getByRole("option").nth(0).element().focus();
    await userEvent.keyboard("{Backspace}");

    await vi.waitFor(() => expect(archive).toHaveBeenCalledWith({ ids: [ID_A] }));
    await expect.element(screen.getByLabelText("Current URL")).toHaveTextContent(`/inbox/${ID_B}`);
    expect(screen.getByRole("option").elements()).toHaveLength(2);
  });

  it("Show unreads only vai para a URL e esconde as lidas", async () => {
    const screen = await render(<Harness />);

    await screen.getByRole("button", { name: "Show unreads only" }).click();

    await expect.element(screen.getByLabelText("Current URL")).toHaveTextContent("/inbox?unread=1");
    expect(screen.getByRole("option").elements()).toHaveLength(2);
  });

  it("Delete all read chama archiveAll só com as lidas", async () => {
    const screen = await render(<Harness />);

    await screen.getByRole("button", { name: "Notification actions" }).click();
    await screen.getByRole("menuitem", { name: /Delete all read/ }).click();

    await vi.waitFor(() => expect(archiveAll).toHaveBeenCalledWith({ onlyRead: true }));
    expect(screen.getByRole("option").elements()).toHaveLength(2);
  });

  it("desfaz a mudança e avisa quando a API recusa", async () => {
    archive.mockRejectedValue(new Error("boom"));
    const screen = await render(<Harness initialPath={`/inbox/${ID_A}`} />);
    await vi.waitFor(() => expect(markRead).toHaveBeenCalledTimes(1));

    await screen.getByRole("button", { name: "Delete notification" }).click();

    await expect.element(screen.getByText("Could not delete notification")).toBeVisible();
    await expect.element(screen.getByRole("option").nth(0)).toHaveTextContent("ZYN-1");
  });

  it("id inexistente mostra o estado de não encontrado", async () => {
    const screen = await render(<Harness initialPath="/inbox/unknown" />);
    await expect.element(screen.getByText("Notification not found")).toBeVisible();
  });

  it("lista vazia, carregando e erro têm estado próprio", async () => {
    fetchList.mockResolvedValueOnce({ items: [], nextCursor: null });
    fetchCount.mockResolvedValue(0);
    const empty = await render(<Harness />);
    await expect.element(empty.getByText("No notifications")).toBeVisible();
    await expect.element(empty.getByText("No notification selected")).toBeVisible();
    await empty.unmount();

    fetchList.mockRejectedValueOnce(new Error("down"));
    const failed = await render(<Harness />);
    await expect.element(failed.getByText("Could not load notifications")).toBeVisible();
    fetchList.mockImplementation(async () => ({ items: seed(), nextCursor: null }));
    await failed.getByRole("button", { name: "Retry" }).click();
    await expect.element(failed.getByRole("option").nth(0)).toBeVisible();
  });

  it.each(["dark", "light"] as const)("não tem violações de acessibilidade (%s)", async (theme) => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(<Harness initialPath={`/inbox/${ID_B}`} />);
    await expect.element(screen.getByRole("heading", { name: "Title of ZYN-2" })).toBeVisible();
    await new Promise((r) => setTimeout(r, 300));
    expect(await violations()).toEqual([]);
  });
});
