/**
 * Página de desenvolvimento `/_design` (VYZ-12): mostra os tokens aplicados nos dois temas.
 * Os dados são de exemplo, fixos, e servem só para visualização; esta rota não existe em produção.
 * Os componentes daqui são provisórios: os primitivos reais nascem em src/components/ui nos passos seguintes.
 */
import clsx from "clsx";
import {
  Box,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleAlert,
  CircleSlash2,
  CircleX,
  Contrast,
  Ellipsis,
  Inbox,
  Layers,
  ListFilter,
  Monitor,
  Moon,
  Plus,
  Search,
  SignalHigh,
  SignalLow,
  SignalMedium,
  SlidersHorizontal,
  SquarePen,
  Sun,
  TriangleAlert,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Dialog, ToggleGroup } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { setThemePreference, useThemePreference, type ThemePreference } from "@/lib/theme";

/* ---------- Vocabulário visual ---------- */

type Tone = "neutral" | "success" | "info" | "warning" | "danger";

const toneIcon: Record<Tone, string> = {
  neutral: "text-secondary",
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  danger: "text-danger",
};

const toneBadge: Record<Exclude<Tone, "neutral">, string> = {
  success: "bg-success-subtle text-success-strong",
  info: "bg-info-subtle text-info-strong",
  warning: "bg-warning-subtle text-warning-strong",
  danger: "bg-danger-subtle text-danger-strong",
};

const workflow: { name: string; icon: LucideIcon; tone: Tone }[] = [
  { name: "Backlog", icon: CircleDashed, tone: "neutral" },
  { name: "Todo", icon: Circle, tone: "neutral" },
  { name: "In Progress", icon: Contrast, tone: "warning" },
  { name: "In Review", icon: CircleDot, tone: "info" },
  { name: "Done", icon: CircleCheck, tone: "success" },
  { name: "Canceled", icon: CircleX, tone: "neutral" },
  { name: "Duplicate", icon: CircleSlash2, tone: "neutral" },
];

const priorities: { name: string; icon: LucideIcon; tone: Tone }[] = [
  { name: "No priority", icon: Ellipsis, tone: "neutral" },
  { name: "Urgent", icon: TriangleAlert, tone: "danger" },
  { name: "High", icon: SignalHigh, tone: "neutral" },
  { name: "Medium", icon: SignalMedium, tone: "neutral" },
  { name: "Low", icon: SignalLow, tone: "neutral" },
];

const health: { name: string; icon: LucideIcon; tone: Exclude<Tone, "neutral"> }[] = [
  { name: "On track", icon: CircleCheck, tone: "success" },
  { name: "At risk", icon: CircleAlert, tone: "warning" },
  { name: "Off track", icon: CircleX, tone: "danger" },
];

const labels = [
  ["Bug", "bg-label-red"],
  ["Feature", "bg-label-blue"],
  ["Improvement", "bg-label-green"],
  ["Design", "bg-label-pink"],
  ["Infra", "bg-label-cyan"],
  ["Docs", "bg-label-amber"],
  ["Research", "bg-label-purple"],
  ["Security", "bg-label-orange"],
  ["Data", "bg-label-indigo"],
  ["Chore", "bg-label-lime"],
] as const;

const issues = [
  { id: "VYZ-12", title: "Design tokens", status: 2, priority: 2, label: 3, date: "Sep 27" },
  { id: "VYZ-13", title: "Authentication", status: 1, priority: 1, label: 1, date: "Sep 28" },
  { id: "VYZ-11", title: "API skeleton", status: 3, priority: 3, label: 4, date: "Sep 26" },
  { id: "VYZ-10", title: "Monorepo", status: 4, priority: 4, label: 9, date: "Sep 26" },
  { id: "VYZ-9", title: "Cycle", status: 0, priority: 0, label: 0, date: "Oct 12" },
  { id: "VYZ-5", title: "Label", status: 5, priority: 4, label: 5, date: "Oct 3" },
];

/* ---------- Peças ---------- */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-mini font-medium text-secondary">{title}</h2>
      {children}
    </section>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonState = "default" | "hover" | "focus" | "disabled";

const buttonBase =
  "inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-mini font-medium transition-colors disabled:opacity-50";

/** `live`: hover real; `hover`: o mesmo visual aplicado fixo, para a coluna "hover". */
const buttonVariant: Record<ButtonVariant, { base: string; live: string; hover: string }> = {
  primary: {
    base: "bg-inverse text-inverse",
    live: "enabled:hover:bg-inverse-hover",
    hover: "bg-inverse-hover",
  },
  secondary: {
    base: "border border-default bg-control text-primary",
    live: "enabled:hover:bg-control-strong",
    hover: "bg-control-strong",
  },
  ghost: {
    base: "text-secondary",
    live: "enabled:hover:bg-hover enabled:hover:text-primary",
    hover: "bg-hover text-primary",
  },
};

function DemoButton({
  variant,
  state = "default",
  children,
  ...rest
}: {
  variant: ButtonVariant;
  state?: ButtonState;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className">) {
  const v = buttonVariant[variant];
  return (
    <button
      type="button"
      {...rest}
      disabled={state === "disabled"}
      className={clsx(
        buttonBase,
        v.base,
        state === "hover" ? v.hover : v.live,
        state === "focus" && "outline-2 outline-offset-2 outline-focus",
      )}
    >
      {children}
    </button>
  );
}

/** `labelled`: sem texto ao lado, o ícone leva o nome para leitores de tela. */
function StatusIcon({ status, labelled }: { status: number; labelled?: boolean }) {
  const s = workflow[status]!;
  const Icon = s.icon;
  return (
    <Icon
      aria-label={labelled ? s.name : undefined}
      aria-hidden={labelled ? undefined : true}
      className={clsx("size-3.5 shrink-0", toneIcon[s.tone])}
    />
  );
}

function PriorityIcon({
  priority,
  large,
  labelled,
}: {
  priority: number;
  large?: boolean;
  labelled?: boolean;
}) {
  const p = priorities[priority]!;
  const Icon = p.icon;
  return (
    <Icon
      aria-label={labelled ? p.name : undefined}
      aria-hidden={labelled ? undefined : true}
      className={clsx(large ? "size-4" : "size-3.5", "shrink-0", toneIcon[p.tone])}
    />
  );
}

function LabelChip({ index }: { index: number }) {
  const [name, dot] = labels[index]!;
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-default px-2 text-mini text-secondary">
      <span className={clsx("size-2 rounded-full", dot)} />
      {name}
    </span>
  );
}

/* ---------- Blocos ---------- */

function ThemeSwitcher() {
  const preference = useThemePreference();
  const items: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <ToggleGroup.Root
      type="single"
      value={preference}
      onValueChange={(value) => value && setThemePreference(value as ThemePreference)}
      aria-label="Theme"
      className="inline-flex gap-0.5 rounded-md border border-default bg-surface p-0.5"
    >
      {items.map(({ value, label, icon: Icon }) => (
        <ToggleGroup.Item
          key={value}
          value={value}
          className="inline-flex h-6 items-center gap-1.5 rounded-sm px-2 text-mini text-secondary transition-colors hover:text-primary data-[state=on]:bg-selected data-[state=on]:text-primary"
        >
          <Icon className="size-3.5" />
          {label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

function Sidebar() {
  const item =
    "flex h-7 items-center gap-2 rounded-md px-2 text-small font-medium text-secondary transition-colors hover:bg-hover hover:text-primary";
  return (
    <nav aria-label="Sidebar demo" className="flex w-61 shrink-0 flex-col gap-4 bg-sidebar p-2">
      <div className="flex items-center justify-between px-2">
        <span className="flex items-center gap-2 text-small font-medium">
          <span className="grid size-5 place-items-center rounded-md bg-inverse text-micro text-inverse">
            ZY
          </span>
          Zynox
        </span>
        <span className="flex gap-1 text-secondary">
          <Search className="size-3.5" />
          <SquarePen className="size-3.5" />
        </span>
      </div>
      <div className="flex flex-col gap-px">
        <a href="#inbox" className={clsx(item, "no-underline")}>
          <Inbox className="size-3.5" /> Inbox
          <span className="ml-auto text-micro font-medium text-accent">3</span>
        </a>
        <a href="#issues" className={clsx(item, "no-underline")}>
          <Circle className="size-3.5" /> My issues
        </a>
      </div>
      <div className="flex flex-col gap-px">
        <span className="px-2 text-mini font-medium text-secondary">Your teams</span>
        <a href="#team" className={clsx(item, "no-underline")}>
          <Box className="size-3.5" /> Vyzer
        </a>
        <a
          href="#team-issues"
          aria-current="page"
          className={clsx(item, "relative bg-selected pl-7 text-primary no-underline")}
        >
          <span
            aria-hidden
            className="absolute top-1/2 left-0.5 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-accent"
          />
          <Layers className="size-3.5" /> Issues
        </a>
        <a href="#team-projects" className={clsx(item, "pl-7 no-underline")}>
          <Box className="size-3.5" /> Projects
        </a>
      </div>
    </nav>
  );
}

function IssueList() {
  return (
    <div className="m-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-subtle bg-panel">
      <header className="flex h-11 items-center justify-between border-b border-subtle px-4">
        <h3 className="font-display text-heading font-semibold">Issues</h3>
        <span className="flex gap-1">
          <DemoButton variant="ghost">
            <ListFilter className="size-3.5" /> Filter
          </DemoButton>
          <DemoButton variant="ghost">
            <SlidersHorizontal className="size-3.5" /> Display
          </DemoButton>
        </span>
      </header>
      <div className="mx-2 flex h-9 items-center gap-2 rounded-md bg-subtle px-2 text-small">
        <Contrast className="size-3.5 text-warning" aria-hidden />
        In Progress <span className="text-tertiary">2</span>
      </div>
      <ul>
        {issues.map((issue, i) => (
          <li
            key={issue.id}
            data-selected={i === 1 || undefined}
            className={clsx(
              "flex h-11 items-center gap-2 px-4 transition-colors hover:bg-hover",
              i === 1 && "bg-selected",
            )}
          >
            <PriorityIcon priority={issue.priority} large labelled />
            <span className="w-14 text-small tracking-id text-tertiary">{issue.id}</span>
            <StatusIcon status={issue.status} labelled />
            <span className="min-w-0 flex-1 truncate font-medium">{issue.title}</span>
            <LabelChip index={issue.label} />
            <UserRound className="size-4.5 text-secondary" aria-label="No assignee" />
            <span className="w-12 text-right text-mini text-tertiary">{issue.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Buttons() {
  const states: ButtonState[] = ["default", "hover", "focus", "disabled"];
  const variants: ButtonVariant[] = ["primary", "secondary", "ghost"];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[repeat(5,max-content)] items-center gap-x-3 gap-y-3">
        <span />
        {states.map((s) => (
          <span key={s} className="text-mini text-tertiary capitalize">
            {s}
          </span>
        ))}
        {variants.map((v) => (
          <div key={v} className="contents">
            <span className="text-mini text-tertiary capitalize">{v}</span>
            {states.map((s) => (
              <DemoButton key={s} variant={v} state={s}>
                {v === "primary" ? "Create issue" : v === "secondary" ? "Cancel" : "More"}
              </DemoButton>
            ))}
          </div>
        ))}
      </div>
      <p className="text-mini text-tertiary">
        A coluna "default" também é interativa: passe o mouse e use Tab para ver hover e foco reais.
        Links: <a href="#link">texto principal sublinhado</a>.
      </p>
    </div>
  );
}

function Inputs() {
  const field =
    "h-8 w-full rounded-md border border-default bg-input px-3 text-small text-primary placeholder:text-tertiary transition-colors focus-visible:border-strong disabled:opacity-50";
  return (
    <div className="grid grid-cols-2 gap-4">
      <label className="flex flex-col gap-1.5 text-mini text-secondary">
        Default
        <input className={field} placeholder="Issue title" />
      </label>
      <label className="flex flex-col gap-1.5 text-mini text-secondary">
        Focus (simulado)
        <input
          className={clsx(field, "border-strong outline-2 outline-offset-2 outline-focus")}
          defaultValue="Design tokens"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-mini text-secondary">
        Disabled
        <input className={field} disabled defaultValue="Read only" />
      </label>
      <label className="flex flex-col gap-1.5 text-mini text-secondary">
        Error
        <input
          className={clsx(field, "border-danger")}
          defaultValue="VYZ"
          aria-invalid
          aria-describedby="team-key-error"
        />
        <span id="team-key-error" className="flex items-center gap-1 text-danger-strong">
          <CircleAlert className="size-3" aria-hidden /> Team key already in use
        </span>
      </label>
      <label className="col-span-2 flex items-center gap-2 text-small">
        <input type="checkbox" defaultChecked className="size-3.5 accent-accent" />
        Checkbox marcado (acento terracota)
      </label>
    </div>
  );
}

function Badges() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {workflow.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-small">
            <StatusIcon status={i} />
            {s.name}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {priorities.map((p, i) => (
          <span key={p.name} className="inline-flex items-center gap-1.5 text-small">
            <PriorityIcon priority={i} />
            {p.name}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {health.map(({ name, icon: Icon, tone }) => (
          <span
            key={name}
            className={clsx(
              "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-mini font-medium",
              toneBadge[tone],
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {name}
          </span>
        ))}
        <span
          className={clsx(
            "inline-flex h-6 items-center rounded-full px-2 text-mini font-medium",
            toneBadge.info,
          )}
        >
          In Review · 4
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {labels.map(([name], i) => (
          <LabelChip key={name} index={i} />
        ))}
      </div>
      <div className="flex items-center gap-2 text-mini text-secondary">
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded-xs border border-default px-1 text-mini">G</kbd>
          <span className="text-2xs text-tertiary">then</span>
          <kbd className="rounded-xs border border-default px-1 text-mini">I</kbd>
        </span>
        atalho com <code>text-2xs</code>
      </div>
    </div>
  );
}

function ModalDemo() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <DemoButton variant="primary">
          <Plus className="size-3.5" /> New issue
        </DemoButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-scrim" />
        <Dialog.Content className="fixed top-1/4 left-1/2 flex w-230 -translate-x-1/2 flex-col rounded-xl border border-default bg-surface shadow-modal">
          <div className="flex h-13 items-center justify-between px-5">
            <Dialog.Title className="text-small text-secondary">Vyzer › New issue</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="grid size-7 place-items-center rounded-full text-secondary hover:bg-hover hover:text-primary"
              >
                <X className="size-3.5" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Create a new issue</Dialog.Description>
          <div className="flex flex-col gap-2 px-5 py-3">
            <input
              placeholder="Issue title"
              aria-label="Issue title"
              className="rounded-md bg-transparent text-regular font-medium placeholder:text-tertiary"
            />
            <textarea
              placeholder="Add description…"
              aria-label="Description"
              className="min-h-20 resize-none rounded-md bg-transparent text-small placeholder:text-tertiary"
            />
            <div className="flex gap-1.5">
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-default px-2 text-mini">
                <StatusIcon status={1} /> Todo
              </span>
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-default px-2 text-mini">
                <PriorityIcon priority={0} /> Priority
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-subtle px-5 py-3">
            <Dialog.Close asChild>
              <DemoButton variant="secondary">Cancel</DemoButton>
            </Dialog.Close>
            <DemoButton variant="primary">Create issue</DemoButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------- Página ---------- */

export function DesignPage() {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-app p-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-heading font-semibold">Vyzer · design tokens</h1>
        <ThemeSwitcher />
      </header>

      <Section title="Tipografia: títulos em Inter Tight, corpo em Inter">
        <div className="flex flex-col gap-2 rounded-xl border border-subtle bg-panel p-5">
          <p className="font-display text-title font-semibold">Mv School · Overview</p>
          <p className="font-display text-heading font-semibold">Issues</p>
          <p className="text-regular font-medium">Title of an issue in the modal</p>
          <p className="text-small">
            Body text at 13 px in Inter: the default for rows, menus and descriptions.
          </p>
          <p className="text-mini text-secondary">Metadata at 12 px · Sep 27 · 3 comments</p>
        </div>
      </Section>

      <Section title="Sidebar e lista de issues">
        <div className="flex h-96 overflow-hidden rounded-xl border border-subtle bg-app">
          <Sidebar />
          <IssueList />
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-6 rounded-xl border border-subtle bg-panel p-5">
          <Section title="Botões">
            <Buttons />
          </Section>
          <Section title="Modal">
            <div>
              <ModalDemo />
            </div>
          </Section>
        </div>
        <div className="flex flex-col gap-6 rounded-xl border border-subtle bg-panel p-5">
          <Section title="Inputs">
            <Inputs />
          </Section>
          <Section title="Status, prioridade, health e labels">
            <Badges />
          </Section>
        </div>
      </div>
    </div>
  );
}
