/**
 * `CodeReviewsPage` ligada à API (em memória aqui): carrega, grava só o campo alterado com volta e
 * aviso se falha, e deixa os controles desabilitados para quem não é Admin.
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
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import type { CodeReviewSettings } from "@/services/code-reviews";
import { CodeReviewsPage } from "./code-reviews-page";

const INITIAL: CodeReviewSettings = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  enabled: true,
  autoConvertDraftPullRequests: false,
  mergeStrategy: "squash",
};

let server: CodeReviewSettings;
const updates: unknown[] = [];
const state = { fail: false, role: "admin", failLoad: false };

vi.mock("@/services/code-reviews", () => ({
  codeReviewsQueryOptions: () =>
    queryOptions({
      queryKey: ["code-reviews"],
      queryFn: async () => {
        if (state.failLoad) throw new Error("boom");
        return structuredClone(server);
      },
    }),
  updateCodeReviewsMutationOptions: () =>
    mutationOptions({
      mutationFn: async (patch: Partial<CodeReviewSettings>) => {
        updates.push(patch);
        if (state.fail) throw new Error("boom");
        server = { ...server, ...patch };
        return structuredClone(server);
      },
    }),
}));

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({
      queryKey: ["workspace", "current"],
      queryFn: async () => ({ member: { role: state.role } }),
    }),
}));

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <main>
          <CodeReviewsPage />
        </main>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  server = structuredClone(INITIAL);
  updates.length = 0;
  state.fail = false;
  state.failLoad = false;
  state.role = "admin";
  await page.viewport(1280, 900);
});

describe("CodeReviewsPage", () => {
  it("carrega os valores da API", async () => {
    await render(<Harness />);
    await expect.element(page.getByRole("switch", { name: "Enable code reviews" })).toBeChecked();
    await expect
      .element(page.getByRole("combobox", { name: "Merge strategy" }))
      .toHaveTextContent("Squash and merge");
  });

  it("erro de carga mostra Retry", async () => {
    state.failLoad = true;
    await render(<Harness />);
    await expect.element(page.getByText("Could not load code review settings")).toBeVisible();
    state.failLoad = false;
    await page.getByRole("button", { name: "Retry" }).click();
    await expect.element(page.getByRole("switch", { name: "Enable code reviews" })).toBeVisible();
  });

  it("grava só o campo alterado", async () => {
    await render(<Harness />);
    await page.getByRole("switch", { name: "Auto-convert draft pull requests" }).click();
    await vi.waitFor(() => expect(server.autoConvertDraftPullRequests).toBe(true));
    expect(updates).toEqual([{ autoConvertDraftPullRequests: true }]);
  });

  it("falha ao gravar: volta o controle e avisa", async () => {
    state.fail = true;
    await render(<Harness />);
    await page.getByRole("switch", { name: "Enable code reviews" }).click();
    await expect.element(page.getByText("Could not save code review settings")).toBeVisible();
    await expect.element(page.getByRole("switch", { name: "Enable code reviews" })).toBeChecked();
  });

  it("quem não é admin vê tudo desabilitado", async () => {
    state.role = "member";
    await render(<Harness />);
    await expect.element(page.getByRole("switch", { name: "Enable code reviews" })).toBeDisabled();
    await expect.element(page.getByRole("combobox", { name: "Merge strategy" })).toBeDisabled();
  });
});
