import {
  ProjectStatusIcon,
  StatusIcon,
  type IconSize,
  type ProjectStatusType,
  type StatusType,
} from "@vyzer/design-system/icons";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { Code, DocTable } from "../../kit/doc";

const TYPES: { value: ProjectStatusType; label: string; examples: string }[] = [
  { value: "backlog", label: "Backlog", examples: "Backlog" },
  { value: "planned", label: "Planned", examples: "Planned" },
  { value: "started", label: "Started", examples: "Ready, In Progress" },
  { value: "completed", label: "Completed", examples: "Completed" },
  { value: "canceled", label: "Canceled", examples: "Canceled" },
];

/** O tipo de issue equivalente, para a comparação lado a lado. */
const ISSUE_TYPE: Record<ProjectStatusType, StatusType> = {
  backlog: "backlog",
  planned: "unstarted",
  started: "started",
  completed: "completed",
  canceled: "canceled",
};

const SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];

function usePlayground() {
  const [type, setType] = useState<ProjectStatusType>("started");
  const [size, setSize] = useState<IconSize>("lg");
  const label = TYPES.find((t) => t.value === type)?.label ?? "";
  return {
    preview: (
      <span className="inline-flex items-center gap-1.5 text-body-md text-primary">
        <ProjectStatusIcon type={type} size={size} />
        {label}
      </span>
    ),
    controls: (
      <>
        <Field label="type">
          <Segmented label="type" value={type} onChange={setType} options={TYPES} />
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

/** Projeto × issue na mesma linha: a diferença de forma e de tamanho. */
function Comparison() {
  return (
    <DocTable
      caption="Status de projeto e de issue"
      columns={["Tipo", "Projeto (ProjectStatusIcon)", "Issue (StatusIcon)"]}
      rows={TYPES.map((t) => [
        t.label,
        <span key="p" className="inline-flex items-center gap-1.5 text-primary">
          <ProjectStatusIcon type={t.value} />
          {t.examples}
        </span>,
        <span key="i" className="inline-flex items-center gap-1.5 text-primary">
          <StatusIcon type={ISSUE_TYPE[t.value]} />
          {ISSUE_TYPE[t.value]}
        </span>,
      ])}
    />
  );
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Project status icon",
        description:
          "Ícone do status de um projeto, com o desenho exato do Figma (22:1239, submenu Project status). Não é o ícone de status de issue: projeto é um hexágono na cor do status, com um hexágono interno preenchido pelo andamento; issue é um círculo.",
        whenToUse: [
          "Ao lado do nome do status do projeto: listas de projetos, filtros, New Project",
          "Em filtros e agrupamentos por status de projeto",
        ],
        whenNotToUse: [
          "Status de uma issue: use o Status icon",
          "Saúde do projeto (on track, at risk): use o Health Badge",
        ],
        playground,
        showcase: (
          <div className="flex flex-col gap-6">
            <Comparison />
            <DocTable
              caption="Tipos por tamanho"
              columns={["Tipo", ...SIZES]}
              rows={TYPES.map((t) => [
                t.label,
                ...SIZES.map((s) => <ProjectStatusIcon key={s} type={t.value} size={s} />),
              ])}
            />
          </div>
        ),
        states: null,
        statesNote:
          "Não interativo: não tem hover, foco nem desabilitado. Quem recebe esses estados é o controle que o contém (item de menu, linha, botão).",
        themes: () => (
          <div className="flex flex-col gap-2">
            {TYPES.map((t) => (
              <span
                key={t.value}
                className="inline-flex items-center gap-1.5 text-body-md text-primary"
              >
                <ProjectStatusIcon type={t.value} />
                {t.examples}
              </span>
            ))}
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Quadro de 16 px. Hexágono de 1,5 px do Figma (tracejado no backlog) e, dentro dele, um
            hexágono de 6 px que se enche em setor a partir das 12 h: vazio em backlog e planned,
            metade em started (ou o progress passado), cheio em completed e canceled. A cor vem do
            tipo (currentColor). O Status icon de issue é um círculo de 14 px no mesmo quadro.
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
          "Todos os tipos têm a mesma forma: o nome do status sempre acompanha o ícone (a cor não é o único indicador).",
        ],
        content: [
          "O rótulo é o nome do status do projeto (Backlog, Planned, Ready, In Progress, Completed, Canceled).",
        ],
        dos: ["Use o ícone de projeto para projeto e o de issue para issue"],
        donts: [
          "Não use o hexágono de projeto para status de issue, nem o círculo de issue para projeto",
        ],
        usage: `import { ProjectStatusIcon } from "@vyzer/design-system/icons";

<ProjectStatusIcon type="started" />
<ProjectStatusIcon type="completed" label="Completed" />`,
        props: [
          {
            name: "type",
            type: '"backlog" | "planned" | "started" | "completed" | "canceled"',
            description: "Tipo do status do projeto; define a cor.",
          },
          {
            name: "size",
            type: "IconSize",
            default: '"sm"',
            description: "xs 12 · sm 16 · md 20 · lg 24 · xl 32.",
          },
          {
            name: "progress",
            type: "number",
            description:
              "Fração do hexágono interno preenchida, 0 a 1. Padrão: 0 em backlog e planned, 1/2 em started, 1 em completed e canceled.",
          },
          { name: "label", type: "string", description: "Rótulo acessível. Sem ele, decorativo." },
          {
            name: "className",
            type: "string",
            description: 'Troca a cor (ex.: "text-secondary" nos tipos de status).',
          },
        ],
        decisions: [
          {
            decision:
              "Hexágono exato do Figma, visível (o disco de traço 8 recortado pelo hexágono interno)",
            rule: "Figma 22:1239, 22:1257, 22:1271, 22:1299, 22:1313",
          },
          {
            decision: "Hexágono no projeto, círculo na issue: a diferença é a forma",
            rule: "Figma 22:1218 (projeto) × 22:1933 (issue)",
          },
          {
            decision: "Cores na paleta do Vyzer: laranja, primário, warning, índigo e secundário",
            rule: "ADR-0013 (sem os hex do Linear), seguindo as matizes do Figma (#f2994a, #d7d8db, #f0bf00, #5e6ad2, #8a8f98)",
          },
          {
            decision: "Ready e In Progress com o mesmo ícone (tipo started)",
            rule: "Figma 22:1271 e 22:1285 (mesmo SVG)",
          },
        ],
      }}
    />
  );
}
