import axe from "axe-core";
import { Circle } from "lucide-react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "../styles/index.css";
import {
  Chip,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  DisplayProperties,
  Menu,
  MenuContent,
  MenuItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  ToggleGroup,
  Tooltip,
  TooltipProvider,
} from ".";

async function violations(root: Element) {
  // Espera a entrada (opacidade 0 → 1) terminar: no meio dela o axe mede contraste errado.
  await Promise.all(root.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

describe("Chip", () => {
  it("mantém o chip somente leitura fora da árvore de foco", async () => {
    const screen = await render(<Chip>Bug</Chip>);
    const chip = screen.getByText("Bug");

    expect(chip.element().tagName).toBe("SPAN");
    await expect.element(chip).not.toHaveAttribute("tabindex");
    expect(chip.element().matches("button, a, input, select, textarea")).toBe(false);
  });

  it("é um botão clicável, alterna por Enter/Espaço e expõe o estado ativo", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <Chip active onClick={onClick}>
        Active view
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "Active view" });

    await expect.element(chip).toHaveAttribute("aria-pressed", "true");
    await expect.element(chip).toHaveAttribute("data-state", "on");
    await chip.click();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("nomeia um chip de ícone/contagem e renderiza um link com as classes", async () => {
    const screen = await render(
      <div>
        <Chip icon={<Circle />} count={2} label="Urgent priority" onClick={vi.fn()} />
        <Chip asChild label="Open issues">
          <a href="/issues">Open issues</a>
        </Chip>
      </div>,
    );

    await expect.element(screen.getByRole("button", { name: "Urgent priority" })).toBeVisible();
    const link = screen.getByRole("link", { name: "Open issues" });
    await expect.element(link).toHaveClass("rounded-full");
    await expect.element(link).toHaveTextContent("Open issues");
  });

  it("remove pelo botão, Enter, Espaço, Backspace e Delete", async () => {
    const onRemove = vi.fn();
    const screen = await render(
      <Chip label="Bug" onRemove={onRemove}>
        Bug
      </Chip>,
    );
    const remove = screen.getByRole("button", { name: "Remove Bug" });

    await remove.click();
    remove.element().focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Backspace}");
    await userEvent.keyboard("{Delete}");
    expect(onRemove).toHaveBeenCalledTimes(5);
  });

  it("aceita um nome de remoção explícito e passa no axe", async () => {
    const screen = await render(
      <Chip removeLabel="Remove relation" onRemove={vi.fn()}>
        Blocks
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "Remove relation" });

    await expect.element(chip).toBeVisible();
    expect(await violations(screen.container)).toEqual([]);
  });
});

function PopoverHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button">Open details</button>
        </PopoverTrigger>
        <PopoverContent label="Details">
          <input aria-label="Details name" />
          <PopoverClose aria-label="Close details">Close</PopoverClose>
        </PopoverContent>
      </Popover>
      <button type="button">Outside</button>
    </div>
  );
}

describe("Popover", () => {
  it("foca o input e recolhe a seleção no fim do valor ao abrir", async () => {
    const screen = await render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open focus popover</button>
        </PopoverTrigger>
        <PopoverContent label="Focus popover">
          <input aria-label="Issue search" defaultValue="Active issues" />
        </PopoverContent>
      </Popover>,
    );
    const input = screen.getByRole("textbox", { name: "Issue search" });

    await screen.getByRole("button", { name: "Open focus popover" }).click();
    await expect.element(input).toHaveFocus();
    const inputElement = input.element() as HTMLInputElement;
    expect(inputElement.selectionStart).toBe(13);
    expect(inputElement.selectionEnd).toBe(13);
  });

  it("respeita onOpenAutoFocus quando o consumidor previne o foco automático", async () => {
    const screen = await render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open prevented popover</button>
        </PopoverTrigger>
        <PopoverContent
          label="Prevented popover"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <input aria-label="Issue search" defaultValue="Active issues" />
        </PopoverContent>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Open prevented popover" });
    const input = screen.getByRole("textbox", { name: "Issue search" });

    await trigger.click();
    await expect.element(input).not.toHaveFocus();
    await expect.element(trigger).toHaveFocus();
  });

  it("foca o próprio conteúdo quando não há elemento focável", async () => {
    const screen = await render(
      <Popover>
        <PopoverTrigger asChild>
          <button type="button">Open empty popover</button>
        </PopoverTrigger>
        <PopoverContent label="Empty popover">No focusable content</PopoverContent>
      </Popover>,
    );
    const dialog = screen.getByRole("dialog", { name: "Empty popover" });

    await screen.getByRole("button", { name: "Open empty popover" }).click();
    await expect.element(dialog).toHaveFocus();
  });

  it("abre por clique e Enter, nomeia o diálogo, foca o primeiro controle e abre abaixo", async () => {
    const screen = await render(<PopoverHarness />);
    const trigger = screen.getByRole("button", { name: "Open details" });

    await trigger.click();
    const dialog = screen.getByRole("dialog", { name: "Details" });
    const input = screen.getByRole("textbox", { name: "Details name" });
    await expect.element(dialog).toBeVisible();
    await expect.element(input).toHaveFocus();
    expect(dialog.element().getAttribute("data-side")).toBe("bottom");
    expect(dialog.element().getBoundingClientRect().top).toBeGreaterThan(
      trigger.element().getBoundingClientRect().bottom,
    );
    await userEvent.keyboard("{Escape}");
    await expect.element(dialog).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByRole("dialog", { name: "Details" })).toBeVisible();
  });

  it("fecha por clique fora e por PopoverClose, e passa no axe com o conteúdo aberto", async () => {
    const screen = await render(<PopoverHarness />);
    await screen.getByRole("button", { name: "Open details" }).click();
    const dialog = screen.getByRole("dialog", { name: "Details" });

    expect(await violations(dialog.element())).toEqual([]);
    await screen.getByRole("button", { name: "Outside" }).click();
    await expect.element(dialog).not.toBeInTheDocument();

    await screen.getByRole("button", { name: "Open details" }).click();
    await screen.getByRole("button", { name: "Close details" }).click();
    await expect.element(screen.getByRole("button", { name: "Open details" })).toHaveFocus();
  });
});

const toggleOptions = [
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "assignee", label: "Assignee", disabled: true },
];

function ToggleHarness({ labelledBy = false }: { labelledBy?: boolean }) {
  const [value, setValue] = useState<string[]>(["status"]);
  return (
    <div>
      {labelledBy && <span id="toggle-label">Visible properties</span>}
      <ToggleGroup
        {...(labelledBy ? { labelledBy: "toggle-label" } : { label: "Visible properties" })}
        value={value}
        onValueChange={setValue}
        options={toggleOptions}
      />
    </div>
  );
}

describe("ToggleGroup", () => {
  it("alterna valores com clique/teclado, move o foco por setas e bloqueia itens disabled", async () => {
    const onValueChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState<string[]>(["status"]);
      return (
        <ToggleGroup
          label="Visible properties"
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange(next);
          }}
          options={toggleOptions}
        />
      );
    }
    const screen = await render(<Controlled />);
    const group = screen.getByRole("toolbar", { name: "Visible properties" });
    const status = screen.getByRole("button", { name: "Status" });
    const priority = screen.getByRole("button", { name: "Priority" });
    const assignee = screen.getByRole("button", { name: "Assignee" });

    await expect.element(status).toHaveAttribute("aria-pressed", "true");
    await expect.element(priority).toHaveAttribute("aria-pressed", "false");
    await priority.click();
    expect(onValueChange).toHaveBeenLastCalledWith(["status", "priority"]);
    await expect.element(priority).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard(" ");
    expect(onValueChange).toHaveBeenLastCalledWith(["status"]);
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(status).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(priority).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(["status", "priority"]);
    await expect.element(assignee).toBeDisabled();
    assignee.element().dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onValueChange).not.toHaveBeenLastCalledWith(["status", "priority", "assignee"]);
    await expect.element(group).toHaveAttribute("aria-label", "Visible properties");
  });

  it("nomeia o grupo por labelledBy e pode ser desabilitado inteiro", async () => {
    const screen = await render(
      <div>
        <ToggleHarness labelledBy />
        <ToggleGroup
          label="Disabled properties"
          value={[]}
          onValueChange={vi.fn()}
          disabled
          options={toggleOptions}
        />
      </div>,
    );
    const labelledGroup = screen.container.querySelector('[aria-labelledby="toggle-label"]');
    if (!labelledGroup)
      throw new Error("ToggleGroup labelledBy não renderizou o atributo esperado");
    await expect.element(labelledGroup as HTMLElement).toBeVisible();
    const disabledGroup = screen.container.querySelector('[aria-label="Disabled properties"]');
    if (!disabledGroup) throw new Error("ToggleGroup disabled não renderizou o grupo");
    for (const item of disabledGroup.querySelectorAll("button")) {
      expect(item).toBeDisabled();
    }
  });

  it("mantém o comportamento do DisplayProperties", async () => {
    const onValueChange = vi.fn();
    function DisplayHarness() {
      const [value, setValue] = useState(["status"]);
      return (
        <DisplayProperties
          label="Visible properties"
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange(next);
          }}
          options={[
            { value: "status", label: "Status" },
            { value: "priority", label: "Priority" },
          ]}
        />
      );
    }
    const screen = await render(<DisplayHarness />);
    await screen.getByRole("button", { name: "Priority" }).click();
    expect(onValueChange).toHaveBeenCalledWith(["status", "priority"]);
  });
});

function ContextMenuHarness({ onSelect = vi.fn() }: { onSelect?: (value: string) => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button type="button">Issue row</button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <MenuItem onSelect={() => onSelect("edit")}>Edit issue</MenuItem>
        <MenuItem disabled onSelect={() => onSelect("disabled")}>
          Disabled action
        </MenuItem>
        <MenuSub>
          <MenuSubTrigger>More actions</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem onSelect={() => onSelect("duplicate")}>Duplicate issue</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}

async function openContextMenu(trigger: Element) {
  const target = trigger as HTMLButtonElement;
  target.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 2,
      buttons: 2,
      pointerId: 1,
      pointerType: "mouse",
      clientX: 40,
      clientY: 40,
    }),
  );
  target.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2,
      clientX: 40,
      clientY: 40,
    }),
  );
  await wait(0);
  const menu = document.body.querySelector('[role="menu"]');
  if (!menu) throw new Error("ContextMenu não abriu com o clique direito");
  await expect.element(menu as HTMLElement).toBeVisible();
}

describe("ContextMenu", () => {
  it("abre no clique direito, navega, abre/fecha submenu, seleciona, ignora disabled e passa no axe", async () => {
    const onSelect = vi.fn();
    const screen = await render(<ContextMenuHarness onSelect={onSelect} />);
    const trigger = screen.getByRole("button", { name: "Issue row" });
    await openContextMenu(trigger.element());
    const menu = screen.getByRole("menu");
    await expect.element(menu).toBeVisible();
    expect(await violations(menu.element())).toEqual([]);

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("menuitem", { name: "Edit issue" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    const disabled = screen.getByRole("menuitem", { name: "Disabled action" });
    await expect.element(disabled).not.toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    const more = screen.getByRole("menuitem", { name: "More actions" });
    await expect.element(more).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    const duplicate = screen.getByRole("menuitem", { name: "Duplicate issue" });
    await expect.element(duplicate).toBeVisible();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(more).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    duplicate.element().focus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("duplicate");

    await openContextMenu(trigger.element());
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("edit");
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  });

  it("fecha com Esc e abre no alvo focado por Shift+F10", async () => {
    const screen = await render(<ContextMenuHarness />);
    const trigger = screen.getByRole("button", { name: "Issue row" });
    trigger.element().focus();
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    await expect.element(screen.getByRole("menu")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  });
});

describe("Menu: regressão de submenu dropdown", () => {
  it("abre MenuSub com seta direita e seleciona a ação filha", async () => {
    const onSelect = vi.fn();
    const screen = await render(
      <Menu>
        <MenuTrigger asChild>
          <button type="button">Open menu</button>
        </MenuTrigger>
        <MenuContent variant="dropdown">
          <MenuSub>
            <MenuSubTrigger>More</MenuSubTrigger>
            <MenuSubContent>
              <MenuItem onSelect={() => onSelect("child")}>Child action</MenuItem>
            </MenuSubContent>
          </MenuSub>
        </MenuContent>
      </Menu>,
    );
    await screen.getByRole("button", { name: "Open menu" }).click();
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    await expect.element(screen.getByRole("menuitem", { name: "Child action" })).toBeVisible();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("child");
  });
});

function TooltipHarness({ provider = false }: { provider?: boolean }) {
  const tooltip = (
    <Tooltip content="Create issue" shortcut={["Ctrl", "K"]} shortcutMode="plus">
      <button type="button">Create</button>
    </Tooltip>
  );
  return provider ? <TooltipProvider>{tooltip}</TooltipProvider> : tooltip;
}

describe("Tooltip", () => {
  it("abre no foco de teclado sem atraso, inclui atalho, descreve o gatilho e fecha com Esc", async () => {
    const screen = await render(<TooltipHarness />);
    const trigger = screen.getByRole("button", { name: "Create" });
    await userEvent.tab();
    await expect.element(trigger).toHaveFocus();
    const tooltip = screen.getByRole("tooltip", { name: /Create issue/ });
    await expect.element(tooltip).toHaveTextContent("Create issue");
    await expect.element(tooltip).toHaveTextContent("Ctrl");
    await expect.element(tooltip).toHaveTextContent("K");
    const describedBy = trigger.element().getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(tooltip.element().id).toBe(describedBy);
    await userEvent.keyboard("{Escape}");
    await expect.element(tooltip).not.toBeInTheDocument();
  });

  it("abre no hover após --tooltip-delay e não antes, com ou sem provedor", async () => {
    document.documentElement.style.setProperty("--tooltip-delay", "500ms");
    const screen = await render(<TooltipHarness provider />);
    const trigger = screen.getByRole("button", { name: "Create" });
    await userEvent.hover(trigger);
    await wait(350);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    await wait(250);
    await expect.element(screen.getByRole("tooltip", { name: /Create issue/ })).toBeVisible();
    expect(await violations(screen.getByRole("tooltip").element())).toEqual([]);
  });
});
