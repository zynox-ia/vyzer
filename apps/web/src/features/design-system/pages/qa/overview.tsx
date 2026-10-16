import { cn } from "@zynox/design-system/cn";
import { apcaContrast, over, toRgba, wcagContrast, withAlpha } from "@zynox/design-system/contrast";
import {
  PriorityIcon,
  StatusIcon,
  type Priority,
  type StatusType,
} from "@zynox/design-system/icons";
import { useRef } from "react";
import { readVar, resolveSurface, useMeasure } from "../../kit/color";
import { Code, Decisions, DocPage, DocSection, Prose } from "../../kit/doc";
import { ThemeFrame, type ThemeName } from "../../kit/theme-frame";

type Issue = {
  id: string;
  title: string;
  status: StatusType;
  progress?: number;
  priority: Priority;
  label: { name: string; hue: "purple" | "blue" | "green" | "orange" };
  selected?: boolean;
  hover?: boolean;
  focus?: boolean;
};

const issues: Issue[] = [
  {
    id: "VYZ-31",
    title: "Invite members by email",
    status: "started",
    progress: 1 / 2,
    priority: "urgent",
    label: { name: "Feature", hue: "purple" },
    selected: true,
  },
  {
    id: "VYZ-32",
    title: "Fix login redirect loop",
    status: "unstarted",
    priority: "high",
    label: { name: "Bug", hue: "orange" },
    selected: true,
  },
  {
    id: "VYZ-33",
    title: "Add Brevo email provider",
    status: "backlog",
    priority: "medium",
    label: { name: "Infra", hue: "blue" },
    selected: true,
  },
  {
    id: "VYZ-34",
    title: "Team settings page",
    status: "started",
    progress: 1 / 3,
    priority: "low",
    label: { name: "Feature", hue: "purple" },
    hover: true,
  },
  {
    id: "VYZ-35",
    title: "Workspace switcher",
    status: "completed",
    priority: "none",
    label: { name: "Design", hue: "green" },
    focus: true,
  },
  {
    id: "VYZ-36",
    title: "Remove legacy tokens",
    status: "canceled",
    priority: "low",
    label: { name: "Infra", hue: "blue" },
  },
];

const hueDot: Record<Issue["label"]["hue"], string> = {
  purple: "bg-purple",
  blue: "bg-blue",
  green: "bg-green",
  orange: "bg-orange",
};

function IssueList() {
  return (
    <ul className="overflow-hidden rounded-container border border-default bg-panel">
      {issues.map((i) => (
        <li
          key={i.id}
          className={cn(
            "flex h-row items-center gap-2 border-t border-subtle px-cell-x text-body-md first:border-t-0",
            i.selected && "bg-selected",
            i.hover && "bg-hover",
            i.focus && "focus-ring-shown",
          )}
        >
          <PriorityIcon priority={i.priority} />
          <span className="w-14 shrink-0 font-mono text-code tracking-id text-secondary">
            {i.id}
          </span>
          <StatusIcon type={i.status} progress={i.progress} />
          <span className="min-w-0 flex-1 truncate text-primary">{i.title}</span>
          <span className="hidden items-center gap-1 rounded-full border border-default px-2 text-label-sm text-secondary tablet:inline-flex">
            <span aria-hidden className={cn("size-2 rounded-full", hueDot[i.label.hue])} />
            {i.label.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Badges() {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex h-control-xs items-center rounded-full bg-success-subtle px-2 text-label-sm text-success-strong">
        Done
      </span>
      <span className="inline-flex h-control-xs items-center rounded-full bg-info-subtle px-2 text-label-sm text-info-strong">
        In Review
      </span>
      <span className="inline-flex h-control-xs items-center rounded-full bg-warning-subtle px-2 text-label-sm text-warning-strong">
        At risk
      </span>
      <span className="inline-flex h-control-xs items-center rounded-full bg-danger-subtle px-2 text-label-sm text-danger-strong">
        Blocked
      </span>
    </div>
  );
}

function Controls() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex h-control-md items-center rounded-full bg-inverse px-3 text-label-md text-inverse">
        Create issue
      </span>
      <span className="inline-flex h-control-md items-center rounded-full border border-default bg-control px-3 text-label-md text-primary">
        Filter
      </span>
      <span className="inline-flex h-control-md w-48 items-center rounded-control border border-control bg-input px-2 text-body-md text-placeholder">
        Search issues…
      </span>
      <span className="inline-flex h-control-md items-center rounded-full border border-default bg-control px-3 text-label-md text-primary focus-ring-shown">
        Focused
      </span>
    </div>
  );
}

function Card() {
  return (
    <div className="flex flex-col gap-1 rounded-container border border-default bg-surface p-4">
      <p className="type-heading-3 text-primary">Mobile App Redesign</p>
      <p className="text-body-sm text-secondary">12 issues · 4 in progress · due Oct 30</p>
    </div>
  );
}

function Popover() {
  return (
    <div className="flex w-full max-w-56 flex-col gap-0.5 rounded-xl border border-strong bg-popover p-1.5 shadow-md">
      {["Backlog", "Todo", "In Progress"].map((s, n) => (
        <span
          key={s}
          className={cn(
            "flex h-menu-item items-center gap-2 rounded-control px-2 text-body-md text-primary",
            n === 2 && "bg-hover",
          )}
        >
          <StatusIcon type={n === 0 ? "backlog" : n === 1 ? "unstarted" : "started"} />
          {s}
        </span>
      ))}
    </div>
  );
}

/** Contraste do texto sobre a seleção desta moldura (para decidir o tom do claro). */
function SelectionMeasure() {
  const ref = useRef<HTMLParagraphElement>(null);
  const m = useMeasure(
    ref,
    (el) => {
      const bg = resolveSurface(el, "--bg-selected");
      const primary = over(withAlpha(toRgba(readVar(el, "--fg-primary")), 1), bg);
      const secondary = over(withAlpha(toRgba(readVar(el, "--fg-secondary")), 1), bg);
      const panel = resolveSurface(el, "--bg-panel");
      return {
        primary: wcagContrast(primary, bg),
        secondary: wcagContrast(secondary, bg),
        lc: Math.abs(apcaContrast(secondary, bg)),
        step: wcagContrast(bg, panel),
      };
    },
    "selection",
  );
  return (
    <p ref={ref} className="text-body-sm text-secondary">
      {m
        ? `Seleção sobre o painel: ${m.step.toFixed(2)}:1 · primary ${m.primary.toFixed(2)}:1 · secondary ${m.secondary.toFixed(2)}:1 (Lc ${m.lc.toFixed(0)})`
        : "medindo…"}
    </p>
  );
}

function Frame({
  theme,
  label,
  selection,
}: {
  theme: ThemeName;
  label: string;
  selection?: "beige" | "neutral";
}) {
  return (
    <ThemeFrame theme={theme} label={label} selection={selection}>
      <IssueList />
      <SelectionMeasure />
      <Badges />
      <Controls />
      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
        <Card />
        <Popover />
      </div>
    </ThemeFrame>
  );
}

export function Page() {
  return (
    <DocPage
      title="QA"
      description="Escuro e claro lado a lado com as peças principais montadas só com tokens. Três linhas selecionadas, uma em hover e uma com foco (estático) em cada tema."
    >
      <DocSection
        title="Escolha: seleção do tema claro"
        description="As duas molduras claras diferem só no tom de seleção: bege (atual) e neutro quente. Os números abaixo de cada lista medem a seleção."
      >
        <div className="grid grid-cols-1 gap-4 wide:grid-cols-3">
          <Frame theme="dark" label="Escuro" />
          <Frame theme="light" label="Claro · seleção bege (atual)" selection="beige" />
          <Frame theme="light" label="Claro · seleção neutro quente" selection="neutral" />
        </div>
        <Prose>
          <p>
            Bege: camada <Code>rgb(135 94 40 / 0.2)</Code>, que resulta em #e3dacc sobre o creme.
            Neutro quente: camada do grafite a 8%. Depois da escolha, o perdedor sai de{" "}
            <Code>themes.css</Code>.
          </p>
        </Prose>
      </DocSection>

      <Decisions
        items={[
          { decision: "Seleção e hover como camadas translúcidas", rule: "§12 estados" },
          {
            decision: "Foco B como padrão nas peças",
            rule: "ADR-0013 (A não atinge 3:1: Foundations → Colors)",
          },
          {
            decision: "Cards do claro: bg-surface #f0eee6 + hairline #d1cfc5",
            rule: "ADR-0013; §11 região comum",
          },
          { decision: "Badges com texto -strong sobre a cor a 15%", rule: "§3 texto ≥ 4,5:1" },
        ]}
      />
    </DocPage>
  );
}
