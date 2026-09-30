/**
 * Página de espera de uma linha do Overview do Team (`/settings/teams/:team/<destino>`): o
 * caminho "Teams › Nome › Título" e uma frase, até o domínio da linha existir.
 */
import { SettingsPlaceholderPage } from "../settings-placeholder";
import { TeamBreadcrumb, useTeam } from "./layout";

export function TeamPlaceholderPage({ title }: { title: string }) {
  const team = useTeam();
  return (
    <div className="flex flex-col">
      <TeamBreadcrumb team={team} page={title} />
      <SettingsPlaceholderPage title={title} />
    </div>
  );
}

/** Destinos do Overview que ainda não têm página própria. */
export const teamPlaceholderPages: { path: string; title: string }[] = [
  { path: "access", title: "Access and permissions" },
  { path: "slack", title: "Slack notifications" },
  { path: "issue-labels", title: "Issue labels" },
  { path: "project-labels", title: "Project labels" },
  { path: "templates", title: "Templates" },
  { path: "recurring-issues", title: "Recurring issues" },
  { path: "project-statuses", title: "Project statuses" },
  { path: "workflows", title: "Workflows & automations" },
  { path: "triage", title: "Triage" },
  { path: "cycles", title: "Cycles" },
  { path: "agents", title: "Team agents" },
  { path: "agent-skills", title: "Agent skills" },
  { path: "agent-connectors", title: "Agent connectors" },
  { path: "project-updates", title: "Project updates" },
  { path: "thread-summaries", title: "Resolved thread summaries" },
  { path: "parent-team", title: "Parent team" },
];
