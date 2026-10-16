/**
 * Sparkline (Figma 25:5437/25:5438, coluna Status da lista de projetos): tendência decorativa ao
 * lado de um valor textual.
 */
import { Sparkline, type SparklineVariant } from "@zynox/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

const TREND_UP = [4, 5, 4, 6, 7, 6, 8, 9, 8, 10, 11, 12];
const TREND_DOWN = [12, 11, 12, 10, 9, 10, 8, 7, 8, 6, 5, 4];
const VARIANTS: SparklineVariant[] = ["line", "bar"];

function Showcase() {
  return (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex items-center gap-6">
          <span className="w-24 text-body-sm text-secondary">{variant}</span>
          <span className="inline-flex items-center gap-2 text-body-md text-primary tabular-nums">
            <Sparkline data={TREND_UP} variant={variant} />
            33%
          </span>
          <span className="inline-flex items-center gap-2 text-body-md text-primary tabular-nums">
            <Sparkline data={TREND_DOWN} variant={variant} tone="danger" />
            8%
          </span>
          <span className="inline-flex items-center gap-2 text-body-md text-secondary">
            <Sparkline data={[]} variant={variant} />
            No data
          </span>
        </div>
      ))}
    </div>
  );
}

function usePlayground() {
  const [variant, setVariant] = useState<SparklineVariant>("line");
  return {
    preview: (
      <span className="inline-flex items-center gap-2 text-body-md text-primary tabular-nums">
        <Sparkline data={TREND_UP} variant={variant} />
        33%
      </span>
    ),
    controls: (
      <Field label="variant">
        <Segmented
          label="variant"
          value={variant}
          onChange={setVariant}
          options={VARIANTS.map((v) => ({ value: v, label: v }))}
        />
      </Field>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Sparkline",
        description:
          "Tendência decorativa em traço fino ou barras finas, sempre ao lado de um valor textual (Figma 25:5437/25:5438, coluna Status da lista de projetos).",
        whenToUse: ["Ao lado de um percentual ou métrica, para dar contexto de tendência"],
        whenNotToUse: [
          "Sozinho, sem o valor textual ao lado (a cor e a forma nunca são o único indicador)",
          "Como gráfico principal de uma seção: use LineChart",
        ],
        playground,
        showcase: <Showcase />,
        states: null,
        statesNote:
          'Vazio (menos de 2 pontos): nada é desenhado — o componente retorna null e só o valor textual ao lado fica visível. Carregando: use Skeleton (shape="line", um traço estreito no lugar). Erro: oculto, como o vazio.',
        themes: () => <Showcase />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Variant=&quot;line&quot;: duas linhas de 1,25 px sem ponto — uma reta do primeiro ao
            último valor em --hue-indigo (atrás) e o traço real dos dados em currentColor/tone (na
            frente), como a sparkline real da coluna Status do Linear. Variant=&quot;bar&quot;: um
            tom só, barras finas com o topo levemente arredondado. Sem eixo nem grade — Recharts em
            tamanho fixo (ADR-0014). Cor do traço da frente/das barras por tone, como o Progress
            (neutral, success, warning, danger).
          </p>
        ),
        keyboard: ["Não focável: aria-hidden sempre."],
        accessibility: [
          'aria-hidden="true" sempre — o par percentual + tendência (ex.: "33%") ao lado é o texto acessível.',
          "Nunca é o único indicador: sempre ao lado de um valor textual (WCAG 1.4.1).",
        ],
        content: ['O valor textual ao lado usa algarismos tabulares (ex.: "33%").'],
        dos: ["Use tone para ecoar o sentido do valor (danger numa queda relevante)"],
        donts: ["Não use Sparkline sem o valor textual ao lado", "Não adicione eixo ou grade"],
        usage: `import { Sparkline } from "@zynox/design-system/components";

<span className="inline-flex items-center gap-2">
  <Sparkline data={[4, 5, 4, 6, 7, 6, 8]} />
  33%
</span>`,
        props: [
          { name: "data", type: "number[]", description: "Série, do mais antigo ao mais recente." },
          {
            name: "variant",
            type: '"line" | "bar"',
            default: '"line"',
            description: "Traço contínuo ou barras finas.",
          },
          {
            name: "tone",
            type: '"neutral" | "success" | "warning" | "danger"',
            default: '"neutral"',
            description: "Cor do traço/barras (currentColor).",
          },
          { name: "width", type: "number", default: "32", description: "Largura em px." },
          { name: "height", type: "number", default: "16", description: "Altura em px." },
        ],
        decisions: [
          {
            decision: "Traço de 1,25 px, sem eixo nem grade",
            rule: "spec Fase 9, item 3; largura conferida contra a sparkline real do Linear (28/09)",
          },
          {
            decision:
              'Variant="line" em duotone: indigo (reta do 1º ao último valor) atrás do traço real',
            rule: "regra do responsável (28/09): a coluna Status do Linear real usa duas linhas sobrepostas; a segunda é a tendência linear dos mesmos dados, não uma métrica nova",
          },
          {
            decision:
              'Variante "bar": mesmo traço, raio de 1 px no topo (geometria SVG, na escala de 32×16)',
            rule: "Sem frame dedicado no Figma; radius-inline (4 px) desproporcional numa barra tão fina",
          },
          {
            decision: "Menos de 2 pontos: nada desenhado (null)",
            rule: 'spec "Estados": vazio fica oculto, mostra só o valor textual',
          },
          {
            decision:
              "Miolo em Recharts (LineChart/BarChart em tamanho fixo, sem ResponsiveContainer)",
            rule: "ADR-0014; elemento inline pequeno, sem eixo, legenda ou tooltip",
          },
        ],
      }}
    />
  );
}
