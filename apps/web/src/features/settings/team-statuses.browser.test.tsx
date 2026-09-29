/** Team issue statuses (Workflow) interaction in a real Chromium browser. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ORPCError } from "@orpc/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { ToastProvider } from "@vyzer/design-system/components";
import { StatusIcon } from "@vyzer/design-system/icons";
import type { WorkflowStatus } from "@vyzer/contract";
import "@/index.css";
import { TeamStatusesPage } from "./team-statuses";

type WorkspaceCurrent = {
  workspace: { id: string; name: string; icon: { kind: "icon"; name: string; color: "red" } };
  member: { id: string; name: string; email: string; role: string };
};

type TeamItem = {
  id: string;
  name: string;
  slug: string;
  key: string;
  icon: { kind: "icon"; name: string; color: "red" };
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateInput = {
  team: string;
  category: WorkflowStatus["category"];
  name: string;
  description: string | null;
  color: WorkflowStatus["color"];
};
type UpdateInput = {
  id: string;
  name: string;
  description: string | null;
  color: WorkflowStatus["color"];
};

const fetchStatuses = vi.fn<() => Promise<WorkflowStatus[]>>();
const fetchCurrent = vi.fn<() => Promise<WorkspaceCurrent>>();
const createStatus = vi.fn<(input: CreateInput) => Promise<WorkflowStatus>>();
const updateStatus = vi.fn<(input: UpdateInput) => Promise<WorkflowStatus>>();
const deleteStatus = vi.fn<(input: { id: string }) => Promise<unknown>>();
const reorderStatus = vi.fn<(input: { id: string; position: number }) => Promise<unknown>>();
const setDefaultStatus = vi.fn<(input: { id: string }) => Promise<unknown>>();

vi.mock("@/services/statuses", () => ({
  statusesQueryOptions: (team: string) =>
    queryOptions({ queryKey: ["statuses", team], queryFn: () => fetchStatuses() }),
  createStatusMutationOptions: () =>
    mutationOptions({ mutationFn: (input: CreateInput) => createStatus(input) }),
  updateStatusMutationOptions: () =>
    mutationOptions({ mutationFn: (input: UpdateInput) => updateStatus(input) }),
  deleteStatusMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => deleteStatus(input) }),
  reorderStatusMutationOptions: () =>
    mutationOptions({
      mutationFn: (input: { id: string; position: number }) => reorderStatus(input),
    }),
  setDefaultStatusMutationOptions: () =>
    mutationOptions({ mutationFn: (input: { id: string }) => setDefaultStatus(input) }),
}));

vi.mock("@/services/teams", () => ({
  teamQueryOptions: (slug: string) =>
    queryOptions({ queryKey: ["team", slug], queryFn: async () => makeTeam(slug) }),
}));

vi.mock("@/services/workspace", () => ({
  currentWorkspaceQueryOptions: () =>
    queryOptions({ queryKey: ["workspace", "current"], queryFn: () => fetchCurrent() }),
}));

const TEAM_ID = "55555555-5555-4555-8555-555555555555";
const STAMP = "2026-01-01T00:00:00.000Z";

function makeTeam(slug: string): TeamItem {
  return {
    id: TEAM_ID,
    name: "Vyzer",
    slug,
    key: "VYZ",
    icon: { kind: "icon", name: "Zap", color: "red" },
    description: null,
    createdAt: STAMP,
    updatedAt: STAMP,
  };
}

function makeCurrent(role = "admin"): WorkspaceCurrent {
  return {
    workspace: {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Zynox",
      icon: { kind: "icon", name: "Zap", color: "red" },
    },
    member: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Andre",
      email: "andre@example.com",
      role,
    },
  };
}

let nextId = 1;
function makeStatus(
  name: string,
  category: WorkflowStatus["category"],
  overrides: Partial<WorkflowStatus> = {},
): WorkflowStatus {
  const suffix = String(nextId++).padStart(12, "0");
  return {
    id: `66666666-6666-4666-8666-${suffix}`,
    teamId: TEAM_ID,
    name,
    description: null,
    category,
    color: "grey",
    position: 0,
    isDefault: false,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...overrides,
  };
}

/** The 7 statuses a new Team starts with; Triage is off by default. */
function makeStatuses(): WorkflowStatus[] {
  return [
    makeStatus("Backlog", "backlog", { isDefault: true }),
    makeStatus("Todo", "unstarted"),
    makeStatus("In Progress", "started", { color: "amber" }),
    makeStatus("In Review", "started", {
      color: "green",
      position: 1,
      description: "Pull request is being reviewed",
    }),
    makeStatus("Done", "completed", { color: "purple" }),
    makeStatus("Canceled", "canceled"),
    makeStatus("Duplicate", "duplicate"),
  ];
}

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/settings/teams/vyzer/statuses"]}>
          <main>
            <Routes>
              <Route path="/settings/teams/:team/statuses" element={<TeamStatusesPage />} />
            </Routes>
          </main>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

type Screen = Awaited<ReturnType<typeof render>>;

const group = (screen: Screen, title: string) =>
  screen.getByRole("region", { name: title, exact: true });
const row = (screen: Screen, name: string) =>
  screen.getByRole("listitem").filter({ hasText: name });
const openMenu = async (screen: Screen, name: string) => {
  const target = row(screen, name);
  await target.hover();
  await target.getByRole("button", { name: "Open menu" }).click();
};

/** Serves a mutable list, so a mutation followed by the invalidation shows up in the refetch. */
function serve(statuses: WorkflowStatus[], role = "admin") {
  fetchStatuses.mockImplementation(async () => structuredClone(statuses));
  fetchCurrent.mockResolvedValue(makeCurrent(role));
  return statuses;
}

beforeEach(async () => {
  nextId = 1;
  for (const mock of [
    fetchStatuses,
    fetchCurrent,
    createStatus,
    updateStatus,
    deleteStatus,
    reorderStatus,
    setDefaultStatus,
  ]) {
    mock.mockReset();
  }
  await page.viewport(1280, 900);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("TeamStatusesPage", () => {
  it("renders the Workflow grouped by category, with the default marker and descriptions", async () => {
    serve(makeStatuses());
    const screen = await render(<Harness />);

    await expect
      .element(screen.getByRole("heading", { name: "Issue statuses", level: 1 }))
      .toBeVisible();
    await expect.element(group(screen, "Backlog")).toBeVisible();
    const titles = screen
      .getByRole("heading", { level: 3 })
      .elements()
      .map((heading) => heading.textContent);
    expect(titles).toEqual([
      "Backlog",
      "Unstarted",
      "Started",
      "Completed",
      "Canceled",
      "Duplicate",
    ]);

    await expect.element(group(screen, "Backlog")).toHaveTextContent("Backlog");
    await expect.element(group(screen, "Unstarted")).toHaveTextContent("Todo");
    await expect.element(group(screen, "Started")).toHaveTextContent("In Progress");
    await expect.element(group(screen, "Started")).toHaveTextContent("In Review");
    await expect.element(group(screen, "Completed")).toHaveTextContent("Done");
    await expect.element(group(screen, "Canceled")).toHaveTextContent("Canceled");
    await expect.element(group(screen, "Duplicate")).toHaveTextContent("Duplicate");

    await expect
      .element(group(screen, "Backlog").getByText("Default", { exact: true }))
      .toBeVisible();
    await expect.element(screen.getByText("Pull request is being reviewed")).toBeVisible();
  });

  it("admin sees Create on every group but Duplicate, and Duplicate has no menu", async () => {
    serve(makeStatuses());
    const screen = await render(<Harness />);

    await expect.element(group(screen, "Backlog")).toBeVisible();
    for (const title of ["Backlog", "Unstarted", "Started", "Completed", "Canceled"]) {
      await expect
        .element(group(screen, title).getByRole("button", { name: "Create new workflow state" }))
        .toBeVisible();
    }
    await expect
      .element(
        group(screen, "Duplicate").getByRole("button", { name: "Create new workflow state" }),
      )
      .not.toBeInTheDocument();

    await expect
      .element(row(screen, "Todo").getByRole("button", { name: "Open menu" }))
      .toBeInTheDocument();
    await expect
      .element(row(screen, "Duplicate").getByRole("button", { name: "Open menu" }))
      .not.toBeInTheDocument();
  });

  it("creates a status inline and refreshes the list", async () => {
    const statuses = serve(makeStatuses());
    createStatus.mockImplementation(async (input) => {
      const created = makeStatus(input.name, input.category, {
        description: input.description,
        color: input.color,
        position: 2,
      });
      statuses.push(created);
      return created;
    });
    const screen = await render(<Harness />);

    await expect.element(group(screen, "Started")).toBeVisible();
    await group(screen, "Started")
      .getByRole("button", { name: "Create new workflow state" })
      .click();

    const name = screen.getByRole("textbox", { name: "Name", exact: true });
    await expect.element(name).toHaveFocus();
    const save = screen.getByRole("button", { name: "Save" });
    await expect.element(save).toBeDisabled();

    await name.fill("Blocked");
    await screen.getByRole("textbox", { name: "Description" }).fill("Waiting on others");
    await expect.element(save).toBeEnabled();
    await save.click();

    await vi.waitFor(() =>
      expect(createStatus).toHaveBeenCalledWith({
        team: "vyzer",
        category: "started",
        name: "Blocked",
        description: "Waiting on others",
        color: "grey",
      }),
    );
    await expect.element(group(screen, "Started")).toHaveTextContent("Blocked");
    await expect.element(group(screen, "Started")).toHaveTextContent("Waiting on others");
    await expect
      .element(screen.getByRole("textbox", { name: "Name", exact: true }))
      .not.toBeInTheDocument();
  });

  it("Esc in the Name field cancels the create form without saving", async () => {
    serve(makeStatuses());
    const screen = await render(<Harness />);

    await expect.element(group(screen, "Started")).toBeVisible();
    await group(screen, "Started")
      .getByRole("button", { name: "Create new workflow state" })
      .click();
    const name = screen.getByRole("textbox", { name: "Name", exact: true });
    await expect.element(name).toHaveFocus();
    await name.fill("Blocked");

    await userEvent.keyboard("{Escape}");

    await expect.element(name).not.toBeInTheDocument();
    expect(createStatus).not.toHaveBeenCalled();
  });

  it("edits a status inline, pre-filled, and saves only when something changed", async () => {
    const statuses = serve(makeStatuses());
    const target = statuses.find((status) => status.name === "In Review")!;
    updateStatus.mockImplementation(async ({ id, ...values }) => {
      const found = statuses.find((status) => status.id === id)!;
      Object.assign(found, values);
      return found;
    });
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("In Review", { exact: true })).toBeVisible();
    await openMenu(screen, "In Review");
    await screen.getByRole("menuitem", { name: "Edit" }).click();

    const name = screen.getByRole("textbox", { name: "Name", exact: true });
    await expect.element(name).toHaveFocus();
    await expect.element(name).toHaveValue("In Review");
    await expect
      .element(screen.getByRole("textbox", { name: "Description" }))
      .toHaveValue("Pull request is being reviewed");
    const save = screen.getByRole("button", { name: "Save" });
    await expect.element(save).toBeDisabled();

    await name.fill("In QA");
    await expect.element(save).toBeEnabled();
    await save.click();

    await vi.waitFor(() =>
      expect(updateStatus).toHaveBeenCalledWith({
        id: target.id,
        name: "In QA",
        description: "Pull request is being reviewed",
        color: "green",
      }),
    );
    await expect.element(screen.getByText("In QA", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("In Review", { exact: true })).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("textbox", { name: "Name", exact: true }))
      .not.toBeInTheDocument();
  });

  it("shows only the row menu items that apply to each status", async () => {
    serve(makeStatuses());
    const screen = await render(<Harness />);
    await expect.element(group(screen, "Started")).toBeVisible();

    // First of two in Started: can go down, not up; Started can never be the default.
    await openMenu(screen, "In Progress");
    await expect.element(screen.getByRole("menuitem", { name: "Move down" })).toBeVisible();
    await expect.element(screen.getByRole("menuitem", { name: "Move up" })).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("menuitem", { name: "Make default" }))
      .not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    // Last of two: can go up, not down.
    await openMenu(screen, "In Review");
    await expect.element(screen.getByRole("menuitem", { name: "Move up" })).toBeVisible();
    await expect
      .element(screen.getByRole("menuitem", { name: "Move down" }))
      .not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    // Non-default Unstarted can become the default.
    await openMenu(screen, "Todo");
    await expect.element(screen.getByRole("menuitem", { name: "Make default" })).toBeVisible();
    await userEvent.keyboard("{Escape}");

    // The current default already is one.
    await openMenu(screen, "Backlog");
    await expect.element(screen.getByRole("menuitem", { name: "Edit" })).toBeVisible();
    await expect
      .element(screen.getByRole("menuitem", { name: "Make default" }))
      .not.toBeInTheDocument();
  });

  it("Move down reorders and Make default sets the Team default", async () => {
    const statuses = serve(makeStatuses());
    reorderStatus.mockResolvedValue({});
    setDefaultStatus.mockResolvedValue({});
    const screen = await render(<Harness />);
    await expect.element(group(screen, "Started")).toBeVisible();

    await openMenu(screen, "In Progress");
    await screen.getByRole("menuitem", { name: "Move down" }).click();
    await vi.waitFor(() =>
      expect(reorderStatus).toHaveBeenCalledWith({
        id: statuses.find((status) => status.name === "In Progress")!.id,
        position: 1,
      }),
    );

    await openMenu(screen, "Todo");
    await screen.getByRole("menuitem", { name: "Make default" }).click();
    await vi.waitFor(() =>
      expect(setDefaultStatus).toHaveBeenCalledWith({
        id: statuses.find((status) => status.name === "Todo")!.id,
      }),
    );
  });

  it("asks for confirmation before deleting, with Cancel focused", async () => {
    const statuses = serve(makeStatuses());
    const target = statuses.find((status) => status.name === "In Review")!;
    deleteStatus.mockImplementation(async ({ id }) => {
      statuses.splice(
        statuses.findIndex((status) => status.id === id),
        1,
      );
    });
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("In Review", { exact: true })).toBeVisible();

    await openMenu(screen, "In Review");
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    const dialog = screen.getByRole("alertdialog", { name: "Delete “In Review”?" });
    await expect.element(dialog).toBeVisible();
    await expect.element(dialog.getByRole("button", { name: "Cancel" })).toHaveFocus();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect.element(dialog).not.toBeInTheDocument();
    expect(deleteStatus).not.toHaveBeenCalled();
    await expect.element(screen.getByText("In Review", { exact: true })).toBeVisible();

    await openMenu(screen, "In Review");
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    await dialog.getByRole("button", { name: "Delete" }).click();

    await vi.waitFor(() => expect(deleteStatus).toHaveBeenCalledWith({ id: target.id }));
    await expect.element(dialog).not.toBeInTheDocument();
    await expect.element(screen.getByText("In Review", { exact: true })).not.toBeInTheDocument();
  });

  it("shows the API message in an error toast when a delete is rejected", async () => {
    serve(makeStatuses());
    deleteStatus.mockRejectedValue(
      new ORPCError("BAD_REQUEST", {
        message: "Each workflow category must keep at least one Status.",
      }),
    );
    const screen = await render(<Harness />);
    await expect.element(screen.getByText("Done", { exact: true })).toBeVisible();

    await openMenu(screen, "Done");
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    await screen
      .getByRole("alertdialog", { name: "Delete “Done”?" })
      .getByRole("button", { name: "Delete" })
      .click();

    await expect.element(screen.getByText("Could not delete status")).toBeVisible();
    await expect
      .element(screen.getByText("Each workflow category must keep at least one Status."))
      .toBeVisible();
    await expect.element(screen.getByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Member comum não vê Create nem menu de linha", async () => {
    serve(makeStatuses(), "member");
    const screen = await render(<Harness />);

    await expect.element(group(screen, "Backlog")).toBeVisible();
    await expect.element(screen.getByText("In Review", { exact: true })).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Create new workflow state" }))
      .not.toBeInTheDocument();
    expect(document.querySelector('button[aria-label="Create new workflow state"]')).toBeNull();
    expect(document.querySelector('button[aria-label="Open menu"]')).toBeNull();
  });

  it("shows a skeleton while loading, then the content", async () => {
    let release: (value: WorkflowStatus[]) => void = () => {};
    fetchStatuses.mockImplementation(
      () => new Promise<WorkflowStatus[]>((resolve) => (release = resolve)),
    );
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Loading statuses.")).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expect.element(group(screen, "Backlog")).not.toBeInTheDocument();

    release(makeStatuses());

    await expect.element(group(screen, "Backlog")).toBeVisible();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it("erro de leitura oferece Retry e recarrega os statuses", async () => {
    fetchStatuses.mockRejectedValueOnce(new Error("network error"));
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);

    await expect.element(screen.getByRole("alert")).toHaveTextContent("Could not load statuses");
    fetchStatuses.mockImplementation(async () => makeStatuses());
    await screen.getByRole("button", { name: "Retry" }).click();

    await expect.element(group(screen, "Backlog")).toBeVisible();
    await expect.element(screen.getByText("Could not load statuses")).not.toBeInTheDocument();
  });

  it("unknown Team shows the not found state", async () => {
    fetchStatuses.mockRejectedValue(new ORPCError("NOT_FOUND", { message: "Team not found" }));
    fetchCurrent.mockResolvedValue(makeCurrent());
    const screen = await render(<Harness />);

    await expect.element(screen.getByText("Team not found", { exact: true })).toBeVisible();
    await expect.element(screen.getByText("Could not load statuses")).not.toBeInTheDocument();
  });
});

describe("StatusIcon", () => {
  it("paints the icon with the label color class", async () => {
    const screen = await render(<StatusIcon type="completed" color="green" />);

    const svg = screen.container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.classList.contains("text-green")).toBe(true);
  });
});
