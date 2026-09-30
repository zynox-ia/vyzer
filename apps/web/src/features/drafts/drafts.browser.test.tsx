/**
 * Página Drafts (item "Drafts" da sidebar) num Chromium real: lista, estado vazio, retomar,
 * publicar (só com título e Team) e descartar, com a API de rascunhos em memória.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import axe from "axe-core";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { DraftsPage } from "./index";

type DraftRow = {
  id: string;
  workspaceId: string;
  creatorId: string;
  teamId: string | null;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

const TEAM_ID = "33333333-3333-4333-8333-333333333333";
const draft = (over: Partial<DraftRow>): DraftRow => ({
  id: "44444444-4444-4444-8444-444444444444",
  workspaceId: "11111111-1111-4111-8111-111111111111",
  creatorId: "22222222-2222-4222-8222-222222222222",
  teamId: null,
  title: "",
  description: null,
  createdAt: "2026-09-30T12:00:00.000Z",
  updatedAt: "2026-09-30T12:00:00.000Z",
  ...over,
});

let rows: DraftRow[] = [];
const updateDraft = vi.fn<(input: Record<string, unknown>) => Promise<DraftRow>>();
const publishDraft = vi.fn<(input: { id: string }) => Promise<unknown>>();
const discardDraft = vi.fn<(input: { id: string }) => Promise<void>>();

vi.mock("@/services/issue-drafts", () => ({
  issueDraftsQueryOptions: () =>
    queryOptions({ queryKey: ["issue-drafts"], queryFn: async () => structuredClone(rows) }),
  updateIssueDraftMutationOptions: () =>
    mutationOptions({ mutationFn: (input: Record<string, unknown>) => updateDraft(input) }),
  publishIssueDraftMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => publishDraft(input) }),
  discardIssueDraftMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => discardDraft(input) }),
  createIssueDraftMutationOptions: () => mutationOptions({ mutationFn: async () => ({}) }),
}));
vi.mock("@/services/teams", () => ({
  teamsQueryOptions: () =>
    queryOptions({ queryKey: ["teams"], queryFn: async () => [{ id: TEAM_ID, name: "Vyzer" }] }),
}));

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/drafts"]}>
          <Routes>
            <Route path="/drafts" element={<DraftsPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  rows = [];
  updateDraft.mockReset();
  publishDraft.mockReset();
  discardDraft.mockReset();
  await page.viewport(1280, 720);
});
afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("DraftsPage", () => {
  it("sem rascunhos mostra o estado vazio", async () => {
    await render(<Harness />);
    await expect.element(page.getByText("No drafts")).toBeVisible();
  });

  it("lista os rascunhos; sem título aparece Untitled draft e sem Team o Publish fica desabilitado", async () => {
    rows = [
      draft({ id: "a1111111-1111-4111-8111-111111111111", title: "Fix login", teamId: TEAM_ID }),
      draft({ id: "b2222222-2222-4222-8222-222222222222", title: "" }),
    ];
    await render(<Harness />);
    await expect.element(page.getByText("Fix login")).toBeVisible();
    await expect.element(page.getByText("Untitled draft")).toBeVisible();
    const publish = page.getByRole("button", { name: "Publish" });
    await expect.element(publish.first()).toBeEnabled();
    await expect.element(publish.last()).toBeDisabled();
  });

  it("publicar chama a API e mostra o aviso", async () => {
    rows = [draft({ title: "Fix login", teamId: TEAM_ID })];
    publishDraft.mockImplementation(async () => {
      rows = [];
      return { identifier: "VYZ-9", title: "Fix login" };
    });
    await render(<Harness />);
    await page.getByRole("button", { name: "Publish" }).click();
    await vi.waitFor(() => expect(publishDraft).toHaveBeenCalledTimes(1));
    await expect.element(page.getByText("Issue created")).toBeVisible();
    await expect.element(page.getByText("No drafts")).toBeVisible();
  });

  it("Open draft edita título e Team e grava", async () => {
    rows = [draft({ title: "Old" })];
    updateDraft.mockResolvedValue(draft({ title: "New", teamId: TEAM_ID }));
    await render(<Harness />);
    await page.getByRole("button", { name: "Open draft" }).click();
    await page.getByLabelText("Draft title").fill("New");
    await page.getByRole("button", { name: "Save draft" }).click();
    await vi.waitFor(() => expect(updateDraft).toHaveBeenCalledTimes(1));
    expect(updateDraft.mock.calls[0]![0]).toMatchObject({ title: "New", teamId: null });
  });

  it("Discard pede confirmação e só então descarta", async () => {
    rows = [draft({ title: "Old" })];
    discardDraft.mockImplementation(async () => {
      rows = [];
    });
    await render(<Harness />);
    await page.getByRole("button", { name: "Discard" }).click();
    await expect.element(page.getByRole("alertdialog", { name: "Discard draft?" })).toBeVisible();
    expect(discardDraft).not.toHaveBeenCalled();
    await page.getByRole("alertdialog").getByRole("button", { name: "Discard draft" }).click();
    await vi.waitFor(() => expect(discardDraft).toHaveBeenCalledTimes(1));
    await expect.element(page.getByText("Draft discarded")).toBeVisible();
  });

  it("não tem violações axe", async () => {
    rows = [draft({ title: "Fix login", teamId: TEAM_ID })];
    await render(<Harness />);
    await expect.element(page.getByText("Fix login")).toBeVisible();
    const result = await axe.run(document.body, { resultTypes: ["violations"] });
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
});
