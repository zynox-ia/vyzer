/**
 * BurnUpChart (Figma 25:3040, card "Zynox OS › Overview"): progresso de projeto ou ciclo, três
 * séries de papel fixo.
 */
import { Alert, BurnUpChart, Skeleton, type BurnUpPoint } from "@zynox/design-system/components";
import { ComponentPage } from "../../kit/component-page";

const DATA: BurnUpPoint[] = [
  { date: "2026-09-01", scope: 3, started: 0, completed: 0 },
  { date: "2026-09-07", scope: 5, started: 1, completed: 0 },
  { date: "2026-09-14", scope: 9, started: 2, completed: 1 },
  { date: "2026-09-21", scope: 9, started: 3, completed: 1 },
  { date: "2026-09-28", scope: 9, started: 4, completed: 2 },
];

/** Simula o card "Progress" da sidebar do projeto (Figma 25:3040; medido ao vivo no Linear real
 * em 28/09, projeto Zynox OS: seção com rótulo, sem título extra) — o contexto de produto em que
 * o BurnUpChart vive, não um card novo do design system. */
function ProgressCard() {
  return (
    <div className="w-full max-w-100 rounded-container border border-subtle bg-panel p-4">
      <p className="mb-3 text-label-sm text-secondary">Progress</p>
      <BurnUpChart data={DATA} label="Zynox OS progress" />
    </div>
  );
}

function Showcase() {
  return <ProgressCard />;
}

function States() {
  return (
    <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Default</p>
        <BurnUpChart data={DATA} label="Zynox OS progress" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Empty</p>
        <BurnUpChart data={[]} label="Zynox OS progress" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Loading</p>
        <div className="flex flex-col gap-3">
          <div className="flex gap-6">
            <Skeleton shape="line" className="w-16" />
            <Skeleton shape="line" className="w-16" />
            <Skeleton shape="line" className="w-16" />
          </div>
          <Skeleton shape="block" className="h-50" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label-sm text-secondary">Error</p>
        <Alert tone="danger" title="Couldn't load progress">
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
        title: "Burn Up Chart",
        description:
          "Progresso de um projeto ou ciclo: Scope (teto, neutro), Started (--hue-amber) e Completed (--hue-indigo), as três com preenchimento em gradiente, com contagem na legenda (Figma 25:3040; conferido ao vivo contra o Linear).",
        whenToUse: [
          "Progresso de projeto no detalhe (card Progress, Figma 25:4689)",
          "Progresso de ciclo, quando a tela usar ciclos",
        ],
        whenNotToUse: [
          "Percentual isolado ao lado de um valor: use Sparkline",
          "Issues por categoria: use StackedBarChart",
        ],
        playground: {
          preview: <Showcase />,
          controls: (
            <p className="text-body-sm text-secondary">
              Papel fixo por série — sem opções de cor ou paleta (não é um gráfico de séries
              genéricas).
            </p>
          ),
        },
        showcase: <Showcase />,
        states: <States />,
        themes: () => <Showcase />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Legenda: quadrado de 6 px + rótulo (13 px) e a contagem em tabular-nums abaixo, própria
            do BurnUpChart (papel fixo, não a Legend genérica), com um IconButton &quot;…&quot;
            discreto (tone=&quot;subtle&quot;) à direita — abre o menu com &quot;View as
            table&quot;. Gráfico em Recharts (ComposedChart) com eixo X em escala de tempo real
            (`scale=&quot;time&quot;`): só **duas** marcas — início e fim reais do período (`ticks`
            explícito, não `tickCount`, para nunca esconder a data inicial), rótulo em 12 px
            (text-body-sm), sem linha nem marca de tique. Sem grade: medido ao vivo no card Progress
            real (28/09), as únicas &quot;gridlines&quot; do Linear são hairlines quase invisíveis,
            sem função de leitura. Hachura diagonal (padrão SVG, `bg-subtle`/`border-subtle`) cobre
            os sábados e domingos do período, atrás dos dados. As três séries são `Area` sólidas de
            1,5 px, com preenchimento em gradiente (0% → transparente, topo em `--opacity-subtle`);
            Started e Completed com ponto ativo no hover/foco, Scope sem ponto ativo.
          </p>
        ),
        keyboard: [
          'Ordem de foco: Tab primeiro chega no IconButton "…" (cabeçalho), Tab de novo entra no gráfico — o accessibilityLayer do Recharts: ← → move entre datas, Enter abre/fecha o tooltip no ponto ativo, Esc fecha (perde o foco do marco).',
          'O IconButton "…" e o Menu são os primitivos existentes: Enter/Espaço abre o menu, ↑ ↓ navega, Enter em "View as table" alterna para a tabela.',
        ],
        accessibility: [
          "A tabela alternativa (mesmo componente Table da Fase 9 de Data Display) tem os mesmos números: data × Scope × Started × Completed — nunca só o gráfico.",
          "Cor nunca é o único indicador: a legenda nomeia cada série por texto (Scope/Started/Completed) e a tabela alternativa tem os números — não dependem da cor da linha.",
        ],
        content: ['Rótulos de série curtos ("Scope", "Started", "Completed"), como no Linear.'],
        dos: ["Ordene os pontos do mais antigo ao mais recente"],
        donts: [
          "Não troque as cores fixas de Started/Completed pela paleta categórica",
          "Não use para séries genéricas (por assignee, por label) — para isso, LineChart",
        ],
        usage: `import { BurnUpChart } from "@zynox/design-system/components";

<BurnUpChart
  label="Zynox OS progress"
  data={[
    { date: "2026-09-01", scope: 3, started: 0, completed: 0 },
    { date: "2026-09-28", scope: 9, started: 4, completed: 2 },
  ]}
/>`,
        props: [
          {
            name: "data",
            type: "BurnUpPoint[]",
            description:
              "{ date, scope, started, completed }[], em ordem cronológica. date em ISO (AAAA-MM-DD): o eixo X e a tabela formatam para o rótulo curto.",
          },
          {
            name: "label",
            type: "string",
            description: "Nome acessível (usado na legenda da tabela alternativa).",
          },
        ],
        decisions: [
          {
            decision: "Cores fixas por papel (âmbar/índigo), não a paleta categórica",
            rule: 'spec Fase 9, item 1: "não é um componente de séries genéricas"',
          },
          {
            decision: "Miolo em Recharts, atrás da API do BurnUpChart",
            rule: "ADR-0014 (decidido em 28/09, depois de uma primeira versão em SVG próprio)",
          },
          {
            decision: "Animação de entrada desligada (isAnimationActive=false)",
            rule: "ADR-0014 permite desligar; a animação de desenho do Recharts 3.10 travava em 0% em alguns carregamentos",
          },
          {
            decision: "Gradiente nas três séries e hachura de fim de semana",
            rule: "regra do responsável (28/09): quando o Linear real mostra algo diferente da spec original, vale o Linear — conferido ao vivo no projeto Zynox OS",
          },
          {
            decision: "Opacidade do topo do gradiente em --opacity-subtle (token existente)",
            rule: "sem token novo — mesma camada usada em bg-*-subtle",
          },
          {
            decision:
              "Scope sólida, 1,5 px nas três séries, eixo X só com início e fim reais (ticks explícito + interval=0)",
            rule: "revisão de fidelidade em contexto limpo (achados objetivos, medidos contra o Linear ao vivo): a spec original ainda descrevia Scope tracejada e o Recharts com tickCount escondia a data inicial",
          },
          {
            decision:
              'Botão "Ver como tabela" trocado por IconButton "…" + Menu ("View as table", em inglês); grade removida; altura 160→200 px',
            rule: 'pedido do responsável (redesenho, VYZ-36 fase 2): "gráficos amadores" — botão de texto visível poluía a composição; medido ao vivo contra o card Progress real (28/09): sem grade de leitura, 200 px de altura total (132 de plotagem + eixo)',
          },
        ],
      }}
    />
  );
}
