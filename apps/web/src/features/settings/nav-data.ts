/**
 * Grupos da navegação de Settings (Figma 33:20122): Personal, Issues, Projects, Features,
 * Administration e Your teams. Administration e Your teams ficam sempre no container nesta fase
 * — a regra de visibilidade por Role (só Admin vê Administration) é comportamento de produto,
 * fora do escopo do layout (spec, "Fora do escopo").
 */
import {
  Bell,
  Building2,
  CircleDashed,
  Code,
  FileText,
  Gauge,
  Key,
  LayoutGrid,
  Link2,
  Lock,
  Megaphone,
  MessageCircleQuestion,
  MessageSquare,
  Orbit,
  Plug,
  Plus,
  Rocket,
  Shield,
  Sliders,
  Smile,
  SquareStack,
  Sparkles,
  Tag,
  Target,
  Timer,
  UserCog,
  UserRound,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";
import type { SettingsGroup } from "@/layouts/app-shell/settings-layout";

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: "Personal",
    links: [
      { to: "/settings/preferences", label: "Preferences", icon: Sliders },
      { to: "/settings/profile", label: "Profile", icon: UserRound },
      { to: "/settings/notifications", label: "Notifications", icon: Bell },
      { to: "/settings/code-reviews", label: "Code & reviews", icon: Code },
      { to: "/settings/security", label: "Security & access", icon: Lock },
      { to: "/settings/connected-accounts", label: "Connected accounts", icon: Link2 },
      { to: "/settings/agent-personalization", label: "Agent personalization", icon: UserCog },
    ],
  },
  {
    title: "Issues",
    links: [
      { to: "/settings/issues/labels", label: "Labels", icon: Tag },
      { to: "/settings/issues/templates", label: "Templates", icon: SquareStack },
      { to: "/settings/issues/slas", label: "SLAs", icon: Timer },
    ],
  },
  {
    title: "Projects",
    links: [
      { to: "/settings/projects/labels", label: "Labels", icon: Tag },
      { to: "/settings/projects/templates", label: "Templates", icon: SquareStack },
      { to: "/settings/projects/statuses", label: "Statuses", icon: CircleDashed },
      { to: "/settings/projects/updates", label: "Updates", icon: Megaphone },
    ],
  },
  {
    title: "Features",
    links: [
      { to: "/settings/ai-agents", label: "AI & Agents", icon: Sparkles },
      { to: "/settings/loops", label: "Loops", icon: Workflow },
      { to: "/settings/initiatives", label: "Initiatives", icon: Target },
      { to: "/settings/documents", label: "Documents", icon: FileText },
      {
        to: "/settings/customer-requests",
        label: "Customer requests",
        icon: MessageCircleQuestion,
      },
      { to: "/settings/releases", label: "Releases", icon: Rocket },
      { to: "/settings/pulse", label: "Pulse", icon: Zap },
      { to: "/settings/asks", label: "Asks", icon: MessageSquare },
      { to: "/settings/emojis", label: "Emojis", icon: Smile },
      { to: "/settings/integrations", label: "Integrations", icon: Plug },
    ],
  },
  {
    title: "Administration",
    links: [
      { to: "/settings/workspace", label: "Workspace", icon: Building2 },
      { to: "/settings/teams", label: "Teams", icon: UsersRound },
      { to: "/settings/members", label: "Members", icon: UserRound },
      { to: "/settings/security-admin", label: "Security", icon: Shield },
      { to: "/settings/api", label: "API", icon: Key },
      { to: "/settings/applications", label: "Applications", icon: LayoutGrid },
      { to: "/settings/usage", label: "Usage & limits", icon: Gauge },
    ],
  },
  {
    title: "Your teams",
    links: [
      { to: "/settings/teams/vyzer", label: "Vyzer", icon: Zap },
      { to: "/settings/teams/zynox", label: "Zynox", icon: Orbit },
      { to: "/settings/teams/new", label: "Create a team", icon: Plus },
    ],
  },
];
