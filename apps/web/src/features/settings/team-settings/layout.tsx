/**
 * Moldura da configuração de um Team (`/settings/teams/:team`, spec `settings-administration.md`,
 * sub-etapa 2.2; Linear ao vivo, `/zynox-dev/settings/teams/VYZ`): carrega o Team pelo slug e
 * mostra o caminho "Teams › Nome" acima da subpágina (Overview, General ou Members). Slug que não
 * existe vira "Team not found", como o Project inexistente; erro de rede não vira "não
 * encontrado" e oferece nova tentativa.
 */
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, UsersRound } from "lucide-react";
import { Link, Outlet, useNavigate, useOutletContext, useParams } from "react-router";
import type { Team } from "@zynox/contract";
import { Alert, Button, EmptyState, Skeleton } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import { teamQueryOptions } from "@/services/teams";

export type TeamOutletContext = { team: Team };

/** Contexto que as subpáginas leem: o Team já carregado. */
export function useTeam() {
  return useOutletContext<TeamOutletContext>().team;
}

export function isNotFound(error: unknown) {
  return (
    typeof error === "object" && error !== null && "code" in error && error.code === "NOT_FOUND"
  );
}

const crumbLink =
  "rounded-control text-body-md text-secondary no-underline focus-ring hovered:text-primary";

export function TeamBreadcrumb({ team, page }: { team: Team; page?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pb-4">
      <Link to="/settings/teams" className={crumbLink}>
        Teams
      </Link>
      <Icon icon={ChevronRight} size="xs" className="text-tertiary" />
      {page ? (
        <>
          <Link to={`/settings/teams/${team.slug}`} className={crumbLink}>
            {team.name}
          </Link>
          <Icon icon={ChevronRight} size="xs" className="text-tertiary" />
          <span aria-current="page" className="text-body-md text-primary">
            {page}
          </span>
        </>
      ) : (
        <span aria-current="page" className="text-body-md text-primary">
          {team.name}
        </span>
      )}
    </nav>
  );
}

export function TeamSettingsLayout() {
  const { team: slug = "" } = useParams();
  const navigate = useNavigate();
  const team = useQuery({
    ...teamQueryOptions(slug),
    // "Não encontrado" é resposta definitiva: repetir só atrasa a tela (o padrão são 3 tentativas).
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
  });

  if (team.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Loading Team.</span>
        <Skeleton className="w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton shape="block" className="h-32" />
      </div>
    );
  }

  if (team.isError) {
    if (isNotFound(team.error)) {
      return (
        <EmptyState
          icon={UsersRound}
          title="Team not found"
          action={
            <Button type="button" variant="secondary" onClick={() => navigate("/settings/teams")}>
              Back to Teams
            </Button>
          }
        >
          This team does not exist in the workspace, or it was deleted.
        </EmptyState>
      );
    }
    return (
      <Alert
        tone="danger"
        role="alert"
        title="Could not load Team"
        action={
          <Button type="button" variant="secondary" onClick={() => void team.refetch()}>
            Retry
          </Button>
        }
      >
        Check your connection and try again.
      </Alert>
    );
  }

  return <Outlet context={{ team: team.data } satisfies TeamOutletContext} />;
}
