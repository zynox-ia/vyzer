/**
 * Projetos de exemplo (Figma 25:4964, lista, e Linear ao vivo em `/zynox-dev/projects/all`), de
 * mais de um time — para a diferença entre "Projects do workspace" e "Projects do time"
 * aparecer. Sem dados reais (fora do escopo): nomes e números vêm do Figma/Linear conferidos ao
 * vivo, não de uma API.
 */
import type { Health } from "@vyzer/design-system/components";
import type { Priority } from "@vyzer/design-system/icons";
import type { ProjectIconValue } from "@vyzer/design-system/components";
import type { ProjectStatusType } from "@vyzer/design-system/icons";

export type Team = { slug: string; name: string; icon: ProjectIconValue; key?: string };

/**
 * Ícone + cor do time (como no Linear, medido ao vivo: o Zynox tem cor própria, ciano, fixa —
 * não vem do texto). Mesmo modelo do ícone de projeto (`ProjectIcon`/`ProjectIconValue`); o
 * Zynox usa o mesmo ícone/cor já usados no kit de dados da documentação
 * (`design-system/kit/project-data.tsx`, `TEAMS`). Dado de exemplo: o modelo real (de onde vem a
 * cor de cada time) fica para quando houver a feature de times de verdade.
 */
export const TEAMS: Team[] = [
  { slug: "zynox", name: "Zynox", icon: { kind: "icon", name: "Navigation", color: "cyan" } },
  { slug: "vyzer", name: "Vyzer", icon: { kind: "icon", name: "Layers", color: "purple" } },
];

export type Project = {
  id: string;
  name: string;
  icon: ProjectIconValue;
  teamSlug: string;
  /** Marco atual, como "Identidade e Onboarding" (Aname CRM) — opcional. */
  milestone?: string;
  health: Health;
  /** Texto ao lado da saúde, ex.: "2w" (2 semanas atrás) ou "20min". */
  healthNote?: string;
  priority?: Priority;
  lead?: string;
  targetDate?: string;
  issues: number;
  status: ProjectStatusType;
  /** Percentual concluído (0–100), mostrado ao lado do ícone de status. */
  progress: number;
};

export const PROJECTS: Project[] = [
  {
    id: "aname-crm",
    name: "Aname CRM",
    icon: { kind: "icon", name: "Box", color: "grey" },
    teamSlug: "zynox",
    milestone: "Identidade e Onboarding",
    health: "none",
    priority: "medium",
    issues: 106,
    status: "started",
    progress: 4,
  },
  {
    id: "plugga-os",
    name: "Plugga OS",
    icon: { kind: "icon", name: "Box", color: "green" },
    teamSlug: "zynox",
    health: "off-track",
    healthNote: "2w",
    issues: 18,
    status: "started",
    progress: 8,
  },
  {
    id: "mv-school",
    name: "Mv School",
    icon: { kind: "icon", name: "Box", color: "amber" },
    teamSlug: "zynox",
    health: "none",
    issues: 1,
    status: "started",
    progress: 25,
  },
  {
    id: "zyncloud",
    name: "ZynCloud",
    icon: { kind: "icon", name: "Box", color: "cyan" },
    teamSlug: "zynox",
    health: "none",
    issues: 0,
    status: "started",
    progress: 0,
  },
  {
    id: "zynox-os",
    name: "Zynox OS",
    icon: { kind: "icon", name: "Box", color: "red" },
    teamSlug: "zynox",
    milestone: "Fundação · Oct 10",
    health: "on-track",
    healthNote: "20min",
    priority: "medium",
    lead: "André Júnio",
    targetDate: "Dec 18th",
    issues: 9,
    status: "started",
    progress: 33,
  },
  {
    id: "teste",
    name: "Teste",
    icon: { kind: "icon", name: "Box", color: "purple" },
    teamSlug: "vyzer",
    health: "none",
    issues: 0,
    status: "backlog",
    progress: 0,
  },
];

export function projectsForTeam(teamSlug?: string): Project[] {
  return teamSlug ? PROJECTS.filter((p) => p.teamSlug === teamSlug) : PROJECTS;
}

export function projectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function teamByslug(slug: string): Team | undefined {
  return TEAMS.find((t) => t.slug === slug);
}
