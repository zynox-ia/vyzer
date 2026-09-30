/**
 * Overview do Team (`/settings/teams/:team`, spec 2.2; Linear ao vivo, `/settings/teams/VYZ`):
 * caminho "Teams › Nome", título, "Accessible to all workspace members" e o hub de links. O
 * hub aqui é o reduzido da spec (D9): só o que existe hoje — General e Members — e a Danger
 * zone com "Delete team" (`Confirm` danger, exclusão imediata, ADR-0016). Os demais cartões do
 * Linear (Slack, labels, templates, workflow, cycles, AI…) entram com os seus domínios.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Settings, UsersRound, type LucideIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button, Confirm, ProjectIcon, useToast } from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { deleteTeamMutationOptions, teamsQueryOptions } from "@/services/teams";
import { SettingsGroup, SettingsRow } from "../settings-row";
import { TeamBreadcrumb, useTeam } from "./layout";

/**
 * Linha do hub como a do Linear (medida ao vivo): ícone à esquerda, rótulo e descrição, o valor
 * atual à direita (quando há) e a seta.
 */
function HubLink({
  to,
  icon,
  label,
  description,
  value,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  value?: string;
}) {
  return (
    <Link
      to={to}
      className="-mx-4 flex items-center gap-3 border-b border-subtle px-4 py-4 no-underline last:border-b-0 focus-ring hovered:bg-hover"
    >
      <Icon icon={icon} size="sm" className="shrink-0 text-tertiary" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-label-md text-primary">{label}</span>
        <span className="text-body-sm text-secondary">{description}</span>
      </div>
      {value && <span className="shrink-0 text-body-sm text-secondary">{value}</span>}
      <Icon icon={ChevronRight} size="sm" className="shrink-0 text-secondary" />
    </Link>
  );
}

export function TeamOverviewPage() {
  const team = useTeam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  // A contagem de Members vem da lista de Teams (o `team.get` não a traz).
  const memberCount = useQuery(teamsQueryOptions()).data?.find(
    (t) => t.id === team.id,
  )?.memberCount;

  const remove = useMutation({
    ...deleteTeamMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamsQueryOptions().queryKey });
    },
    onError: (error) => {
      const conflict = "code" in error && error.code === "CONFLICT";
      toast({
        title: "Could not delete team",
        description: conflict
          ? "This team still has Projects. Nothing was deleted."
          : "Nothing was deleted. Check your connection and try again.",
        variant: "error",
      });
    },
  });

  return (
    <div className="flex flex-col">
      <TeamBreadcrumb team={team} />
      <div className="flex items-center gap-3 pb-1">
        <ProjectIcon value={team.icon} className="size-icon-md" />
        <h1 className="type-heading-1 text-primary">{team.name}</h1>
      </div>
      <p className="pb-6 text-body-md text-secondary">Accessible to all workspace members</p>

      <SettingsGroup title="Team overview">
        <HubLink
          to={`/settings/teams/${team.slug}/general`}
          icon={Settings}
          label="General"
          description="Name, identifier, icon and description"
        />
        <HubLink
          to={`/settings/teams/${team.slug}/members`}
          icon={UsersRound}
          label="Members"
          description="Manage team members"
          value={
            memberCount === undefined
              ? undefined
              : `${memberCount} ${memberCount === 1 ? "member" : "members"}`
          }
        />
      </SettingsGroup>

      <SettingsGroup title="Danger zone">
        <SettingsRow label="Delete team" description="Permanently delete this team, immediately">
          {() => (
            <Confirm
              title="Delete team?"
              description={`This permanently deletes ${team.name}. It happens immediately and cannot be undone.`}
              confirmLabel="Delete team"
              onConfirm={() =>
                remove.mutate(
                  { id: team.id },
                  {
                    onSuccess: () => {
                      toast({ title: `${team.name} deleted`, variant: "success" });
                      navigate("/settings/teams");
                    },
                  },
                )
              }
            >
              <Button type="button" variant="danger" loading={remove.isPending}>
                Delete team
              </Button>
            </Confirm>
          )}
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
