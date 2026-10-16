import {
  StatusIcon,
  type IconSize,
  type StatusTone,
  type StatusType,
} from "@zynox/design-system/icons";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { Code, DocTable } from "../../kit/doc";

const TYPES: { value: StatusType; label: string; example: string }[] = [
  { value: "triage", label: "Triage", example: "Triage" },
  { value: "backlog", label: "Backlog", example: "Backlog" },
  { value: "unstarted", label: "Unstarted", example: "Todo" },
  { value: "started", label: "Started", example: "In Progress" },
  { value: "completed", label: "Completed", example: "Done" },
  { value: "canceled", label: "Canceled", example: "Canceled" },
  { value: "duplicate", label: "Duplicate", example: "Duplicate" },
];

const SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];

const PROGRESS = [
  { value: "1", label: "1/6", n: 1 / 6 },
  { value: "2", label: "1/3", n: 1 / 3 },
  { value: "3", label: "1/2", n: 1 / 2 },
  { value: "4", label: "2/3", n: 2 / 3 },
  { value: "5", label: "5/6", n: 5 / 6 },
];

function usePlayground() {
  const [type, setType] = useState<StatusType>("started");
  const [tone, setTone] = useState<StatusTone | "default">("default");
  const [size, setSize] = useState<IconSize>("lg");
  const [progress, setProgress] = useState("2");
  const example = TYPES.find((t) => t.value === type)?.example ?? "";
  return {
    preview: (
      <span className="inline-flex items-center gap-1.5 text-body-md text-primary">
        <StatusIcon
          type={type}
          tone={tone === "default" ? undefined : tone}
          size={size}
          progress={PROGRESS.find((p) => p.value === progress)?.n}
        />
        {example}
      </span>
    ),
    controls: (
      <>
        <Field label="type">
          <Segmented label="type" value={type} onChange={setType} options={TYPES} />
        </Field>
        <Field label="tone">
          <Segmented
            label="tone"
            value={tone}
            onChange={setTone}
            options={["default", "neutral", "success", "info", "warning", "danger"].map((t) => ({
              value: t as StatusTone | "default",
              label: t,
            }))}
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
        <Field label="progress (started)">
          <Segmented label="progress" value={progress} onChange={setProgress} options={PROGRESS} />
        </Field>
      </>
    ),
  };
}

function Row({ type, example }: { type: StatusType; example: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-body-md text-primary">
      <StatusIcon type={type} />
      {example}
    </span>
  );
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Status icon",
        description:
          "Ícone do status de workflow de uma issue, com os desenhos exatos do Figma (nó 6:1543). Cada tipo tem forma própria: a cor nunca é o único indicador.",
        whenToUse: [
          "Ao lado do nome do status em listas, board, menus e detalhes da issue",
          "Em filtros e agrupamentos por status",
        ],
        whenNotToUse: [
          "Para estados de sistema (online, processando): use o Status Indicator da Fase 4",
          "Sozinho, sem o nome do status, quando não houver tooltip ou rótulo acessível",
        ],
        playground,
        showcase: (
          <DocTable
            caption="Tipos por tamanho"
            columns={["Tipo", ...SIZES]}
            rows={TYPES.map((t) => [
              t.label,
              ...SIZES.map((s) => <StatusIcon key={s} type={t.value} size={s} />),
            ])}
          />
        ),
        states: null,
        statesNote:
          "Não interativo: não tem hover, foco nem desabilitado. Quem recebe esses estados é o controle que o contém (item de menu, linha, botão).",
        themes: () => (
          <div className="flex flex-col gap-2">
            {TYPES.map((t) => (
              <Row key={t.value} type={t.value} example={t.example} />
            ))}
            <span className="inline-flex items-center gap-1.5 text-body-md text-primary">
              {PROGRESS.map((p) => (
                <StatusIcon key={p.value} type="started" progress={p.n} />
              ))}
              Progresso de started
            </span>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Desenho de 14 px centralizado num quadro de 16 px (como no Figma). Anel de 1,5 px para
            unstarted e started; setor preenchido a partir das 12 h para o progresso; círculo cheio
            com marca para triage, completed, canceled e duplicate; anel tracejado para backlog.
            Status de projeto usa outro ícone (Project status icon).
          </p>
        ),
        keyboard: ["Não recebe foco."],
        accessibility: [
          <>
            Decorativo por padrão (<Code>aria-hidden</Code>), porque o nome do status vem ao lado.
          </>,
          <>
            Sozinho, passe <Code>label</Code> (ex.: &quot;In Progress&quot;): vira{" "}
            <Code>role=&quot;img&quot;</Code> com nome acessível.
          </>,
          "Tons de status passam 3:1 contra todas as superfícies nos dois temas (Foundations → Colors).",
        ],
        content: ["O rótulo é o nome do status do Team (Backlog, Todo, In Progress, Done…)."],
        dos: ["Use o tom padrão do tipo", "Mostre o nome do status ao lado ou em tooltip"],
        donts: [
          "Não troque a forma para indicar outro significado",
          "Não use cor diferente da escala de status",
        ],
        usage: `import { StatusIcon } from "@zynox/design-system/icons";

<StatusIcon type="started" progress={1 / 3} />
<StatusIcon type="completed" label="Done" />`,
        props: [
          { name: "type", type: "StatusType", description: "Categoria de workflow (Linear)." },
          {
            name: "progress",
            type: "number",
            default: "1/3",
            description: "Só para started: fração do setor, 0 a 1.",
          },
          {
            name: "tone",
            type: "StatusTone",
            description:
              "Tom semântico; o padrão vem do tipo (started = warning, completed = success).",
          },
          {
            name: "size",
            type: "IconSize",
            default: '"sm"',
            description: "xs 12 · sm 16 · md 20 · lg 24 · xl 32.",
          },
          { name: "label", type: "string", description: "Rótulo acessível. Sem ele, decorativo." },
        ],
        decisions: [
          { decision: "Desenhos exatos do Figma", rule: "Figma nó 6:1543; triage em 22:1954" },
          { decision: "Uma forma por tipo", rule: "§3 cor nunca é o único indicador (WCAG 1.4.1)" },
          {
            decision: "16 px ao lado de texto de 13 px, gap 6 px",
            rule: "§10 tamanho e gap de ícone",
          },
          {
            decision: "Tons de status com 3:1 nos dois temas",
            rule: "§3 componentes não textuais",
          },
          {
            decision: "Círculos no quadro de 16 px, desenho de 14 px",
            rule: "§10 alinhamento óptico (Figma)",
          },
        ],
      }}
    />
  );
}
