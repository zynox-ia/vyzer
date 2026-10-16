/**
 * LineChart + Legend (sem frame no Figma — Insights do Linear hoje): linhas de throughput/
 * velocidade multi-série, com legenda de texto + swatch + valor.
 */
import {
  Alert,
  Legend,
  LineChart,
  Skeleton,
  type LineSeries,
} from "@zynox/design-system/components";
import { ComponentPage } from "../../kit/component-page";

const CATEGORIES = ["Cycle 12", "Cycle 13", "Cycle 14", "Cycle 15", "Cycle 16"];

const THROUGHPUT: LineSeries[] = [
  { key: "created", label: "Created", colorVar: "--chart-1", values: [8, 10, 9, 12, 11] },
  { key: "completed", label: "Completed", colorVar: "--chart-5", values: [6, 7, 9, 8, 10] },
];

/** Simula o card de Insights em que o LineChart vive no produto (sem frame no Figma — Insights do
 * Linear hoje): título, período e o total do período em destaque, como um stat tile (skill
 * dataviz, marks-and-anatomy.md). Não é um card novo do design system, só a composição da tela. */
function InsightsCard() {
  const total = THROUGHPUT[1]?.values.at(-1) ?? 0;
  return (
    <div className="w-full max-w-100 rounded-container border border-subtle bg-panel p-4">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-label-sm text-secondary">Throughput</p>
          <p className="text-body-sm text-secondary">Last 5 cycles</p>
        </div>
        <p className="text-body-lg text-primary tabular-nums">{total}</p>
      </div>
      <LineChart categories={CATEGORIES} series={THROUGHPUT} label="Throughput per cycle" />
    </div>
  );
}

function Showcase() {
  return <InsightsCard />;
}

function States() {
  return (
    <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Default</p>
        <LineChart categories={CATEGORIES} series={THROUGHPUT} label="Throughput per cycle" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Empty</p>
        <LineChart categories={[]} series={THROUGHPUT} label="Throughput per cycle" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Loading</p>
        <div className="flex flex-col gap-3">
          <div className="flex gap-4">
            <Skeleton shape="line" className="w-20" />
            <Skeleton shape="line" className="w-20" />
          </div>
          <Skeleton shape="block" className="h-45" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Error</p>
        <Alert tone="danger" title="Couldn't load throughput">
          Try again in a few moments.
        </Alert>
      </div>
    </div>
  );
}

function LegendShowcase() {
  return (
    <div className="flex flex-col gap-4">
      <Legend
        items={[
          { key: "created", label: "Created", value: 11, colorVar: "--chart-1", mark: "line" },
          { key: "completed", label: "Completed", value: 10, colorVar: "--chart-5", mark: "line" },
        ]}
      />
      <Legend
        items={[
          { key: "done", label: "Done", colorVar: "--st-success" },
          { key: "started", label: "In Progress", colorVar: "--st-warning" },
        ]}
      />
    </div>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Line Chart",
        description:
          "Linhas de throughput/velocidade multi-série, com legenda e tooltip. Sem frame no Figma: desenhado a partir do Insights do Linear hoje e da skill dataviz.",
        whenToUse: [
          "Tendência de uma ou mais métricas ao longo do tempo (throughput, velocidade)",
          "Comparar até ~4 séries com identidade própria",
        ],
        whenNotToUse: [
          "Parte-todo por categoria: use StackedBarChart",
          "Progresso de projeto com teto: use BurnUpChart",
          "Mais de ~6 séries: pequenos múltiplos ou uma tabela",
        ],
        playground: {
          preview: <Showcase />,
          controls: (
            <p className="text-body-sm text-secondary">
              Passe o mouse ou use Tab sobre o gráfico: o Tooltip do Recharts é `shared` por padrão
              — uma posição X mostra o valor de todas as séries ali.
            </p>
          ),
        },
        showcase: <Showcase />,
        states: <States />,
        themes: () => <Showcase />,
        anatomy: (
          <div className="flex max-w-prose flex-col gap-3">
            <p className="text-body-md text-secondary">
              Legend (exportada à parte, reaproveitada por StackedBarChart): swatch (quadrado ou
              traço) + rótulo + valor, nunca só a cor — traço para séries de linha, quadrado para
              barras/áreas. Um IconButton &quot;…&quot; discreto (tone=&quot;subtle&quot;) à direita
              da Legend abre o menu com &quot;View as table&quot;.
            </p>
            <LegendShowcase />
            <p className="text-body-md text-secondary">
              Gráfico em Recharts (LineChart): linhas sem ponto em repouso, com marcador de 8 px
              (raio 4 e anel de 2 px na cor da superfície) só no ponto ativo. Grade horizontal
              mínima (3 marcas do eixo Y oculto), sem grade vertical (skill dataviz, &quot;poucos
              ticks&quot;). Passar o mouse numa linha esmaece as outras (opacidade
              --opacity-inactive) e destaca o item correspondente na Legend. O ChartTooltip lista o
              valor de cada série na posição ativa. Sem categorias (`categories=[]`), o componente
              renderiza seu próprio EmptyState.
            </p>
          </div>
        ),
        keyboard: [
          'Ordem de foco: Tab primeiro chega no IconButton "…" (cabeçalho), Tab de novo entra no gráfico — o accessibilityLayer do Recharts: ← → move entre datas, Enter abre/fecha o tooltip, Esc fecha (perde o foco do marco).',
          'O IconButton "…" e o Menu são os primitivos existentes: Enter/Espaço abre o menu, Enter em "View as table" troca o gráfico pela tabela alternativa (data × valor por série).',
        ],
        accessibility: [
          "A tabela alternativa tem data × valor por série — nunca só o gráfico.",
          "Legend nunca é só cor: cada item tem o rótulo em texto ao lado do swatch.",
        ],
        content: ["Rótulos de série curtos (nome do que está sendo medido)."],
        dos: ["Direct-label só o essencial (o valor final já aparece na legenda)"],
        donts: [
          "Não use um segundo eixo Y",
          "Não gere uma 9ª cor: agrupe em 'Other' ou pequenos múltiplos",
        ],
        usage: `import { LineChart, Legend } from "@zynox/design-system/components";

<LineChart
  label="Throughput per cycle"
  categories={["Cycle 12", "Cycle 13"]}
  series={[
    { key: "created", label: "Created", colorVar: "--chart-1", values: [8, 10] },
    { key: "completed", label: "Completed", colorVar: "--chart-5", values: [6, 7] },
  ]}
/>

<Legend items={[{ key: "created", label: "Created", value: 10, colorVar: "--chart-1", mark: "line" }]} />`,
        props: [
          { name: "categories", type: "string[]", description: "Rótulos do eixo X." },
          {
            name: "series",
            type: "LineSeries[]",
            description: "{ key, label, colorVar, values }[].",
          },
          { name: "label", type: "string", description: "Nome acessível da tabela alternativa." },
          {
            name: "Legend.items",
            type: "LegendItem[]",
            description: "{ key, label, value?, colorVar, mark? }[].",
          },
          {
            name: "Legend.onToggleItem",
            type: "(key: string) => void",
            description: "Isola uma série (fora do escopo desta fase; a API já permite).",
          },
        ],
        decisions: [
          {
            decision: "Legend exportada à parte de LineChart",
            rule: "Reaproveitada por StackedBarChart — evita duplicar a peça (AGENTS.md regra 1)",
          },
          {
            decision: "Um tooltip por posição X, com todas as séries",
            rule: 'skill dataviz, interaction.md: "one tooltip, every series"',
          },
          {
            decision: "Marcador de 8 px com anel de 2 px na cor da superfície",
            rule: "skill dataviz, marks-and-anatomy.md (marker + surface ring)",
          },
          {
            decision: "Miolo em Recharts (LineChart), atrás da API do LineChart do DS",
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
