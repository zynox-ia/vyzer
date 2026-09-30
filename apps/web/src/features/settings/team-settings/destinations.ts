/**
 * Destinos de configuração de um Team, na ordem do submenu "Settings" da linha de Teams no Linear
 * (29/09): Overview, General, Access and permissions, Members, … `path` é relativo a
 * `/settings/teams/:team` (vazio = Overview). Project labels e Parent team ficam liberados
 * (pedido do responsável), no fim.
 */
import {
  Bot,
  Box,
  CircleDashed,
  Cog,
  Globe,
  Inbox,
  LayoutDashboard,
  Lock,
  Megaphone,
  MessageSquareText,
  Network,
  Play,
  Repeat,
  SquareCheck,
  SquareStack,
  Tag,
  UsersRound,
  Hash,
  type LucideIcon,
} from "lucide-react";

export type TeamDestination = { path: string; label: string; icon: LucideIcon };

export const TEAM_DESTINATIONS: TeamDestination[] = [
  { path: "", label: "Overview", icon: LayoutDashboard },
  { path: "general", label: "General", icon: Cog },
  { path: "access", label: "Access and permissions", icon: Lock },
  { path: "members", label: "Members", icon: UsersRound },
  { path: "issue-labels", label: "Issue labels", icon: Tag },
  { path: "project-labels", label: "Project labels", icon: Tag },
  { path: "templates", label: "Templates", icon: SquareStack },
  { path: "recurring-issues", label: "Recurring issues", icon: Repeat },
  { path: "slack", label: "Slack notifications", icon: Hash },
  { path: "agents", label: "Team agents", icon: Bot },
  { path: "agent-skills", label: "Agent skills", icon: Box },
  { path: "agent-connectors", label: "Agent connectors", icon: Globe },
  { path: "issue-statuses", label: "Issue statuses", icon: CircleDashed },
  { path: "workflows", label: "Workflows & automations", icon: SquareCheck },
  { path: "triage", label: "Triage", icon: Inbox },
  { path: "cycles", label: "Cycles", icon: Play },
  { path: "project-updates", label: "Project updates", icon: Megaphone },
  { path: "thread-summaries", label: "Resolved thread summaries", icon: MessageSquareText },
  { path: "parent-team", label: "Parent team", icon: Network },
];
