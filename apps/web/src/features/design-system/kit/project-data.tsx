/**
 * Dados de exemplo do "New Project" (Figma 1:2), compartilhados pelas páginas de Navigation.
 * Textos reais do produto; valores fixos só para a documentação.
 */
import {
  Avatar,
  ProjectIcon,
  type FrequentEmoji,
  type LabelItem,
  type ListOption,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import { PriorityIcon, StatusIcon } from "@vyzer/design-system/icons";
import { UserRound } from "lucide-react";

export type ProjectStatus =
  | "backlog"
  | "ready"
  | "ready-started"
  | "in-progress"
  | "in-review"
  | "verifying"
  | "blocked"
  | "done"
  | "canceled"
  | "duplicate";

/**
 * Status (Figma 18:152, menu "Change status"): ícones de status de workflow (StatusIcon, 6:1543)
 * na cor do estado; os de andamento enchem o setor de 1/6 a 5/6. Os dois "Ready" seguem o Figma.
 */
export const PROJECT_STATUSES: ListOption<ProjectStatus>[] = [
  { value: "backlog", label: "Backlog", icon: <StatusIcon type="backlog" /> },
  // Os dois "Ready" do Figma: o ícone com nome acessível distingue as opções no leitor de tela.
  {
    value: "ready",
    label: "Ready",
    icon: <StatusIcon type="unstarted" tone="info" label="Not started" />,
  },
  {
    value: "ready-started",
    label: "Ready",
    icon: <StatusIcon type="started" progress={1 / 6} tone="neutral" label="Started" />,
  },
  {
    value: "in-progress",
    label: "In Progress",
    icon: <StatusIcon type="started" progress={1 / 3} />,
  },
  {
    value: "in-review",
    label: "In Review",
    icon: <StatusIcon type="started" progress={1 / 2} tone="success" />,
  },
  {
    value: "verifying",
    label: "Verifying",
    icon: <StatusIcon type="started" progress={2 / 3} className="text-orange" />,
  },
  {
    value: "blocked",
    label: "Blocked",
    icon: <StatusIcon type="started" progress={5 / 6} tone="danger" />,
  },
  { value: "done", label: "Done", icon: <StatusIcon type="completed" /> },
  { value: "canceled", label: "Canceled", icon: <StatusIcon type="canceled" /> },
  { value: "duplicate", label: "Duplicate", icon: <StatusIcon type="duplicate" /> },
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
  // Figma 1:931: avatar de 16 px ao lado do nome (aqui sem foto: ícone de pessoa)
  {
    value: "andre",
    label: "André Júnio",
    group: "Users from the project team",
    icon: <Avatar name="André Júnio" size="sm" />,
  },
  {
    value: "marina",
    label: "Marina Costa",
    group: "Users from the project team",
    icon: <Avatar name="Marina Costa" size="sm" />,
  },
];

/**
 * Emojis frequentes de exemplo (seção "Frequently used" do Figma 1:1401). No produto, o histórico
 * vem do usuário.
 */
export const FREQUENT_EMOJIS: FrequentEmoji[] = [
  { emoji: "👍", label: "Thumbs up" },
  { emoji: "✌️", label: "Victory hand" },
  { emoji: "🙏", label: "Folded hands" },
  { emoji: "😂", label: "Face with tears of joy" },
  { emoji: "❤️", label: "Red heart" },
  { emoji: "👀", label: "Eyes" },
  { emoji: "✅", label: "Check mark button" },
  { emoji: "😀", label: "Grinning face" },
  { emoji: "😅", label: "Grinning face with sweat" },
  { emoji: "🎉", label: "Party popper" },
  { emoji: "🚀", label: "Rocket" },
  { emoji: "⚠️", label: "Warning" },
  { emoji: "❌", label: "Cross mark" },
  { emoji: "🙌", label: "Raising hands" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💡", label: "Light bulb" },
  { emoji: "👋", label: "Waving hand" },
  { emoji: "❓", label: "Red question mark" },
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
