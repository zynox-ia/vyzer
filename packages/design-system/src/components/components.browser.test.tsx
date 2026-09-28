/**
 * Componentes base num Chromium real: interação por teclado e mouse, ligação com o Field e
 * acessibilidade (axe-core) nos dois temas.
 */
import axe from "axe-core";
import { Plus } from "lucide-react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "../styles/index.css";
import {
  Button,
  Checkbox,
  Combobox,
  Field,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PasswordInput,
  PropertyButton,
  Radio,
  RadioGroup,
  SearchInput,
  SegmentedControl,
  Select,
  Switch,
  TextArea,
  TextInput,
} from ".";

async function violations(root: Element) {
  // Espera a entrada (opacidade 0 → 1) terminar: no meio dela o axe mede contraste errado.
  await Promise.all(root.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

function Form() {
  const [notify, setNotify] = useState(false);
  return (
    <form className="flex flex-col gap-4 p-4">
      <Field label="Team name" description="Shown in the sidebar." required>
        <TextInput placeholder="Engineering" />
      </Field>
      <Field label="Team key" error="Team key is already in use. Try another.">
        <TextInput defaultValue="ENG" />
      </Field>
      <Field label="Description">
        <TextArea placeholder="What does this team work on?" />
      </Field>
      <Field label="Password">
        <PasswordInput />
      </Field>
      <Field label="Search issues">
        <SearchInput placeholder="Search…" />
      </Field>
      <Field label="Private team" orientation="horizontal">
        <Checkbox />
      </Field>
      <Field label="Email notifications" orientation="horizontal">
        <Switch checked={notify} onCheckedChange={setNotify} />
      </Field>
      <Field label="Priority">
        <RadioGroup defaultValue="high">
          <Radio value="high" label="High" />
          <Radio value="low" label="Low" />
        </RadioGroup>
      </Field>
      <div className="flex gap-2">
        <Button variant="primary" icon={Plus}>
          Create team
        </Button>
        <Button variant="ghost">Cancel</Button>
        <IconButton icon={Plus} label="Add member" />
      </div>
    </form>
  );
}

describe.each(["dark", "light"] as const)("acessibilidade no tema %s", (theme) => {
  it("formulário completo sem violações", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(<Form />);
    expect(await violations(screen.container)).toEqual([]);
  });
});

describe("Field", () => {
  it("liga label, ajuda e erro ao controle", async () => {
    const screen = await render(<Form />);
    const name = screen.getByRole("textbox", { name: /Team name/ });
    await expect.element(name).toHaveAccessibleDescription("Shown in the sidebar.");
    await expect.element(name).toBeRequired();
    const key = screen.getByRole("textbox", { name: "Team key" });
    await expect.element(key).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(key)
      .toHaveAccessibleDescription("Team key is already in use. Try another.");
  });

  it("clicar no rótulo foca o campo", async () => {
    const screen = await render(<Form />);
    await screen.getByText("Description").click();
    await expect.element(screen.getByRole("textbox", { name: "Description" })).toHaveFocus();
  });
});

describe("Button", () => {
  it("dispara no clique e com Enter/Espaço", async () => {
    const onClick = vi.fn();
    const screen = await render(<Button onClick={onClick}>Save changes</Button>);
    const button = screen.getByRole("button", { name: "Save changes" });
    await button.click();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("carregando: aria-busy e não dispara", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <Button loading onClick={onClick}>
        Save changes
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save changes" });
    await expect.element(button).toHaveAttribute("aria-busy", "true");
    await button.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("carregando mantém a largura (com e sem ícone)", async () => {
    const screen = await render(
      <div className="flex flex-col items-start gap-2">
        <Button>Save changes</Button>
        <Button loading>Save changes</Button>
        <Button icon={Plus}>Save changes</Button>
        <Button icon={Plus} loading>
          Save changes
        </Button>
      </div>,
    );
    const [a, b, c, d] = screen.container.querySelectorAll("button");
    expect(b?.offsetWidth).toBe(a?.offsetWidth);
    expect(d?.offsetWidth).toBe(c?.offsetWidth);
  });

  it("desabilitado não recebe foco nem clique", async () => {
    const onClick = vi.fn();
    const screen = await render(
      <Button disabled onClick={onClick}>
        Save changes
      </Button>,
    );
    await expect.element(screen.getByRole("button")).toBeDisabled();
  });

  it("IconButton tem nome acessível", async () => {
    const screen = await render(<IconButton icon={Plus} label="Add member" />);
    await expect.element(screen.getByRole("button", { name: "Add member" })).toBeVisible();
  });

  it("IconButton usa ícone de 14 px no tamanho md e 16 px nos demais", async () => {
    const screen = await render(
      <>
        <IconButton icon={Plus} label="xs" size="xs" data-testid="icon-xs" />
        <IconButton icon={Plus} label="sm" size="sm" data-testid="icon-sm" />
        <IconButton icon={Plus} label="md" size="md" data-testid="icon-md" />
        <IconButton icon={Plus} label="lg" size="lg" data-testid="icon-lg" />
      </>,
    );
    // A classe (não a largura do svg, que o lucide fixa em 24 por padrão) reflete o tamanho real.
    const hasIconSizeClass = (testId: string, size: "14" | "sm") =>
      screen
        .getByTestId(testId)
        .element()
        .querySelector("svg")
        ?.classList.contains(`size-icon-${size}`);
    expect(hasIconSizeClass("icon-md", "14")).toBe(true);
    expect(hasIconSizeClass("icon-xs", "sm")).toBe(true);
    expect(hasIconSizeClass("icon-sm", "sm")).toBe(true);
    expect(hasIconSizeClass("icon-lg", "sm")).toBe(true);
  });

  it("IconButton secondary perde o relevo raised; Button secondary mantém", async () => {
    const screen = await render(
      <>
        <Button variant="secondary">Save changes</Button>
        <IconButton icon={Plus} label="Add" variant="secondary" data-testid="icon-secondary" />
      </>,
    );
    const button = screen.getByRole("button", { name: "Save changes" }).element();
    const iconButton = screen.getByTestId("icon-secondary").element();
    expect(getComputedStyle(button).boxShadow).not.toBe("none");
    expect(getComputedStyle(iconButton).boxShadow).toBe("none");
  });

  it("IconButton secondary e ghost usam text-secondary e passam a text-primary no hover", async () => {
    const screen = await render(
      <>
        <span data-testid="expected-secondary" className="text-secondary" />
        <span data-testid="expected-primary" className="text-primary" />
        <IconButton icon={Plus} label="Add" variant="secondary" data-testid="secondary" />
        <IconButton
          icon={Plus}
          label="Add"
          variant="secondary"
          data-preview="hover"
          data-testid="secondary-hover"
        />
        <IconButton icon={Plus} label="Add" variant="ghost" data-testid="ghost" />
      </>,
    );
    const colorOf = (testId: string) =>
      getComputedStyle(screen.getByTestId(testId).element()).color;
    expect(colorOf("secondary")).toBe(colorOf("expected-secondary"));
    expect(colorOf("ghost")).toBe(colorOf("expected-secondary"));
    expect(colorOf("secondary-hover")).toBe(colorOf("expected-primary"));
  });

  it('IconButton tone="subtle" usa text-tertiary e passa a text-secondary no hover', async () => {
    const screen = await render(
      <>
        <span data-testid="expected-tertiary" className="text-tertiary" />
        <span data-testid="expected-secondary" className="text-secondary" />
        <IconButton icon={Plus} label="Add view" tone="subtle" data-testid="subtle" />
        <IconButton
          icon={Plus}
          label="Add view"
          tone="subtle"
          data-preview="hover"
          data-testid="subtle-hover"
        />
      </>,
    );
    const colorOf = (testId: string) =>
      getComputedStyle(screen.getByTestId(testId).element()).color;
    expect(colorOf("subtle")).toBe(colorOf("expected-tertiary"));
    expect(colorOf("subtle-hover")).toBe(colorOf("expected-secondary"));
  });
});

describe("Checkbox, Switch e Radio", () => {
  it("checkbox alterna com Espaço", async () => {
    const screen = await render(<Form />);
    const box = screen.getByRole("checkbox", { name: "Private team" });
    await box.click();
    await expect.element(box).toBeChecked();
    await userEvent.keyboard(" ");
    await expect.element(box).not.toBeChecked();
  });

  it("switch alterna no clique do rótulo", async () => {
    const screen = await render(<Form />);
    await screen.getByText("Email notifications").click();
    await expect.element(screen.getByRole("switch", { name: "Email notifications" })).toBeChecked();
  });

  it("radio: setas movem a seleção", async () => {
    const screen = await render(<Form />);
    await expect.element(screen.getByRole("radiogroup", { name: "Priority" })).toBeVisible();
    await screen.getByRole("radio", { name: "High" }).click();
    // O Radix move o foco num setTimeout e só marca se a seta ainda estiver pressionada.
    await userEvent.keyboard("{ArrowDown>}");
    await expect.element(screen.getByRole("radio", { name: "Low" })).toHaveFocus();
    await userEvent.keyboard("{/ArrowDown}");
    await expect.element(screen.getByRole("radio", { name: "Low" })).toBeChecked();
  });
});

describe("SearchInput e PasswordInput", () => {
  it("busca: Esc limpa e o botão aparece só com texto", async () => {
    const screen = await render(<Form />);
    const input = screen.getByRole("searchbox", { name: "Search issues" });
    await expect
      .element(screen.getByRole("button", { name: "Clear search" }))
      .not.toBeInTheDocument();
    await input.fill("login");
    await expect.element(screen.getByRole("button", { name: "Clear search" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(input).toHaveValue("");
  });

  it("busca controlada: limpar dispara onChange com valor vazio", async () => {
    function Controlled() {
      const [q, setQ] = useState("login");
      return <SearchInput aria-label="Filter" value={q} onChange={(e) => setQ(e.target.value)} />;
    }
    const screen = await render(<Controlled />);
    await screen.getByRole("button", { name: "Clear search" }).click();
    await expect.element(screen.getByRole("searchbox", { name: "Filter" })).toHaveValue("");
  });

  it("senha: mostrar e ocultar", async () => {
    const screen = await render(<Form />);
    const toggle = screen.getByRole("button", { name: "Show password" });
    await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect
      .element(screen.getByRole("button", { name: "Hide password" }))
      .toHaveAttribute("aria-pressed", "true");
  });
});

describe("Menu", () => {
  function Slash({ onSelect }: { onSelect: (v: string) => void }) {
    return (
      <Menu>
        <MenuTrigger asChild>
          <Button>Insert block</Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem shortcut={["Ctrl", "Alt", "1"]} onSelect={() => onSelect("h1")}>
            Heading 1
          </MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => onSelect("list")}>Bulleted list</MenuItem>
        </MenuContent>
      </Menu>
    );
  }

  it("abre pelo teclado, navega com setas, seleciona com Enter e devolve o foco", async () => {
    const onSelect = vi.fn();
    const screen = await render(<Slash onSelect={onSelect} />);
    const trigger = screen.getByRole("button", { name: "Insert block" });
    await trigger.click();
    await expect.element(screen.getByRole("menu")).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("menuitem", { name: "Bulleted list" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("list");
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("Esc fecha sem selecionar e o menu passa no axe", async () => {
    const onSelect = vi.fn();
    const screen = await render(<Slash onSelect={onSelect} />);
    await screen.getByRole("button", { name: "Insert block" }).click();
    await expect.element(screen.getByRole("menu")).toBeVisible();
    // Audita o próprio menu: com o menu modal aberto, o Radix esconde o fundo (aria-hidden) de
    // propósito, e a página de teste não tem landmarks.
    const menu = document.querySelector('[role="menu"]');
    if (!menu) throw new Error("menu não abriu");
    expect(await violations(menu)).toEqual([]);
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("SegmentedControl", () => {
  function Modes() {
    const [mode, setMode] = useState<"comment" | "update">("update");
    return (
      <SegmentedControl
        label="Post type"
        value={mode}
        onValueChange={setMode}
        options={[
          { value: "comment", label: "Comment" },
          { value: "update", label: "Update" },
        ]}
      />
    );
  }

  it("marca a opção clicada e não desmarca a atual", async () => {
    const screen = await render(<Modes />);
    const comment = screen.getByRole("radio", { name: "Comment" });
    const update = screen.getByRole("radio", { name: "Update" });
    await expect.element(update).toHaveAttribute("aria-checked", "true");
    await comment.click();
    await expect.element(comment).toHaveAttribute("aria-checked", "true");
    await comment.click();
    await expect.element(comment).toHaveAttribute("aria-checked", "true");
    expect(await violations(screen.container)).toEqual([]);
  });
});

const priorities = [
  { value: "none", label: "No priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

describe("Combobox", () => {
  function Priority({ onChange }: { onChange?: (v: string) => void }) {
    const [value, setValue] = useState("none");
    return (
      <Combobox
        label="Priority"
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onChange?.(v);
        }}
        options={priorities}
        searchPlaceholder="Change priority…"
        shortcut={["P", "P"]}
        numberFrom={0}
      >
        <PropertyButton>{priorities.find((p) => p.value === value)?.label}</PropertyButton>
      </Combobox>
    );
  }

  it("abre com foco na busca, filtra e escolhe com Enter", async () => {
    const onChange = vi.fn();
    const screen = await render(<Priority onChange={onChange} />);
    await screen.getByRole("button", { name: "No priority" }).click();
    const search = screen.getByPlaceholder("Change priority…");
    await expect.element(search).toHaveFocus();
    await userEvent.keyboard("hig");
    await expect.element(screen.getByRole("option", { name: /Urgent/ })).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("high");
    await expect.element(screen.getByRole("button", { name: "High" })).toHaveFocus();
  });

  it("número escolhe direto com a busca vazia; Esc fecha", async () => {
    const onChange = vi.fn();
    const screen = await render(<Priority onChange={onChange} />);
    await screen.getByRole("button", { name: "No priority" }).click();
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    const dialog = document.querySelector("[data-radix-popper-content-wrapper]");
    if (!dialog) throw new Error("popover não abriu");
    expect(await violations(dialog)).toEqual([]);
    // Começa em 0 (No priority): 3 = Medium, como no Figma.
    await userEvent.keyboard("3");
    expect(onChange).toHaveBeenCalledWith("medium");
    await screen.getByRole("button", { name: "Medium" }).click();
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("Select", () => {
  it("abre pelo teclado e escolhe com setas e Enter", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <Field label="Priority">
        <Select options={priorities} defaultValue="none" onValueChange={onChange} />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: "Priority" });
    await trigger.click();
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("urgent");
    await expect.element(trigger).toHaveTextContent("Urgent");
  });
});
