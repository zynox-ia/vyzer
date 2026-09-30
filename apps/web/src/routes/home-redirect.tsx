/**
 * A rota `/` leva à "Default home view" das Preferences do Member (spec `preferences-persistence.md`).
 * Enquanto a preferência carrega não mostra nada (para não piscar /projects antes de ir ao destino
 * certo); se ela falhar ao carregar, cai em /projects, o destino de antes.
 */
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { memberPreferencesQueryOptions } from "@/services/member-preferences";
import { teamsQueryOptions } from "@/services/teams";

export type HomeView =
  | "agent"
  | "inbox"
  | "my-issues"
  | "reviews"
  | "all-issues"
  | "active-issues"
  | "current-cycle"
  | "projects";

/**
 * Rota de cada opção. "All issues" e "Active issues" não têm tela global no Vyzer: vão para as
 * issues do primeiro Team (ou /projects, sem nenhum).
 */
export function homePath(view: HomeView, firstTeamSlug?: string) {
  switch (view) {
    case "agent":
      return "/agent";
    case "inbox":
      return "/inbox";
    case "my-issues":
      return "/my-issues";
    case "reviews":
      return "/reviews";
    case "current-cycle":
      return "/cycles";
    case "all-issues":
    case "active-issues":
      return firstTeamSlug ? `/teams/${firstTeamSlug}/issues` : "/projects";
    default:
      return "/projects";
  }
}

export function HomeRedirect() {
  const preferences = useQuery(memberPreferencesQueryOptions());
  const teams = useQuery(teamsQueryOptions());
  const needsTeam =
    preferences.data?.defaultHomeView === "all-issues" ||
    preferences.data?.defaultHomeView === "active-issues";

  if (preferences.isError) return <Navigate to="/projects" replace />;
  if (preferences.isPending || (needsTeam && teams.isPending)) return null;
  return (
    <Navigate to={homePath(preferences.data.defaultHomeView, teams.data?.[0]?.slug)} replace />
  );
}
