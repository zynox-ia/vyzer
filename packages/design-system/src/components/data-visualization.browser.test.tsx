import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "../styles/index.css";
import {
  BurnUpChart,
  type BurnUpPoint,
  HealthBadge,
  type Health,
  LineChart,
  type LineSeries,
  Legend,
  type LegendItem,
  Sparkline,
  StackedBarChart,
  type StackedBarGroup,
} from ".";

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

afterEach(async () => {
  delete document.documentElement.dataset.theme;
  // Devolve o ponteiro real para um ponto neutro (centro do body) depois de cada teste: sem
  // isso, um teste que clica ou passa o mouse perto do topo de um card (o header do gráfico, a
  // Legend) deixa o ponteiro parado ali, e o próximo gráfico monta na mesma posição de tela —
  // disparando um hover fantasma (mouseenter real do Chromium) assim que o elemento aparece sob
  // um ponteiro parado.
  await userEvent.hover(document.body);
});

/** Localiza o `<svg class="recharts-surface">` principal do gráfico, ignorando os swatches SVG
 * de legendas (6x6/12x12) que também vivem no container. */
function chartSurface(root: Element) {
  return root.querySelector("svg.recharts-surface");
}

/** Pontos (em coordenadas locais do `<svg>`, iguais a offsets de pixel dentro dele) do traço
 * principal de uma série de linha/área — lidos do atributo `d` do path, que o Recharts desenha
 * como segmentos retos (`M`/`L`) na ausência de um `type` de curva. Hover nessas coordenadas
 * (via `{ position }`, relativo ao elemento) dispara o tooltip do ponto de dado exato, sem
 * depender de qual tick de eixo o Recharts decide desenhar (ticks que colidiriam são omitidos). */
function linePoints(root: Element, curveSelector = ".recharts-line-curve") {
  const d = root.querySelector(curveSelector)?.getAttribute("d") ?? "";
  const points = [...d.matchAll(/[ML]\s*(-?[\d.]+)[ ,]+(-?[\d.]+)/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
  }));
  if (points.length === 0) throw new Error(`linePoints: nenhum ponto em "${curveSelector}"`);
  return points;
}

/** Abre o menu "…" do card do gráfico (IconButton "Chart options") e seleciona um item pelo nome
 * acessível — mesmo padrão dos outros menus do DS (Menu/MenuItem, Radix DropdownMenu): o gatilho
 * visível trocou de um Button de texto abaixo do gráfico para este IconButton discreto no
 * cabeçalho. */
async function selectChartMenuItem(screen: Awaited<ReturnType<typeof render>>, itemName: string) {
  await screen.getByRole("button", { name: "Chart options" }).click();
  await screen.getByRole("menuitem", { name: itemName }).click();
}

const BURN_UP: BurnUpPoint[] = [
  { date: "2026-09-01", scope: 10, started: 2, completed: 0 },
  { date: "2026-09-08", scope: 12, started: 5, completed: 3 },
  { date: "2026-09-15", scope: 12, started: 6, completed: 7 },
];

const STACKED: StackedBarGroup[] = [
  {
    key: "w1",
    label: "Sep 1",
    segments: [
      { key: "done", label: "Done", value: 2, colorVar: "--st-success" },
      { key: "started", label: "In Progress", value: 1, colorVar: "--st-warning" },
    ],
  },
  {
    key: "w2",
    label: "Sep 8",
    segments: [
      { key: "done", label: "Done", value: 4, colorVar: "--st-success" },
      { key: "started", label: "In Progress", value: 2, colorVar: "--st-warning" },
    ],
  },
];

const LINE_SERIES: LineSeries[] = [
  { key: "throughput", label: "Throughput", colorVar: "--chart-1", values: [3, 5, 4] },
  { key: "velocity", label: "Velocity", colorVar: "--chart-2", values: [2, 3, 6] },
];
const LINE_CATEGORIES = ["Sep 1", "Sep 8", "Sep 15"];

describe.each(["dark", "light"] as const)("data visualization no tema %s", (theme) => {
  describe("Tabela alternativa", () => {
    it("BurnUpChart alterna entre gráfico e tabela com os dados corretos", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<BurnUpChart data={BURN_UP} label="Zynox OS progress" />);
      expect(chartSurface(screen.container)).not.toBeNull();
      expect(screen.container.querySelector("table")).toBeNull();

      await selectChartMenuItem(screen, "View as table");
      const table = screen.getByRole("table", { name: "Zynox OS progress" });
      await expect.element(table).toBeInTheDocument();
      expect(chartSurface(screen.container)).toBeNull();
      const rows = table.element().querySelectorAll("tbody tr");
      expect(rows).toHaveLength(3);
      expect(rows[1]?.textContent).toContain("Sep 8");
      expect(rows[1]?.textContent).toContain("12");
      expect(rows[1]?.textContent).toContain("5");
      expect(rows[1]?.textContent).toContain("3");
      const headers = [...table.element().querySelectorAll("thead th")].map((th) => th.textContent);
      expect(headers).toEqual(["Date", "Scope", "Started", "Completed"]);

      await selectChartMenuItem(screen, "Show chart");
      await expect.element(table).not.toBeInTheDocument();
      expect(chartSurface(screen.container)).not.toBeNull();
    });

    it("StackedBarChart alterna entre gráfico e tabela com os dados corretos", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<StackedBarChart data={STACKED} label="Issues by status" />);
      expect(chartSurface(screen.container)).not.toBeNull();

      await selectChartMenuItem(screen, "View as table");
      const table = screen.getByRole("table", { name: "Issues by status" });
      const headers = [...table.element().querySelectorAll("thead th")].map((th) => th.textContent);
      expect(headers).toEqual(["Category", "Done", "In Progress"]);
      const rows = table.element().querySelectorAll("tbody tr");
      expect(rows).toHaveLength(2);
      expect(rows[0]?.textContent).toContain("Sep 1");
      expect(rows[0]?.textContent).toContain("2");
      expect(rows[0]?.textContent).toContain("1");
      expect(rows[1]?.textContent).toContain("Sep 8");
      expect(rows[1]?.textContent).toContain("4");
      expect(rows[1]?.textContent).toContain("2");

      await selectChartMenuItem(screen, "Show chart");
      await expect.element(table).not.toBeInTheDocument();
    });

    it("StackedBarChart: o menu '…' abre e fecha só por teclado, com o foco voltando ao gatilho", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<StackedBarChart data={STACKED} label="Issues by status" />);
      const trigger = screen.getByRole("button", { name: "Chart options" });

      // Tab até o gatilho: dois itens da Legend vêm antes dele na ordem de foco.
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await expect.element(trigger).toHaveFocus();

      await userEvent.keyboard("{Enter}");
      const menuItem = screen.getByRole("menuitem", { name: "View as table" });
      await expect.element(menuItem).toHaveFocus();

      await userEvent.keyboard("{Enter}");
      const table = screen.getByRole("table", { name: "Issues by status" });
      await expect.element(table).toBeInTheDocument();
      await expect.element(trigger).toHaveFocus();

      // Volta: mesmo ciclo, agora para "Show chart".
      await userEvent.keyboard("{Enter}");
      const showChartItem = screen.getByRole("menuitem", { name: "Show chart" });
      await expect.element(showChartItem).toHaveFocus();

      await userEvent.keyboard("{Enter}");
      await expect.element(table).not.toBeInTheDocument();
      await expect.element(trigger).toHaveFocus();
    });

    it("LineChart alterna entre gráfico e tabela com os dados corretos", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(
        <LineChart categories={LINE_CATEGORIES} series={LINE_SERIES} label="Throughput trend" />,
      );
      expect(chartSurface(screen.container)).not.toBeNull();

      await selectChartMenuItem(screen, "View as table");
      const table = screen.getByRole("table", { name: "Throughput trend" });
      const headers = [...table.element().querySelectorAll("thead th")].map((th) => th.textContent);
      expect(headers).toEqual(["Date", "Throughput", "Velocity"]);
      const rows = table.element().querySelectorAll("tbody tr");
      expect(rows).toHaveLength(3);
      expect(rows[2]?.textContent).toContain("Sep 15");
      expect(rows[2]?.textContent).toContain("4");
      expect(rows[2]?.textContent).toContain("6");

      await selectChartMenuItem(screen, "Show chart");
      await expect.element(table).not.toBeInTheDocument();
    });
  });

  describe("Estado vazio", () => {
    it("BurnUpChart com data=[] renderiza o EmptyState em vez do gráfico", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<BurnUpChart data={[]} label="Zynox OS progress" />);
      expect(chartSurface(screen.container)).toBeNull();
      await expect.element(screen.getByText("No progress yet")).toBeVisible();
    });

    it("StackedBarChart com data=[] renderiza o EmptyState em vez do gráfico", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<StackedBarChart data={[]} label="Issues by status" />);
      expect(chartSurface(screen.container)).toBeNull();
      await expect.element(screen.getByText("No issues yet")).toBeVisible();
    });

    it("LineChart com categories=[] renderiza o EmptyState em vez do gráfico", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(
        <LineChart categories={[]} series={LINE_SERIES} label="Throughput trend" />,
      );
      expect(chartSurface(screen.container)).toBeNull();
      await expect.element(screen.getByText("No cycles yet")).toBeVisible();
    });

    // Regressão: os hooks (useMemo/useId/useState) precisam rodar na mesma ordem em toda
    // renderização — o `return` do EmptyState não pode vir antes deles (regra dos hooks do
    // React). Sem isso, alternar vazio -> com dados -> vazio de novo no mesmo componente monta
    // um número diferente de hooks entre renders e o React lança em desenvolvimento.
    it("BurnUpChart alterna vazio -> com dados -> vazio sem quebrar a regra dos hooks", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<BurnUpChart data={[]} label="Zynox OS progress" />);
      await expect.element(screen.getByText("No progress yet")).toBeVisible();

      await screen.rerender(<BurnUpChart data={BURN_UP} label="Zynox OS progress" />);
      expect(chartSurface(screen.container)).not.toBeNull();

      await screen.rerender(<BurnUpChart data={[]} label="Zynox OS progress" />);
      await expect.element(screen.getByText("No progress yet")).toBeVisible();
    });

    it("StackedBarChart alterna vazio -> com dados -> vazio sem quebrar a regra dos hooks", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<StackedBarChart data={[]} label="Issues by status" />);
      await expect.element(screen.getByText("No issues yet")).toBeVisible();

      await screen.rerender(<StackedBarChart data={STACKED} label="Issues by status" />);
      expect(chartSurface(screen.container)).not.toBeNull();

      await screen.rerender(<StackedBarChart data={[]} label="Issues by status" />);
      await expect.element(screen.getByText("No issues yet")).toBeVisible();
    });

    it("LineChart alterna vazio -> com dados -> vazio sem quebrar a regra dos hooks", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(
        <LineChart categories={[]} series={LINE_SERIES} label="Throughput trend" />,
      );
      await expect.element(screen.getByText("No cycles yet")).toBeVisible();

      await screen.rerender(
        <LineChart categories={LINE_CATEGORIES} series={LINE_SERIES} label="Throughput trend" />,
      );
      expect(chartSurface(screen.container)).not.toBeNull();

      await screen.rerender(
        <LineChart categories={[]} series={LINE_SERIES} label="Throughput trend" />,
      );
      await expect.element(screen.getByText("No cycles yet")).toBeVisible();
    });
  });

  describe("Tooltip por ponteiro e teclado", () => {
    it("StackedBarChart mostra o tooltip no hover, no foco e some no Escape", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<StackedBarChart data={STACKED} label="Issues by status" />);
      // Uma barra por segmento por categoria, agrupadas por série: [done Sep1, done Sep8,
      // started Sep1, started Sep8]. O primeiro elemento é sempre a primeira categoria.
      const bars = screen.container.querySelectorAll(".recharts-bar-rectangle");

      expect(document.querySelector('[role="tooltip"]')).toBeNull();
      await userEvent.hover(bars[0] as Element);
      const tooltip = screen.getByRole("tooltip");
      await expect.element(tooltip).toBeVisible();
      await expect.element(tooltip).toHaveTextContent("Sep 1");
      await expect.element(tooltip).toHaveTextContent("Done");
      await expect.element(tooltip).toHaveTextContent("2");
      await expect.element(tooltip).toHaveTextContent("In Progress");
      await expect.element(tooltip).toHaveTextContent("1");

      await userEvent.unhover(bars[0] as Element);
      await expect.element(tooltip).not.toBeInTheDocument();

      // Foco por teclado: o accessibilityLayer torna o próprio <svg class="recharts-surface">
      // focável (role="application", tabIndex 0) e já mostra o tooltip do primeiro ponto. Quatro
      // Tabs: os dois itens da Legend (agora focáveis — destaque de série por teclado, achado da
      // revisão de código, redesenho r2) e o IconButton "Chart options" do cabeçalho vêm antes do
      // gráfico na ordem de foco (2 itens + o botão = 3 paradas antes do próprio gráfico).
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      const surface = chartSurface(screen.container) as HTMLElement;
      await expect.element(surface).toHaveFocus();
      await expect.element(screen.getByRole("tooltip")).toBeVisible();
      await expect.element(screen.getByRole("tooltip")).toHaveTextContent("Sep 1");

      await userEvent.keyboard("{ArrowRight}");
      await expect.element(screen.getByRole("tooltip")).toHaveTextContent("Sep 8");
      await expect.element(screen.getByRole("tooltip")).toHaveTextContent("4");
      await expect.element(screen.getByRole("tooltip")).toHaveTextContent("2");

      await userEvent.keyboard("{Escape}");
      await expect.element(screen.getByRole("tooltip")).not.toBeInTheDocument();
    });

    it("LineChart mostra o tooltip no hover, no foco e some no Escape", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(
        <LineChart categories={LINE_CATEGORIES} series={LINE_SERIES} label="Throughput trend" />,
      );
      const surface = chartSurface(screen.container) as HTMLElement;
      const points = linePoints(screen.container);

      expect(document.querySelector('[role="tooltip"]')).toBeNull();
      await userEvent.hover(surface, { position: points[1] });
      const tooltip = screen.getByRole("tooltip");
      await expect.element(tooltip).toBeVisible();
      await expect.element(tooltip).toHaveTextContent("Sep 8");
      await expect.element(tooltip).toHaveTextContent("Throughput");
      await expect.element(tooltip).toHaveTextContent("5");
      await expect.element(tooltip).toHaveTextContent("Velocity");
      await expect.element(tooltip).toHaveTextContent("3");

      await userEvent.unhover(surface);
      await expect.element(tooltip).not.toBeInTheDocument();

      // Quatro Tabs: os dois itens da Legend (focáveis — destaque de série por teclado) e o
      // IconButton "Chart options" do cabeçalho vêm antes do gráfico na ordem de foco.
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await userEvent.tab();
      await expect.element(surface).toHaveFocus();
      await expect.element(screen.getByRole("tooltip")).toBeVisible();
      await expect.element(screen.getByRole("tooltip")).toHaveTextContent("Sep 1");

      await userEvent.keyboard("{ArrowRight}");
      await expect.element(screen.getByRole("tooltip")).toHaveTextContent("Sep 8");
      await expect.element(screen.getByRole("tooltip")).toHaveTextContent("5");
      await expect.element(screen.getByRole("tooltip")).toHaveTextContent("3");

      await userEvent.keyboard("{Escape}");
      await expect.element(screen.getByRole("tooltip")).not.toBeInTheDocument();
    });

    it("BurnUpChart mostra o tooltip no hover com os valores de Scope, Started e Completed", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<BurnUpChart data={BURN_UP} label="Zynox OS progress" />);
      const surface = chartSurface(screen.container) as HTMLElement;
      // As três séries agora são Area (preenchimento em gradiente); qualquer uma dá as mesmas
      // coordenadas X, já que compartilham o eixo de tempo.
      const points = linePoints(screen.container, ".recharts-area-curve");

      expect(document.querySelector('[role="tooltip"]')).toBeNull();
      await userEvent.hover(surface, { position: points[1] });
      const tooltip = screen.getByRole("tooltip");
      await expect.element(tooltip).toBeVisible();
      await expect.element(tooltip).toHaveTextContent("Sep 8");
      await expect.element(tooltip).toHaveTextContent("Scope");
      await expect.element(tooltip).toHaveTextContent("Started");
      await expect.element(tooltip).toHaveTextContent("Completed");
      await expect.element(tooltip).toHaveTextContent("12");
      await expect.element(tooltip).toHaveTextContent("5");
      await expect.element(tooltip).toHaveTextContent("3");

      await userEvent.unhover(surface);
      await expect.element(tooltip).not.toBeInTheDocument();
    });
  });

  describe("Legend", () => {
    const items: LegendItem[] = [
      { key: "done", label: "Done", value: 4, colorVar: "--st-success" },
      { key: "started", label: "In Progress", value: 2, colorVar: "--st-warning" },
    ];

    it("renderiza swatch, rótulo e valor de cada item (nunca só a cor)", async () => {
      document.documentElement.dataset.theme = theme;
      // Escopo pelo `locator` (raiz = container deste render): o Recharts mantém um span de
      // medição de texto ("recharts_measurement_span") direto no body, fora do container, e uma
      // busca por texto sem escopo (screen.getByText) o pegaria junto.
      const screen = await render(<Legend items={items} />);
      await expect.element(screen.locator.getByText("Done")).toBeVisible();
      await expect.element(screen.locator.getByText("4")).toBeVisible();
      await expect.element(screen.locator.getByText("In Progress")).toBeVisible();
      await expect.element(screen.locator.getByText("2")).toBeVisible();
      expect(screen.container.querySelectorAll("svg")).toHaveLength(2);
      expect(await violations(screen.container)).toEqual([]);
    });

    it("com onToggleItem, o clique chama o callback e aria-pressed reflete o item ativo", async () => {
      document.documentElement.dataset.theme = theme;
      const onToggleItem = vi.fn();
      function Harness() {
        const [activeKey, setActiveKey] = useState<string | null>(null);
        return (
          <Legend
            items={items}
            activeKey={activeKey}
            onToggleItem={(key) => {
              onToggleItem(key);
              setActiveKey((current) => (current === key ? null : key));
            }}
          />
        );
      }
      const screen = await render(<Harness />);
      const doneButton = screen.getByRole("button", { name: "Done 4" });
      const startedButton = screen.getByRole("button", { name: "In Progress 2" });
      await expect.element(doneButton).toHaveAttribute("aria-pressed", "false");
      await expect.element(startedButton).toHaveAttribute("aria-pressed", "false");

      await doneButton.click();
      expect(onToggleItem).toHaveBeenCalledOnce();
      expect(onToggleItem).toHaveBeenCalledWith("done");
      await expect.element(doneButton).toHaveAttribute("aria-pressed", "true");
      await expect.element(startedButton).toHaveAttribute("aria-pressed", "false");

      await startedButton.click();
      expect(onToggleItem).toHaveBeenCalledTimes(2);
      await expect.element(doneButton).toHaveAttribute("aria-pressed", "false");
      await expect.element(startedButton).toHaveAttribute("aria-pressed", "true");
    });

    it("com onItemHover (sem onToggleItem), o foco/saída de foco dispara o mesmo destaque do hover", async () => {
      document.documentElement.dataset.theme = theme;
      const onItemHover = vi.fn();
      function Harness() {
        const [activeKey, setActiveKey] = useState<string | null>(null);
        return (
          <Legend
            items={items}
            activeKey={activeKey}
            onItemHover={(key) => {
              onItemHover(key);
              setActiveKey(key);
            }}
          />
        );
      }
      const screen = await render(<Harness />);
      const doneButton = screen.getByRole("button", { name: "Done 4" });
      const startedButton = screen.getByRole("button", { name: "In Progress 2" });
      // Sem onToggleItem, os itens não têm estado alternável: nunca aria-pressed.
      expect(doneButton.element()).not.toHaveAttribute("aria-pressed");

      await userEvent.tab();
      await expect.element(doneButton).toHaveFocus();
      expect(onItemHover).toHaveBeenCalledWith("done");
      // O item focado fica com opacidade plena; o outro esmaece (mesma classe do hover por
      // ponteiro) — destaque de teclado equivalente ao de mouse (achado da revisão, redesenho r2).
      expect(startedButton.element().querySelector("span")?.className).toContain(
        "opacity-inactive",
      );
      expect(doneButton.element().querySelector("span")?.className).not.toContain(
        "opacity-inactive",
      );

      await userEvent.tab();
      await expect.element(startedButton).toHaveFocus();
      expect(onItemHover).toHaveBeenCalledWith("started");
      expect(doneButton.element().querySelector("span")?.className).toContain("opacity-inactive");

      await userEvent.tab();
      await expect.element(startedButton).not.toHaveFocus();
      expect(onItemHover).toHaveBeenLastCalledWith(null);
    });

    it("StackedBarChart e LineChart não duplicam a legenda (só a externa do DS)", async () => {
      document.documentElement.dataset.theme = theme;
      // O Recharts também monta a própria `<Legend>` interna quando presente no gráfico; aqui só
      // a externa do DS (dados do componente) deve existir — sem `.recharts-legend-wrapper`.
      const stacked = await render(<StackedBarChart data={STACKED} label="Issues by status" />);
      expect(stacked.container.querySelector(".recharts-legend-wrapper")).toBeNull();
      const stackedLegend = stacked.container.querySelectorAll("ul");
      expect(stackedLegend).toHaveLength(1);
      expect(stackedLegend[0]?.textContent).toContain("Done");
      expect(stackedLegend[0]?.textContent).toContain("In Progress");

      const line = await render(
        <LineChart categories={LINE_CATEGORIES} series={LINE_SERIES} label="Throughput trend" />,
      );
      expect(line.container.querySelector(".recharts-legend-wrapper")).toBeNull();
      const lineLegend = line.container.querySelectorAll("ul");
      expect(lineLegend).toHaveLength(1);
      expect(lineLegend[0]?.textContent).toContain("Throughput");
      expect(lineLegend[0]?.textContent).toContain("Velocity");
    });
  });

  describe("Sparkline", () => {
    it("não renderiza nada com data vazio ou com 1 ponto", async () => {
      document.documentElement.dataset.theme = theme;
      const empty = await render(<Sparkline data={[]} />);
      expect(empty.container.querySelector("svg.recharts-surface")).toBeNull();

      const single = await render(<Sparkline data={[5]} />);
      expect(single.container.querySelector("svg.recharts-surface")).toBeNull();
    });

    it("renderiza um span aria-hidden com svg do Recharts para dados válidos", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<Sparkline data={[3, 5, 2, 8]} />);
      const span = screen.container.querySelector("span");
      expect(span).not.toBeNull();
      expect(span).toHaveAttribute("aria-hidden", "true");
      expect(span?.querySelector("svg.recharts-surface")).not.toBeNull();
    });
  });

  describe("HealthBadge", () => {
    it.each(["on-track", "at-risk", "off-track", "none"] as Health[])(
      "mostra o rótulo em texto para health=%s e passa no axe",
      async (health) => {
        document.documentElement.dataset.theme = theme;
        const screen = await render(<HealthBadge health={health} />);
        const labels: Record<Health, string> = {
          "on-track": "On track",
          "at-risk": "At risk",
          "off-track": "Off track",
          none: "No updates",
        };
        await expect.element(screen.getByText(labels[health])).toBeVisible();
        expect(await violations(screen.container)).toEqual([]);
      },
    );
  });

  describe("axe-core", () => {
    it("BurnUpChart sem violações, com o gráfico e com a tabela alternativa", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<BurnUpChart data={BURN_UP} label="Zynox OS progress" />);
      expect(await violations(screen.container)).toEqual([]);
      await selectChartMenuItem(screen, "View as table");
      expect(await violations(screen.container)).toEqual([]);
    });

    it("StackedBarChart sem violações, com o gráfico e com a tabela alternativa", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<StackedBarChart data={STACKED} label="Issues by status" />);
      expect(await violations(screen.container)).toEqual([]);
      await selectChartMenuItem(screen, "View as table");
      expect(await violations(screen.container)).toEqual([]);
    });

    it("LineChart sem violações, com o gráfico e com a tabela alternativa", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(
        <LineChart categories={LINE_CATEGORIES} series={LINE_SERIES} label="Throughput trend" />,
      );
      expect(await violations(screen.container)).toEqual([]);
      await selectChartMenuItem(screen, "View as table");
      expect(await violations(screen.container)).toEqual([]);
    });

    it("Sparkline sem violações", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(<Sparkline data={[1, 4, 2, 6, 3]} />);
      expect(await violations(screen.container)).toEqual([]);
    });
  });
});
