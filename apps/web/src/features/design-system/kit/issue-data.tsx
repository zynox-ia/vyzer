/**
 * Issues de exemplo das páginas de Data Display (lista agrupada de 1:7477, board de 1:8749,
 * sub-issues e atividade). Status, prioridades, projetos e labels vêm de project-data; os valores
 * são fixos, só para a documentação.
 */
import {
  Chip,
  ProgressRing,
  ProjectIcon,
  type IssueAssignee,
  type IssueValue,
} from "@vyzer/design-system/components";
import { Icon, PriorityIcon } from "@vyzer/design-system/icons";
import { OctagonMinus } from "lucide-react";
import {
  INITIAL_LABELS,
  PRIORITIES,
  PROJECT_STATUSES,
  PROJECTS,
  type Priority,
  type ProjectStatus,
} from "./project-data";

/** Pessoas do workspace (sem foto: o Avatar mostra o ícone de pessoa). */
export const PEOPLE: IssueAssignee[] = [
  { name: "André Júnio" },
  { name: "Marina Costa" },
  { name: "Rafael Brito" },
  { name: "Luiza Prado" },
  { name: "Caio Mendes" },
  { name: "Beatriz Lima" },
];

const person = (name: string) => PEOPLE.find((p) => p.name === name);

export function statusValue(value: ProjectStatus): IssueValue {
  const option = PROJECT_STATUSES.find((s) => s.value === value)!;
  return { label: option.label, icon: option.icon };
}

export function priorityValue(value: Priority): IssueValue {
  const option = PRIORITIES.find((p) => p.value === value)!;
  return { label: option.label, icon: option.icon };
}

export type SampleIssue = {
  id: string;
  title: string;
  status: ProjectStatus;
  priority: Priority;
  project?: string;
  labels?: string[];
  /** Sub-issues concluídas e total (chip "x/y" com anel). */
  subIssues?: { done: number; total: number };
  /** Quantas issues bloqueiam esta. */
  blockedBy?: number;
  assignee?: IssueAssignee;
  date: string;
};

export const ISSUES: SampleIssue[] = [
  {
    id: "ZYN-41",
    title: "Sync Linear webhooks with the issue feed",
    status: "blocked",
    priority: "urgent",
    project: "plugga",
    labels: ["bug"],
    blockedBy: 2,
    assignee: person("André Júnio"),
    date: "Sep 13",
  },
  {
    id: "ZYN-38",
    title: "Rate limit public API tokens",
    status: "blocked",
    priority: "high",
    project: "zynox",
    labels: ["feature"],
    blockedBy: 1,
    assignee: person("Marina Costa"),
    date: "Sep 12",
  },
  {
    id: "ZYN-35",
    title: "Email digest for inbox notifications",
    status: "verifying",
    priority: "medium",
    project: "mv",
    labels: ["improvement"],
    assignee: person("Rafael Brito"),
    date: "Sep 11",
  },
  {
    id: "ZYN-33",
    title: "Creation composer for new issues",
    status: "in-progress",
    priority: "high",
    project: "plugga",
    labels: ["feature"],
    assignee: person("André Júnio"),
    date: "Sep 10",
  },
  {
    id: "ZYN-31",
    title: "Keyboard navigation in lists and tables",
    status: "in-progress",
    priority: "medium",
    project: "zynox",
    labels: ["improvement", "feature"],
    assignee: person("Marina Costa"),
    date: "Sep 9",
  },
  {
    id: "ZYN-29",
    title: "Fix login redirect loop",
    status: "in-progress",
    priority: "urgent",
    project: "aname",
    labels: ["bug"],
    date: "Sep 8",
  },
  {
    id: "ZYN-27",
    title: "Workspace switcher",
    status: "backlog",
    priority: "low",
    project: "zyncloud",
    assignee: person("Luiza Prado"),
    date: "Sep 5",
  },
  {
    id: "ZYN-24",
    title: "Remove legacy tokens",
    status: "backlog",
    priority: "none",
    labels: ["improvement"],
    date: "Sep 2",
  },
];

/** Grupos da lista (Figma 1:7477: Blocked, Verifying, In Progress e um status cinza). */
export const GROUPS: ProjectStatus[] = ["blocked", "verifying", "in-progress", "backlog"];

export const issuesIn = (status: ProjectStatus) => ISSUES.filter((i) => i.status === status);

export const issueById = (id: string) => ISSUES.find((i) => i.id === id)!;

/**
 * Chips de valor da linha: progresso das sub-issues (x/y com anel), a relação "blocked by" com
 * contagem, projeto e labels.
 */
export function IssueChips({ issue }: { issue: SampleIssue }) {
  const project = PROJECTS.find((p) => p.value === issue.project);
  const sub = issue.subIssues;
  return (
    <>
      {sub && (
        <Chip
          icon={
            <ProgressRing
              value={sub.done}
              max={sub.total}
              label="Sub-issues done"
              className="size-3.5"
            />
          }
          label={`${sub.done} of ${sub.total} sub-issues done`}
        >
          {`${sub.done}/${sub.total}`}
        </Chip>
      )}
      {issue.blockedBy !== undefined && (
        <Chip
          icon={<Icon icon={OctagonMinus} className="text-danger" />}
          count={issue.blockedBy}
          label={`Blocked by ${issue.blockedBy} ${issue.blockedBy === 1 ? "issue" : "issues"}`}
        />
      )}
      {project && <Chip icon={<ProjectIcon value={project.icon} />}>{project.label}</Chip>}
      {issue.labels?.map((value) => {
        const label = INITIAL_LABELS.find((l) => l.value === value)!;
        return (
          <Chip key={value} color={label.color}>
            {label.label}
          </Chip>
        );
      })}
    </>
  );
}

/** Chips do cartão do board: a prioridade só com ícone vem primeiro (Figma 1:8881). */
export function CardChips({ issue }: { issue: SampleIssue }) {
  const priority = priorityValue(issue.priority);
  return (
    <>
      <Chip
        icon={<PriorityIcon priority={issue.priority} />}
        label={issue.priority === "none" ? priority.label : `${priority.label} priority`}
      />
      <IssueChips issue={issue} />
    </>
  );
}

/** Props de linha (IssueRow / IssueRowContent) a partir de uma issue de exemplo. */
export function rowProps(issue: SampleIssue) {
  return {
    identifier: issue.id,
    title: issue.title,
    priority: priorityValue(issue.priority),
    status: statusValue(issue.status),
    chips: <IssueChips issue={issue} />,
    assignee: issue.assignee,
    date: issue.date,
  };
}

/** Issue com sub-issues aninhadas (nó da Tree). */
export type SubIssue = SampleIssue & { value: string; children?: SubIssue[] };

const sub = (issue: SampleIssue, children?: SubIssue[]): SubIssue => ({
  ...issue,
  value: issue.id,
  children,
});

/** Sub-issues de ZYN-33, dois níveis abaixo da issue pai (contexto de issue do Command Menu). */
export const SUB_ISSUES: SubIssue[] = [
  sub(issueById("ZYN-33"), [
    sub({
      id: "ZYN-44",
      title: "New view form",
      status: "done",
      priority: "medium",
      assignee: person("Marina Costa"),
      date: "Sep 6",
    }),
    sub(
      {
        id: "ZYN-45",
        title: "New issue form",
        status: "in-review",
        priority: "high",
        assignee: person("André Júnio"),
        date: "Sep 9",
      },
      [
        sub({
          id: "ZYN-47",
          title: "Property buttons in the footer",
          status: "done",
          priority: "medium",
          assignee: person("André Júnio"),
          date: "Sep 8",
        }),
        sub({
          id: "ZYN-48",
          title: "Keep the draft when the composer closes",
          status: "in-progress",
          priority: "low",
          date: "Sep 9",
        }),
      ],
    ),
    sub({
      id: "ZYN-46",
      title: "New project form",
      status: "backlog",
      priority: "none",
      assignee: person("Caio Mendes"),
      date: "Sep 10",
    }),
  ]),
  sub(issueById("ZYN-31"), [
    sub({
      id: "ZYN-49",
      title: "Arrow keys in the table",
      status: "in-progress",
      priority: "medium",
      assignee: person("Marina Costa"),
      date: "Sep 9",
    }),
  ]),
];

/**
 * Árvore da página Tree (Figma 40:687, captura do Linear): VYZ-1 → VYZ-12 → VYZ-33, VYZ-30 e
 * VYZ-31. VYZ-13 vem depois de VYZ-12 para mostrar a vertical do avô atravessando os netos.
 */
export const NESTED_ISSUES: SubIssue[] = [
  sub(
    {
      id: "VYZ-1",
      title: "Foundation",
      status: "backlog",
      priority: "none",
      subIssues: { done: 2, total: 12 },
      blockedBy: 1,
      date: "Sep 26",
    },
    [
      sub(
        {
          id: "VYZ-12",
          title: "Design System",
          status: "in-progress",
          priority: "none",
          subIssues: { done: 0, total: 4 },
          date: "Sep 26",
        },
        [
          sub({
            id: "VYZ-33",
            title: "Composer de criação (New Issue, New Project, New view)",
            status: "in-review",
            priority: "none",
            assignee: person("André Júnio"),
            date: "Sep 27",
          }),
          sub({
            id: "VYZ-30",
            title: "Fase 2 — Base",
            status: "in-review",
            priority: "none",
            assignee: person("André Júnio"),
            date: "Sep 27",
          }),
          sub({
            id: "VYZ-31",
            title: "Fase 3 — Seleção e menus",
            status: "in-review",
            priority: "none",
            assignee: person("André Júnio"),
            date: "Sep 27",
          }),
        ],
      ),
      sub({
        id: "VYZ-13",
        title: "Authentication",
        status: "backlog",
        priority: "none",
        date: "Sep 26",
      }),
    ],
  ),
];

/** Valores de todos os itens com filhos: a árvore começa toda aberta, como no Linear. */
export function parentValues(nodes: SubIssue[]): string[] {
  return nodes.flatMap((node) =>
    node.children?.length ? [node.value, ...parentValues(node.children)] : [],
  );
}
