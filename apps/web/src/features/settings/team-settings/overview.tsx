/**
 * Overview do Team (`/settings/teams/:team`; Linear ao vivo, `/zynox-dev/settings/teams/VYZ`,
 * medido no DOM em 29/09): "‹ Teams" no canto do painel, título e "Accessible to all workspace
 * members" com o botão "Team overview" (leva à home do time) à direita, e o hub em cartões — sem
 * divisórias, linhas de 66 px (ícone num bloco de 32 px, rótulo de 13 px e ajuda de 12 px à
 * esquerda; valor e seta à direita), títulos de seção de 15 px recuados 16 px e 48 px entre
 * seções: Issues, projects, and documents, Workflow, AI & Agents, Team hierarchy e Danger zone.
 *
 * General e Members têm página de verdade; as demais linhas levam a uma página de espera dentro
 * do Team (`/settings/teams/:team/<destino>`) até o domínio existir. O valor à direita só aparece
 * onde há dado ou o estado é conhecido (Members vem da lista; "None" e "Off" são o estado real de
 * quem ainda não tem nada). Nada é bloqueado por plano: o Vyzer é aberto, então Project labels, Project statuses e Parent
 * team (que no Linear levam "Available on Business") são linhas normais. Danger zone: Delete team de
 * verdade (`Confirm` danger, exclusão imediata, ADR-0016); Leave team e Retire ainda não têm
 * backend e ficam desabilitados.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Hash,
  Inbox,
  Megaphone,
  MessageSquareText,
  Network,
  Plug,
  RefreshCw,
  Repeat,
  Settings,
  Sparkles,
  SquareStack,
  Tag,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { Button, Confirm, useToast } from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { deleteTeamMutationOptions, teamsQueryOptions } from "@/services/teams";
import { useTeam } from "./layout";

/** Cartão do Linear: fundo de superfície, raio 10, sem borda nem divisórias entre as linhas. */
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-container bg-surface">{children}</div>
  );
}

/** Título de seção (15 px, recuado 16 px como no Linear) e o cartão, 16 px abaixo. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5 px-4">
        <h2 className="type-heading-3 leading-6 text-primary">{title}</h2>
        {description && <p className="text-body-md text-secondary">{description}</p>}
      </div>
      <Card>{children}</Card>
    </section>
  );
}

/** Linha do cartão (Figma 59:2): 16 px de respiro e divisória de 1 px recuada 16 px, menos na última. */
const rowBase =
  "relative flex items-center gap-3 p-4 after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:border-b after:border-subtle last:after:hidden";

function RowText({
  label,
  description,
  muted,
}: {
  label: string;
  description: string;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className={`text-label-md leading-4 ${muted ? "text-secondary" : "text-primary"}`}>
        {label}
      </span>
      <span className="text-body-sm leading-4 text-secondary">{description}</span>
    </div>
  );
}

function IconTile({ icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-hover text-secondary">
      <Icon icon={icon} size="sm" />
    </span>
  );
}

/** Linha do hub: bloco de ícone, rótulo e ajuda, valor atual (quando há) e a seta. */
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
    <Link to={to} className={`${rowBase} no-underline focus-ring hovered:bg-hover`}>
      <IconTile icon={icon} />
      <RowText label={label} description={description} />
      {value && <span className="shrink-0 text-body-sm text-secondary">{value}</span>}
      <Icon icon={ChevronRight} size="sm" className="shrink-0 text-secondary" />
    </Link>
  );
}

/** Linha da Danger zone: rótulo e ajuda à esquerda, ação em pílula de 32 px à direita. */
function DangerRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className={rowBase}>
      <RowText label={label} description={description} />
      {children}
    </div>
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
  const base = `/settings/teams/${team.slug}`;

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
    <div className="flex flex-col gap-12 pt-8">
      {/* No canto do painel, fora da coluna (como o Linear: "‹ Teams" leva à lista). */}
      <nav aria-label="Breadcrumb" className="absolute top-3 left-4">
        <Link
          to="/settings/teams"
          className="flex h-control-md items-center gap-1.5 rounded-full pr-3 pl-2 text-label-md text-secondary no-underline transition-colors select-none focus-ring hovered:bg-hover hovered:text-primary"
        >
          <Icon icon={ChevronLeft} size="sm" />
          Teams
        </Link>
      </nav>

      <div className="flex flex-col gap-10">
        <div className="flex items-start justify-between gap-4 px-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="type-heading-1 truncate text-primary">{team.name}</h1>
            <p className="text-body-md text-secondary">Accessible to all workspace members</p>
          </div>
          {/* No Linear "Team overview" é um botão pequeno, não um título: leva à home do time. */}
          <Button
            type="button"
            variant="ghost"
            className="mt-7 h-control-sm gap-1 pr-1.5 pl-2 text-label-sm"
            onClick={() => navigate(`/teams/${team.slug}`)}
          >
            Team overview
            <Icon icon={ChevronRight} size="xs" />
          </Button>
        </div>

        <Card>
          <HubLink
            to={`${base}/general`}
            icon={Settings}
            label="General"
            description="Name, identifier, timezone, estimates, and broader settings"
          />
          <HubLink
            to={`${base}/members`}
            icon={UsersRound}
            label="Members"
            description="Manage team members"
            value={
              memberCount === undefined
                ? undefined
                : `${memberCount} ${memberCount === 1 ? "member" : "members"}`
            }
          />
          <HubLink
            to={`${base}/slack`}
            icon={Hash}
            label="Slack notifications"
            description="Broadcast notifications to Slack"
            value="Off"
          />
        </Card>
      </div>

      <Section title="Issues, projects, and documents">
        <HubLink
          to={`${base}/issue-labels`}
          icon={Tag}
          label="Issue labels"
          description="Labels available to this team’s issues"
          value="None"
        />
        <HubLink
          to={`${base}/project-labels`}
          icon={Tag}
          label="Project labels"
          description="Labels available to this team’s projects"
        />
        <HubLink
          to={`${base}/templates`}
          icon={SquareStack}
          label="Templates"
          description="Pre-filled templates for issues, documents, and projects"
          value="None"
        />
        <HubLink
          to={`${base}/recurring-issues`}
          icon={Repeat}
          label="Recurring issues"
          description="Automatically create issues on a schedule"
          value="None"
        />
      </Section>

      <Section title="Workflow">
        <HubLink
          to={`${base}/statuses`}
          icon={CircleDashed}
          label="Issue statuses"
          description="Customize the statuses issues go through"
        />
        <HubLink
          to={`${base}/project-statuses`}
          icon={CircleDashed}
          label="Project statuses"
          description="Customize the statuses projects go through"
        />
        <HubLink
          to={`${base}/workflows`}
          icon={Workflow}
          label="Workflows & automations"
          description="Manage issue automations, git workflows and other workflows"
        />
        <HubLink
          to={`${base}/triage`}
          icon={Inbox}
          label="Triage"
          description="Streamline how you handle requests from outside your team"
          value="Off"
        />
        <HubLink
          to={`${base}/cycles`}
          icon={RefreshCw}
          label="Cycles"
          description="Focus your team over short, time-boxed windows"
          value="Off"
        />
      </Section>

      <Section title="AI & Agents">
        <HubLink
          to={`${base}/agents`}
          icon={Bot}
          label="Team agents"
          description="Add guidance for how agents should operate within this team"
        />
        <HubLink
          to={`${base}/agent-skills`}
          icon={Sparkles}
          label="Agent skills"
          description="Agent skills shared with this team"
          value="None"
        />
        <HubLink
          to={`${base}/agent-connectors`}
          icon={Plug}
          label="Agent connectors"
          description="MCP connectors shared with this team"
          value="None"
        />
        <HubLink
          to={`${base}/project-updates`}
          icon={Megaphone}
          label="Project updates"
          description="Automatically generate updates using recent activity and defined rules"
        />
        <HubLink
          to={`${base}/thread-summaries`}
          icon={MessageSquareText}
          label="Resolved thread summaries"
          description="Automatically generate summaries for resolved threads"
        />
      </Section>

      <Section
        title="Team hierarchy"
        description="Teams can be nested to reflect your team structure and to share workflows and settings."
      >
        <HubLink
          to={`${base}/parent-team`}
          icon={Network}
          label="Parent team"
          description="Nest this team under another to share workflows and settings"
        />
      </Section>

      <Section title="Danger zone">
        <DangerRow label="Leave team" description="Remove yourself as a member of this team">
          <Button type="button" variant="ghost" className="h-control-lg" disabled>
            Leave team…
          </Button>
        </DangerRow>
        <DangerRow
          label="Retire team"
          description="Prevent creating and updating issues in this team while preserving all historical data"
        >
          <Button type="button" variant="ghost" className="h-control-lg" disabled>
            Retire…
          </Button>
        </DangerRow>
        <DangerRow
          label="Delete team"
          description="Permanently delete this team and all its data, immediately"
        >
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
            <Button
              type="button"
              variant="ghost"
              className="h-control-lg"
              aria-label="Delete team"
              loading={remove.isPending}
            >
              Delete…
            </Button>
          </Confirm>
        </DangerRow>
      </Section>
    </div>
  );
}
