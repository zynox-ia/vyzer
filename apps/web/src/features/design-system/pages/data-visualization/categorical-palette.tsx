/**
 * Paleta categórica de dados (VYZ-36, item 4 da spec — fundação dos gráficos de identidade
 * livre). Os tokens (--chart-1…8) e a medição de contraste ao vivo estão em Foundations → Colors;
 * esta página mostra a ordem fixa em uso e o resultado da validação da skill dataviz.
 */
import {
  Legend,
  LineChart,
  type LegendItem,
  type LineSeries,
} from "@vyzer/design-system/components";
import { Link } from "react-router";
import { Code, DocPage, DocSection, DocTable, Prose } from "../../kit/doc";

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

const legendItems: LegendItem[] = CHART_ORDER.map((h, i) => ({
  key: `chart-${i + 1}`,
  label: `chart-${i + 1} · ${h}`,
  colorVar: `--chart-${i + 1}`,
}));

const CATEGORIES = ["Week 1", "Week 2", "Week 3", "Week 4"];
const series: LineSeries[] = CHART_ORDER.slice(0, 4).map((h, i) => ({
  key: h,
  label: h,
  colorVar: `--chart-${i + 1}`,
  values: [4 + i, 6 + i, 5 + i, 8 + i],
}));

const validation = [
  ["Faixa de luminosidade", "PASS", "PASS", "L 0,43–0,77 (claro) · 0,48–0,67 (escuro)"],
  [
    "Separação CVD (pares adjacentes)",
    "PASS — pior par ΔE 11,9",
    "PASS — pior par ΔE 13,1",
    "alvo ≥ 8, piso ≥ 6",
  ],
  [
    "Piso de visão normal",
    "PASS — pior par ΔE 18,1",
    "PASS — pior par ΔE 19,2",
    "piso rígido ≥ 15",
  ],
  ["Contraste com a superfície", "PASS — todos ≥ 3:1", "PASS — todos ≥ 3:1", "alvo ≥ 3:1"],
];

export function Page() {
  return (
    <DocPage
      title="Categorical palette"
      description="8 tokens de cor para identidade livre em gráficos (por assignee, por label, por time) — nunca para estado de workflow, que usa os tokens de status (st-*)."
    >
      <DocSection
        title="Ordem fixa"
        description="A ordem nunca é ciclada nem reordenada por tela: um leitor que vê chart-1 num gráfico e noutro sabe que é a mesma série."
      >
        <Legend items={legendItems} />
      </DocSection>

      <DocSection
        title="Em uso"
        description="As mesmas 4 primeiras cores, aplicadas a um LineChart de identidade livre (ver a página Line Chart para o componente completo)."
      >
        <div className="w-full max-w-100">
          <LineChart categories={CATEGORIES} series={series} label="Categorical series example" />
        </div>
      </DocSection>

      <DocSection
        title="Validação (skill dataviz)"
        description={
          <>
            <Code>node scripts/validate_palette.js "…" --mode light|dark</Code> nos 8 tokens, nos
            dois temas, contra as superfícies reais do Vyzer (<Code>#faf9f5</Code> claro,{" "}
            <Code>#141413</Code> escuro). Todos os 5 testes computáveis passam, sem nenhum FAIL — os
            valores de contraste e das primitivas estão em{" "}
            <Link to="/design-system/foundations/colors" className="text-accent underline">
              Foundations → Colors
            </Link>
            .
          </>
        }
      >
        <DocTable
          caption="Resultado do validate_palette.js"
          columns={["Teste", "Claro", "Escuro", "Meta"]}
          rows={validation}
        />
      </DocSection>

      <Prose>
        <p>
          Por que 8 e não 10: os <Code>--fill-chart-1…10</Code> antigos apontavam 1:1 para os
          matizes de status/labels (<Code>--hue-*</Code>), na mesma ordem deles. Isso colidia com
          status (<Code>--fill-chart-5</Code> era literalmente <Code>--hue-red</Code>, a cor do{" "}
          <Code>st-danger</Code>) e falhava a validação: pink↔orange em ΔE 15,0 (limite) e, no
          claro, âmbar↔verde em ΔE 4,7 (abaixo do piso 6). A nova ordem — indigo, amber, pink, lime,
          blue, green, purple, orange — reserva vermelho para status, deixa ciano fora da rotação
          (não encaixa sem derrubar o pior par) e passa com a maior margem entre as ordens testadas.
        </p>
      </Prose>
    </DocPage>
  );
}
