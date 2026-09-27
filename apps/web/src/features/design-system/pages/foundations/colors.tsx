import { ContrastReport, SwatchGroup, type ContrastCheck, type Swatch } from "../../kit/color";
import { Code, Decisions, DocPage, DocSection, Prose } from "../../kit/doc";

const surfaces: Swatch[] = [
  { token: "bg-app", cssVar: "--bg-app", usage: "janela, calha" },
  { token: "bg-sidebar", cssVar: "--bg-sidebar", usage: "sidebar" },
  { token: "bg-panel", cssVar: "--bg-panel", usage: "conteúdo" },
  { token: "bg-surface", cssVar: "--bg-surface", usage: "cards, modal" },
  { token: "bg-subtle", cssVar: "--bg-subtle", usage: "cabeçalho de grupo" },
  { token: "bg-popover", cssVar: "--bg-popover", usage: "menus, popovers" },
  { token: "bg-input", cssVar: "--bg-input", usage: "campos" },
  { token: "bg-inverse", cssVar: "--bg-inverse", usage: "base do botão primário" },
  { token: "primary-stop-1", cssVar: "--primary-stop-1", usage: "degradê do primário (topo)" },
  { token: "primary-stop-2", cssVar: "--primary-stop-2", usage: "degradê do primário (meio)" },
  { token: "primary-stop-3", cssVar: "--primary-stop-3", usage: "degradê do primário (base)" },
];

const states: Swatch[] = [
  { token: "bg-hover", cssVar: "--bg-hover", usage: "hover (camada)" },
  { token: "bg-selected", cssVar: "--bg-selected", usage: "seleção (camada)" },
  { token: "bg-pressed", cssVar: "--bg-pressed", usage: "pressionado (camada)" },
];

const text: Swatch[] = [
  { token: "text-primary", cssVar: "--fg-primary", usage: "texto, controles ativos" },
  { token: "text-secondary", cssVar: "--fg-secondary", usage: "metadados, ícones" },
  { token: "text-tertiary", cssVar: "--fg-tertiary", usage: "desabilitado, decoração" },
  { token: "text-placeholder", cssVar: "--fg-placeholder", usage: "placeholder de campos" },
  { token: "text-accent", cssVar: "--accent-text", usage: "contadores de destaque" },
];

const borders: Swatch[] = [
  { token: "border-subtle", cssVar: "--line-subtle", usage: "divisórias" },
  { token: "border-default", cssVar: "--line-default", usage: "cards, modal" },
  { token: "border-strong", cssVar: "--line-strong", usage: "popovers" },
  { token: "border-control", cssVar: "--line-control", usage: "campos e controles" },
  { token: "border-control-hover", cssVar: "--line-control-hover", usage: "hover de controles" },
  { token: "accent (foco)", cssVar: "--accent", usage: "foco, item ativo" },
];

const status: Swatch[] = ["success", "info", "warning", "danger"].map((s) => ({
  token: s,
  cssVar: `--st-${s}`,
  usage: `ícone; texto de badge: ${s}-strong`,
}));

const HUES = [
  "green",
  "blue",
  "amber",
  "red",
  "purple",
  "pink",
  "cyan",
  "orange",
  "lime",
  "indigo",
];

const hues: Swatch[] = HUES.map((h, i) => ({
  token: `${h} · chart-${i + 1}`,
  cssVar: `--hue-${h}`,
  usage: "labels e data viz",
}));

const textChecks: ContrastCheck[] = [
  { label: "text-primary", fg: "--fg-primary", target: 4.5, apca: 75 },
  { label: "text-secondary", fg: "--fg-secondary", target: 4.5, apca: 60 },
  { label: "text-tertiary", fg: "--fg-tertiary", target: 3, apca: 30 },
  {
    label: "text-placeholder (em campos)",
    fg: "--fg-placeholder",
    target: 4.5,
    apca: 30,
    on: ["--bg-input", "--bg-panel", "--bg-surface", "--bg-sidebar", "--bg-hover"],
  },
  { label: "text-accent (contador)", fg: "--accent-text", target: 4.5, apca: 60 },
  {
    label: "text-inverse (botão primário)",
    fg: "--fg-inverse",
    target: 4.5,
    apca: 75,
    on: ["--bg-inverse", "--primary-stop-1", "--primary-stop-2", "--primary-stop-3"],
  },
];

const indicatorChecks: ContrastCheck[] = [
  { label: "Foco B (padrão): terracota 100%", fg: "--accent", target: 3 },
  { label: "Foco A: terracota 25%", fg: "--accent", fgAlpha: 0.25, target: 3 },
  { label: "Foco B sobre o botão primário", fg: "--accent", target: 3, on: ["--bg-inverse"] },
  { label: "border-control", fg: "--line-control", target: 3 },
  { label: "border-control-hover", fg: "--line-control-hover", target: 3 },
  {
    label: "border-default (hairline)",
    fg: "--line-default",
    on: ["--bg-app", "--bg-panel", "--bg-surface", "--bg-popover"],
    target: 1.2,
    apca: 15,
  },
  { label: "controle ativo (text-primary)", fg: "--fg-primary", target: 3 },
];

const iconChecks: ContrastCheck[] = [
  ...["success", "info", "warning", "danger"].map((s) => ({
    label: `ícone ${s}`,
    fg: `--st-${s}`,
    target: 3,
  })),
  ...HUES.map((h) => ({ label: `label ${h}`, fg: `--hue-${h}`, target: 3 })),
];

const badgeChecks: ContrastCheck[] = ["success", "info", "warning", "danger"].map((s) => ({
  label: `badge ${s}`,
  fg: `--st-${s}-text`,
  tintedBy: `--st-${s}`,
  target: 4.5,
  apca: 60,
}));

export function Page() {
  return (
    <DocPage
      title="Colors"
      description="Neutros quentes em dois temas, acento terracota mínimo e cores de status e labels em OKLCH. Todos os contrastes abaixo são medidos ao vivo neste navegador."
    >
      <DocSection
        title="Superfícies"
        description="Elevação no escuro é superfície mais clara, não sombra. No claro nenhuma superfície passa de #faf9f5; cards usam o creme mais escuro (#f0eee6) ou a hairline #d1cfc5."
      >
        <SwatchGroup swatches={surfaces} />
      </DocSection>

      <DocSection
        title="Estados como camadas"
        description="Hover, seleção e pressionado são camadas translúcidas: a mesma classe funciona sobre sidebar, painel, card ou popover. A seleção do claro (bege ou neutro quente) está em decisão na página QA."
      >
        <SwatchGroup swatches={states} />
      </DocSection>

      <DocSection title="Texto e ícones">
        <SwatchGroup swatches={text} />
      </DocSection>

      <DocSection title="Bordas e acento">
        <SwatchGroup swatches={borders} />
      </DocSection>

      <DocSection
        title="Status e labels"
        description="Mesmo L por tema (escuro 0,72; claro 0,55) e o maior C que cabe na gama sRGB (até 0,15), variando o matiz. Cor nunca é o único indicador: status sempre vem com ícone de forma própria."
      >
        <SwatchGroup swatches={status} />
        <SwatchGroup swatches={hues} />
      </DocSection>

      <DocSection
        title="Contraste de texto"
        description="WCAG contra a pior superfície da lista (aprovação) e APCA no escuro (qualidade). text-tertiary não é texto de leitura: fica em desabilitado e decoração, com meta de 3:1."
      >
        <ContrastReport checks={textChecks} />
      </DocSection>

      <DocSection
        title="Foco e controles"
        description={
          <>
            Indicadores e bordas de controle precisam de 3:1. O foco A (borda a 25%) é medido para
            comparação: se não atingir 3:1, o padrão é o B. A hairline é decorativa; a meta dela é
            só ser percebida (APCA ≥ 15). Troque a variante na toolbar e navegue com{" "}
            <Code>Tab</Code>.
          </>
        }
      >
        <ContrastReport checks={indicatorChecks} />
      </DocSection>

      <DocSection title="Ícones de status e labels" description="Componentes não textuais: 3:1.">
        <ContrastReport checks={iconChecks} />
      </DocSection>

      <DocSection
        title="Badges"
        description="Texto do badge sobre o fundo da própria cor a 15%. No claro o texto usa um tom mais escuro do mesmo matiz (success-strong etc.) para chegar a 4,5:1."
      >
        <ContrastReport checks={badgeChecks} />
      </DocSection>

      <Prose>
        <p>
          Para medir fora do navegador: <Code>node docs/design/palette-contrast.mjs</Code>.
        </p>
      </Prose>

      <Decisions
        items={[
          {
            decision: "Texto de leitura ≥ 4,5:1 contra a pior superfície, nos dois temas",
            rule: "§3 Contraste (WCAG 2.2, 1.4.3)",
          },
          {
            decision: "No escuro, text-primary com meta APCA Lc 75 e text-secondary Lc 60",
            rule: "§3 APCA: corpo ≥ 75, UI secundário ≥ 60",
          },
          {
            decision: "Foco, bordas de controle, ícones e labels ≥ 3:1",
            rule: "§3 componentes não textuais; §12 foco ≥ 3:1",
          },
          {
            decision: "Hover 4%, seleção 7–8% e pressionado 10% como camadas translúcidas",
            rule: "§12 estados como camadas (ex.: 4% e 7%)",
          },
          {
            decision:
              "Status e labels com o mesmo L por tema, C até 0,15 dentro da gama, matizes ≥ 25° entre vizinhos",
            rule: "§3 paleta em OKLCH; ADR-0013",
          },
          {
            decision: "Acento terracota só em foco, item ativo da sidebar e contadores",
            rule: "§3 orçamento de ênfase (< 5% da área); ADR-0012",
          },
          {
            decision:
              "Texto mais claro #faf9f5, nunca branco puro; fundo mais escuro #0a0a09, nunca preto",
            rule: "§3 tema escuro",
          },
        ]}
      />
    </DocPage>
  );
}
