/**
 * StackedBarChart (sem frame no Figma — Insights do Linear hoje): barras empilhadas por
 * categoria, cor pelo tipo de dado (status ou paleta categórica).
 */
import {
  Alert,
  Skeleton,
  StackedBarChart,
  type StackedBarGroup,
} from "@zynox/design-system/components";
import { ComponentPage } from "../../kit/component-page";

const BY_STATUS: StackedBarGroup[] = [
  {
    key: "w1",
    label: "Sep 1",
    segments: [
      { key: "done", label: "Done", value: 2, colorVar: "--st-success" },
      { key: "started", label: "In Progress", value: 1, colorVar: "--st-warning" },
      { key: "backlog", label: "Backlog", value: 3, colorVar: "--fg-tertiary" },
    ],
  },
  {
    key: "w2",
    label: "Sep 8",
    segments: [
      { key: "done", label: "Done", value: 4, colorVar: "--st-success" },
      { key: "started", label: "In Progress", value: 2, colorVar: "--st-warning" },
      { key: "backlog", label: "Backlog", value: 2, colorVar: "--fg-tertiary" },
    ],
  },
  {
    key: "w3",
    label: "Sep 15",
    segments: [
      { key: "done", label: "Done", value: 5, colorVar: "--st-success" },
      { key: "started", label: "In Progress", value: 3, colorVar: "--st-warning" },
      { key: "backlog", label: "Backlog", value: 1, colorVar: "--fg-tertiary" },
    ],
  },
  {
    key: "w4",
    label: "Sep 22",
    segments: [
      { key: "done", label: "Done", value: 8, colorVar: "--st-success" },
      { key: "started", label: "In Progress", value: 2, colorVar: "--st-warning" },
      { key: "backlog", label: "Backlog", value: 0, colorVar: "--fg-tertiary" },
    ],
  },
];

const BY_ASSIGNEE: StackedBarGroup[] = [
  {
    key: "w1",
    label: "Sep 1",
    segments: [
      { key: "a1", label: "André", value: 3, colorVar: "--chart-1" },
      { key: "a2", label: "Mari", value: 2, colorVar: "--chart-2" },
      { key: "a3", label: "Léo", value: 1, colorVar: "--chart-3" },
    ],
  },
  {
    key: "w2",
    label: "Sep 8",
    segments: [
      { key: "a1", label: "André", value: 4, colorVar: "--chart-1" },
      { key: "a2", label: "Mari", value: 3, colorVar: "--chart-2" },
      { key: "a3", label: "Léo", value: 2, colorVar: "--chart-3" },
    ],
  },
  {
    key: "w3",
    label: "Sep 15",
    segments: [
      { key: "a1", label: "André", value: 2, colorVar: "--chart-1" },
      { key: "a2", label: "Mari", value: 4, colorVar: "--chart-2" },
      { key: "a3", label: "Léo", value: 3, colorVar: "--chart-3" },
    ],
  },
];

/** Simula o card de Insights em que o StackedBarChart vive no produto (sem frame no Figma —
 * Insights do Linear hoje): título, período e o total do período em destaque, como um stat tile
 * (skill dataviz, marks-and-anatomy.md). Não é um card novo do design system, só a composição da
 * tela. */
function InsightsCard({
  title,
  period,
  data,
  label,
}: {
  title: string;
  period: string;
  data: StackedBarGroup[];
  label: string;
}) {
  const total = data.at(-1)?.segments.reduce((sum, s) => sum + s.value, 0) ?? 0;
  return (
    <div className="w-full max-w-100 rounded-container border border-subtle bg-panel p-4">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-label-sm text-secondary">{title}</p>
          <p className="text-body-sm text-secondary">{period}</p>
        </div>
        <p className="text-body-lg text-primary tabular-nums">{total}</p>
      </div>
      <StackedBarChart data={data} label={label} />
    </div>
  );
}

function Showcase() {
  return (
    <div className="flex flex-col gap-6">
      <InsightsCard
        title="Issues by status"
        period="Last 4 weeks"
        data={BY_STATUS}
        label="Issues by status per week"
      />
      <InsightsCard
        title="Issues by assignee"
        period="Last 3 weeks"
        data={BY_ASSIGNEE}
        label="Issues by assignee per week"
      />
    </div>
  );
}

function States() {
  return (
    <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Default</p>
        <StackedBarChart data={BY_STATUS} label="Issues by status per week" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Empty</p>
        <StackedBarChart data={[]} label="Issues by status per week" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Loading</p>
        <div className="flex flex-col gap-3">
          <div className="flex gap-4">
            <Skeleton shape="line" className="w-16" />
            <Skeleton shape="line" className="w-16" />
          </div>
          <Skeleton shape="block" className="h-50" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Error</p>
        <Alert tone="danger" title="Couldn't load issues">
          Try again in a few moments.
        </Alert>
      </div>
    </div>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Stacked Bar Chart",
        description:
          "Barras empilhadas por categoria (issues por status, por ciclo). Sem frame no Figma: desenhado a partir do Insights do Linear hoje e das especificações de marca da skill dataviz.",
        whenToUse: [
          "Parte-todo por categoria ao longo do tempo (issues por status, por ciclo)",
          "Comparar composição entre grupos (por assignee, por label, por time)",
        ],
        whenNotToUse: [
          "Tendência de uma métrica ao longo do tempo: use LineChart",
          "Progresso de projeto com teto (Scope/Started/Completed): use BurnUpChart",
        ],
        playground: {
          preview: <Showcase />,
          controls: (
            <p className="text-body-sm text-secondary">
              A cor de cada segmento vem de <code>colorVar</code>: tokens de status para estado de
              workflow, --chart-1…8 para identidade livre — nunca embutida no componente.
            </p>
          ),
        },
        showcase: <Showcase />,
        states: <States />,
        themes: () => <Showcase />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Legend (swatch quadrado + rótulo) acima do gráfico, montada a partir dos segmentos do
            primeiro grupo — a única legenda (a interna do Recharts foi removida: duas legendas para
            os mesmos dados era ruído, achado da revisão de código), com um IconButton &quot;…&quot;
            discreto (tone=&quot;subtle&quot;) à direita, abrindo o menu com &quot;View as
            table&quot;. Sem dados (`data=[]`), o componente renderiza seu próprio EmptyState.
            Gráfico em Recharts (BarChart): cada barra cresce de uma única linha de base (eixo X sem
            linha nem tique); grade horizontal mínima (3 marcas do eixo Y oculto, skill dataviz,
            &quot;poucos ticks&quot;); segmentos com um traço de 2 px na cor da superfície entre si
            (skill dataviz, &quot;surface gap&quot;, via `stroke`/`strokeWidth` do Bar); só o
            segmento do topo tem os cantos arredondados (4 px) — segmentos internos não têm ponta
            livre. Espessura da barra até 24 px (maxBarSize). Passar o mouse numa série esmaece as
            outras (opacidade --opacity-inactive) e destaca o item correspondente na Legend; passar
            o mouse ou focar a coluna de uma barra mostra o tooltip com todos os segmentos daquela
            categoria (Tooltip `shared` por padrão do Recharts).
          </p>
        ),
        keyboard: [
          'Ordem de foco: Tab primeiro chega no IconButton "…" (cabeçalho), Tab de novo entra no gráfico — o accessibilityLayer do Recharts: ← → move entre categorias, Enter abre/fecha o tooltip, Esc fecha (perde o foco do marco).',
          'O IconButton "…" e o Menu são os primitivos existentes: Enter/Espaço abre o menu, Enter em "View as table" troca o gráfico pela tabela alternativa, com todos os valores.',
        ],
        accessibility: [
          "A tabela alternativa tem categoria × valor por segmento — nunca só o gráfico.",
          "A cor nunca é o único indicador de status: a legenda e a tabela sempre têm o rótulo em texto.",
        ],
        content: [
          "Rótulos de categoria curtos; rótulos de segmento vêm do domínio (status, nome).",
        ],
        dos: ["Use a mesma ordem de segmentos em todas as barras (a legenda deriva da primeira)"],
        donts: [
          "Não use a paleta categórica para estado de workflow (isso é --st-*)",
          "Não rotule cada segmento individualmente: prefira legenda + tooltip + tabela",
        ],
        usage: `import { StackedBarChart } from "@zynox/design-system/components";

<StackedBarChart
  label="Issues by status per week"
  data={[
    {
      key: "w1",
      label: "Sep 1",
      segments: [
        { key: "done", label: "Done", value: 2, colorVar: "--st-success" },
        { key: "started", label: "In Progress", value: 1, colorVar: "--st-warning" },
      ],
    },
  ]}
/>`,
        props: [
          { name: "data", type: "StackedBarGroup[]", description: "{ key, label, segments }[]." },
          {
            name: "StackedBarSegment",
            type: "{ key, label, value, colorVar }",
            description: "colorVar: variável CSS do token (status ou --chart-N).",
          },
          { name: "label", type: "string", description: "Nome acessível da tabela alternativa." },
        ],
        decisions: [
          {
            decision: "Cor por colorVar, nunca embutida no componente",
            rule: "spec Fase 9, item 5: status usa st-*, identidade livre usa --chart-1…8",
          },
          {
            decision: "Vão de 2 px entre segmentos, sem borda desenhada",
            rule: "skill dataviz, marks-and-anatomy.md (surface gap)",
          },
          {
            decision: "Tooltip por coluna (todos os segmentos daquela categoria)",
            rule: 'skill dataviz, interaction.md: "one tooltip, every series" (Tooltip shared do Recharts)',
          },
          {
            decision: "Miolo em Recharts (BarChart), atrás da API do StackedBarChart",
            rule: "ADR-0014 (decidido em 28/09, depois de uma primeira versão em SVG próprio)",
          },
          {
            decision:
              'Botão "Ver como tabela" trocado por IconButton "…" + Menu; grade reduzida a 3 marcas; hover esmaece as outras séries',
            rule: 'pedido do responsável (redesenho, VYZ-36 fase 2): "gráficos amadores" — botão de texto visível poluía a composição; skill dataviz, marks-and-anatomy.md e interaction.md ("poucos ticks", destaque de série no hover)',
          },
        ],
      }}
    />
  );
}
