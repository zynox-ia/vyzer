/**
 * ChartTooltip (sem desenho dedicado no Figma; reaproveita tooltipStyles do Tooltip existente;
 * ADR-0014): miolo visual que serve de `content` custom do Tooltip do Recharts.
 */
import { ChartTooltip } from "@vyzer/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

function Showcase() {
  return (
    <div className="flex items-center justify-center rounded-container border border-subtle bg-panel p-8">
      <ChartTooltip
        active
        label="Sep 14"
        rows={[
          { key: "scope", label: "Scope", value: 9 },
          { key: "started", label: "Started", value: 2, color: "var(--hue-amber)" },
          { key: "completed", label: "Completed", value: 1, color: "var(--hue-indigo)" },
        ]}
      />
    </div>
  );
}

function usePlayground() {
  const [active, setActive] = useState(true);
  return {
    preview: (
      <div className="flex items-center justify-center rounded-container border border-subtle bg-panel p-8">
        <ChartTooltip
          active={active}
          label="Cycle 14"
          rows={[
            { key: "created", label: "Created", value: 9, color: "var(--chart-1)" },
            { key: "completed", label: "Completed", value: 7, color: "var(--chart-5)" },
          ]}
        />
      </div>
    ),
    controls: (
      <Field label="active">
        <Segmented
          label="active"
          value={String(active)}
          onChange={(v) => setActive(v === "true")}
          options={[
            { value: "true", label: "active" },
            { value: "false", label: "inactive" },
          ]}
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
        title: "Chart Tooltip",
        description:
          "A aparência do Tooltip existente (tooltipStyles), servindo de conteúdo custom do Tooltip do Recharts (ADR-0014) — o Recharts posiciona, mostra e esconde (hover, foco por teclado via accessibilityLayer); este componente só renderiza o miolo.",
        whenToUse: [
          "Como `content` do Tooltip do Recharts, dentro de BurnUpChart, StackedBarChart ou LineChart",
        ],
        whenNotToUse: [
          "Rótulo curto de um controle fixo (botão, ícone): use Tooltip",
          "Como único jeito de ler um valor: a legenda e a tabela alternativa sempre têm os números",
        ],
        playground,
        showcase: <Showcase />,
        states: null,
        statesNote: "active (visível) e inactive (não renderiza nada). Sem outros estados.",
        themes: () => <Showcase />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Mesma superfície do Tooltip (tooltipStyles.content): raio de contêiner, borda forte,
            sombra sm. Título (data/categoria) em text-label-sm; cada linha tem um traço curto na
            cor da série (nunca uma caixa — a cor já vem resolvida do payload do Recharts, ex.
            &quot;var(--chart-1)&quot;), o valor em text-primary tabular-nums (a regra &quot;valores
            lideram&quot;) e o rótulo da série em text-secondary.
          </p>
        ),
        keyboard: [
          "Abre no foco de um marco quando o gráfico expõe um accessibilityLayer (Tab/setas do Recharts).",
          "Esc fecha: o gráfico que usa este componente tira o foco do marco (o Recharts zera a interação por teclado ao perder o foco).",
        ],
        accessibility: [
          'role="tooltip"; não intercepta clique (o Recharts controla o posicionamento e a exibição).',
          "O mesmo texto está sempre na tabela alternativa do gráfico — o tooltip nunca é a única fonte.",
        ],
        content: ["Título curto (data ou categoria); um valor por linha."],
        dos: [
          "Deixe o BurnUpChart, o StackedBarChart e o LineChart montarem o tooltip sozinhos — é assim que os três já usam este componente",
        ],
        donts: [
          "Não torne o tooltip interativo (para isso, Popover)",
          "Não o posicione você mesmo — isso é do Recharts",
          "Não importe o Recharts numa tela para montar um tooltip próprio (ADR-0014): use um dos três gráficos do DS",
        ],
        usage: `import { ChartTooltip } from "@vyzer/design-system/components";

<ChartTooltip
  active
  label="Sep 14"
  rows={[{ key: "scope", label: "Scope", value: 9 }]}
/>`,
        props: [
          {
            name: "active",
            type: "boolean",
            description:
              "Vem de `active` do Recharts; sem marco em foco/hover, nada é renderizado.",
          },
          {
            name: "label",
            type: "ReactNode",
            description: "Data ou categoria (o `label` do Recharts).",
          },
          {
            name: "rows",
            type: "ChartTooltipRow[]",
            description:
              "{ key, label, value, color? }[] — o BurnUpChart, o StackedBarChart e o LineChart já montam isso sozinhos a partir do payload do Recharts, internamente.",
          },
        ],
        decisions: [
          {
            decision: "Reaproveita tooltipStyles em vez de um novo estilo",
            rule: "AGENTS.md regra 1: reutilize o que já existe",
          },
          {
            decision: "Serve de `content` do Tooltip do Recharts, sem se posicionar sozinho",
            rule: "ADR-0014: o Recharts fica atrás dos componentes do DS; ele já resolve posição, hover e teclado",
          },
          {
            decision: "Valor em text-primary, rótulo em text-secondary",
            rule: 'skill dataviz, interaction.md: "values lead, labels follow"',
          },
        ],
      }}
    />
  );
}
