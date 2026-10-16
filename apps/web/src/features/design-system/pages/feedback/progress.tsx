/**
 * Progress (Figma 1:5161, 1:5137 e 1:6391 como referência geral): barra e anel sobre o Radix
 * Progress.
 */
import {
  ProgressBar,
  ProgressRing,
  type ProgressRingSize,
  type ProgressTone,
} from "@zynox/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

const TONES: ProgressTone[] = ["neutral", "success", "warning", "danger"];
const SIZES: ProgressRingSize[] = ["sm", "md", "lg", "xl"];

/** Anel de 16 px ao lado da porcentagem, como na lista de projetos (Figma 1:5161). */
function RingWithValue({ value, tone }: { value: number; tone?: ProgressTone }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-body-sm text-secondary tabular-nums">
      <ProgressRing value={value} tone={tone} label="Project progress" />
      {value}%
    </span>
  );
}

function Showcase() {
  return (
    <div className="flex w-full max-w-100 flex-col gap-6">
      <div className="flex flex-col gap-3">
        {TONES.map((tone, i) => (
          <ProgressBar key={tone} value={25 * (i + 1)} tone={tone} label={`Progress (${tone})`} />
        ))}
      </div>
      <div className="flex items-center gap-4">
        {SIZES.map((size) => (
          <ProgressRing key={size} value={60} size={size} label={`Progress (${size})`} />
        ))}
        <RingWithValue value={45} />
        <RingWithValue value={100} tone="success" />
      </div>
    </div>
  );
}

function usePlayground() {
  const [value, setValue] = useState("45");
  const [tone, setTone] = useState<ProgressTone>("neutral");
  const v = Number(value);
  return {
    preview: (
      <div className="flex w-full max-w-100 flex-col items-center gap-4">
        <ProgressBar value={v} tone={tone} label="Upload progress" />
        <RingWithValue value={v} tone={tone} />
      </div>
    ),
    controls: (
      <>
        <Field label="value">
          <Segmented
            label="value"
            value={value}
            onChange={setValue}
            options={["0", "20", "45", "80", "100"].map((n) => ({ value: n, label: n }))}
          />
        </Field>
        <Field label="tone">
          <Segmented
            label="tone"
            value={tone}
            onChange={setTone}
            options={TONES.map((t) => ({ value: t, label: t }))}
          />
        </Field>
      </>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Progress",
        description:
          "Quanto de uma tarefa já foi feito, com valor conhecido: barra para uploads e processos, anel ao lado de uma porcentagem (projetos, milestones).",
        whenToUse: [
          "Upload, importação ou processo com andamento medido",
          "Andamento de projeto ou milestone ao lado da porcentagem",
        ],
        whenNotToUse: [
          "Espera sem valor conhecido: use Spinner",
          "Carregar o layout de uma lista: use Skeleton",
          "Status de uma issue em andamento: use o Status icon",
        ],
        playground,
        showcase: <Showcase />,
        states: null,
        statesNote:
          "Vazio (0), em andamento e completo (100, em geral com o tom success). O preenchimento anima em 240 ms quando o valor muda. Sem valor (null), a barra pulsa e o anel gira; prefira o Spinner.",
        themes: () => <Showcase />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Barra: trilho de 4 px em pílula, na cor do tom a 15% (bg-*-subtle), com o preenchimento
            na cor cheia. Anel: quadro de 16 (raio 7, traço 2) nos tamanhos de ícone, trilho a 15% e
            arco a partir das 12 h, no sentido horário. Tom neutral em text-primary; os demais nas
            cores de status.
          </p>
        ),
        keyboard: ["Não recebe foco: é só leitura."],
        accessibility: [
          'Radix Progress: role="progressbar" com aria-valuenow, aria-valuemax e o valor em porcentagem (aria-valuetext).',
          "label é obrigatório: diz o que está progredindo.",
          "Preenchimento contra o trilho ≥ 3:1 (WCAG 1.4.11).",
        ],
        content: ["Mostre a porcentagem ou o que falta ao lado quando o número importa."],
        dos: ["Use success só quando completo", "Atualize o valor em passos visíveis"],
        donts: [
          "Não use o acento terracota (só sidebar e contadores)",
          "Não finja progresso sem medida",
        ],
        usage: `import { ProgressBar, ProgressRing } from "@zynox/design-system/components";

<ProgressBar value={45} label="Upload progress" />
<ProgressRing value={100} tone="success" label="Project progress" />`,
        props: [
          { name: "value", type: "number | null", description: "De 0 a max; null: indeterminado." },
          { name: "max", type: "number", default: "100", description: "Valor máximo." },
          { name: "label", type: "string", description: "Nome acessível." },
          {
            name: "tone",
            type: '"neutral" | "success" | "warning" | "danger"',
            default: '"neutral"',
            description: "Cor do preenchimento; trilho na mesma cor a 15%.",
          },
          {
            name: "ProgressRing.size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"sm"',
            description: "16, 20, 24 ou 32 px.",
          },
        ],
        decisions: [
          {
            decision: "Neutro em text-primary, sem o laranja do Figma (1:5161)",
            rule: "ADR-0013: controles e indicadores sem acento; tons de status só com significado",
          },
          {
            decision: "Trilho na cor do tom a 15%",
            rule: "A mesma mistura dos fundos de status (bg-*-subtle)",
          },
          {
            decision: "Anel no quadro de 16 dos ícones de status",
            rule: "Geometria do StatusIcon, escalada nos tamanhos de ícone",
          },
        ],
      }}
    />
  );
}
