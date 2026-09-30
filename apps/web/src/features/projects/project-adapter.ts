/**
 * Do Project da API (`@vyzer/contract`) para a linha da lista de Projects (`project-data.tsx`,
 * `Project`): a tabela continua a mesma, só a origem do dado mudou (antes os projetos de exemplo).
 * Campos que a API ainda não tem, como o marco atual (`milestone`), ficam vazios; a data alvo
 * fica em ISO (`YYYY-MM-DD`) para a ordenação e é formatada só na hora de mostrar.
 */
import type { Project as ApiProject } from "@vyzer/contract";
import type { Project } from "./project-data";

export function toProjectRow(project: ApiProject): Project {
  return {
    id: project.id,
    name: project.name,
    icon: project.icon,
    // A lista de um time já vem filtrada pelo servidor; este é o primeiro time do projeto.
    teamSlug: project.teams[0]?.slug ?? "",
    health: project.health,
    healthNote: project.healthNote ?? undefined,
    priority: project.priority ?? undefined,
    lead: project.lead?.name,
    targetDate: project.targetDate ?? undefined,
    issues: project.issues,
    status: project.status,
    progress: project.progress,
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-12-18" → "Dec 18", como a coluna Target date do Linear. */
export function formatTargetDate(iso: string): string {
  const [, month, day] = iso.split("-");
  const name = MONTHS[Number(month) - 1];
  return name && day ? `${name} ${Number(day)}` : iso;
}
