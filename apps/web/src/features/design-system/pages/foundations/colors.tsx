import { ContrastReport, SwatchGroup, type ContrastCheck, type Swatch } from "../../kit/color";
import { Code, Decisions, DocPage, DocSection, DocTable, Prose } from "../../kit/doc";

/** Fase 9 (VYZ-36), redesenho r2: traços de gráfico aprovados pelo responsável em 28/09, agora
 * tokens em `theme.css` — os componentes usam `style={{ strokeWidth: "var(--chart-line-width)" }}`
 * (ver `packages/design-system/src/lib/chart-geometry.ts` para o porquê do `style`, não atributo). */
const chartStrokeTokens: [string, string, string][] = [
  ["--chart-line-width", "1.5px", "Traço das linhas/áreas do BurnUpChart e do LineChart"],
  ["--chart-sparkline-width", "1.25px", 'Traço das duas linhas da Sparkline (variant="line")'],
  ["--chart-sparkline-bar-radius", "1px", 'Raio do topo da barra da Sparkline (variant="bar")'],
  [
    "--chart-weekend-hatch-width",
    "3px",
    "Espessura da linha da hachura de fim de semana do BurnUpChart",
  ],
];

const surfaces: Swatch[] = [
  { token: "bg-app", cssVar: "--bg-app", usage: "janela, calha" },
  { token: "bg-sidebar", cssVar: "--bg-sidebar", usage: "sidebar" },
  { token: "bg-panel", cssVar: "--bg-panel", usage: "conteúdo" },
  { token: "bg-surface", cssVar: "--bg-surface", usage: "cards, modal" },
  { token: "bg-subtle", cssVar: "--bg-subtle", usage: "cabeçalho de grupo" },
  { token: "bg-popover", cssVar: "--bg-popover", usage: "menus, popovers" },
  { token: "bg-input", cssVar: "--bg-input", usage: "campos" },
  { token: "bg-inverse", cssVar: "--bg-inverse", usage: "base do botão primário" },
  { token: "bg-primary-button", cssVar: "--bg-primary-button", usage: "botão primário (chapado)" },
  {
    token: "bg-primary-button-hover",
    cssVar: "--bg-primary-button-hover",
    usage: "hover do botão primário",
  },
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
  { token: "text-nav-idle", cssVar: "--fg-nav", usage: "item de nav não selecionado (sidebar)" },
];

const borders: Swatch[] = [
  { token: "border-subtle", cssVar: "--line-subtle", usage: "divisórias" },
  { token: "border-default", cssVar: "--line-default", usage: "cards, modal" },
  { token: "border-strong", cssVar: "--line-strong", usage: "popovers" },
  { token: "border-control", cssVar: "--line-control", usage: "checkbox, radio, switch" },
  { token: "border-control-hover", cssVar: "--line-control-hover", usage: "hover de controles" },
  { token: "border-field", cssVar: "--line-field", usage: "input, text area, select" },
  {
    token: "border-field-hover · -focus",
    cssVar: "--line-field-active",
    usage: "hover e foco de campos",
  },
  { token: "accent", cssVar: "--accent", usage: "item ativo da sidebar, contadores" },
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

const hues: Swatch[] = HUES.map((h) => ({
  token: h,
  cssVar: `--hue-${h}`,
  usage: "labels (Select, Label Picker, Color Dot)",
}));

/* Paleta categórica de dados (VYZ-36): 8 tokens, ordem fixa (skill dataviz). Vermelho fica fora
 * (reservado a status) e ciano fica fora (não encaixa sem derrubar o pior par de separação). */
const CHART_ORDER = [
  "indigo",
  "amber",
  "pink",
  "lime",
  "blue",
  "green",
  "purple",
  "orange",
] as const;

const chartHues: Swatch[] = CHART_ORDER.map((h, i) => ({
  token: `chart-${i + 1} · ${h}`,
  cssVar: `--chart-${i + 1}`,
  usage: "identidade livre em gráficos (assignee, label, time)",
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
  {
    label: "text-accent (contador, item ativo da sidebar)",
    fg: "--accent-text",
    target: 4.5,
    apca: 60,
  },
  {
    label: "text-nav-idle (item de nav não selecionado)",
    fg: "--fg-nav",
    target: 4.5,
    apca: 60,
    on: ["--bg-app"],
  },
  {
    label: "text-inverse (botão primário)",
    fg: "--fg-inverse",
    target: 4.5,
    apca: 75,
    on: ["--bg-inverse", "--bg-primary-button", "--bg-primary-button-hover"],
  },
];

const indicatorChecks: ContrastCheck[] = [
  { label: "border-control", fg: "--line-control", target: 3 },
  { label: "border-control-hover", fg: "--line-control-hover", target: 3 },
  { label: "border-field (Figma 13:2010)", fg: "--line-field", target: 3 },
  // Foco de todo o sistema (decisão do responsável) = hover e foco de campo
  { label: "foco e hover de campo", fg: "--line-field-active", target: 3 },
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

const chartChecks: ContrastCheck[] = CHART_ORDER.map((h, i) => ({
  label: `chart-${i + 1} · ${h}`,
  fg: `--chart-${i + 1}`,
  target: 3,
}));

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
        title="Paleta categórica de dados"
        description={
          <>
            Fundação da Fase 9 (Data Visualization): 8 tokens <Code>--chart-1</Code> a{" "}
            <Code>--chart-8</Code>, ordem fixa indigo·amber·pink·lime·blue·green·purple·orange —
            nunca cicle nem reordene. Vermelho fica reservado a status; ciano fica fora da rotação
            (não encaixa sem derrubar o pior par). Uso só em <Code>fill-chart-*</Code> e{" "}
            <Code>stroke-chart-*</Code> (SVG), nunca em estado de workflow — isso são os tokens{" "}
            <Code>st-*</Code> de Status e labels, acima. No claro reaproveita{" "}
            <Code>--hue-*-light</Code> sem alteração; no escuro usa 8 primitivos novos com L 0,66 (a
            faixa recomendada de paleta categórica no escuro), em vez de L 0,72 dos ícones de
            status/labels — ver Decisões, abaixo. Validado sem nenhum FAIL pelo{" "}
            <Code>validate_palette.js</Code> da skill dataviz, nos dois temas.
          </>
        }
      >
        <SwatchGroup swatches={chartHues} />
      </DocSection>

      <DocSection
        title="Traços de gráfico"
        description={
          <>
            Fase 9 (VYZ-36), redesenho r2: 4 tokens de espessura de traço, aprovados pelo
            responsável em 28/09, medidos no Linear real. Ficam em <Code>theme.css</Code> (não
            variam por tema). SVG só resolve <Code>var()</Code> dentro de <Code>style</Code>, nunca
            num atributo de apresentação — os componentes passam a espessura pelo <Code>style</Code>{" "}
            do elemento (ex.: <Code>strokeWidth: "var(--chart-line-width)"</Code>
            ), nunca pelo atributo <Code>strokeWidth</Code> direto.
          </>
        }
      >
        <DocTable
          caption="Tokens de espessura de traço dos gráficos"
          columns={["Token", "Valor", "Papel"]}
          rows={chartStrokeTokens.map(([token, value, role]) => [
            <Code key={token}>{token}</Code>,
            value,
            role,
          ])}
        />
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
            Indicadores e bordas de controle precisam de 3:1. O foco é a linha de campo em todo o
            sistema, por decisão do responsável, e fica abaixo dessa meta: a medição fica aqui para
            acompanhar. A hairline é decorativa; a meta dela é só ser percebida (APCA ≥ 15). Navegue
            com <Code>Tab</Code> para ver o foco.
          </>
        }
      >
        <ContrastReport checks={indicatorChecks} />
      </DocSection>

      <DocSection title="Ícones de status e labels" description="Componentes não textuais: 3:1.">
        <ContrastReport checks={iconChecks} />
      </DocSection>

      <DocSection
        title="Paleta categórica de dados"
        description="Traços e preenchimentos de gráfico são componentes não textuais: 3:1, como ícones."
      >
        <ContrastReport checks={chartChecks} />
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
            decision:
              "Paleta categórica: 8 tokens (não 10), vermelho e ciano fora da rotação, ordem indigo·amber·pink·lime·blue·green·purple·orange",
            rule: "skill dataviz (status reservado; ΔE de separação): a ordem antiga (10 hues 1:1) tinha pink↔orange em ΔE 15,0 (limite) e âmbar↔verde em ΔE 4,7 no claro (abaixo do piso 6)",
          },
          {
            decision: "8 primitivos novos só para o escuro (L 0,66, mesma matiz e croma do -dark)",
            rule: "faixa recomendada de paleta categórica no escuro é L 0,48–0,67 (skill dataviz); os -dark existentes (L 0,72) são para status/labels, cor única de significado fixo, não uma série",
          },
          {
            decision: "Acento terracota só em foco, item ativo da sidebar e contadores",
            rule: "§3 orçamento de ênfase (< 5% da área); ADR-0012",
          },
          {
            decision:
              "Testado e revertido, 28/09: text-selected (bege) no item ativo da sidebar, no lugar do acento — o responsável decidiu manter o terracota",
            rule: "ADR-0012, ADR-0013",
          },
          {
            decision:
              "Aprovado, 28/09: text-nav-idle (cinza quase neutro) nos itens de nav não selecionados da sidebar, no lugar do text-secondary global",
            rule: "ADR-0013 (Nav idle color)",
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
