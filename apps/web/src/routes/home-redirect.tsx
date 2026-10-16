/**
 * A rota `/` leva à "Default home view" das Preferences do Member (spec `preferences-persistence.md`).
 * Enquanto a preferência carrega não mostra nada (para não piscar /projects antes de ir ao destino
 * certo); se ela falhar ao carregar, cai em /projects, o destino de antes.
 *
 * `HomeView` é o enum do contrato (`memberPreferenceValuesSchema.defaultHomeView`), intocado pela
 * Missão 02 — só o destino de cada opção mudou, aqui no web: my-issues/reviews não têm mais tela
 * própria (caem no mais próximo, Inbox) e current-cycle/all-issues/active-issues também não (sem
 * Teams na sidebar; caem em Projects, sem depender mais do primeiro Team).
 */
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router";
import { memberPreferencesQueryOptions } from "@/services/member-preferences";

export type HomeView =
  | "agent"
  | "inbox"
  | "my-issues"
  | "reviews"
  | "all-issues"
  | "active-issues"
  | "current-cycle"
  | "projects";

/** Rota de cada opção; a que não sobreviveu à Missão 02 cai no destino mais próximo que ficou. */
export function homePath(view: HomeView): string {
  switch (view) {
    case "agent":
      return "/agent";
    case "inbox":
    case "my-issues":
    case "reviews":
      return "/inbox";
    case "current-cycle":
    case "all-issues":
    case "active-issues":
    case "projects":
    default:
      return "/projects";
  }
}

export function HomeRedirect() {
  const preferences = useQuery(memberPreferencesQueryOptions());

  if (preferences.isError) return <Navigate to="/projects" replace />;
  if (preferences.isPending) return null;
  return <Navigate to={homePath(preferences.data.defaultHomeView)} replace />;
}
