import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Icon, ICON_STROKE } from "../icons";
import "../styles/index.css";
import {
  Combobox,
  IconPickerPanel,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  ProjectIcon,
  PropertyButton,
} from ".";
import { loadMoreIcons, PROJECT_ICONS } from "./icon-picker-data";
import { Circle } from "lucide-react";

describe("Icon Picker: ícones adicionais", () => {
  it("mostra o carregamento e depois as 1.483 opções em More icons", async () => {
    const screen = await render(
      <IconPickerPanel
        value={{ kind: "icon", name: "Box", color: "grey" }}
        onValueChange={vi.fn()}
      />,
    );

    await expect.element(screen.getByText("Loading more icons…")).toBeVisible();
    const more = screen.getByRole("group", { name: "More icons" });
    await expect.element(more).toBeVisible();
    expect(more.element().querySelectorAll("button")).toHaveLength(1483);
    expect(screen.container.querySelectorAll('fieldset[aria-label="More icons"]')).toHaveLength(0);
    expect(screen.container.querySelectorAll("fieldset")).toHaveLength(16);
  });

  it("não repete componentes curados e usa nome kebab legível nos ícones adicionais", async () => {
    const more = await loadMoreIcons();
    const curated = new Set(PROJECT_ICONS.map((entry) => entry.icon));
    expect(PROJECT_ICONS).toHaveLength(371);
    expect(more).toHaveLength(1483);
    expect(more.some((entry) => curated.has(entry.icon))).toBe(false);

    const screen = await render(
      <IconPickerPanel
        value={{ kind: "icon", name: "Box", color: "grey" }}
        onValueChange={vi.fn()}
      />,
    );
    const search = screen.getByPlaceholder("Search icons…");
    await search.fill("column");
    const moreGroup = screen.getByRole("group", { name: "More icons" });
    await expect.element(moreGroup).toBeVisible();
    const option = screen.getByRole("button", { name: "Chart column increasing", exact: true });
    await expect.element(option).toBeVisible();
    expect(
      option.element().querySelector("svg")?.classList.contains("lucide-chart-column-increasing"),
    ).toBe(true);
  });

  it("salva o nome kebab e ProjectIcon renderiza nomes fora da curadoria", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <IconPickerPanel
        value={{ kind: "icon", name: "Box", color: "grey" }}
        onValueChange={onChange}
      />,
    );
    await screen.getByPlaceholder("Search icons…").fill("column");
    await screen.getByRole("button", { name: "Chart column increasing", exact: true }).click();
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "icon",
      name: "chart-column-increasing",
      color: "grey",
    });

    const projectIcons = await render(
      <>
        <span data-testid="known">
          <ProjectIcon value={{ kind: "icon", name: "chart-column-increasing", color: "grey" }} />
        </span>
        <span data-testid="unknown">
          <ProjectIcon value={{ kind: "icon", name: "does-not-exist", color: "grey" }} />
        </span>
      </>,
    );
    const known = projectIcons.getByTestId("known");
    await expect.element(known).toContainHTML("lucide-chart-column-increasing");
    expect(projectIcons.getByTestId("unknown").element().querySelector("svg")).toBeNull();
  });
});

describe("Icon", () => {
  it("mantém 2 px reais de traço em xs e xl pela fórmula do Lucide", async () => {
    const screen = await render(
      <>
        <Icon icon={Circle} size="xs" data-testid="icon-xs" />
        <Icon icon={Circle} size="xl" data-testid="icon-xl" />
      </>,
    );

    for (const testId of ["icon-xs", "icon-xl"]) {
      const svg = screen.getByTestId(testId).element() as SVGSVGElement;
      const viewBoxSize = Number(svg.viewBox.baseVal.width);
      const renderedSize = Number(svg.getAttribute("width"));
      const expected = (ICON_STROKE * viewBoxSize) / renderedSize;
      expect(Number(svg.getAttribute("stroke-width"))).toBe(expected);
      expect(expected).toBe(2);
    }
  });
});

describe("Combobox sem busca", () => {
  const options = [
    { value: "none", label: "No lead" },
    { value: "ana", label: "Ana" },
    { value: "bruno", label: "Bruno" },
  ];

  function Lead({ onChange }: { onChange: (value: string) => void }) {
    const [value, setValue] = useState("none");
    return (
      <Combobox
        label="Lead"
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onChange(next);
        }}
        options={options}
        searchable={false}
        numberFrom={0}
      >
        <PropertyButton>{options.find((option) => option.value === value)?.label}</PropertyButton>
      </Combobox>
    );
  }

  it("não renderiza input, foca a raiz do cmdk e escolhe com seta e Enter", async () => {
    const onChange = vi.fn();
    const screen = await render(<Lead onChange={onChange} />);
    await screen.getByRole("button", { name: "No lead" }).click();
    await expect.element(screen.getByRole("listbox")).toBeVisible();
    expect(screen.container.querySelector("input")).toBeNull();
    const root = document.querySelector("[cmdk-root]");
    expect(root).not.toBeNull();
    expect(document.activeElement).toBe(root);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("ana");
  });

  it("escolhe pela tecla numérica a partir de numberFrom=0", async () => {
    const onChange = vi.fn();
    const screen = await render(<Lead onChange={onChange} />);
    await screen.getByRole("button", { name: "No lead" }).click();
    await userEvent.keyboard("2");
    expect(onChange).toHaveBeenLastCalledWith("bruno");
  });

  it("mantém o input quando searchable usa o padrão", async () => {
    const screen = await render(
      <Combobox label="Lead" value="none" onValueChange={vi.fn()} options={options}>
        <PropertyButton>No lead</PropertyButton>
      </Combobox>,
    );
    await screen.getByRole("button", { name: "No lead" }).click();
    await expect.element(screen.getByRole("combobox")).toBeVisible();
    await userEvent.keyboard("{Escape}");
  });
});

describe("MenuContent", () => {
  it("abre para baixo e limita a altura com 8 px de margem na borda", async () => {
    const screen = await render(
      <div style={{ position: "fixed", left: 16, top: "calc(100vh - 48px)" }}>
        <Menu>
          <MenuTrigger asChild>
            <PropertyButton>Near viewport edge</PropertyButton>
          </MenuTrigger>
          <MenuContent>
            {Array.from({ length: 40 }, (_, index) => (
              <MenuItem key={index}>Action {index + 1}</MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </div>,
    );
    const trigger = screen.getByRole("button", { name: "Near viewport edge" });
    const triggerElement = trigger.element();
    await trigger.click();
    const menu = screen.getByRole("menu");
    await expect.element(menu).toBeVisible();
    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = menu.element().getBoundingClientRect();
    expect(menu.element().getAttribute("data-side")).toBe("bottom");
    expect(menuRect.top).toBeGreaterThanOrEqual(triggerRect.bottom);
    expect(menuRect.bottom).toBeLessThanOrEqual(window.innerHeight - 8);
    expect(menu.element().scrollHeight).toBeGreaterThan(menu.element().clientHeight);
  });
});
