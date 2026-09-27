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
    await screen.getByPlaceholder("Search emoji…").fill("fire");
    await screen.getByRole("button", { name: "fire" }).click();
    expect(onChange).toHaveBeenLastCalledWith({ kind: "emoji", emoji: "🔥" });
    expect(await violations(screen.container)).toEqual([]);
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
