/** Members Administration interaction in a real Chromium browser. */
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
import { MembersPage } from "./members";

type WorkspaceCurrent = {
  workspace: { id: string; name: string; icon: { kind: "icon"; name: string; color: "red" } };
  member: { id: string; name: string; email: string; role: string };
};

type MemberItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const fetchMembers = vi.fn<() => Promise<MemberItem[]>>();
const fetchCurrent = vi.fn<() => Promise<WorkspaceCurrent>>();
const updateMember = vi.fn<(input: { id: string; name: string }) => Promise<MemberItem>>();

vi.mock("@/services/members", () => ({
  membersQueryOptions: () => queryOptions({ queryKey: ["members"], queryFn: () => fetchMembers() }),
  updateMemberMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string; name: string }) => updateMember(input) }),
}));

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({ queryKey: ["workspace", "current"], queryFn: () => fetchCurrent() }),
}));

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "22222222-2222-4222-8222-222222222222";

function makeMembers(): MemberItem[] {
  return [
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Zoe",
      email: "zoe@example.com",
      role: "member",
      createdAt: "2026-01-03T00:00:00.000Z",
    },
    {
      id: ADMIN_ID,
      name: "Andre",
      email: "andre@example.com",
      role: "admin",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: MEMBER_ID,
      name: "Bianca",
      email: "bianca@example.com",
      role: "member",
      createdAt: "2026-01-02T00:00:00.000Z",
    },
  ];
}

function makeCurrent(role = "admin"): WorkspaceCurrent {
  return {
    workspace: {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Zynox",
      icon: { kind: "icon", name: "Zap", color: "red" },
    },
    member: { id: ADMIN_ID, name: "Andre", email: "andre@example.com", role },
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

function Harness({ initialPath = "/settings/members" }: { initialPath?: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <main>
            <MembersPage />
            <LocationOutput />
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  fetchMembers.mockReset();
  fetchCurrent.mockReset();
  updateMember.mockReset();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("MembersPage", () => {
  it("carrega tabela e grava ordenação nos search params", async () => {
    fetchMembers.mockResolvedValue(makeMembers());
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness initialPath="/settings/members?filter=active" />);

    await expect.element(screen.getByRole("heading", { name: "Members" })).toBeVisible();
    const rows = screen.getByRole("table", { name: "Members" }).getByRole("row");
    await expect.element(rows.nth(1)).toHaveTextContent("Andre");
    await expect.element(rows.nth(2)).toHaveTextContent("Bianca");
    await expect.element(rows.nth(3)).toHaveTextContent("Zoe");

    await screen
      .getByRole("columnheader", { name: "Name" })
      .getByRole("button", { name: "Name" })
      .click();

    await expect
      .element(screen.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/members?filter=active&sort=name&dir=desc");
    await expect.element(rows.nth(1)).toHaveTextContent("Zoe");
    await expect.element(rows.nth(3)).toHaveTextContent("Andre");
  });

  it("admin renomeia um Member e atualiza a lista", async () => {
    const members = makeMembers();
    fetchMembers.mockResolvedValue(members);
    fetchCurrent.mockResolvedValue(makeCurrent());
    updateMember.mockImplementation(async ({ id, name }) => {
      const target = members.find((item) => item.id === id);
      if (!target) throw new Error("Member not found");
      target.name = name;
      return target;
    });
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Bianca", { exact: true })).toBeVisible();
    const row = screen.getByRole("table", { name: "Members" }).getByRole("row").nth(2);
    await row.hover();
    await row.getByRole("button", { name: "Open menu" }).click();
    await screen.getByRole("menuitem", { name: /Update name/ }).click();
    await screen.getByRole("textbox", { name: "Name" }).fill("Bia");
    await screen.getByRole("button", { name: "Save" }).click();

    await vi.waitFor(() =>
      expect(updateMember).toHaveBeenCalledWith({ id: MEMBER_ID, name: "Bia" }),
    );
    await expect.element(screen.getByText("Member name updated")).toBeVisible();
    await expect.element(screen.getByText("Bia", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Bianca", { exact: true })).not.toBeInTheDocument();
  });

  it("Member comum não vê ação de edição", async () => {
    fetchMembers.mockResolvedValue(makeMembers());
    fetchCurrent.mockResolvedValue(makeCurrent("member"));
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Andre", { exact: true })).toBeVisible();
    expect(document.querySelector('button[aria-label="Open menu"]')).toBeNull();
  });

  it("erro de leitura oferece Retry e recarrega os Members", async () => {
    fetchMembers.mockRejectedValueOnce(new Error("network error"));
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Could not load Members")).toBeVisible();
    fetchMembers.mockResolvedValue(makeMembers());
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(screen.getByText("Bianca", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Could not load Members")).not.toBeInTheDocument();
  });
});
