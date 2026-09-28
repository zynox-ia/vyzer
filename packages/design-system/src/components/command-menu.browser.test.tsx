import axe from "axe-core";
import { Search, Settings } from "lucide-react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "../styles/index.css";
import { Button, CommandGroup, CommandItem, CommandMenu, CommandSeparator } from ".";

async function violations(root: Element) {
  await Promise.all(
    root
      .getAnimations({ subtree: true })
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => {})),
  );
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

function BasicMenu({
  hotkey = true,
  onSelect = vi.fn(),
}: {
  hotkey?: boolean;
  onSelect?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open commands</Button>
      <CommandMenu open={open} onOpenChange={setOpen} hotkey={hotkey}>
        <CommandGroup heading="Actions">
          <CommandItem
            value="Create issue"
            keywords={["ticket", "new"]}
            onSelect={() => onSelect("create")}
            icon={Settings}
          >
            Create issue
          </CommandItem>
          <CommandItem value="Open settings" onSelect={() => onSelect("settings")}>
            Open settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem value="Search issues" onSelect={() => onSelect("search")} icon={Search}>
            Search issues
          </CommandItem>
        </CommandGroup>
      </CommandMenu>
    </>
  );
}

describe.each(["dark", "light"] as const)("CommandMenu no tema %s", (theme) => {
  it("Ctrl+K abre com foco na busca, filtra, navega em loop e executa", async () => {
    document.documentElement.dataset.theme = theme;
    const onSelect = vi.fn();
    const screen = await render(<BasicMenu onSelect={onSelect} />);
    const trigger = screen.getByRole("button", { name: "Open commands" });
    await trigger.click();
    await userEvent.keyboard("{Escape}");
    await expect
      .element(screen.getByRole("dialog", { name: "Command menu" }))
      .not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
    await userEvent.keyboard("{Control>}k{/Control}");
    const dialog = screen.getByRole("dialog", { name: "Command menu" });
    const search = screen.getByRole("combobox", { name: "Command menu" });
    await expect.element(search).toHaveFocus();
    expect(await violations(dialog.element())).toEqual([]);
    await userEvent.keyboard("nonsense");
    await expect.element(screen.getByText("No results")).toBeVisible();
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await userEvent.keyboard("ticket");
    const create = screen.getByRole("option", { name: /Create issue/ });
    await expect.element(create).toBeVisible();
    await expect
      .element(screen.getByRole("option", { name: /Open settings/ }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("option", { name: /Search issues/ }))
      .not.toBeInTheDocument();
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await expect
      .element(screen.getByRole("option", { name: /Search issues/ }))
      .toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowUp}");
    await expect
      .element(screen.getByRole("option", { name: /Open settings/ }))
      .toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowUp}");
    await expect
      .element(screen.getByRole("option", { name: /Create issue/ }))
      .toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowUp}");
    await expect
      .element(screen.getByRole("option", { name: /Search issues/ }))
      .toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("search");
    await expect.element(dialog).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await expect.element(dialog).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("hotkey false não abre; separadores somem ao buscar e ficam ocultos na árvore", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(<BasicMenu hotkey={false} />);
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "Open commands" }).click();
    const separator = document.querySelector('[aria-hidden="true"].border-t');
    expect(separator).not.toBeNull();
    await expect.element(separator as HTMLElement).toHaveAttribute("aria-hidden", "true");
    const search = screen.getByRole("combobox", { name: "Command menu" });
    await search.fill("settings");
    await expect.element(separator as HTMLElement).not.toBeInTheDocument();
  });

  it("entra numa página limpando busca e destacando a primeira linha; Backspace vazio volta, preenchido não", async () => {
    document.documentElement.dataset.theme = theme;
    const onBack = vi.fn();
    function Pages() {
      const [open, setOpen] = useState(false);
      const [page, setPage] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open pages</button>
          <CommandMenu
            open={open}
            onOpenChange={setOpen}
            pages={page ? ["Settings"] : []}
            onBack={onBack}
          >
            {page ? (
              <CommandGroup heading="Preferences">
                <CommandItem value="General preferences">General preferences</CommandItem>
                <CommandItem value="Notifications">Notifications</CommandItem>
              </CommandGroup>
            ) : (
              <CommandGroup heading="Actions">
                <CommandItem value="Open settings" onSelect={() => setPage(true)}>
                  Open settings
                </CommandItem>
              </CommandGroup>
            )}
          </CommandMenu>
        </>
      );
    }
    const screen = await render(<Pages />);
    await screen.getByRole("button", { name: "Open pages" }).click();
    const search = screen.getByRole("combobox", { name: "Command menu" });
    await search.fill("settings");
    await userEvent.keyboard("{Enter}");
    await expect
      .element(screen.getByRole("option", { name: "General preferences" }))
      .toHaveAttribute("aria-selected", "true");
    await expect.element(search).toHaveValue("");
    const dialog = screen.getByRole("dialog", { name: "Command menu" });
    expect(await violations(dialog.element())).toEqual([]);
    await userEvent.keyboard("{Backspace}");
    expect(onBack).toHaveBeenCalledOnce();
    onBack.mockClear();
    await search.fill("g");
    await userEvent.keyboard("{Backspace}");
    expect(onBack).not.toHaveBeenCalled();
  });

  it("loading exibe estado de carregamento", async () => {
    document.documentElement.dataset.theme = theme;
    function LoadingMenu() {
      const [open, setOpen] = useState(true);
      return (
        <CommandMenu open={open} onOpenChange={setOpen} loading>
          {null}
        </CommandMenu>
      );
    }
    const screen = await render(<LoadingMenu />);
    await expect.element(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    await expect.element(screen.getByRole("option", { name: "Loading…" })).toBeVisible();
    const dialog = screen.getByRole("dialog", { name: "Command menu" });
    expect(await violations(dialog.element())).toEqual([]);
  });
});
