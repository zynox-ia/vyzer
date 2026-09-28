/**
 * Dados de exemplo dos filtros da vista "Active issues" (Figma 18:353, 18:722, 18:930, 18:1130 e
 * os submenus de 22:2039), compartilhados pelas páginas Filter Menu, Display Options e Filter
 * Breakdown. Status de issue, prioridade, labels e projetos vêm de project-data; os valores que o
 * Figma não mostra seguem o Linear e servem só para a documentação.
 */
import {
  Avatar,
  ColorDot,
  ProjectIcon,
  type BreakdownGroup,
  type DisplayProperty,
  type FilterCategory,
  type ListOption,
} from "@vyzer/design-system/components";
import { Icon, PriorityIcon, ProjectStatusIcon, StatusIcon } from "@vyzer/design-system/icons";
import {
  Archive,
  ArrowLeftRight,
  Bell,
  Blend,
  Bot,
  Box,
  CalendarCheck,
  CalendarChevronsRight,
  CalendarPlus,
  CalendarSync,
  ChartNoAxesColumnIncreasing,
  CircleDashed,
  CircleSlash2,
  CircleX,
  Contrast,
  Diamond,
  Flag,
  GitMerge,
  Hexagon,
  Layers2,
  Link,
  ListTree,
  OctagonMinus,
  Package,
  PanelTop,
  Repeat,
  SquareArrowUpRight,
  SquareDashedMousePointer,
  SquareMinus,
  SquareMousePointer,
  StickyNote,
  Tag,
  Timer,
  Type,
  UserRound,
  UserRoundCog,
  UserRoundPen,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import {
  INITIAL_LABELS,
  PRIORITIES,
  PROJECTS,
  PROJECT_OPTIONS,
  PROJECT_STATUSES,
} from "./project-data";

const icon = (glyph: LucideIcon, className = "text-secondary") => (
  <Icon icon={glyph} className={className} />
);

const avatar = (name: string) => <Avatar name={name} size="sm" />;

const USERS: ListOption[] = [
  { value: "andre", label: "André Júnio", icon: avatar("André Júnio") },
  { value: "marina", label: "Marina Costa", icon: avatar("Marina Costa") },
];

/** Agentes (Figma 22:1745, 22:1762): avatar e a etiqueta "Agent" onde o Figma mostra. */
const AGENTS: ListOption[] = [
  { value: "codex", label: "Codex", icon: avatar("Codex") },
  { value: "cursor", label: "Cursor", icon: avatar("Cursor") },
];

const LABEL_OPTIONS: ListOption[] = INITIAL_LABELS.map((l) => ({
  value: l.value,
  label: l.label,
  icon: <ColorDot color={l.color} />,
}));

const plain = (...labels: string[]): ListOption[] =>
  labels.map((label) => ({ value: label.toLowerCase().replaceAll(" ", "-"), label }));

/** Contagem que o Figma mostra ao lado de alguns valores ("14 issues"). */
const HINT = "14 issues";

/**
 * Status de projeto (Figma 22:1218): ícone de projeto (hexágono na cor do status), diferente do
 * ícone de status de issue. Ready e In Progress são do tipo started.
 */
export const PROJECT_STATUS_OPTIONS: ListOption[] = [
  {
    value: "backlog",
    label: "Backlog",
    icon: <ProjectStatusIcon type="backlog" />,
    hint: HINT,
  },
  { value: "planned", label: "Planned", icon: <ProjectStatusIcon type="planned" /> },
  { value: "ready", label: "Ready", icon: <ProjectStatusIcon type="started" /> },
  { value: "in-progress", label: "In Progress", icon: <ProjectStatusIcon type="started" /> },
  { value: "completed", label: "Completed", icon: <ProjectStatusIcon type="completed" /> },
  { value: "canceled", label: "Canceled", icon: <ProjectStatusIcon type="canceled" /> },
];

/** Tipos de status de issue (Figma 22:1933): todos em cinza neutro, como no Figma. */
const STATUS_TYPE_OPTIONS: ListOption[] = [
  { value: "triage", label: "Triage", icon: <StatusIcon type="triage" tone="neutral" /> },
  { value: "backlog", label: "Backlog", icon: <StatusIcon type="backlog" tone="neutral" /> },
  {
    value: "unstarted",
    label: "Unstarted",
    icon: <StatusIcon type="unstarted" tone="neutral" />,
  },
  {
    value: "started",
    label: "Started",
    icon: <StatusIcon type="started" progress={1 / 2} tone="neutral" />,
    hint: HINT,
  },
  {
    value: "completed",
    label: "Completed",
    icon: <StatusIcon type="completed" tone="neutral" />,
  },
  { value: "canceled", label: "Canceled", icon: <StatusIcon type="canceled" tone="neutral" /> },
  {
    value: "duplicate",
    label: "Duplicate",
    icon: <StatusIcon type="duplicate" tone="neutral" />,
  },
];

/** Tipos de status de projeto (fora do Figma): o ícone de projeto em cinza neutro. */
const PROJECT_STATUS_TYPE_OPTIONS: ListOption[] = (
  ["backlog", "planned", "started", "completed", "canceled"] as const
).map((type) => ({
  value: type,
  label: type.charAt(0).toUpperCase() + type.slice(1),
  icon: <ProjectStatusIcon type={type} className="text-secondary" />,
}));

const PAST = plain("Past day", "Past week", "Past month", "Past 3 months");

/** Categorias do "Add Filter…" (Figma 18:353), nos grupos e na ordem do Figma. */
export const FILTER_SECTIONS: FilterCategory[][] = [
  [{ value: "ai-filter", label: "AI filter", icon: Bot }],
  [{ value: "advanced-filter", label: "Advanced filter", icon: ListTree }],
  [
    { value: "status", label: "Status", icon: CircleDashed, options: PROJECT_STATUSES },
    { value: "status-type", label: "Status type", icon: Contrast, options: STATUS_TYPE_OPTIONS },
    {
      value: "assignee",
      label: "Assignee",
      icon: UserRoundPlus,
      options: [{ value: "none", label: "No assignee", icon: icon(UserRound) }, ...USERS],
    },
    // Figma 22:1861
    {
      value: "agent",
      label: "Agent",
      icon: SquareMousePointer,
      options: [
        { value: "none", label: "No agent", icon: icon(SquareDashedMousePointer), hint: HINT },
        { value: "any", label: "Any agent", icon: icon(SquareMousePointer) },
        ...AGENTS,
      ],
    },
    // Figma 22:1793
    {
      value: "agent-session",
      label: "Agent Session",
      icon: SquareMousePointer,
      options: [
        { value: "active", label: "Active", icon: <StatusIcon type="started" progress={1 / 2} /> },
        { value: "error", label: "Error", icon: <StatusIcon type="canceled" /> },
        { value: "dismissed", label: "Dismissed", icon: icon(Archive) },
        { value: "merged", label: "Merged", icon: icon(GitMerge) },
      ],
    },
    // Figma 22:1676
    {
      value: "creator",
      label: "Creator",
      icon: UserRoundPen,
      options: [
        { value: "me", label: "Current user", icon: icon(UserRound, "text-primary"), hint: HINT },
        { value: "application", label: "Application", icon: icon(UserRoundCog) },
        { value: "andre", label: "André Júnio", icon: avatar("André Júnio"), hint: HINT },
        ...AGENTS.map((a) => ({ ...a, tag: "Agent" })),
        { value: "linear", label: "Linear", icon: avatar("Linear"), tag: "Agent" },
      ],
    },
    {
      value: "priority",
      label: "Priority",
      icon: ChartNoAxesColumnIncreasing,
      options: PRIORITIES,
    },
    { value: "labels", label: "Labels", icon: Tag, options: LABEL_OPTIONS },
    // Figma 22:1580: filtros diretos, e Recurring issues com valores
    {
      value: "relations",
      label: "Relations",
      icon: Flag,
      children: [
        { value: "parent-issues", label: "Parent issues", icon: SquareArrowUpRight },
        { value: "sub-issues", label: "Sub-issues", icon: Layers2 },
        { value: "blocked-issues", label: "Blocked issues", icon: OctagonMinus },
        { value: "blocking-issues", label: "Blocking issues", icon: SquareMinus },
        {
          value: "recurring-issues",
          label: "Recurring issues",
          icon: Repeat,
          options: plain("Recurring", "Not recurring"),
        },
        { value: "issues-with-relations", label: "Issues with relations", icon: Flag },
        { value: "duplicates", label: "Duplicates", icon: CircleSlash2 },
      ],
    },
    { value: "suggested-label", label: "Suggested label", icon: Tag, options: LABEL_OPTIONS },
    // Figma 22:1439: cada data abre os seus intervalos (valores de exemplo, fora do Figma)
    {
      value: "dates",
      label: "Dates",
      icon: PanelTop,
      children: [
        {
          value: "due-date",
          label: "Due date",
          icon: PanelTop,
          options: plain("Overdue", "Due today", "Due this week", "No due date"),
        },
        { value: "created-date", label: "Created date", icon: CalendarPlus, options: PAST },
        { value: "updated-date", label: "Updated date", icon: CalendarSync, options: PAST },
        {
          value: "started-date",
          label: "Started date",
          icon: CalendarChevronsRight,
          options: PAST,
        },
        { value: "completed-date", label: "Completed date", icon: CalendarCheck, options: PAST },
        { value: "auto-closed-date", label: "Auto-closed date", icon: CircleX, options: PAST },
        { value: "triaged-date", label: "Triaged date", icon: ArrowLeftRight, options: PAST },
        {
          value: "time-in-status",
          label: "Time in current status",
          icon: Timer,
          options: plain("More than 1 day", "More than 1 week", "More than 1 month"),
        },
      ],
    },
  ],
  [
    { value: "project", label: "Project", icon: Box, options: PROJECT_OPTIONS },
    // Figma 22:1322: cada propriedade abre os seus valores (Project status: 22:1218)
    {
      value: "project-properties",
      label: "Project properties",
      icon: Package,
      children: [
        {
          value: "project-status",
          label: "Project status",
          icon: Hexagon,
          options: PROJECT_STATUS_OPTIONS,
        },
        {
          value: "project-status-type",
          label: "Project status type",
          icon: Hexagon,
          options: PROJECT_STATUS_TYPE_OPTIONS,
        },
        {
          value: "project-priority",
          label: "Project priority",
          icon: ChartNoAxesColumnIncreasing,
          options: PRIORITIES,
        },
        { value: "project-labels", label: "Project labels", icon: Tag, options: LABEL_OPTIONS },
        { value: "project-lead", label: "Project lead", icon: UserRound, options: USERS },
        {
          value: "milestone-name",
          label: "Milestone name",
          icon: Diamond,
          options: plain("Alpha", "Beta", "Launch"),
        },
      ],
    },
  ],
  [
    { value: "subscribers", label: "Subscribers", icon: Bell, options: USERS },
    {
      value: "external-source",
      label: "External source",
      icon: Blend,
      options: plain("Slack", "GitHub", "Email"),
    },
    { value: "auto-closed", label: "Auto-closed", icon: CircleX },
    {
      value: "content",
      label: "Content",
      icon: Type,
      options: plain("Title", "Description", "Comments"),
    },
    { value: "links", label: "Links", icon: Link, options: plain("Has links", "No links") },
    {
      value: "template",
      label: "Template",
      icon: StickyNote,
      options: plain("Bug report", "Feature request"),
    },
  ],
];

/** Todas as categorias, com as subcategorias dos submenus simples. */
function allCategories(list: FilterCategory[]): FilterCategory[] {
  return list.flatMap((c) => [c, ...allCategories(c.children ?? [])]);
}

/** Categoria pelo valor, em qualquer nível. */
export function findCategory(value: string): FilterCategory | undefined {
  return allCategories(FILTER_SECTIONS.flat()).find((c) => c.value === value);
}

/** Rótulo de cada valor escolhido, para mostrar os filtros ativos. */
export function describeFilters(value: Record<string, string[]>): string[] {
  const categories = allCategories(FILTER_SECTIONS.flat());
  return Object.entries(value).flatMap(([key, values]) => {
    const category = categories.find((c) => c.value === key);
    const labels = values.map((v) => category?.options?.find((o) => o.value === v)?.label ?? v);
    return labels.length > 0 ? [`${category?.label ?? key}: ${labels.join(", ")}`] : [];
  });
}

/** Contagens do painel da vista (Figma 18:1130: Projects com 7, 6 e 1). */
export const BREAKDOWN_GROUPS: BreakdownGroup[] = [
  {
    value: "assignee",
    label: "Assignees",
    items: [
      { value: "andre", label: "André Júnio", icon: avatar("André Júnio"), count: 5 },
      { value: "marina", label: "Marina Costa", icon: avatar("Marina Costa"), count: 4 },
      { value: "none", label: "No assignee", icon: icon(UserRound), count: 5 },
    ],
  },
  {
    value: "labels",
    label: "Labels",
    items: INITIAL_LABELS.map((l, i) => ({
      value: l.value,
      label: l.label,
      icon: <ColorDot color={l.color} />,
      count: [3, 6, 2][i] ?? 0,
    })),
  },
  {
    value: "priority",
    label: "Priority",
    items: [
      { value: "urgent", label: "Urgent", icon: <PriorityIcon priority="urgent" />, count: 1 },
      { value: "high", label: "High", icon: <PriorityIcon priority="high" />, count: 4 },
      { value: "medium", label: "Medium", icon: <PriorityIcon priority="medium" />, count: 5 },
      { value: "low", label: "Low", icon: <PriorityIcon priority="low" />, count: 2 },
      { value: "none", label: "No priority", icon: <PriorityIcon priority="none" />, count: 2 },
    ],
  },
  {
    value: "project",
    label: "Projects",
    items: PROJECTS.slice(0, 3).map((p, i) => ({
      value: p.value,
      label: p.label,
      icon: <ProjectIcon value={p.icon} />,
      count: [7, 6, 1][i] ?? 0,
    })),
  },
];

/** Propriedades de exibição (Figma 18:870 na lista, 18:1062 no quadro), na ordem do Figma. */
export const LIST_PROPERTIES: DisplayProperty[] = [
  "ID",
  "Status",
  "Assignee",
  "Creator",
  "Priority",
  "Project",
  "Due date",
  "Milestone",
  "Labels",
  "Links",
  "Time in status",
  "Created",
  "Updated",
  "Pull requests",
].map((label) => ({ value: label.toLowerCase().replaceAll(" ", "-"), label }));

/** O quadro não mostra Creator (Figma 18:1062). */
export const BOARD_PROPERTIES = LIST_PROPERTIES.filter((p) => p.value !== "creator");

/** Ligadas no Figma (fundo mais claro): as demais aparecem desligadas. */
export const DEFAULT_PROPERTIES = [
  "id",
  "status",
  "assignee",
  "priority",
  "project",
  "due-date",
  "labels",
  "created",
  "pull-requests",
];

export const GROUPINGS = plain(
  "Status",
  "Assignee",
  "Project",
  "Priority",
  "Labels",
  "No grouping",
);
export const ORDERINGS = plain("Manual", "Priority", "Status", "Created", "Updated", "Due date");
export const NESTED_SUB_ISSUES = plain("Show matching", "Show all");
