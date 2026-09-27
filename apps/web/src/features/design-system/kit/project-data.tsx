/**
 * Dados de exemplo do "New Project" (Figma 1:2), compartilhados pelas páginas de Navigation.
 * Textos reais do produto; valores fixos só para a documentação.
 */
import {
  ColorDot,
  ProjectIcon,
  type LabelColor,
  type LabelItem,
  type ListOption,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import { PriorityIcon } from "@vyzer/design-system/icons";
import { UserRound } from "lucide-react";

export type ProjectStatus =
  | "backlog"
  | "planned"
  | "ready"
  | "in-progress"
  | "completed"
  | "canceled";

const status = (
  value: ProjectStatus,
  label: string,
  color: LabelColor,
): ListOption<ProjectStatus> => ({
  value,
  label,
  icon: <ColorDot color={color} size="md" />,
});

/** Status de projeto (Figma 1:1013): bolinhas de 14 px na cor do estado. */
export const PROJECT_STATUSES: ListOption<ProjectStatus>[] = [
  status("backlog", "Backlog", "orange"),
  status("planned", "Planned", "grey"),
  status("ready", "Ready", "amber"),
  status("in-progress", "In Progress", "amber"),
  status("completed", "Completed", "purple"),
  status("canceled", "Canceled", "slate"),
];

export type Priority = "none" | "urgent" | "high" | "medium" | "low";

export const PRIORITIES: ListOption<Priority>[] = [
  { value: "none", label: "No priority", icon: <PriorityIcon priority="none" /> },
  { value: "urgent", label: "Urgent", icon: <PriorityIcon priority="urgent" /> },
  { value: "high", label: "High", icon: <PriorityIcon priority="high" /> },
  { value: "medium", label: "Medium", icon: <PriorityIcon priority="medium" /> },
  { value: "low", label: "Low", icon: <PriorityIcon priority="low" /> },
];

export const LEADS: ListOption[] = [
  { value: "none", label: "No lead", icon: <UserRound className="size-4 text-secondary" /> },
  { value: "andre", label: "André Júnio", group: "Users from the project team" },
  { value: "marina", label: "Marina Costa", group: "Users from the project team" },
];

export const INITIAL_LABELS: LabelItem[] = [
  { value: "bug", label: "Bug", color: "red" },
  { value: "feature", label: "Feature", color: "purple" },
  { value: "improvement", label: "Improvement", color: "cyan" },
];

/** Projetos para dependências (Figma 1:1284): ícone de projeto na cor de cada um. */
export const PROJECTS: { value: string; label: string; icon: ProjectIconValue }[] = [
  { value: "aname", label: "Aname CRM", icon: { kind: "icon", name: "Atom", color: "slate" } },
  { value: "plugga", label: "Plugga OS", icon: { kind: "icon", name: "Atom", color: "green" } },
  { value: "mv", label: "Mv School", icon: { kind: "icon", name: "Atom", color: "amber" } },
  { value: "zyncloud", label: "ZynCloud", icon: { kind: "icon", name: "Atom", color: "purple" } },
  { value: "zynox", label: "Zynox OS", icon: { kind: "icon", name: "Atom", color: "red" } },
];

export const PROJECT_OPTIONS: ListOption[] = PROJECTS.map((p) => ({
  value: p.value,
  label: p.label,
  icon: <ProjectIcon value={p.icon} />,
}));
