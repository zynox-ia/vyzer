/**
 * Table: a lista de projetos (Figma 25:4964; seleção em 1:5330).
 */
import {
  Avatar,
  Checkbox,
  HealthBadge,
  ProjectIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type Health,
  type ProjectIconValue,
  type SortDirection,
} from "@zynox/design-system/components";
import {
  Icon,
  PriorityIcon,
  ProjectStatusIcon,
  type ProjectStatusType,
} from "@zynox/design-system/icons";
import { UserRound } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { PRIORITIES, PROJECTS, type Priority } from "../../kit/project-data";
import { StatesStack } from "../../kit/states";

type ProjectRow = {
  value: string;
  name: string;
  icon: ProjectIconValue;
  health: Health;
  priority: Priority;
  lead?: string;
  /** Data ISO (ordenação) e o texto curto. */
  target: string;
  targetLabel: string;
  issues: number;
  status: ProjectStatusType;
  statusLabel: string;
  progress: number;
};

const project = (value: string) => PROJECTS.find((p) => p.value === value)!;

const ROWS: ProjectRow[] = [
  {
    value: "plugga",
    name: project("plugga").label,
    icon: project("plugga").icon,
    health: "on-track",
    priority: "high",
    lead: "André Júnio",
    target: "2026-10-30",
    targetLabel: "Oct 30",
    issues: 24,
    status: "started",
    statusLabel: "In Progress",
    progress: 0.62,
  },
  {
    value: "zynox",
    name: project("zynox").label,
    icon: project("zynox").icon,
    health: "off-track",
    priority: "urgent",
    lead: "Marina Costa",
    target: "2026-10-15",
    targetLabel: "Oct 15",
    issues: 41,
    status: "started",
    statusLabel: "In Progress",
    progress: 0.35,
  },
  {
    value: "aname",
    name: project("aname").label,
    icon: project("aname").icon,
    health: "at-risk",
    priority: "medium",
    lead: "Rafael Brito",
    target: "2026-11-20",
    targetLabel: "Nov 20",
    issues: 12,
    status: "planned",
    statusLabel: "Planned",
    progress: 0,
  },
  {
    value: "mv",
    name: project("mv").label,
    icon: project("mv").icon,
    health: "none",
    priority: "low",
    target: "2026-12-05",
    targetLabel: "Dec 5",
    issues: 8,
    status: "backlog",
    statusLabel: "Backlog",
    progress: 0,
  },
  {
    value: "zyncloud",
    name: project("zyncloud").label,
    icon: project("zyncloud").icon,
    health: "on-track",
    priority: "none",
    lead: "Luiza Prado",
    target: "2026-09-30",
    targetLabel: "Sep 30",
    issues: 17,
    status: "completed",
    statusLabel: "Completed",
    progress: 1,
  },
];

type Column = "name" | "priority" | "target" | "issues" | "status";
type Sort = { column: Column; direction: SortDirection } | undefined;

const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low", "none"];

const compare: Record<Column, (a: ProjectRow, b: ProjectRow) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  priority: (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  target: (a, b) => a.target.localeCompare(b.target),
  issues: (a, b) => a.issues - b.issues,
  status: (a, b) => a.progress - b.progress,
};

function sortRows(rows: ProjectRow[], sort: Sort) {
  if (!sort) return rows;
  const sign = sort.direction === "asc" ? 1 : -1;
  return rows.toSorted((a, b) => compare[sort.column](a, b) * sign);
}

const priorityLabel = (p: Priority) => PRIORITIES.find((o) => o.value === p)!.label;

/** Células de uma linha de projeto (depois da coluna de seleção). */
function ProjectCells({
  row,
  onOpen,
  preview,
}: {
  row: ProjectRow;
  onOpen?: (name: string) => void;
  preview?: string;
}) {
  return (
    <>
      <TableCell>
        <button
          type="button"
          onClick={() => onOpen?.(row.name)}
          data-preview={preview}
          className="-mx-1 flex cursor-default items-center gap-2 rounded-control px-1 py-0.5 text-left text-label-md text-primary focus-ring"
        >
          <ProjectIcon value={row.icon} />
          <span className="whitespace-nowrap">{row.name}</span>
        </button>
      </TableCell>
      <TableCell>
        <span className="flex">
          <HealthBadge health={row.health} />
        </span>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <PriorityIcon priority={row.priority} />
          {priorityLabel(row.priority)}
        </span>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-2 whitespace-nowrap">
          {row.lead ? (
            <>
              <Avatar name={row.lead} size="sm" />
              <span className="text-primary">{row.lead}</span>
            </>
          ) : (
            <>
              <Icon icon={UserRound} />
              No lead
            </>
          )}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">{row.targetLabel}</TableCell>
      <TableCell className="text-right text-primary tabular-nums">{row.issues}</TableCell>
      <TableCell>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <ProjectStatusIcon type={row.status} progress={row.progress} label={row.statusLabel} />
          <span className="tabular-nums">{Math.round(row.progress * 100)}%</span>
        </span>
      </TableCell>
    </>
  );
}

function ProjectsTable({
  selectable = true,
  initialSelected = [],
  rows: source = ROWS,
}: {
  selectable?: boolean;
  initialSelected?: string[];
  rows?: ProjectRow[];
}) {
  const [sort, setSort] = useState<Sort>();
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [last, setLast] = useState<string>();
  const rows = sortRows(source, sort);

  const sortBy = (column: Column) => () =>
    setSort((current) =>
      current?.column === column && current.direction === "asc"
        ? { column, direction: "desc" }
        : { column, direction: "asc" },
    );
  const sortOf = (column: Column) => (sort?.column === column ? sort.direction : false);
  const all = selected.length === rows.length;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="overflow-x-auto">
        <Table label="Projects" className="min-w-max">
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-0">
                  <span className="flex items-center">
                    <Checkbox
                      aria-label="Select all projects"
                      checked={all ? true : selected.length > 0 ? "indeterminate" : false}
                      onCheckedChange={() => setSelected(all ? [] : rows.map((r) => r.value))}
                    />
                  </span>
                </TableHead>
              )}
              <TableHead sort={sortOf("name")} onSort={sortBy("name")}>
                Name
              </TableHead>
              <TableHead className="w-0">Health</TableHead>
              <TableHead className="w-0" sort={sortOf("priority")} onSort={sortBy("priority")}>
                Priority
              </TableHead>
              <TableHead className="w-0">Lead</TableHead>
              <TableHead className="w-0" sort={sortOf("target")} onSort={sortBy("target")}>
                Target date
              </TableHead>
              <TableHead className="text-right" sort={sortOf("issues")} onSort={sortBy("issues")}>
                Issues
              </TableHead>
              <TableHead className="w-0" sort={sortOf("status")} onSort={sortBy("status")}>
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isSelected = selected.includes(row.value);
              return (
                <TableRow key={row.value} selected={isSelected}>
                  {selectable && (
                    <TableCell>
                      <span className="flex items-center">
                        <Checkbox
                          aria-label={`Select ${row.name}`}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            setSelected((s) =>
                              checked === true
                                ? [...s, row.value]
                                : s.filter((v) => v !== row.value),
                            )
                          }
                        />
                      </span>
                    </TableCell>
                  )}
                  <ProjectCells row={row} onOpen={(name) => setLast(`Open ${name}`)} />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {(selectable || last) && (
        <p className="text-body-sm text-secondary" aria-live="polite">
          {selectable ? `${selected.length} selected` : ""}
          {last ? ` · ${last}` : ""}
        </p>
      )}
    </div>
  );
}

/** Uma linha estática num estado, com o cabeçalho. */
function StateTable({
  selected = false,
  rowPreview,
  namePreview,
}: {
  selected?: boolean;
  rowPreview?: string;
  namePreview?: string;
}) {
  const row = ROWS[0]!;
  return (
    <div className="overflow-x-auto">
      <Table
        label={`Projects, ${rowPreview ?? namePreview ?? (selected ? "selected" : "default")}`}
      >
        <TableBody>
          <TableRow selected={selected} data-preview={rowPreview}>
            <TableCell className="w-0">
              <span className="flex items-center">
                <Checkbox aria-label={`Select ${row.name}`} checked={selected} />
              </span>
            </TableCell>
            <ProjectCells row={row} preview={namePreview} />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function usePlayground() {
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [selectable, setSelectable] = useState<"yes" | "no">("yes");
  return {
    preview: (
      <div data-density={density} className="w-full">
        <ProjectsTable key={selectable} selectable={selectable === "yes"} />
      </div>
    ),
    controls: (
      <>
        <Field label="densidade">
          <Segmented
            label="densidade"
            value={density}
            onChange={setDensity}
            options={[
              { value: "comfortable", label: "padrão" },
              { value: "compact", label: "compacta" },
            ]}
          />
        </Field>
        <Field label="seleção">
          <Segmented
            label="seleção"
            value={selectable}
            onChange={setSelectable}
            options={[
              { value: "yes", label: "sim" },
              { value: "no", label: "não" },
            ]}
          />
        </Field>
        <p className="self-end text-body-sm text-secondary">
          Clique nos títulos para ordenar; ↑ ↓ andam na mesma coluna.
        </p>
      </>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Table",
        description:
          "Tabela de dados com colunas comparáveis, como a lista de projetos (Figma 25:4964): cabeçalho com ordenação, linhas de 44 px (36 no compacto), seleção por checkbox e hover e seleção como camadas no fundo.",
        whenToUse: [
          "Comparar itens por várias propriedades (projetos, membros, ciclos)",
          "Ordenar por coluna e marcar vários itens",
        ],
        whenNotToUse: [
          "Issues com chips e sem colunas fixas: use List Row",
          "Poucos pares rótulo e valor: use uma lista de propriedades",
        ],
        playground,
        showcase: <ProjectsTable initialSelected={["zynox", "aname"]} />,
        states: (
          <StatesStack
            states={[
              { label: "padrão", node: <StateTable /> },
              { label: "hover", node: <StateTable rowPreview="hover" /> },
              { label: "focus-visible (nome)", node: <StateTable namePreview="focus" /> },
              { label: "selecionada", node: <StateTable selected /> },
              { label: "selecionada + hover", node: <StateTable selected rowPreview="hover" /> },
            ]}
          />
        ),
        themes: () => (
          <ProjectsTable selectable={false} rows={ROWS.slice(0, 3)} initialSelected={[]} />
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Tabela nativa sem divisórias. Cabeçalho de 32 px com títulos de 12 px em text-secondary;
            os ordenáveis são pílulas de 24 px com hover no fundo, e a coluna ordenada fica em
            text-primary com a seta da direção. Linhas de h-row (44 px; 36 no compacto) com
            px-cell-x, raio 8 nas pontas; conteúdo de 12 px em text-secondary, com o nome em 13
            px/500 e contagens em algarismos tabulares, alinhadas à direita.
          </p>
        ),
        keyboard: [
          "Tab percorre a seleção, os títulos ordenáveis e os controles das células.",
          "Enter ou Espaço num título ordenam (asc, depois desc); no checkbox, marcam.",
          "↑ ↓ levam o foco ao controle da mesma coluna na linha de cima ou de baixo.",
        ],
        accessibility: [
          "Tabela nativa com nome (label); títulos com scope=col; a coluna ordenada tem aria-sort.",
          'A seleção é o Checkbox da linha, com nome ("Select Plugga OS"); o fundo bg-selected só reforça.',
          "Saúde, status e prioridade têm texto ou rótulo, não só cor.",
        ],
        content: [
          "Títulos curtos, com a primeira letra maiúscula (Target date).",
          "Números alinhados à direita; datas curtas (Oct 30).",
        ],
        dos: [
          "Guarde ordenação e seleção da tela nos search params",
          "Deixe ordenáveis só as colunas que fazem sentido comparar",
        ],
        donts: ["Não use a tabela para layout", "Não esconda a seleção só no hover"],
        usage: `import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zynox/design-system/components";

<Table label="Projects">
  <TableHeader>
    <TableRow>
      <TableHead sort={sort.name} onSort={() => sortBy("name")}>Name</TableHead>
      <TableHead>Health</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow selected={isSelected}>
      <TableCell className="text-label-md text-primary">Plugga OS</TableCell>
      <TableCell><HealthBadge health="on-track" /></TableCell>
    </TableRow>
  </TableBody>
</Table>`,
        props: [
          { name: "Table.label", type: "string", description: "Nome acessível da tabela." },
          {
            name: "TableHead.sort",
            type: '"asc" | "desc" | false',
            description: "Ordenação desta coluna (aria-sort e seta).",
          },
          {
            name: "TableHead.onSort",
            type: "() => void",
            description: "Torna o título um botão de ordenação.",
          },
          {
            name: "TableRow.selected",
            type: "boolean",
            default: "false",
            description: "Fundo bg-selected (a marcação é o Checkbox).",
          },
          {
            name: "TableHeader, TableBody, TableCell",
            type: "HTML",
            description: "thead, tbody e td com os estilos do sistema.",
          },
        ],
        decisions: [
          {
            decision: "Linhas de h-row (44 / 36 px) no lugar do passo de 48 do Figma",
            rule: "Tokens de densidade (ADR-0013: linhas de lista de 44 px); grid de 4",
          },
          {
            decision: "Seleção em bg-selected, sem o tom índigo do Figma",
            rule: "ADR-0013 (sem o acento do Linear); §12 estados como camadas",
          },
          {
            decision: "Hover e seleção pintados nas células (raio 8 nas pontas)",
            rule: "Fundo de tr não aceita raio; Figma 1:5413 (r8)",
          },
          {
            decision: "Checkbox sempre visível, não só no hover",
            rule: "Descoberta e alvo estável (§6); o Figma mostra só nas marcadas",
          },
          {
            decision: "↑ ↓ entre linhas na mesma coluna, sem virar grid",
            rule: "Spec VYZ-34 (tabela navegável); a semântica de tabela nativa continua",
          },
        ],
      }}
    />
  );
}
