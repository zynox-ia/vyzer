/**
 * Seletores do New Project (Figma 1:2) num Chromium real: Date Picker, Label Picker, submenu com
 * busca, Icon Picker e Tabs. Teclado, mouse e axe-core.
 */
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "../styles/index.css";
import {
  ComboboxPanel,
  DatePickerPanel,
  IconPickerPanel,
  LabelPickerPanel,
  Menu,
  MenuContent,
  MenuPanel,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  PropertyButton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type LabelItem,
} from ".";

async function violations(root: Element) {
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

const TODAY = new Date(2026, 8, 27);

describe("DatePickerPanel", () => {
  it("lê o texto digitado com Enter e troca a granularidade", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <DatePickerPanel label="Start date" onValueChange={onChange} today={TODAY} />,
    );
    const input = screen.getByRole("textbox", { name: /Start date/ });
    await input.click();
    await userEvent.keyboard("Q4{Enter}");
    expect(onChange).toHaveBeenCalledWith({ kind: "quarter", year: 2026, quarter: 4 });
    await expect.element(screen.getByRole("radio", { name: "Quarter" })).toBeChecked();
    await userEvent.keyboard("soon{Enter}");
    await expect.element(input).toHaveAttribute("aria-invalid", "true");
    expect(await violations(screen.container)).toEqual([]);
  });

  it("anda pela grade com as setas e Page Down e escolhe com Enter", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <DatePickerPanel label="Start date" onValueChange={onChange} today={TODAY} />,
    );
    const today = screen.getByRole("button", { name: "September 27, 2026 (today)" });
    await expect.element(today).toHaveAttribute("tabindex", "0");
    await today.click();
    expect(onChange).toHaveBeenLastCalledWith({ kind: "day", year: 2026, month: 9, day: 27 });
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByRole("button", { name: "September 28, 2026" })).toHaveFocus();
    await userEvent.keyboard("{PageDown}");
    await expect.element(screen.getByRole("button", { name: "October 28, 2026" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith({ kind: "day", year: 2026, month: 10, day: 28 });
    expect(await violations(screen.container)).toEqual([]);
  });
});

describe("LabelPickerPanel", () => {
  function Labels({ onCreate }: { onCreate: (name: string, color: string) => void }) {
    const [labels, setLabels] = useState<LabelItem[]>([
      { value: "bug", label: "Bug", color: "red" },
      { value: "feature", label: "Feature", color: "purple" },
    ]);
    const [value, setValue] = useState<string[]>([]);
    return (
      <>
        <LabelPickerPanel
          labels={labels}
          value={value}
          onValueChange={setValue}
          onCreate={(name, color) => {
            onCreate(name, color);
            setLabels((prev) => [...prev, { value: name, label: name, color }]);
            return name;
          }}
        />
        <output>{value.join(",")}</output>
      </>
    );
  }

  it("marca vários sem fechar e cria um label novo com cor", async () => {
    const onCreate = vi.fn();
    const screen = await render(<Labels onCreate={onCreate} />);
    await screen.getByRole("option", { name: /Bug/ }).click();
    await screen.getByRole("option", { name: /Feature/ }).click();
    await expect.element(screen.getByRole("status")).toHaveTextContent("bug,feature");
    await screen.getByPlaceholder("Change or add labels…").click();
    await userEvent.keyboard("Design");
    await screen.getByRole("option", { name: /Create new workspace label/ }).click();
    await expect.element(screen.getByPlaceholder("Pick a color for label")).toBeVisible();
    await screen.getByRole("option", { name: "Teal" }).click();
    expect(onCreate).toHaveBeenCalledWith("Design", "cyan");
    await expect.element(screen.getByRole("status")).toHaveTextContent("bug,feature,Design");
    expect(await violations(screen.container)).toEqual([]);
  });
});

describe("Submenu com busca", () => {
  it("→ abre o submenu com o foco na busca; digitar filtra sem typeahead do menu", async () => {
    const onChange = vi.fn();
    function Dependencies() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <Menu>
          <MenuTrigger asChild>
            <PropertyButton>Dependencies</PropertyButton>
          </MenuTrigger>
          <MenuContent variant="dropdown">
            <MenuSub>
              <MenuSubTrigger>Blocked by…</MenuSubTrigger>
              <MenuSubContent panelLabel="Blocked by">
                <MenuPanel>
                  <ComboboxPanel
                    multiple
                    label="Blocked by"
                    searchPlaceholder="Search projects…"
                    value={value}
                    onValueChange={(v) => {
                      setValue(v);
                      onChange(v);
                    }}
                    options={[
                      { value: "aname", label: "Aname CRM" },
                      { value: "zyncloud", label: "ZynCloud" },
                    ]}
                  />
                </MenuPanel>
              </MenuSubContent>
            </MenuSub>
          </MenuContent>
        </Menu>
      );
    }
    const screen = await render(<Dependencies />);
    await screen.getByRole("button", { name: "Dependencies" }).click();
    await userEvent.keyboard("{ArrowDown}");
    await expect.element(screen.getByRole("menuitem", { name: /Blocked by/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    const search = screen.getByPlaceholder("Search projects…");
    await expect.element(search).toHaveFocus();
    await userEvent.keyboard("zyn");
    await expect.element(search).toHaveValue("zyn");
    await expect.element(screen.getByRole("option", { name: /Aname/ })).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(["zyncloud"]);
    const sub = document.querySelector('[role="dialog"][aria-label="Blocked by"]');
    if (!sub) throw new Error("submenu não abriu");
    expect(await violations(sub)).toEqual([]);
  });
});

describe("IconPickerPanel", () => {
  it("troca a cor, escolhe um ícone e um emoji", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <IconPickerPanel
        value={{ kind: "icon", name: "Box", color: "grey" }}
        onValueChange={onChange}
      />,
    );
    await screen.getByRole("radio", { name: "Teal" }).click();
    await expect.element(screen.getByRole("radio", { name: "Teal" })).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith({ kind: "icon", name: "Box", color: "cyan" });
    await screen.getByRole("button", { name: "Rocket" }).click();
    expect(onChange).toHaveBeenLastCalledWith({ kind: "icon", name: "Rocket", color: "cyan" });
    await screen.getByPlaceholder("Search icons…").fill("zzzz");
    await expect.element(screen.getByText("No icons found")).toBeVisible();
    expect(await violations(screen.container)).toEqual([]);

    await screen.getByRole("tab", { name: "Emojis" }).click();
    await expect.element(screen.getByText("Smileys & Emotion")).toBeVisible();
    await screen.getByPlaceholder("Search emoji…").fill("fire");
    await screen.getByRole("gridcell", { name: "Fire", exact: true }).click();
    expect(onChange).toHaveBeenLastCalledWith({ kind: "emoji", emoji: "🔥" });
    expect(await violations(screen.container)).toEqual([]);
  });

  it("busca ícones por categoria e mostra estado sem resultados", async () => {
    const screen = await render(
      <IconPickerPanel
        value={{ kind: "icon", name: "Box", color: "grey" }}
        onValueChange={vi.fn()}
      />,
    );
    const search = screen.getByPlaceholder("Search icons…");
    await search.fill("finance");
    await expect.element(screen.getByRole("group", { name: "Business & finance" })).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Wallet" })).toBeVisible();

    await search.fill("zzzz");
    await expect.element(screen.getByText("No icons found")).toBeVisible();
  });

  it("carrega os emojis pelo servidor local e mostra as categorias", async () => {
    const screen = await render(
      <IconPickerPanel
        value={{ kind: "icon", name: "Box", color: "grey" }}
        onValueChange={vi.fn()}
      />,
    );
    await screen.getByRole("tab", { name: "Emojis" }).click();
    await expect.element(screen.getByText("Smileys & Emotion")).toBeVisible();
    await expect.element(screen.getByText("People & Body")).toBeVisible();

    const resourceNames = performance.getEntriesByType("resource").map((entry) => entry.name);
    expect(resourceNames.some((name) => name.includes("/emojibase-data/en/data.json"))).toBe(true);
    expect(resourceNames.some((name) => name.includes("/emojibase-data/en/messages.json"))).toBe(
      true,
    );
  });

  it("começa os índices ARIA do Frimousse em 1", async () => {
    const screen = await render(
      <IconPickerPanel
        value={{ kind: "icon", name: "Box", color: "grey" }}
        onValueChange={vi.fn()}
      />,
    );
    await screen.getByRole("tab", { name: "Emojis" }).click();
    await expect.element(screen.getByText("Smileys & Emotion")).toBeVisible();

    const firstRow = screen.container.querySelector("[frimousse-row][aria-rowindex]");
    const firstEmoji = screen.container.querySelector("button[frimousse-emoji][aria-colindex]");
    if (!firstRow || !firstEmoji) throw new Error("Frimousse não renderizou a primeira linha");
    expect(firstRow.getAttribute("aria-rowindex")).toBe("1");
    expect(firstEmoji.getAttribute("aria-colindex")).toBe("1");
  });
});

describe("Foco global", () => {
  it("usa outline de 1 px com a linha ativa e sem halo ao focar por teclado", async () => {
    const screen = await render(<button type="button">Focus target</button>);
    await userEvent.tab();
    const target = screen.getByRole("button", { name: "Focus target" });
    await expect.element(target).toHaveFocus();

    const element = target.element();
    const expected = document.createElement("span");
    expected.style.color = "var(--line-field-active)";
    document.body.append(expected);
    const expectedColor = getComputedStyle(expected).color;
    expected.remove();

    const styles = getComputedStyle(element);
    expect(styles.outlineWidth).toBe("1px");
    expect(styles.outlineColor).toBe(expectedColor);
    expect(styles.outlineOffset).toBe("-1px");
    expect(styles.boxShadow).toBe("none");
  });
});

describe("Icon Picker: cor personalizada", () => {
  it("abre pelo botão, aceita HEX, muda a matiz e a área pelo teclado", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <IconPickerPanel
        value={{ kind: "icon", name: "Rocket", color: "orange" }}
        onValueChange={onChange}
      />,
    );
    const toggle = screen.getByRole("button", { name: "Set custom color" });
    await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    // Começa da cor atual (Orange), sem trocar o ícone antes de a pessoa mexer.
    expect(onChange).not.toHaveBeenCalled();

    const hex = screen.getByRole("textbox", { name: "Hex color" });
    await hex.fill("#FF2FCD");
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith({ kind: "icon", name: "Rocket", color: "#ff2fcd" });
    await expect.element(hex).toHaveValue("#ff2fcd");

    await hex.fill("pink");
    await expect.element(hex).toHaveAttribute("aria-invalid", "true");
    await userEvent.keyboard("{Enter}");
    await expect.element(hex).toHaveValue("#ff2fcd");

    const hue = screen.getByRole("slider", { name: "Hue" });
    await hue.click();
    await userEvent.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith({ kind: "icon", name: "Rocket", color: "#ff2f2f" });

    const brightness = screen.getByRole("slider", { name: "Brightness" });
    brightness.element().focus();
    await userEvent.keyboard("{End}");
    await expect.element(brightness).toHaveValue("100");

    expect(await violations(screen.container)).toEqual([]);

    // Voltar à paleta: nenhuma amostra marcada, porque a cor atual é personalizada.
    await toggle.click();
    await expect.element(screen.getByRole("radio", { name: "Orange" })).not.toBeChecked();
  });
});

describe("Tabs", () => {
  it("← → trocam de aba e mostram o painel", async () => {
    const screen = await render(
      <Tabs defaultValue="icons">
        <TabsList aria-label="Project icon">
          <TabsTrigger value="icons">Icons</TabsTrigger>
          <TabsTrigger value="emojis">Emojis</TabsTrigger>
        </TabsList>
        <TabsContent value="icons">Icon grid</TabsContent>
        <TabsContent value="emojis">Emoji grid</TabsContent>
      </Tabs>,
    );
    await screen.getByRole("tab", { name: "Icons" }).click();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(screen.getByRole("tab", { name: "Emojis" })).toHaveFocus();
    await expect
      .element(screen.getByRole("tab", { name: "Emojis" }))
      .toHaveAttribute("aria-selected", "true");
    await expect.element(screen.getByRole("tabpanel")).toHaveTextContent("Emoji grid");
    expect(await violations(screen.container)).toEqual([]);
  });
});
