/**
 * Milestones de exemplo (Plugga OS), compartilhados pelas páginas de Patterns: lista, detalhe e a
 * atualização de projeto (Figma 25:3409, dentro do Project Details; 25:6683, o hover card da Fase
 * 5). Mesmos três nomes do hover card, com progresso e issues para a lista e o detalhe.
 */
import { PROJECTS } from "./project-data";
import { ISSUES, type SampleIssue } from "./issue-data";

export const MILESTONE_PROJECT = PROJECTS[1]!; // Plugga OS

export type SampleMilestone = {
  id: string;
  name: string;
  description?: string;
  /** Progresso atual (0–100), das issues concluídas do milestone. */
  progress: number;
  /** Progresso na última atualização de projeto (popover "Progress since …"). */
  progressSince?: number;
  targetDate: string;
  issueIds: string[];
};

export const MILESTONES: SampleMilestone[] = [
  {
    id: "private-alpha",
    name: "Private alpha",
    description: "Internal team testing before the beta opens to design partners.",
    progress: 100,
    progressSince: 100,
    targetDate: "Aug 29",
    issueIds: ["ZYN-41", "ZYN-38"],
  },
  {
    id: "beta-launch",
    name: "Beta launch",
    description: "Open beta with the first design partners, gated by an invite code.",
    progress: 64,
    progressSince: 40,
    targetDate: "Oct 2",
    issueIds: ["ZYN-35", "ZYN-33", "ZYN-31"],
  },
  {
    id: "public-release",
    name: "Public release",
    description: "General availability, with the pricing page and the migration guide.",
    progress: 12,
    progressSince: 0,
    targetDate: "Oct 30",
    issueIds: ["ZYN-29", "ZYN-27", "ZYN-24"],
  },
];

export const milestoneById = (id: string) => MILESTONES.find((m) => m.id === id)!;

export function milestoneIssues(milestone: SampleMilestone): SampleIssue[] {
  return milestone.issueIds.map((id) => ISSUES.find((i) => i.id === id)!);
}
