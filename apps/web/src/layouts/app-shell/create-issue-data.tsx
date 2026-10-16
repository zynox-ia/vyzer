/**
 * Opções do diálogo de criar issue ("C"), sem dados reais (fora do escopo desta fase — não há
 * service de issues ainda). Peças do design system (StatusIcon, PriorityIcon, ColorDot,
 * ProjectIcon), como no exemplo New issue da VYZ-33
 * (`features/design-system/pages/forms/creation-composer.tsx`), sem importar dessa página de
 * documentação.
 */
import type { LabelItem } from "@zynox/design-system/components";
import { ProjectIcon } from "@zynox/design-system/components";
import { PriorityIcon, StatusIcon, type Priority } from "@zynox/design-system/icons";
import type { ReactNode } from "react";
import type { Team } from "@/features/projects/project-data";

export type TeamOption = { value: string; label: string; hint: string; icon: ReactNode };

export const TEAMS: TeamOption[] = [
  {
    value: "zynox",
    label: "Zynox",
    hint: "ZYN",
    icon: <ProjectIcon value={{ kind: "icon", name: "Zap", color: "red" }} />,
  },
];

/** As opções do Team no diálogo, a partir dos Teams reais (`key` como dica, "ZYN"). */
export function teamOptionsFrom(teams: Team[]): TeamOption[] {
  return teams.map((team) => ({
    value: team.slug,
    label: team.name,
    hint: team.key ?? team.name.slice(0, 3).toUpperCase(),
    icon: <ProjectIcon value={team.icon} />,
  }));
}

export type StatusOption = { value: string; label: string; icon: ReactNode };

export const STATUSES: StatusOption[] = [
  { value: "backlog", label: "Backlog", icon: <StatusIcon type="backlog" /> },
  { value: "todo", label: "Todo", icon: <StatusIcon type="unstarted" /> },
  {
    value: "in-progress",
    label: "In Progress",
    icon: <StatusIcon type="started" progress={1 / 3} />,
  },
  { value: "done", label: "Done", icon: <StatusIcon type="completed" /> },
  { value: "canceled", label: "Canceled", icon: <StatusIcon type="canceled" /> },
];

export type PriorityOption = { value: Priority; label: string; icon: ReactNode };

export const PRIORITIES: PriorityOption[] = [
  { value: "none", label: "No priority", icon: <PriorityIcon priority="none" /> },
  { value: "urgent", label: "Urgent", icon: <PriorityIcon priority="urgent" /> },
  { value: "high", label: "High", icon: <PriorityIcon priority="high" /> },
  { value: "medium", label: "Medium", icon: <PriorityIcon priority="medium" /> },
  { value: "low", label: "Low", icon: <PriorityIcon priority="low" /> },
];

export type AssigneeOption = { value: string; label: string };

export const ASSIGNEES: AssigneeOption[] = [
  { value: "none", label: "No assignee" },
  { value: "andre-junio", label: "André Júnio" },
  { value: "marina-costa", label: "Marina Costa" },
];

export const INITIAL_LABELS: LabelItem[] = [
  { value: "bug", label: "Bug", color: "red" },
  { value: "feature", label: "Feature", color: "cyan" },
  { value: "improvement", label: "Improvement", color: "green" },
];
