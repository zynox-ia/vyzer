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
  Field,
  IconButton,
  PasswordInput,
  Radio,
  RadioGroup,
  SearchInput,
  Switch,
  TextArea,
  TextInput,
} from ".";

async function violations(root: Element) {
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
