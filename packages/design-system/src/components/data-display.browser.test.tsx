import axe from "axe-core";
import { Circle } from "lucide-react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "../styles/index.css";
import {
  AvatarGroup,
  BoardCard,
  BoardColumn,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  IssueList,
  IssueRow,
  ListGroup,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Timeline,
  TimelineItem,
  Tree,
  formatRelativeTime,
} from ".";

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

async function violations(root: Element) {
  await Promise.all(
    root.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
  );
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}

const priority = { label: "High", icon: <Circle /> };
const status = { label: "In Progress", icon: <Circle /> };
type TestTreeItem = { value: string; title: string; children?: TestTreeItem[] };

const treeItems: TestTreeItem[] = [
  {
    value: "parent",
    title: "Parent",
    children: [
      {
        value: "child",
        title: "Child",
        children: [{ value: "grandchild", title: "Grandchild" }],
      },
    ],
  },
  { value: "sibling", title: "Sibling" },
];
const renderTreeItem = (item: TestTreeItem) => <span>{item.title}</span>;

function Issues({
  onOpen = vi.fn(),
  onSelectedChange,
}: {
  onOpen?: (value: string) => void;
  onSelectedChange?: (values: string[]) => void;
}) {
  return (
    <IssueList label="Issues" onOpen={onOpen} onSelectedChange={onSelectedChange}>
      <IssueRow
        value="VYZ-1"
        identifier="VYZ-1"
        title="First issue"
        priority={priority}
        status={status}
      />
      <IssueRow value="VYZ-2" identifier="VYZ-2" title="Second issue" />
      <IssueRow value="VYZ-3" identifier="VYZ-3" title="Third issue" />
    </IssueList>
  );
}

function SelectableIssues({
  onOpen,
  onSelectedChange,
}: {
  onOpen: (value: string) => void;
  onSelectedChange: (values: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <IssueList
      label="Issues"
      selected={selected}
      onOpen={onOpen}
      onSelectedChange={(next) => {
        setSelected(next);
        onSelectedChange(next);
      }}
    >
      <IssueRow
        value="VYZ-1"
        identifier="VYZ-1"
        title="First issue"
        priority={priority}
        status={status}
      />
      <IssueRow value="VYZ-2" identifier="VYZ-2" title="Second issue" />
      <IssueRow value="VYZ-3" identifier="VYZ-3" title="Third issue" />
    </IssueList>
  );
}

describe("IssueList and IssueRow", () => {
  it("uses one Tab stop, supports roving keys, selection, opening, clearing, and leaving the list", async () => {
    const onOpen = vi.fn();
    const onSelectedChange = vi.fn();
    const screen = await render(
      <div>
        <button type="button">Before</button>
        <SelectableIssues onOpen={onOpen} onSelectedChange={onSelectedChange} />
        <button type="button">After</button>
      </div>,
    );
    const rows = ["VYZ-1", "VYZ-2", "VYZ-3"].map((name) =>
      screen.getByRole("option", { name: new RegExp(name) }),
    );
    const list = screen.getByRole("listbox", { name: "Issues" });
    await expect.element(list).toHaveAttribute("aria-multiselectable", "true");
    await userEvent.tab();
    await userEvent.tab();
    await expect.element(rows[0]!).toHaveFocus();
    expect(rows.map((row) => row.element().tabIndex)).toEqual([0, -1, -1]);
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(rows[1]!).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}{End}{Home}");
    await expect.element(rows[0]!).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledWith("VYZ-1");
    await userEvent.keyboard(" ");
    expect(onSelectedChange).toHaveBeenLastCalledWith(["VYZ-1"]);
    await userEvent.keyboard("{Escape}");
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
    await userEvent.keyboard("{Control>}");
    await rows[1]!.click();
    await userEvent.keyboard("{/Control}");
    expect(onSelectedChange).toHaveBeenLastCalledWith(["VYZ-2"]);
    await rows[1]!.click();
    expect(onOpen).toHaveBeenLastCalledWith("VYZ-2");
    await userEvent.tab();
    await expect.element(screen.getByRole("button", { name: "After" })).toHaveFocus();

    const readOnly = await render(<Issues />);
    expect(
      readOnly.container.querySelector('[role="listbox"]')?.hasAttribute("aria-multiselectable"),
    ).toBe(false);
  });

  it("includes priority, status and missing assignee in the accessible row name; supports Shift+F10 context menu", async () => {
    const onOpen = vi.fn();
    const screen = await render(
      <IssueList label="Issue context menu">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <IssueRow
              value="VYZ-9"
              identifier="VYZ-9"
              title="Needs triage"
              priority={priority}
              status={status}
            />
          </ContextMenuTrigger>
          <ContextMenuContent>
            <MenuItem>Open details</MenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </IssueList>,
    );
    const row = screen.getByRole("option", {
      name: /Priority: High.*VYZ-9.*In Progress.*Needs triage.*No assignee/,
    });
    row.element().focus();
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    await expect.element(screen.getByRole("menuitem", { name: "Open details" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(row).toHaveFocus();
    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe("ListGroup", () => {
  it("collapses from its trigger and names/calls the add action", async () => {
    const onAdd = vi.fn();
    const screen = await render(
      <ListGroup title="In Progress" count={2} onAdd={onAdd}>
        <div>Group contents</div>
      </ListGroup>,
    );
    const trigger = screen.getByRole("button", { name: "In Progress 2" });
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    trigger.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByText("Group contents")).not.toBeInTheDocument();
    await userEvent.keyboard("{Space}");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await screen.getByRole("button", { name: "Add to In Progress" }).click();
    expect(onAdd).toHaveBeenCalledOnce();
  });
});

function SortableTable() {
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  return (
    <Table label="Projects">
      <TableHeader>
        <TableRow>
          <TableHead sort={sort} onSort={() => setSort(sort === "asc" ? "desc" : "asc")}>
            Name
          </TableHead>
          <TableHead>Owner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow selected>
          <TableCell>
            <a href="#alpha">Alpha</a>
          </TableCell>
          <TableCell>
            <button type="button">Alice</button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <a href="#beta">Beta</a>
          </TableCell>
          <TableCell>
            <button type="button">Bob</button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe("Table", () => {
  it("sorts by click and Enter, moves with arrows in the same column, and marks selected rows", async () => {
    const screen = await render(<SortableTable />);
    const table = screen.getByRole("table", { name: "Projects" });
    const head = screen.getByRole("columnheader", { name: "Name" });
    const sort = screen.getByRole("button", { name: "Name" });
    await expect.element(head).toHaveAttribute("aria-sort", "ascending");
    await sort.click();
    await expect.element(head).toHaveAttribute("aria-sort", "descending");
    sort.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(head).toHaveAttribute("aria-sort", "ascending");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("link", { name: "Alpha" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("link", { name: "Beta" })).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(screen.getByRole("link", { name: "Alpha" })).toHaveFocus();
    await expect
      .element(table.element().querySelector<HTMLTableRowElement>("tbody tr"))
      .toHaveAttribute("data-state", "selected");
  });

  it("does not intercept arrow keys inside text inputs", async () => {
    const screen = await render(
      <Table label="Editable">
        <TableHeader>
          <TableRow>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <input aria-label="First value" defaultValue="abc" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <input aria-label="Second value" defaultValue="def" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const input = screen.getByRole("textbox", { name: "First value" });
    input.element().focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(input).toHaveFocus();
  });
});

describe("Board", () => {
  it("exposes a named group and uses IssueList option keyboard behavior for cards", async () => {
    const onOpen = vi.fn();
    const onSelectedChange = vi.fn();
    const screen = await render(
      <IssueList label="In Progress cards" onOpen={onOpen} onSelectedChange={onSelectedChange}>
        <BoardColumn title="In Progress" count={2}>
          <BoardCard value="VYZ-1" identifier="VYZ-1" title="First card" />
          <BoardCard value="VYZ-2" identifier="VYZ-2" title="Second card" />
        </BoardColumn>
      </IssueList>,
    );
    const column = screen.getByRole("group", { name: "In Progress" });
    const cards = [
      screen.getByRole("option", { name: /VYZ-1.*First card/ }),
      screen.getByRole("option", { name: /VYZ-2.*Second card/ }),
    ];
    cards[0]!.element().focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onOpen).toHaveBeenCalledWith("VYZ-2");
    await userEvent.keyboard(" ");
    expect(onSelectedChange).toHaveBeenCalledWith(["VYZ-2"]);
    await expect.element(column).toBeVisible();
  });
});

describe("Tree", () => {
  it("expands, collapses, moves among visible items and reports ARIA hierarchy", async () => {
    const onOpen = vi.fn();
    const screen = await render(
      <Tree label="Sub-issues" items={treeItems} renderItem={renderTreeItem} onOpen={onOpen} />,
    );
    const parent = screen.getByRole("treeitem", { name: "Parent" });
    await expect.element(parent).toHaveAttribute("aria-level", "1");
    await expect.element(parent).toHaveAttribute("aria-setsize", "2");
    await expect.element(parent).toHaveAttribute("aria-posinset", "1");
    parent.element().focus();
    await userEvent.keyboard("{ArrowRight}");
    const child = screen.getByRole("treeitem", { name: "Child", exact: true });
    await expect.element(child).toHaveAttribute("aria-level", "2");
    await expect.element(child).toHaveAttribute("aria-setsize", "1");
    await expect.element(child).toHaveAttribute("aria-posinset", "1");
    await expect.element(parent).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(child).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    const grandchild = screen.getByRole("treeitem", { name: "Grandchild" });
    await expect.element(grandchild).toHaveAttribute("aria-level", "3");
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(grandchild).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(child).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(grandchild).not.toBeInTheDocument();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(parent).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(parent).toHaveAttribute("aria-expanded", "false");
    await expect.element(child).not.toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("treeitem", { name: "Sibling" })).toHaveFocus();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("clicking a row opens it without changing aria-expanded, and Tab stop returns to the visible ancestor when the pointer never touches an arrow", async () => {
    const onOpen = vi.fn();
    function ControlledTree() {
      const [expanded, setExpanded] = useState<string[]>(["parent", "child"]);
      return (
        <div>
          <Tree
            label="Sub-issues"
            items={treeItems}
            expanded={expanded}
            renderItem={renderTreeItem}
            onOpen={onOpen}
          />
          <button type="button" onClick={() => setExpanded([])}>
            Collapse parent
          </button>
        </div>
      );
    }
    const screen = await render(<ControlledTree />);
    const parent = screen.getByRole("treeitem", { name: "Parent" });
    await expect.element(parent).toHaveAttribute("aria-expanded", "true");
    await parent.click();
    expect(onOpen).toHaveBeenCalledWith("parent");
    await expect.element(parent).toHaveAttribute("aria-expanded", "true");

    const grandchild = screen.getByRole("treeitem", { name: "Grandchild" });
    grandchild.element().focus();
    await expect.element(grandchild).toHaveFocus();
    await screen.getByRole("button", { name: "Collapse parent" }).click();
    await expect.element(grandchild).not.toBeInTheDocument();
    await expect.element(parent).toHaveAttribute("tabindex", "0");
  });

  const guideItems: TestTreeItem[] = [
    {
      value: "root",
      title: "Root",
      children: [
        {
          value: "first",
          title: "First",
          children: [
            { value: "grandchild-a", title: "Grandchild A" },
            { value: "grandchild-b", title: "Grandchild B" },
          ],
        },
        { value: "second", title: "Second" },
        {
          value: "third",
          title: "Third",
          children: [{ value: "grandchild-c", title: "Grandchild C" }],
        },
      ],
    },
  ];

  function guideColumns(row: Element) {
    return Array.from(row.querySelectorAll(':scope > span[aria-hidden="true"]'));
  }

  it("renders Linear-style guide lines for ancestor and own columns", async () => {
    const screen = await render(
      <Tree
        label="Guide lines"
        items={guideItems}
        defaultExpanded={["root", "first", "third"]}
        renderItem={renderTreeItem}
      />,
    );
    const root = screen.getByRole("treeitem", { name: "Root" }).element();
    const first = screen.getByRole("treeitem", { name: "First" }).element();
    const second = screen.getByRole("treeitem", { name: "Second" }).element();
    const third = screen.getByRole("treeitem", { name: "Third" }).element();
    const grandchildA = screen.getByRole("treeitem", { name: "Grandchild A" }).element();
    const grandchildB = screen.getByRole("treeitem", { name: "Grandchild B" }).element();
    const grandchildC = screen.getByRole("treeitem", { name: "Grandchild C" }).element();

    // Number of guide columns per level: level 1 has none, level 2 has one, level 3 has two.
    expect(guideColumns(root)).toHaveLength(0);
    expect(guideColumns(first)).toHaveLength(1);
    expect(guideColumns(second)).toHaveLength(1);
    expect(guideColumns(third)).toHaveLength(1);
    expect(guideColumns(grandchildA)).toHaveLength(2);
    expect(guideColumns(grandchildB)).toHaveLength(2);
    expect(guideColumns(grandchildC)).toHaveLength(2);

    const rowHeight = root.getBoundingClientRect().height;
    const ownRailHeight = (row: Element) => {
      const columns = guideColumns(row);
      const rail = columns[columns.length - 1]!.querySelector("span");
      if (!rail) throw new Error("Own guide rail missing");
      return rail.getBoundingClientRect().height;
    };

    // Not the last sibling: the vertical spans the full row and ends in a branch svg.
    for (const row of [first, second, grandchildA]) {
      const columns = guideColumns(row);
      expect(columns[columns.length - 1]!.querySelector("svg")).not.toBeNull();
      expect(ownRailHeight(row)).toBeGreaterThan(rowHeight - 4);
    }

    // Last sibling: the vertical stops short at the branch svg.
    for (const row of [third, grandchildB, grandchildC]) {
      const columns = guideColumns(row);
      expect(columns[columns.length - 1]!.querySelector("svg")).not.toBeNull();
      expect(ownRailHeight(row)).toBeLessThan(rowHeight * 0.75);
    }

    // Ancestor column (root's): present while "first" still has siblings below it,
    // empty once that branch (here, "third") has already closed.
    expect(guideColumns(grandchildA)[0]!.querySelector("span")).not.toBeNull();
    expect(guideColumns(grandchildB)[0]!.querySelector("span")).not.toBeNull();
    expect(guideColumns(grandchildC)[0]!.querySelector("span")).toBeNull();

    // Collapsing the root removes every descendant row and its guide columns.
    (root as HTMLElement).focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(screen.getByRole("treeitem", { name: "First" })).not.toBeInTheDocument();
    expect(screen.container.querySelectorAll('[role="treeitem"]')).toHaveLength(1);
    expect(screen.container.querySelectorAll("svg")).toHaveLength(0);
  });
});

describe("AvatarGroup", () => {
  it("names the list and the overflow avatar with hidden people", async () => {
    const screen = await render(
      <AvatarGroup
        label="Members"
        max={3}
        people={[
          { name: "Ada Lovelace" },
          { name: "Grace Hopper" },
          { name: "Linus Torvalds" },
          { name: "Margaret Hamilton" },
        ]}
      />,
    );
    await expect.element(screen.getByRole("list", { name: "Members" })).toBeVisible();
    await expect
      .element(screen.getByRole("img", { name: "2 more: Linus Torvalds, Margaret Hamilton" }))
      .toHaveTextContent("+2");
  });
});

describe("HoverCard", () => {
  it("opens on focus after the theme delay and closes on Escape", async () => {
    document.documentElement.style.setProperty("--tooltip-delay", "100ms");
    const screen = await render(
      <HoverCard>
        <HoverCardTrigger asChild>
          <button type="button">Ada</button>
        </HoverCardTrigger>
        <HoverCardContent>
          <p>Ada Lovelace details</p>
        </HoverCardContent>
      </HoverCard>,
    );
    const trigger = screen.getByRole("button", { name: "Ada" });
    trigger.element().focus();
    await wait(150);
    await expect.element(screen.getByText("Ada Lovelace details")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByText("Ada Lovelace details")).not.toBeInTheDocument();
    document.documentElement.style.removeProperty("--tooltip-delay");
  });
});

describe("Timeline", () => {
  it("formats stable relative labels and renders an ISO time value", async () => {
    const now = new Date("2026-09-28T12:00:00.000Z");
    expect(formatRelativeTime(new Date("2026-09-28T11:59:30.000Z"), now)).toBe("just now");
    expect(formatRelativeTime(new Date("2026-09-28T09:00:00.000Z"), now)).toBe("3 hours ago");
    expect(formatRelativeTime(new Date("2026-09-27T12:00:00.000Z"), now)).toBe("yesterday");
    expect(formatRelativeTime(new Date("2026-09-21T12:00:00.000Z"), now)).toBe("last week");
    const screen = await render(
      <Timeline label="Activity">
        <TimelineItem
          icon={<Circle />}
          author="Ada"
          time={new Date("2026-09-28T09:00:00.000Z")}
          now={now}
        >
          changed status
        </TimelineItem>
      </Timeline>,
    );
    const time = screen.container.querySelector("time");
    expect(time?.dateTime).toBe("2026-09-28T09:00:00.000Z");
    await expect.element(screen.getByRole("list", { name: "Activity" })).toBeVisible();
  });
});

describe("Data display accessibility", () => {
  it.each(["light", "dark"] as const)("has no axe violations in the %s theme", async (theme) => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(
      <div className="flex flex-col gap-4">
        <IssueList label="Issues">
          <IssueRow
            value="one"
            identifier="VYZ-1"
            title="Issue"
            priority={priority}
            status={status}
          />
        </IssueList>
        <ListGroup title="In Progress" count={1}>
          <div>Group item</div>
        </ListGroup>
        <Table label="Projects">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Alpha</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <IssueList label="Board cards">
          <BoardColumn title="In Progress">
            <BoardCard value="card" identifier="VYZ-2" title="Board issue" />
          </BoardColumn>
        </IssueList>
        <Tree
          label="Sub-issues"
          items={treeItems}
          defaultExpanded={["parent", "child"]}
          renderItem={renderTreeItem}
        />
        <AvatarGroup
          label="Members"
          people={[{ name: "Ada Lovelace" }, { name: "Grace Hopper" }]}
        />
        <HoverCard>
          <HoverCardTrigger asChild>
            <button type="button">Person</button>
          </HoverCardTrigger>
          <HoverCardContent>
            <p>Person details</p>
          </HoverCardContent>
        </HoverCard>
        <Timeline label="Activity">
          <TimelineItem icon={<Circle />} author="Ada" time="2026-09-28T09:00:00.000Z">
            updated the issue
          </TimelineItem>
        </Timeline>
      </div>,
    );
    expect(await violations(screen.container)).toEqual([]);
  });
});
