/**
 * O Team real do Workspace (ícone, cor, nome e key vindos da API), no lugar do `TEAMS` de exemplo
 * de `project-data.tsx`: usado pelo breadcrumb de `/teams/:team/projects`. A lista de Teams é a
 * mesma query da sidebar e de Settings, então o cache já vem quente. `undefined` enquanto carrega
 * ou se o slug não existe.
 */
import { useQuery } from "@tanstack/react-query";
import { teamsQueryOptions } from "@/services/teams";
import type { Team } from "./project-data";

export function useWorkspaceTeam(slug: string | undefined): Team | undefined {
  const teams = useQuery(teamsQueryOptions());
  if (!slug) return undefined;
  return teams.data?.find((team) => team.slug === slug);
}
