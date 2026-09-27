import { PriorityIcon, type IconSize, type Priority } from "@vyzer/design-system/icons";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { Code, DocTable } from "../../kit/doc";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "none", label: "No priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];

function usePlayground() {
  const [priority, setPriority] = useState<Priority>("high");
  const [size, setSize] = useState<IconSize>("lg");
  return {
    preview: (
      <span className="inline-flex items-center gap-1.5 text-body-md text-primary">
        <PriorityIcon priority={priority} size={size} />
        {PRIORITIES.find((p) => p.value === priority)?.label}
      </span>
    ),
    controls: (
      <>
        <Field label="priority">
          <Segmented
            label="priority"
            value={priority}
            onChange={setPriority}
            options={PRIORITIES}
          />
        </Field>
        <Field label="size">
          <Segmented
            label="size"
            value={size}
            onChange={setSize}
            options={SIZES.map((s) => ({ value: s, label: s }))}
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
        title: "Priority icon",
        description:
          "Ícone de prioridade da issue, com os desenhos exatos do Figma (nó 1:935): barras para low, medium e high, traços para sem prioridade e um quadrado com exclamação para urgent.",
        whenToUse: ["Ao lado da prioridade em listas, board, menus e detalhes da issue"],
        whenNotToUse: ["Para severidade de alertas do sistema: use Alert (Fase 4)"],
        playground,
        showcase: (
          <DocTable
            caption="Prioridades por tamanho"
            columns={["Prioridade", ...SIZES]}
            rows={PRIORITIES.map((p) => [
              p.label,
              ...SIZES.map((s) => <PriorityIcon key={s} priority={p.value} size={s} />),
            ])}
          />
        ),
        states: null,
        statesNote: "Não interativo: os estados são do controle que o contém.",
        themes: () => (
          <div className="flex flex-col gap-2">
            {PRIORITIES.map((p) => (
              <span
                key={p.value}
                className="inline-flex items-center gap-1.5 text-body-md text-primary"
              >
                <PriorityIcon priority={p.value} />
                {p.label}
              </span>
            ))}
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Três barras de alturas crescentes; as inativas ficam a 40% (opacity-inactive). Urgent é
            o único com tom danger; as demais são neutras (text-secondary).
          </p>
        ),
        keyboard: ["Não recebe foco."],
        accessibility: [
          "Decorativo por padrão; o nome da prioridade vem ao lado.",
          <>
            Sozinho, passe <Code>label</Code> (ex.: &quot;High priority&quot;).
          </>,
          "Barras ativas passam 3:1; a diferença entre níveis vem do número de barras, não só da cor.",
        ],
        content: ["Rótulos do Linear: No priority, Urgent, High, Medium, Low."],
        dos: ["Mostre o nome ao lado ou em tooltip"],
        donts: ["Não pinte low/medium/high com cores de status"],
        usage: `import { PriorityIcon } from "@vyzer/design-system/icons";

<PriorityIcon priority="high" />
<PriorityIcon priority="urgent" label="Urgent" />`,
        props: [
          { name: "priority", type: "Priority", description: "none, urgent, high, medium ou low." },
          {
            name: "size",
            type: "IconSize",
            default: '"sm"',
            description: "xs 12 · sm 16 · md 20 · lg 24 · xl 32.",
          },
          { name: "label", type: "string", description: "Rótulo acessível. Sem ele, decorativo." },
        ],
        decisions: [
          { decision: "Desenhos exatos do Figma", rule: "Figma nó 1:935" },
          {
            decision: "Nível indicado pela quantidade de barras",
            rule: "§3 cor nunca é o único indicador",
          },
          { decision: "Só urgent usa cor (danger)", rule: "§3 orçamento de ênfase" },
          { decision: "Barras inativas a 40%", rule: "Figma (opacity-inactive)" },
        ],
      }}
    />
  );
}
