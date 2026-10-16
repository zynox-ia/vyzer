/**
 * Sitemap da sidebar (Missão 02, navegação): a ÚNICA definição central — rótulos, rotas e ícones
 * — de HOME, BUSINESS e PLATFORM. `sidebar.tsx` só percorre isto; nenhuma outra lista duplica os
 * destinos. Nem toda entrada é um link: uma "group" é um macro que só expande/recolhe (Dashboard,
 * Projects, CRM, Finance, AI Tools), uma "link" é destino de verdade. `prefKey` existe só nos 3
 * itens que o Customize sidebar também controla (`sidebar-items.ts`, intocado por esta missão):
 * Inbox, AI Chat e a micro "Projects" dentro do macro Projects.
 *
 * Rotas reaproveitadas: Inbox (`/inbox`), AI Chat (`/agent`, AgentPage), Projects › Projects
 * (`/projects`, ProjectsListPage — `/projects/:projectId` continua) e Settings (`/settings`,
 * rota irmã do AppShell, nav própria). As demais são rotas novas e mínimas (placeholder "Coming
 * Soon"), em kebab-case do rótulo; a "Overview" de cada macro de negócio vai na própria raiz do
 * macro (`/crm`, `/finance`), não em "/crm/overview" — só Dashboard, que não é uma raiz de URL
 * própria, abre em "/dashboard".
 */
import {
  Activity,
  ArrowLeftRight,
  Banknote,
  Bot,
  BookOpen,
  Box,
  Briefcase,
  Building,
  Calendar,
  ChartColumn,
  CircleDollarSign,
  Columns3,
  Contact,
  FileText,
  Folder,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  Milestone,
  Play,
  Receipt,
  RefreshCw,
  ScrollText,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { SidebarItemKey } from "./sidebar-items";

export type NavLink = {
  kind: "link";
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  /** Chave do Customize sidebar (`sidebar-items.ts`); só os 3 itens mapeáveis a têm. */
  prefKey?: SidebarItemKey;
};

export type NavGroup = {
  kind: "group";
  id: string;
  label: string;
  icon: LucideIcon;
  children: NavLink[];
};

export type NavEntry = NavLink | NavGroup;

export type NavSection = {
  id: string;
  title: string;
  items: NavEntry[];
};

export const SITEMAP: NavSection[] = [
  {
    id: "home",
    title: "Home",
    items: [
      {
        kind: "group",
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        children: [
          {
            kind: "link",
            id: "dashboard-overview",
            label: "Overview",
            icon: LayoutGrid,
            to: "/dashboard",
          },
          {
            kind: "link",
            id: "dashboard-my-activity",
            label: "My Activity",
            icon: Activity,
            to: "/dashboard/my-activity",
          },
        ],
      },
      { kind: "link", id: "inbox", label: "Inbox", icon: Inbox, to: "/inbox", prefKey: "inbox" },
      {
        kind: "link",
        id: "agent",
        label: "AI Chat",
        icon: Bot,
        to: "/agent",
        prefKey: "agent",
      },
    ],
  },
  {
    id: "business",
    title: "Business",
    items: [
      {
        kind: "group",
        id: "projects",
        label: "Projects",
        icon: Box,
        children: [
          {
            kind: "link",
            id: "projects-portfolio",
            label: "Portfolio",
            icon: Briefcase,
            to: "/projects/portfolio",
          },
          {
            kind: "link",
            id: "projects-link",
            label: "Projects",
            icon: Folder,
            to: "/projects",
            prefKey: "projects",
          },
          {
            kind: "link",
            id: "projects-tasks",
            label: "Tasks",
            icon: ListChecks,
            to: "/projects/tasks",
          },
          {
            kind: "link",
            id: "projects-milestones",
            label: "Milestones",
            icon: Milestone,
            to: "/projects/milestones",
          },
          {
            kind: "link",
            id: "projects-calendar",
            label: "Calendar",
            icon: Calendar,
            to: "/projects/calendar",
          },
        ],
      },
      {
        kind: "group",
        id: "crm",
        label: "CRM",
        icon: Users,
        children: [
          { kind: "link", id: "crm-overview", label: "Overview", icon: LayoutGrid, to: "/crm" },
          { kind: "link", id: "crm-leads", label: "Leads", icon: UserPlus, to: "/crm/leads" },
          {
            kind: "link",
            id: "crm-pipelines",
            label: "Pipelines",
            icon: Columns3,
            to: "/crm/pipelines",
          },
          {
            kind: "link",
            id: "crm-deals",
            label: "Deals",
            icon: CircleDollarSign,
            to: "/crm/deals",
          },
          {
            kind: "link",
            id: "crm-contacts",
            label: "Contacts",
            icon: Contact,
            to: "/crm/contacts",
          },
          {
            kind: "link",
            id: "crm-companies",
            label: "Companies",
            icon: Building,
            to: "/crm/companies",
          },
        ],
      },
      {
        kind: "group",
        id: "finance",
        label: "Finance",
        icon: Wallet,
        children: [
          {
            kind: "link",
            id: "finance-overview",
            label: "Overview",
            icon: LayoutGrid,
            to: "/finance",
          },
          {
            kind: "link",
            id: "finance-cash-flow",
            label: "Cash Flow",
            icon: ArrowLeftRight,
            to: "/finance/cash-flow",
          },
          {
            kind: "link",
            id: "finance-accounts",
            label: "Accounts",
            icon: Banknote,
            to: "/finance/accounts",
          },
          {
            kind: "link",
            id: "finance-transactions",
            label: "Transactions",
            icon: Receipt,
            to: "/finance/transactions",
          },
          {
            kind: "link",
            id: "finance-invoices",
            label: "Invoices",
            icon: FileText,
            to: "/finance/invoices",
          },
          {
            kind: "link",
            id: "finance-recurring",
            label: "Recurring",
            icon: RefreshCw,
            to: "/finance/recurring",
          },
        ],
      },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    items: [
      {
        kind: "group",
        id: "ai-tools",
        label: "AI Tools",
        icon: Sparkles,
        children: [
          {
            kind: "link",
            id: "ai-tools-agents",
            label: "Agents",
            icon: Bot,
            to: "/ai-tools/agents",
          },
          {
            kind: "link",
            id: "ai-tools-workflows",
            label: "Workflows",
            icon: Workflow,
            to: "/ai-tools/workflows",
          },
          {
            kind: "link",
            id: "ai-tools-tools",
            label: "Tools",
            icon: Wrench,
            to: "/ai-tools/tools",
          },
          {
            kind: "link",
            id: "ai-tools-knowledge",
            label: "Knowledge",
            icon: BookOpen,
            to: "/ai-tools/knowledge",
          },
          {
            kind: "link",
            id: "ai-tools-executions",
            label: "Executions",
            icon: Play,
            to: "/ai-tools/executions",
          },
        ],
      },
      {
        kind: "group",
        id: "analytics",
        label: "Analytics",
        icon: ChartColumn,
        children: [
          {
            kind: "link",
            id: "analytics-dashboards",
            label: "Dashboards",
            icon: LayoutDashboard,
            to: "/analytics/dashboards",
          },
          {
            kind: "link",
            id: "analytics-reports",
            label: "Reports",
            icon: ScrollText,
            to: "/analytics/reports",
          },
          {
            kind: "link",
            id: "analytics-insights",
            label: "Insights",
            icon: Lightbulb,
            to: "/analytics/insights",
          },
        ],
      },
    ],
  },
];
