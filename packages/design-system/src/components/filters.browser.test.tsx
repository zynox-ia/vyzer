import axe from "axe-core";
import { CalendarDays, Circle, FolderKanban, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "../styles/index.css";
import {
  Button,
  ComboboxPanel,
  DisplayOptions,
  DisplayOptionsFooter,
  DisplayOptionsHeading,
  DisplayOptionsRow,
  DisplayOptionsSection,
  DisplayProperties,
  FilterBreakdown,
  type FilterCategory,
  FilterMenu,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type BreakdownGroup,
  type FilterValue,
} from ".";
import { ProjectStatusIcon, StatusIcon } from "../icons";

async function violations(root: Element) {
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

const filterSections: FilterCategory[][] = [
  [
    {
      value: "status",
      label: "Status",
      icon: Circle,
      options: [
        { value: "backlog", label: "Backlog" },
        { value: "done", label: "Done" },
      ],
    },
    { value: "ai-filter", label: "AI filter", icon: Sparkles },
  ],
  [{ value: "assignee", label: "Assignee", icon: UserRound }],
];

function FilterMenuHarness({ onAction = vi.fn() }: { onAction?: (value: string) => void }) {
  const [value, setValue] = useState<FilterValue>({});
  return (
    <FilterMenu
      sections={filterSections}
      value={value}
      onValueChange={setValue}
      onAction={onAction}
      shortcut={["F"]}
    >
      <Button>Add filter</Button>
    </FilterMenu>
  );
}

describe("FilterMenu", () => {
  it("abre com foco na busca, filtra categorias, navega por teclado e passa no axe", async () => {
    const screen = await render(<FilterMenuHarness />);
    const trigger = screen.getByRole("button", { name: "Add filter" });
    await trigger.click();

    const dialog = screen.getByRole("dialog", { name: "Add Filter" });
    const search = screen.getByRole("textbox", { name: "Add Filter" });
    await expect.element(dialog).toBeVisible();
    await expect.element(search).toHaveFocus();
    await expect.element(screen.getByRole("menu", { name: "Filters" })).toBeVisible();
    await expect.element(search).toHaveAttribute("aria-controls");

    await userEvent.keyboard("sta");
    await expect.element(screen.getByRole("menuitem", { name: "Status" })).toBeVisible();
    await expect
      .element(screen.getByRole("menuitem", { name: "AI filter" }))
      .not.toBeInTheDocument();

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("menuitem", { name: "Status" })).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(search).toHaveFocus();
    await userEvent.keyboard("x");
    await expect.element(search).toHaveValue("stax");

    await search.fill("unknown");
    await expect.element(screen.getByText("No results")).toBeVisible();
    await expect.element(search).not.toHaveAttribute("aria-controls");
    expect(await violations(dialog.element())).toEqual([]);
  });

  it("digita uma letra na linha para a busca e Enter executa uma categoria de ação", async () => {
    const onAction = vi.fn();
    const screen = await render(<FilterMenuHarness onAction={onAction} />);
    const trigger = screen.getByRole("button", { name: "Add filter" });
    await trigger.click();
    const search = screen.getByRole("textbox", { name: "Add Filter" });

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("menuitem", { name: "Status" })).toHaveFocus();
    await userEvent.keyboard("a");
    await expect.element(search).toHaveValue("a");
    await search.fill("ai");
    await userEvent.keyboard("{Enter}");

    expect(onAction).toHaveBeenCalledWith("ai-filter");
    await expect
      .element(screen.getByRole("dialog", { name: "Add Filter" }))
      .not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("abre submenu com foco na busca, marca valor, fecha com Esc e limpa a busca ao reabrir", async () => {
    const screen = await render(<FilterMenuHarness />);
    const trigger = screen.getByRole("button", { name: "Add filter" });
    await trigger.click();
    const search = screen.getByRole("textbox", { name: "Add Filter" });

    await userEvent.keyboard("{Enter}");
    const subSearch = screen.getByPlaceholder("Filter…", { exact: true });
    await expect.element(subSearch).toHaveFocus();
    await expect.element(screen.getByRole("dialog", { name: "Status" })).toBeVisible();
    await screen.getByRole("option", { name: "Backlog" }).click();
    await expect.element(screen.getByRole("option", { name: "Backlog" })).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect
      .element(screen.getByRole("dialog", { name: "Add Filter" }))
      .not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
    await trigger.click();
    await expect.element(search).toHaveFocus();
    await expect.element(search).toHaveValue("");
  });
});

const nestedFilterSections: FilterCategory[][] = [
  [
    {
      value: "project-properties",
      label: "Project properties",
      icon: FolderKanban,
      children: [
        {
          value: "project-status",
          label: "Project status",
          icon: Circle,
          options: [
            {
              value: "backlog",
              label: "Backlog",
              icon: <ProjectStatusIcon type="backlog" />,
            },
            {
              value: "completed",
              label: "Completed",
              icon: <ProjectStatusIcon type="completed" />,
            },
          ],
        },
        { value: "project-dates", label: "Dates", icon: CalendarDays },
      ],
    },
  ],
];

function NestedFilterHarness({
  onAction,
  onValueChange,
}: {
  onAction: (value: string) => void;
  onValueChange?: (value: FilterValue) => void;
}) {
  const [value, setValue] = useState<FilterValue>({});
  return (
    <FilterMenu
      sections={nestedFilterSections}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
      onAction={onAction}
    >
      <Button>Add nested filter</Button>
    </FilterMenu>
  );
}

describe("FilterMenu: submenus hierárquicos", () => {
  it("abre filhos com Enter, audita o menu e volta um nível", async () => {
    const onAction = vi.fn();
    const screen = await render(<NestedFilterHarness onAction={onAction} />);
    const trigger = screen.getByRole("button", { name: "Add nested filter" });
    await trigger.click();
    const rootSearch = screen.getByRole("textbox", { name: "Add Filter" });

    await userEvent.keyboard("{ArrowDown}");
    const projectProperties = screen.getByRole("menuitem", { name: "Project properties" });
    await expect.element(projectProperties).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByRole("menuitem", { name: "Project status" })).toBeVisible();
    const childMenu = document.querySelector('[role="menu"][data-state="open"]');
    if (!childMenu) throw new Error("submenu simples não abriu");
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(await violations(childMenu)).toEqual([]);

    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(projectProperties).toHaveFocus();
    await expect.element(rootSearch).not.toHaveFocus();
  });

  it("abre a subcategoria com options em outro submenu e marca o valor", async () => {
    const onAction = vi.fn();
    const onValueChange = vi.fn();
    const screen = await render(
      <NestedFilterHarness onAction={onAction} onValueChange={onValueChange} />,
    );
    await screen.getByRole("button", { name: "Add nested filter" }).click();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    const projectStatus = screen.getByRole("menuitem", { name: "Project status" });
    projectStatus.element().focus();
    await userEvent.keyboard("{ArrowRight}");
    const subSearch = screen.getByPlaceholder("Filter…", { exact: true });
    await expect.element(subSearch).toHaveFocus();
    const nestedDialog = screen.getByRole("dialog", { name: "Project status" });
    const childMenu = document.querySelector('[role="menu"][data-state="open"]');
    if (!childMenu) throw new Error("submenu simples não abriu");
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(await violations(nestedDialog.element())).toEqual([]);
    expect(await violations(childMenu)).toEqual([]);
    await screen.getByRole("option", { name: "Backlog" }).click();
    expect(onValueChange).toHaveBeenCalledWith({ "project-status": ["backlog"] });
  });

  it("seleciona uma subcategoria sem opções como ação e fecha o menu", async () => {
    const onAction = vi.fn();
    const screen = await render(<NestedFilterHarness onAction={onAction} />);
    const trigger = screen.getByRole("button", { name: "Add nested filter" });
    await trigger.click();
    await userEvent.keyboard("{Enter}");
    const dates = screen.getByRole("menuitem", { name: "Dates" });
    await dates.click();
    expect(onAction).toHaveBeenCalledWith("project-dates");
    await expect
      .element(screen.getByRole("dialog", { name: "Add Filter" }))
      .not.toBeInTheDocument();
  });
});

describe("ComboboxPanel: tag e hint", () => {
  it("mostra tag e hint, mas continua filtrando pelo rótulo", async () => {
    const onValueChange = vi.fn();
    const screen = await render(
      <ComboboxPanel
        multiple
        label="People"
        value={[]}
        onValueChange={onValueChange}
        options={[
          { value: "alice", label: "Alice", tag: "Agent", hint: "14 issues" },
          { value: "bruno", label: "Bruno", tag: "Member", hint: "2 issues" },
        ]}
      />,
    );
    await expect.element(screen.getByText("Agent")).toBeVisible();
    await expect.element(screen.getByText("14 issues")).toBeVisible();
    await screen.getByRole("option", { name: /Alice/ }).click();
    expect(onValueChange).toHaveBeenCalledWith(["alice"]);

    const search = screen.getByPlaceholder("Search…");
    await search.fill("alice");
    await expect.element(screen.getByRole("option", { name: /Alice/ })).toBeVisible();
    await expect.element(screen.getByRole("option", { name: /Bruno/ })).not.toBeInTheDocument();
    expect(await violations(screen.container)).toEqual([]);
  });
});

describe("ComboboxPanel: slot de ícone", () => {
  it("omite o recuo quando não há ícones e reserva o slot em todas as linhas quando há um", async () => {
    const screen = await render(
      <div>
        <ComboboxPanel
          multiple
          label="No icons"
          value={[]}
          onValueChange={vi.fn()}
          options={[{ value: "plain", label: "Plain" }]}
        />
        <ComboboxPanel
          multiple
          label="Mixed icons"
          value={[]}
          onValueChange={vi.fn()}
          options={[
            { value: "with-icon", label: "With icon", icon: <Circle /> },
            { value: "without-icon", label: "Without icon" },
          ]}
        />
      </div>,
    );
    const hasIconSlot = (option: Element) =>
      [...option.children].some(
        (child) => child.classList.contains("size-4") && child.classList.contains("shrink-0"),
      );
    expect(hasIconSlot(screen.getByRole("option", { name: "Plain" }).element())).toBe(false);
    expect(hasIconSlot(screen.getByRole("option", { name: "With icon" }).element())).toBe(true);
    expect(hasIconSlot(screen.getByRole("option", { name: "Without icon" }).element())).toBe(true);
  });
});

describe("ProjectStatusIcon e StatusIcon triage", () => {
  it("distingue ícone decorativo de ícone nomeado e desenha cada progresso do hexágono", async () => {
    const screen = await render(
      <div>
        <ProjectStatusIcon type="backlog" />
        <ProjectStatusIcon type="planned" label="Planned" />
        <ProjectStatusIcon type="started" label="Started" />
        <ProjectStatusIcon type="completed" label="Completed" />
        <ProjectStatusIcon type="canceled" label="Canceled" />
        <StatusIcon type="triage" label="Triage" />
      </div>,
    );
    const backlog = screen.container.querySelector('svg[aria-hidden="true"]');
    if (!backlog) throw new Error("ícone decorativo não renderizou");
    expect(backlog).toHaveAttribute("aria-hidden", "true");
    expect(backlog.querySelector("path")).toHaveAttribute("stroke-dasharray", "1.65 1.35");
    expect(backlog.querySelector("circle")).toBeNull();
    expect(backlog.querySelector("clipPath")).toBeNull();

    const planned = screen.getByRole("img", { name: "Planned" }).element();
    expect(planned.querySelector("path")).not.toHaveAttribute("stroke-dasharray");
    expect(planned.querySelector("circle")).toBeNull();
    expect(planned.querySelector("clipPath")).toBeNull();

    const started = screen.getByRole("img", { name: "Started" }).element();
    expect(started.querySelector("circle")).toHaveAttribute("stroke-dasharray");
    expect(started.querySelector("clipPath")).not.toBeNull();

    const completed = screen.getByRole("img", { name: "Completed" }).element();
    const canceled = screen.getByRole("img", { name: "Canceled" }).element();
    expect(completed.querySelectorAll("path")).toHaveLength(2);
    expect(completed.querySelector("circle")).toBeNull();
    expect(canceled.querySelectorAll("path")).toHaveLength(2);
    expect(canceled.querySelector("circle")).toBeNull();

    await expect.element(screen.getByRole("img", { name: "Planned" })).toBeVisible();
    await expect.element(screen.getByRole("img", { name: "Started" })).toBeVisible();
    await expect.element(screen.getByRole("img", { name: "Completed" })).toBeVisible();
    await expect.element(screen.getByRole("img", { name: "Canceled" })).toBeVisible();
    await expect.element(screen.getByRole("img", { name: "Triage" })).toBeVisible();
    expect(await violations(screen.container)).toEqual([]);
  });
});

function DisplayOptionsHarness() {
  const [properties, setProperties] = useState(["status"]);
  return (
    <DisplayOptions trigger={<Button>Display</Button>} label="Display options" align="start">
      <DisplayOptionsSection>
        <DisplayOptionsHeading>List options</DisplayOptionsHeading>
        <DisplayOptionsRow label="Sort by">
          {(id) => (
            <Select
              id={id}
              aria-label="Sort by"
              trigger="button"
              defaultValue="newest"
              options={[
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" },
              ]}
            />
          )}
        </DisplayOptionsRow>
        <DisplayOptionsRow label="Compact rows">{(id) => <Switch id={id} />}</DisplayOptionsRow>
      </DisplayOptionsSection>
      <DisplayOptionsSection>
        <DisplayProperties
          label="Visible properties"
          value={properties}
          onValueChange={setProperties}
          options={[
            { value: "status", label: "Status" },
            { value: "priority", label: "Priority" },
          ]}
        />
      </DisplayOptionsSection>
      <DisplayOptionsFooter>
        <Button variant="ghost">Reset</Button>
      </DisplayOptionsFooter>
    </DisplayOptions>
  );
}

describe("DisplayOptions", () => {
  it("liga rótulos às peças, escolhe no Select, alterna Switch e chips, e passa no axe", async () => {
    const screen = await render(<DisplayOptionsHarness />);
    await screen.getByRole("button", { name: "Display" }).click();
    const dialog = screen.getByRole("dialog", { name: "Display options" });
    await expect.element(dialog).toBeVisible();
    await expect.element(screen.getByText("List options")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Reset" })).toBeVisible();

    const sort = screen.getByLabelText("Sort by");
    const compact = screen.getByLabelText("Compact rows");
    await expect.element(sort).toHaveRole("combobox");
    await expect.element(compact).toHaveRole("switch");
    await sort.click();
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await screen.getByRole("option", { name: "Oldest" }).click();
    await expect.element(sort).toHaveTextContent("Oldest");
    await compact.click();
    await expect.element(compact).toBeChecked();

    const status = screen.getByRole("button", { name: "Status" });
    const priority = screen.getByRole("button", { name: "Priority" });
    await expect.element(status).toHaveAttribute("aria-pressed", "true");
    status.element().scrollIntoView({ block: "center" });
    await status.click();
    await expect.element(status).toHaveAttribute("aria-pressed", "false");
    priority.element().scrollIntoView({ block: "center" });
    await priority.click();
    await expect.element(priority).toHaveAttribute("aria-pressed", "true");

    await sort.click();
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
    await expect.element(dialog).toBeVisible();
    expect(await violations(dialog.element())).toEqual([]);
  });
});

const breakdownGroups: BreakdownGroup[] = [
  {
    value: "assignee",
    label: "Assignees",
    items: [
      { value: "ana", label: "Ana", count: 4 },
      { value: "bruno", label: "Bruno", count: 2 },
    ],
  },
  { value: "labels", label: "Labels", items: [] },
  {
    value: "priority",
    label: "Priority",
    items: [{ value: "high", label: "High", count: 1 }],
  },
];

function BreakdownHarness({ onValueChange }: { onValueChange?: (value: FilterValue) => void }) {
  const [value, setValue] = useState<FilterValue>({});
  return (
    <FilterBreakdown
      label="Breakdown"
      groups={breakdownGroups}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
      defaultGroup="labels"
    />
  );
}

describe("FilterBreakdown", () => {
  it("abre no grupo padrão, troca abas, alterna linhas por mouse e teclado, e passa no axe", async () => {
    const onValueChange = vi.fn();
    const screen = await render(<BreakdownHarness onValueChange={onValueChange} />);
    const labels = screen.getByRole("tab", { name: "Labels" });
    const assignees = screen.getByRole("tab", { name: "Assignees" });
    await expect.element(labels).toHaveAttribute("data-state", "active");
    await expect.element(screen.getByText("No issues")).toBeVisible();

    await assignees.click();
    await expect.element(assignees).toHaveAttribute("data-state", "active");
    const ana = screen.getByRole("button", { name: /Ana/ });
    await ana.click();
    expect(onValueChange).toHaveBeenLastCalledWith({ assignee: ["ana"] });
    await expect.element(ana).toHaveAttribute("aria-pressed", "true");
    await ana.click();
    expect(onValueChange).toHaveBeenLastCalledWith({ assignee: [] });
    await expect.element(ana).toHaveAttribute("aria-pressed", "false");

    const bruno = screen.getByRole("button", { name: /Bruno/ });
    bruno.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(bruno).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard(" ");
    await expect.element(bruno).toHaveAttribute("aria-pressed", "false");
    await assignees.click();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(screen.getByRole("tab", { name: "Labels" }))
      .toHaveAttribute("data-state", "active");
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(assignees).toHaveAttribute("data-state", "active");
    expect(await violations(screen.container)).toEqual([]);
  });
});

describe("variantes de TabsList e Select", () => {
  it("mantém o estado ativo nas abas pills e na variante underline padrão", async () => {
    const screen = await render(
      <>
        <Tabs defaultValue="pills-a">
          <TabsList variant="pills" aria-label="Pill tabs">
            <TabsTrigger value="pills-a">Pills A</TabsTrigger>
            <TabsTrigger value="pills-b">Pills B</TabsTrigger>
          </TabsList>
          <TabsContent value="pills-a">Pills content</TabsContent>
          <TabsContent value="pills-b">Other content</TabsContent>
        </Tabs>
        <Tabs defaultValue="underline-a">
          <TabsList aria-label="Underline tabs">
            <TabsTrigger value="underline-a">Underline A</TabsTrigger>
            <TabsTrigger value="underline-b">Underline B</TabsTrigger>
          </TabsList>
          <TabsContent value="underline-a">Underline content</TabsContent>
          <TabsContent value="underline-b">Other content</TabsContent>
        </Tabs>
      </>,
    );
    const pillsA = screen.getByRole("tab", { name: "Pills A" });
    const underlineA = screen.getByRole("tab", { name: "Underline A" });
    await expect.element(pillsA).toHaveAttribute("data-state", "active");
    await expect.element(underlineA).toHaveAttribute("data-state", "active");
    await expect.element(screen.getByRole("tablist", { name: "Pill tabs" })).toHaveClass("gap-1.5");
    await expect
      .element(screen.getByRole("tablist", { name: "Underline tabs" }))
      .toHaveClass("border-b");
    await pillsA.click();
    await userEvent.keyboard("{ArrowRight}");
    await expect
      .element(screen.getByRole("tab", { name: "Pills B" }))
      .toHaveAttribute("data-state", "active");
  });

  it("Select trigger=button expõe combobox nomeado, abre e escolhe uma opção", async () => {
    const onValueChange = vi.fn();
    const screen = await render(
      <Select
        trigger="button"
        aria-label="Priority"
        defaultValue="low"
        onValueChange={onValueChange}
        options={[
          { value: "low", label: "Low" },
          { value: "high", label: "High" },
        ]}
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Priority" });
    await trigger.click();
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await screen.getByRole("option", { name: "High" }).click();
    expect(onValueChange).toHaveBeenCalledWith("high");
    await expect.element(trigger).toHaveTextContent("High");
  });
});
