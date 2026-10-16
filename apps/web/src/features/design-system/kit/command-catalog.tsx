/**
 * Catálogo do Command Menu (⌘K), copiado do Linear como ele funciona hoje: lido no app (Ctrl+K em
 * My issues e com uma issue aberta, lista inteira), conferido com o Figma 38:2 no trecho que ele
 * cobre e com a documentação pública (ciclo, estimativa, sub-issue). "Linear" vira "Zynox" onde é
 * o nome do produto. Ícones lucide equivalentes (o Linear usa ícones genéricos por família, como a
 * seta dos "Go to…"); status, prioridade, pessoas, projetos e labels vêm dos kits. Só para a
 * documentação.
 */
import {
  Avatar,
  ColorDot,
  ProjectIcon,
  type CommandItemContentProps,
} from "@zynox/design-system/components";
import { Icon, StatusIcon } from "@zynox/design-system/icons";
import {
  AlarmClock,
  AppWindow,
  Archive,
  ArrowRight,
  ArrowRightLeft,
  Bell,
  BookOpen,
  Box,
  Building2,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  Circle,
  CircleAlert,
  CircleDashed,
  CircleHelp,
  Clipboard,
  Clock,
  Code,
  Copy,
  CopyPlus,
  CornerLeftUp,
  CreditCard,
  Crosshair,
  Download,
  Eye,
  EyeOff,
  FileStack,
  FileText,
  Flag,
  GitBranch,
  GitPullRequest,
  Gauge,
  Hash,
  History,
  Import,
  Inbox,
  Key,
  Keyboard,
  Layers,
  LayoutGrid,
  Link,
  Link2,
  ListChecks,
  ListFilter,
  Lock,
  LogOut,
  Megaphone,
  MessageCircleQuestion,
  MessageSquare,
  Monitor,
  MonitorDown,
  Moon,
  PanelLeft,
  PanelRight,
  Plug,
  Plus,
  RefreshCcw,
  Repeat,
  Rocket,
  RotateCcw,
  Rows3,
  ScanSearch,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Smile,
  Sparkles,
  SquareMousePointer,
  SquarePen,
  SquareStack,
  SquareTerminal,
  Star,
  Sun,
  Tag,
  Target,
  TextSearch,
  Timer,
  Trash2,
  Triangle,
  Unlink,
  UserCog,
  UserRound,
  UserRoundMinus,
  UserRoundPlus,
  UsersRound,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { isValidElement, type ReactNode } from "react";
import { DEFAULT_PROPERTIES, FILTER_SECTIONS, LIST_PROPERTIES } from "./filter-data";
import { ISSUES, PEOPLE, SUB_ISSUES, issueById, statusValue } from "./issue-data";
import {
  INITIAL_LABELS,
  PRIORITIES,
  PROJECT_OPTIONS,
  PROJECT_STATUSES,
  TEAMS,
} from "./project-data";

/** Contexto do menu: numa lista (My issues) ou com uma issue aberta. */
export type CommandContext = "view" | "issue";

export type CommandEntry = Omit<CommandItemContentProps, "children"> & {
  label: string;
  /** Texto secundário antes do rótulo (o ID da issue). */
  prefix?: string;
  /** Texto secundário depois do rótulo (a chave do time, "Agent", a issue pai). */
  detail?: string;
  /** Valor atual da issue em foco: marca à direita, como no Linear. */
  checked?: boolean;
  keywords?: string[];
  /** Página que a linha abre; sem ela, a linha executa a ação. */
  page?: string;
  /** Só aparece neste contexto; sem ele, nos dois. */
  context?: CommandContext;
};

export type CommandSection = {
  heading?: string;
  context?: CommandContext;
  items: CommandEntry[];
};

export type CommandPage = {
  /** Nome na trilha e no prefixo da busca da página inicial. */
  title: string;
  placeholder: string;
  sections: CommandSection[];
  /** Texto da página sem itens. */
  empty?: string;
  /**
   * Os itens aparecem também na busca da página inicial, depois do título ("Change status ›
   * Done"): no Linear, as páginas de valor (status, prioridade, tema), não as de navegação.
   */
  searchable?: boolean;
};

const then = (...keys: string[]) => ({ shortcut: keys });
const plus = (...keys: string[]) => ({ shortcut: keys, shortcutMode: "plus" as const });

/** Ícone lucide em cinza, como os ícones do slot (para valores de página). */
const glyph = (icon: LucideIcon) => <Icon icon={icon} className="text-secondary" />;

/** Os ícones dos kits (ListOption, IssueValue) são ReactNode; o slot do menu aceita elementos. */
const element = (node: ReactNode) => (isValidElement(node) ? node : undefined);

/** Issue em foco no contexto "issue": sub-issue de ZYN-33 (Tree, issue-data). */
const FOCUS = SUB_ISSUES[0]!.children!.find((i) => i.id === "ZYN-45")!;
const PARENT = issueById("ZYN-33");

export const FOCUS_ISSUE = FOCUS;

/** Chip de contexto acima da busca (o "VYZ-31 ⋅ título" do Linear). */
export const FOCUS_CHIP = `${FOCUS.id} · ${FOCUS.title}`;

/** Times do workspace: o Zynox dos kits e o Zynox (raio, como o ícone do time no Linear). */
const WORKSPACE_TEAMS = [
  ...TEAMS,
  {
    value: "atlas",
    label: "Atlas",
    hint: "VYZ",
    icon: <ProjectIcon value={{ kind: "icon", name: "Zap", color: "amber" }} />,
  },
];

const teamEntries = (checkedValue?: string, shortcuts = false): CommandEntry[] =>
  WORKSPACE_TEAMS.map((t, i) => ({
    label: t.label,
    detail: t.hint,
    icon: element(t.icon),
    checked: t.value === checkedValue,
    ...(shortcuts ? plus("Ctrl", "⇧", String(i + 1)) : {}),
  }));

const projectEntries = (checkedValue?: string): CommandEntry[] =>
  PROJECT_OPTIONS.map((p) => ({
    label: p.label,
    icon: element(p.icon),
    checked: p.value === checkedValue,
  }));

const peopleEntries = (checked: string[] = []): CommandEntry[] =>
  PEOPLE.map((p) => ({
    label: p.name,
    icon: <Avatar name={p.name} size="sm" />,
    checked: checked.includes(p.name),
  }));

const AGENTS: CommandEntry[] = ["Codex", "Cursor", "Zynox"].map((name) => ({
  label: name,
  detail: "Agent",
  icon: <Avatar name={name} size="sm" />,
}));

const labelEntries = (): CommandEntry[] =>
  INITIAL_LABELS.map((l) => ({ label: l.label, icon: <ColorDot color={l.color} /> }));

/** Issues como linhas: ID em cinza antes do título e o ícone do status. */
export const issueEntries = (exclude?: string): CommandEntry[] =>
  ISSUES.filter((i) => i.id !== exclude).map((i) => ({
    label: i.title,
    prefix: i.id,
    icon: element(statusValue(i.status).icon),
  }));

/** Pull requests de exemplo (commits deste repositório). */
const PULL_REQUESTS = [
  "feat(design-system): creation composer for New view, New issue and New project (VYZ-33)",
  "feat(design-system): Chip, Popover, Toggle Group, Context Menu and Tooltip (VYZ-31)",
  "feat(design-system): form refinements, field focus, icon/emoji library, filters and Avatar (VYZ-30)",
];

/** Agrupamentos do Display options (lidos no Linear, em My issues). */
const GROUPINGS: CommandEntry[] = [
  { label: "Status", icon: CircleDashed },
  { label: "Agent", icon: SquareMousePointer },
  { label: "Project", icon: Box },
  { label: "Priority", icon: ChartNoAxesColumnIncreasing },
  { label: "Cycle", icon: RefreshCcw },
  { label: "Label", icon: Tag },
  { label: "Team", icon: UsersRound },
];

/** Relações de "Mark issue as…": cada uma abre a lista de issues. */
const RELATIONS: { key: string; label: string; shortcut?: Partial<CommandEntry> }[] = [
  { key: "parent-of", label: "Parent of" },
  { key: "sub-issue-of", label: "Sub-issue of", shortcut: plus("Ctrl", "⇧", "P") },
  { key: "related-to", label: "Related to", shortcut: then("M", "R") },
  { key: "blocked-by", label: "Blocked by", shortcut: then("M", "B") },
  { key: "blocking", label: "Blocking", shortcut: then("M", "X") },
  { key: "duplicate-of", label: "Duplicate of", shortcut: then("M", "M") },
];

/**
 * Página inicial, nos grupos e na ordem do Linear. O grupo sem rótulo do topo só existe com uma
 * issue aberta (o chip dela faz o papel de rótulo); alguns itens são só da lista.
 */
export const ROOT: CommandSection[] = [
  {
    context: "issue",
    items: [
      {
        label: "Assign to…",
        icon: UserRoundPlus,
        ...then("A"),
        page: "assign",
        keywords: ["assignee", "owner"],
      },
      { label: "Un-assign from me", icon: UserRoundMinus, ...then("I") },
      {
        label: "Change status…",
        icon: CircleDashed,
        ...then("S"),
        page: "status",
        keywords: ["state", "workflow"],
      },
      {
        label: "Set priority…",
        icon: ChartNoAxesColumnIncreasing,
        ...then("P"),
        page: "priority",
        keywords: ["urgency"],
      },
      { label: "Add to project…", icon: Box, ...plus("⇧", "P"), page: "project" },
      { label: "Add labels…", icon: Tag, ...then("L"), page: "labels", keywords: ["tags"] },
      {
        label: "Move to a different team…",
        icon: ArrowRightLeft,
        ...plus("Ctrl", "⇧", "M"),
        page: "team",
      },
      {
        label: "Add to cycle…",
        icon: RefreshCcw,
        ...plus("⇧", "C"),
        page: "cycle",
        keywords: ["sprint", "iteration"],
      },
      {
        label: "Set estimate…",
        icon: Triangle,
        ...plus("⇧", "E"),
        page: "estimate",
        keywords: ["points", "size", "effort"],
      },
      { label: "Set due date…", icon: CalendarDays, ...plus("⇧", "D"), keywords: ["deadline"] },
      { label: "Copy issue ID", icon: Hash, ...plus("Ctrl", ".") },
      { label: "Copy issue URL", icon: Link, ...plus("Ctrl", "⇧", ",") },
      { label: "Copy issue title", icon: Copy, ...plus("Ctrl", "⇧", "'") },
      { label: "Copy title as link", icon: Link2, ...plus("Ctrl", "C") },
      { label: "Copy issue as Markdown", icon: FileText },
      { label: "Copy everything as Markdown", icon: FileStack, ...plus("Ctrl", "Alt", "C") },
      {
        label: "Copy git branch name",
        icon: GitBranch,
        ...plus("Ctrl", "⇧", "."),
        keywords: ["git"],
      },
      { label: "Copy as prompt", icon: SquareTerminal, ...plus("Ctrl", "Alt", "P") },
      {
        label: "Change subscribers…",
        icon: Bell,
        ...plus("Ctrl", "⇧", "S"),
        page: "subscribers",
        keywords: ["notifications", "watch"],
      },
      {
        label: "Mark issue as…",
        icon: Flag,
        page: "relations",
        keywords: ["relation", "blocked", "duplicate", "parent"],
      },
      { label: "Remove related…", icon: Unlink, page: "remove-related" },
      { label: "Remove from parent", icon: CornerLeftUp },
      { label: "Show similar issues…", icon: ScanSearch, page: "similar" },
      { label: "Favorite issue", icon: Star, ...plus("Alt", "F") },
      { label: "Link pull request…", icon: GitPullRequest },
      { label: "Add link…", icon: Link, ...plus("Ctrl", "Alt", "L") },
      { label: "Create new document for issue…", icon: FileText },
      {
        label: "Remind me about this issue…",
        icon: AlarmClock,
        ...plus("⇧", "H"),
        keywords: ["reminder"],
      },
      { label: "Issue description history", icon: History },
      { label: "Rename issue", icon: SquarePen, ...plus("⇧", "R") },
      { label: "Make a copy as new issue…", icon: CopyPlus, keywords: ["duplicate"] },
      { label: "Create project from issue…", icon: Box },
      { label: "Convert into template…", icon: SquareStack },
      { label: "Convert into recurring issue…", icon: Repeat },
      { label: "Delete issue", icon: Trash2, ...plus("Ctrl", "⌫"), keywords: ["remove", "trash"] },
    ],
  },
  {
    heading: "Issues",
    items: [
      { label: "Create new issue…", icon: Plus, ...then("C"), keywords: ["new", "ticket", "task"] },
      { label: "Create issue in fullscreen…", icon: Plus, ...then("V") },
      {
        label: "Create new related issue…",
        icon: Plus,
        page: "related",
        context: "issue",
        keywords: ["sub-issue"],
      },
      { label: "Create new label…", icon: Tag },
    ],
  },
  {
    heading: "Projects",
    items: [{ label: "Create new project…", icon: Box, ...then("N", "P") }],
  },
  {
    heading: "Documents",
    items: [{ label: "Create new document in…", icon: FileText, page: "document-in" }],
  },
  {
    heading: "Views",
    items: [{ label: "Create view…", icon: Layers }],
  },
  {
    heading: "Team · Zynox",
    context: "issue",
    items: [
      { label: "Favorite team", icon: Star, ...plus("Alt", "F") },
      { label: "Copy team title", icon: Copy, ...plus("Ctrl", "⇧", "'") },
      { label: "Copy title as link", icon: Link2, ...plus("Ctrl", "C") },
    ],
  },
  {
    heading: "Loops",
    context: "issue",
    items: [{ label: `Run loop on ${FOCUS.id}…`, icon: Workflow }],
  },
  {
    heading: "Filter",
    items: [
      { label: "Search workspace…", icon: Search, keywords: ["find"] },
      { label: "Find in view…", icon: Search, ...plus("Ctrl", "F"), context: "view" },
      { label: "Add Filter…", icon: ListFilter, ...then("F"), page: "filter", context: "view" },
    ],
  },
  {
    heading: "Templates",
    items: [
      { label: "Create new issue template…", icon: SquareStack },
      { label: "Create new document template…", icon: SquareStack },
      { label: "Create new project template…", icon: SquareStack },
    ],
  },
  {
    heading: "Navigation",
    items: [
      { label: "Open pull requests…", icon: GitPullRequest, ...then("O", "R"), page: "prs" },
      { label: "Open last viewed issue", icon: Clock },
      {
        label: `Open parent of ${FOCUS.id}`,
        detail: `${PARENT.id} ${PARENT.title}`,
        icon: CornerLeftUp,
        ...plus("Ctrl", "⇧", "↑"),
        context: "issue",
      },
      { label: "Open in desktop app", icon: AppWindow },
      { label: "Open issue…", icon: Circle, ...then("O", "I"), page: "open-issue" },
      { label: "Open team…", icon: UsersRound, ...then("O", "T"), page: "open-team" },
      { label: "Open team archive…", icon: Archive, ...then("G", "X"), page: "team-archive" },
      { label: "Open project…", icon: Box, ...then("O", "P"), page: "open-project" },
      { label: "Open issue label…", icon: Tag, ...then("O", "L"), page: "open-label" },
      { label: "Open user…", icon: UserRound, ...then("O", "U"), page: "open-user" },
      { label: "Open view…", icon: Layers, ...then("O", "V"), page: "open-view" },
      { label: "Open document…", icon: FileText, ...then("O", "D"), page: "open-document" },
      { label: "Go to advanced search", icon: TextSearch, ...then("/") },
      { label: "Go to inbox", icon: ArrowRight, ...then("G", "I"), keywords: ["notifications"] },
      { label: "Go to Agent", icon: ArrowRight, ...then("G", "J") },
      { label: "Go to my issues", icon: ArrowRight, ...then("G", "M") },
      { label: "Go to reviews", icon: ArrowRight, ...then("G", "R"), keywords: ["pull requests"] },
      { label: "Go to drafts", icon: ArrowRight, ...then("G", "D") },
      { label: "Go to active issues", icon: ArrowRight, ...then("G", "A") },
      { label: "Go to backlog", icon: ArrowRight, ...then("G", "B") },
      { label: "Go to all issues", icon: ArrowRight, ...then("G", "E") },
      { label: "Go to projects", icon: ArrowRight, ...then("G", "P") },
      { label: "Enable initiatives", icon: ArrowRight, ...then("G", "N") },
      { label: "Go to views", icon: ArrowRight, ...then("G", "U") },
      { label: "Go to teams", icon: ArrowRight },
      { label: "Go to recently deleted issues", icon: ArrowRight, keywords: ["trash"] },
      { label: "Go to recently deleted projects", icon: ArrowRight, keywords: ["trash"] },
      { label: "Go to recently deleted initiatives", icon: ArrowRight, keywords: ["trash"] },
      { label: "Go to recently deleted documents", icon: ArrowRight, keywords: ["trash"] },
      { label: "Open suspended user…", icon: UserRound, page: "suspended-user" },
      { label: "Download desktop app", icon: MonitorDown },
      { label: "Go to settings", icon: ArrowRight, ...then("G", "S") },
      {
        label: "Open settings…",
        icon: Settings,
        ...then("O", "S"),
        page: "settings",
        keywords: ["preferences"],
      },
      {
        label: "Collapse navigation sidebar",
        icon: PanelLeft,
        ...then("["),
        keywords: ["hide sidebar"],
      },
      { label: "Open details", icon: ArrowRight, ...then("]"), context: "view" },
      { label: "Open sidebar details", icon: PanelRight, ...plus("Ctrl", "I"), context: "view" },
    ],
  },
  {
    heading: "Display options",
    context: "view",
    items: [
      {
        label: "Display options…",
        icon: SlidersHorizontal,
        page: "display",
        keywords: ["grouping", "ordering", "layout"],
      },
    ],
  },
  {
    heading: "AI panel",
    items: [
      { label: "Ask Zynox", icon: Sparkles, ...plus("Ctrl", "J"), keywords: ["ai", "assistant"] },
      { label: "Open agent chat…", icon: History, page: "agent-chat" },
    ],
  },
  {
    heading: "Miscellaneous",
    items: [
      { label: "Copy page URL", icon: Clipboard, ...plus("Ctrl", "⇧", "C"), keywords: ["link"] },
      { label: "Select all", icon: ArrowRight, ...plus("Ctrl", "A"), context: "view" },
    ],
  },
  {
    heading: "Export",
    items: [
      { label: "Export issues as CSV…", icon: Download },
      { label: "Export customer requests as CSV…", icon: Download, context: "issue" },
    ],
  },
  {
    heading: "Settings",
    items: [
      {
        label: "Change interface theme…",
        icon: Settings,
        page: "theme",
        keywords: ["dark mode", "light mode", "appearance"],
      },
      { label: "Change default view…", icon: Settings, page: "default-view" },
      { label: "Invite to Zynox…", icon: Plus, keywords: ["members", "people"] },
    ],
  },
  {
    heading: "Teams",
    items: [
      { label: "Create a team…", icon: ArrowRight },
      { label: "Leave team…", icon: UserRoundMinus, context: "issue" },
    ],
  },
  {
    heading: "Help",
    items: [
      { label: "Contact support", icon: CircleHelp, keywords: ["help"] },
      { label: "Send feedback", icon: MessageSquare },
      { label: "Open Zynox Documentation", icon: BookOpen, keywords: ["help", "docs"] },
      { label: "Open API Documentation", icon: BookOpen, keywords: ["docs"] },
      { label: "Zynox status", icon: CircleAlert, keywords: ["uptime", "incident"] },
      { label: "Report performance problem", icon: Gauge },
      {
        label: "Open Keyboard Shortcuts Cheat Sheet",
        icon: Keyboard,
        ...plus("Ctrl", "/"),
        keywords: ["hotkeys", "keys"],
      },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Create or join a workspace…", icon: Building2 },
      { label: "Log out", icon: LogOut, ...plus("Alt", "⇧", "Q"), keywords: ["sign out"] },
    ],
  },
];

/** Seções da página inicial num contexto. */
export function rootSections(context: CommandContext): CommandSection[] {
  return ROOT.filter((s) => !s.context || s.context === context)
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.context || i.context === context) }))
    .filter((s) => s.items.length > 0);
}

const relationPages = Object.fromEntries(
  RELATIONS.map((r): [string, CommandPage] => [
    r.key,
    {
      title: r.label,
      placeholder: `${r.label}…`,
      sections: [{ items: issueEntries(FOCUS.id) }],
    },
  ]),
);

/** Páginas que os itens com "…" abrem, pela chave de `page`. */
export const PAGES: Record<string, CommandPage> = {
  // Com a issue aberta: o valor atual dela marcado.
  status: {
    title: "Change status",
    placeholder: "Change status to…",
    searchable: true,
    sections: [
      {
        items: PROJECT_STATUSES.map((s) => ({
          label: s.label,
          icon: element(s.icon),
          checked: s.value === FOCUS.status,
          // Os dois "Ready" do kit: a busca distingue pelo tipo.
          keywords: s.value === "ready-started" ? ["started"] : undefined,
        })),
      },
    ],
  },
  priority: {
    title: "Set priority",
    placeholder: "Set priority to…",
    searchable: true,
    sections: [
      {
        items: PRIORITIES.map((p) => ({
          label: p.label,
          icon: element(p.icon),
          checked: p.value === FOCUS.priority,
        })),
      },
    ],
  },
  assign: {
    title: "Assign to",
    placeholder: "Assign to…",
    searchable: true,
    sections: [
      {
        items: [
          { label: "No assignee", icon: glyph(UserRound) },
          ...peopleEntries(FOCUS.assignee ? [FOCUS.assignee.name] : []),
        ],
      },
      { heading: "Agents", items: AGENTS },
    ],
  },
  labels: {
    title: "Add labels",
    placeholder: "Add labels…",
    searchable: true,
    sections: [{ items: labelEntries() }],
  },
  project: {
    title: "Add to project",
    placeholder: "Add to project…",
    searchable: true,
    sections: [{ items: [{ label: "No project", icon: glyph(Box) }, ...projectEntries()] }],
  },
  team: {
    title: "Move to a different team",
    placeholder: "Move to team…",
    searchable: true,
    sections: [{ items: teamEntries("zynox") }],
  },
  cycle: {
    title: "Add to cycle",
    placeholder: "Add to cycle…",
    searchable: true,
    sections: [
      {
        items: [
          { label: "No cycle", icon: glyph(CircleDashed), checked: true },
          { label: "Cycle 12", detail: "Current", icon: glyph(RefreshCcw) },
          { label: "Cycle 13", detail: "Next", icon: glyph(RefreshCcw) },
          { label: "Cycle 14", detail: "Upcoming", icon: glyph(RefreshCcw) },
        ],
      },
    ],
  },
  estimate: {
    title: "Set estimate",
    placeholder: "Set estimate to…",
    searchable: true,
    // Escala Fibonacci (a padrão do Linear para times com estimativa).
    sections: [
      {
        items: [
          { label: "No estimate", icon: glyph(Triangle), checked: true },
          ...[1, 2, 3, 5, 8].map((n) => ({
            label: `${n} ${n === 1 ? "point" : "points"}`,
            icon: glyph(Triangle),
          })),
        ],
      },
    ],
  },
  subscribers: {
    title: "Change subscribers",
    placeholder: "Change subscribers…",
    sections: [{ items: peopleEntries(["André Júnio", "Marina Costa"]) }],
  },
  relations: {
    title: "Mark issue as",
    placeholder: "Mark issue as…",
    searchable: true,
    sections: [
      {
        items: RELATIONS.map((r) => ({
          label: `${r.label}…`,
          icon: Flag,
          page: r.key,
          ...r.shortcut,
        })),
      },
    ],
  },
  ...relationPages,
  "remove-related": {
    title: "Remove related",
    placeholder: "Remove related…",
    searchable: true,
    sections: [
      {
        items: [
          {
            label: issueById("ZYN-31").title,
            prefix: `Related issue ${issueById("ZYN-31").id}`,
            icon: element(statusValue(issueById("ZYN-31").status).icon),
          },
        ],
      },
    ],
  },
  similar: {
    title: "Show similar issues",
    placeholder: "Similar issues…",
    empty: "No similar issues",
    sections: [],
  },
  related: {
    title: "Create new related issue",
    placeholder: "Create new related issue…",
    searchable: true,
    sections: [
      {
        items: [
          { label: "Related issue…", icon: Plus },
          { label: "Blocking issue…", icon: Plus },
          { label: "Blocked issue…", icon: Plus },
          { label: "Sub-issue…", icon: Plus, ...plus("Ctrl", "⇧", "O") },
          { label: "Parent issue…", icon: Plus },
        ],
      },
    ],
  },
  "document-in": {
    title: "Create document in",
    placeholder: "Create document in…",
    sections: [
      { heading: "My teams", items: teamEntries() },
      { heading: "Projects", items: projectEntries() },
    ],
  },
  prs: {
    title: "Open pull requests",
    placeholder: "Open pull requests…",
    sections: [{ items: PULL_REQUESTS.map((label) => ({ label, icon: GitPullRequest })) }],
  },
  "open-issue": {
    title: "Open issue",
    placeholder: "Open issue…",
    sections: [{ items: issueEntries() }],
  },
  "open-team": {
    title: "Open team",
    placeholder: "Open team…",
    sections: [{ heading: "Navigation", items: teamEntries(undefined, true) }],
  },
  "team-archive": {
    title: "Open team archive",
    placeholder: "Open team archive…",
    sections: [{ heading: "Navigation", items: teamEntries(undefined, true) }],
  },
  "open-project": {
    title: "Open project",
    placeholder: "Open project…",
    sections: [{ items: projectEntries() }],
  },
  "open-label": {
    title: "Open issue label",
    placeholder: "Open issue label…",
    sections: [{ heading: "Workspace", items: labelEntries() }],
  },
  "open-user": {
    title: "Open user",
    placeholder: "Open user…",
    sections: [{ items: [...peopleEntries(), ...AGENTS] }],
  },
  "open-view": {
    title: "Open view",
    placeholder: "Open view…",
    sections: [
      {
        heading: "Team views",
        items: WORKSPACE_TEAMS.flatMap((t) => [
          { label: "All issues", prefix: `${t.label} ›`, icon: Layers },
          { label: "Active", prefix: `${t.label} ›`, icon: <StatusIcon type="started" /> },
          { label: "Backlog", prefix: `${t.label} ›`, icon: <StatusIcon type="backlog" /> },
          { label: "All projects", prefix: `${t.label} ›`, icon: Box },
        ]),
      },
    ],
  },
  "open-document": {
    title: "Open document",
    placeholder: "Open document…",
    empty: "No documents",
    sections: [],
  },
  "suspended-user": {
    title: "Open suspended user",
    placeholder: "Open suspended user…",
    empty: "No suspended users",
    sections: [],
  },
  settings: {
    title: "Open settings",
    placeholder: "Open settings…",
    sections: [
      {
        items: [
          { label: "Preferences", icon: SlidersHorizontal },
          { label: "Profile", icon: UserRound },
          { label: "Notifications", icon: Bell },
          { label: "Code & reviews", icon: Code },
          { label: "Security & access", icon: Lock },
          { label: "Connected accounts", icon: Link2 },
          { label: "Agent personalization", icon: UserCog },
        ],
      },
      {
        heading: "Issues",
        items: [
          { label: "Labels", icon: Tag },
          { label: "Templates", icon: SquareStack },
          { label: "SLAs", icon: Timer },
        ],
      },
      {
        heading: "Projects",
        items: [
          { label: "Labels", icon: Tag },
          { label: "Templates", icon: SquareStack },
          { label: "Updates", icon: Megaphone },
        ],
      },
      {
        heading: "Features",
        items: [
          { label: "AI & Agents", icon: Sparkles },
          { label: "Loops", icon: Workflow },
          { label: "Initiatives", icon: Target },
          { label: "Documents", icon: FileText },
          { label: "Customer requests", icon: MessageCircleQuestion },
          { label: "Releases", icon: Rocket },
          { label: "Pulse", icon: Zap },
          { label: "Asks", icon: MessageSquare },
          { label: "Emojis", icon: Smile },
        ],
      },
      {
        heading: "Administration",
        items: [
          { label: "Workspace", icon: Building2 },
          { label: "Teams", icon: UsersRound },
          { label: "Members", icon: UserRound },
          { label: "Security", icon: Shield },
          { label: "API", icon: Key },
          { label: "Applications", icon: LayoutGrid },
          { label: "Billing", icon: CreditCard },
          { label: "Usage & limits", icon: Gauge },
          { label: "Import & export", icon: Import },
        ],
      },
      { heading: "Teams Settings", items: teamEntries() },
      { heading: "Integrations", items: [{ label: "Integrations…", icon: Plug }] },
    ],
  },
  theme: {
    title: "Change interface theme",
    placeholder: "Change interface theme to…",
    searchable: true,
    // O Zynox tem dois temas (ADR-0013); os demais temas do Linear ficam de fora.
    sections: [
      {
        items: [
          { label: "System preference", icon: Monitor },
          { label: "Light", icon: Sun },
          { label: "Dark", icon: Moon },
        ],
      },
    ],
  },
  "default-view": {
    title: "Change default view",
    placeholder: "Change default view…",
    sections: [
      {
        items: [
          { label: "Agent", icon: Sparkles },
          { label: "Inbox", icon: Inbox },
          { label: "My issues", icon: UserRound, checked: true },
          { label: "Reviews", icon: GitPullRequest },
          { label: "All issues", icon: Layers },
          { label: "Active issues", icon: <StatusIcon type="started" /> },
          { label: "Current cycle", icon: RefreshCcw },
          { label: "Projects", icon: Box },
        ],
      },
    ],
  },
  display: {
    title: "Display options",
    placeholder: "Display options…",
    searchable: true,
    sections: [
      {
        items: [
          { label: "Show display options", icon: SlidersHorizontal, ...plus("⇧", "V") },
          { label: "Nested sub-issues…", icon: Rows3, page: "nested-sub-issues" },
          { label: "Show completed issues…", icon: ListChecks, page: "completed-issues" },
          { label: "Reset to default", icon: RotateCcw },
          { label: "Toggle layout view", icon: LayoutGrid, ...plus("Ctrl", "B") },
          { label: "Grouping…", icon: Rows3, ...plus("Alt", "⇧", "G"), page: "grouping" },
          {
            label: "Sub-grouping…",
            icon: Rows3,
            ...plus("Alt", "⇧", "S"),
            page: "sub-grouping",
          },
          { label: "Order completed by recency", icon: Clock },
          { label: "Hide sub-issues", icon: EyeOff },
          { label: "Change displayed properties…", icon: Eye, page: "display-properties" },
        ],
      },
    ],
  },
  "nested-sub-issues": {
    title: "Nested sub-issues",
    placeholder: "Nested sub-issues…",
    searchable: true,
    sections: [
      {
        items: [
          { label: "Show all" },
          { label: "Show matching", checked: true },
          { label: "Hide" },
        ],
      },
    ],
  },
  "completed-issues": {
    title: "Show completed issues",
    placeholder: "Show completed issues…",
    searchable: true,
    sections: [
      {
        items: ["All", "Past day", "Past week", "Past month", "Current cycle", "None"].map(
          (label) => ({ label, checked: label === "Past day" }),
        ),
      },
    ],
  },
  grouping: {
    title: "Grouping",
    placeholder: "Group by…",
    searchable: true,
    sections: [
      {
        items: [
          { label: "No grouping" },
          { label: "Focus", icon: Crosshair, checked: true },
          ...GROUPINGS,
        ],
      },
    ],
  },
  "sub-grouping": {
    title: "Sub-grouping",
    placeholder: "Sub-group by…",
    searchable: true,
    sections: [{ items: [{ label: "No grouping", checked: true }, ...GROUPINGS] }],
  },
  "display-properties": {
    title: "Change displayed properties",
    placeholder: "Change displayed properties…",
    sections: [
      {
        items: LIST_PROPERTIES.map((p) => ({
          label: p.label,
          checked: DEFAULT_PROPERTIES.includes(p.value),
        })),
      },
    ],
  },
  // As categorias do Filter Menu (filter-data), nos grupos e na ordem do Linear.
  filter: {
    title: "Add Filter",
    placeholder: "Add Filter…",
    sections: FILTER_SECTIONS.map((section) => ({
      items: section.map((c) => ({ label: c.label, icon: c.icon })),
    })),
  },
  "agent-chat": {
    title: "Open agent chat",
    placeholder: "Open agent chat…",
    empty: "No agent chats",
    sections: [],
  },
};

/**
 * Rótulo da linha: prefixo e detalhe em cinza em volta do rótulo e a marca do valor atual à
 * direita (decorativa: a linha leva aria-checked, como no Linear). O texto de busca sai de
 * `entryValue`.
 */
export function EntryLabel({ entry, path }: { entry: CommandEntry; path?: string }) {
  if (!path && !entry.prefix && !entry.detail && !entry.checked) return entry.label;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {path && <span className="shrink-0 text-secondary">{path} ›</span>}
      {entry.prefix && <span className="shrink-0 text-secondary">{entry.prefix}</span>}
      <span className="truncate">{entry.label}</span>
      {entry.detail && <span className="truncate text-secondary">{entry.detail}</span>}
      {entry.checked && <Icon icon={Check} className="ml-auto text-secondary" />}
    </span>
  );
}

/** Texto que a busca compara (o cmdk usa o valor, sem os ícones nem as teclas). */
export function entryValue(entry: CommandEntry, path?: string) {
  return [path, entry.prefix, entry.label, entry.detail].filter(Boolean).join(" ");
}

/** Um item da busca profunda: a entrada, o caminho de páginas até ela e o prefixo visível. */
export type DeepEntry = { entry: CommandEntry; trail: string[]; path: string };

/**
 * Itens das páginas de valor na busca da página inicial, como no Linear ("Change status ›
 * Done", "Display options › Grouping › Status"): desce pelas páginas `searchable`.
 */
export function deepEntries(sections: CommandSection[]): DeepEntry[] {
  const walk = (key: string, trail: string[], titles: string[]): DeepEntry[] => {
    const page = PAGES[key];
    if (!page?.searchable || trail.includes(key)) return [];
    const nextTrail = [...trail, key];
    const nextTitles = [...titles, page.title];
    return page.sections.flatMap((s) =>
      s.items.flatMap((entry) => [
        { entry, trail: nextTrail, path: nextTitles.join(" › ") },
        ...(entry.page ? walk(entry.page, nextTrail, nextTitles) : []),
      ]),
    );
  };
  return sections.flatMap((s) => s.items.flatMap((i) => (i.page ? walk(i.page, [], []) : [])));
}

/** Contagem do catálogo (para a legenda e o relatório). */
export function catalogSize() {
  const root = ROOT.reduce((n, s) => n + s.items.length, 0);
  const pages = Object.keys(PAGES).length;
  return { root, pages };
}
