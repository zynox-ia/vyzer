/**
 * Lista de projetos (Figma 25:4964; Linear ao vivo, `/zynox-dev/projects/all` e
 * `/zynox-dev/team/:team/projects/all`, medido lado a lado 1293 px, tema escuro, 28/09): mesma
 * tela para "Projects" do workspace (sem `teamSlug`, todos os projetos, título só "Projects",
 * sem breadcrumb nem estrela) e "Projects" de um time (com `teamSlug`, só os daquele time,
 * breadcrumb "[ícone do time] Time › Projects" + estrela de favorito, medido ao vivo) — o Linear
 * usa o mesmo componente para as duas, só o escopo (e o cabeçalho da linha 1) muda.
 *
 * Cabeçalho em duas linhas, como medido ao vivo (não a TopBar genérica inteira — o arranjo da
 * linha 1 é outro, "New project" fica nela, não nas ações da segunda linha):
 * - Linha 1 (44 px, hairline embaixo): título (workspace) ou breadcrumb do time + estrela
 *   (`Breadcrumbs` do `top-bar.tsx`, a mesma peça do projeto aberto) à esquerda; "New project"
 *   (Button ghost, sem fundo, texto secundário) à direita.
 * - Linha 2 (44 px, sem hairline): "All projects" (pill selecionada) + "+" (Add new view) à
 *   esquerda; Add filter, Display options e o toggle do painel de detalhes à direita, em
 *   IconButton secondary (fundo sutil preenchido), 6 px entre eles.
 * Sem uma terceira linha: o cabeçalho da tabela começa logo depois (o Linear não tem "Board
 * layout" na lista de projetos).
 *
 * Ícone do time no breadcrumb: `ProjectIcon` colorido (o mesmo modelo do ícone de projeto),
 * como a sidebar usa em "Your teams" — o Linear tem cor própria por time (ciano no Zynox,
 * medido ao vivo); dado de exemplo em `project-data.tsx`, `TEAMS`, o modelo real fica para
 * quando houver a feature de times de verdade.
 *
 * Filtros (Health, Lead) e agrupamento (Status, Health, Lead, Priority) na URL (regra 8) e
 * aplicados de verdade à lista — corrigido na revisão de código r3 (bloqueantes 2 e 3), que
 * achou os dois só mudando o parâmetro sem afetar o que a tabela mostra. O cabeçalho de grupo
 * reaproveita o `ListGroup` da Fase 5; como ele é `<div>` (Collapsible) e a lista é uma
 * `<table>` de verdade, cada grupo vira a sua própria `<table>` (só `<tbody>`, sem repetir o
 * cabeçalho de coluna) dentro do `ListGroup` — html válido, sem `<div>` dentro de `<tbody>`. As
 * larguras das colunas (`COLUMN_WIDTH`) valem tanto no cabeçalho quanto nas células, pra as
 * tabelas dos grupos ficarem alinhadas com o cabeçalho comum.
 */
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  LayoutPanelLeft,
  ListFilter,
  Plus,
  SlidersHorizontal,
  Star,
  TriangleAlert,
  UserRoundPen,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  Avatar,
  Button,
  DisplayOptions,
  DisplayOptionsRow,
  DisplayOptionsSection,
  FilterMenu,
  HealthBadge,
  IconButton,
  ListGroup,
  ProjectIcon,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type FilterCategory,
  type FilterValue,
  type Health,
  type ListOption,
  type SortDirection,
} from "@vyzer/design-system/components";
import {
  Icon,
  PriorityIcon,
  ProjectStatusIcon,
  type Priority,
  type ProjectStatusType,
} from "@vyzer/design-system/icons";
import { cn } from "@vyzer/design-system/cn";
import { Breadcrumbs } from "@/layouts/app-shell/top-bar";
import { useAppShell } from "@/layouts/app-shell/use-app-shell";
import { projectsForTeam, type Project } from "./project-data";
import { useWorkspaceTeam } from "./use-workspace-team";

/** Rótulo e ícone de cada saúde (o mesmo texto e os mesmos ícones do `HealthBadge`, que não
 * exporta o mapa — os quatro valores lucide são os dela, badge.tsx). */
const HEALTH_META: Record<Health, { label: string; icon: typeof CircleCheck }> = {
  "on-track": { label: "On track", icon: CircleCheck },
  "at-risk": { label: "At risk", icon: TriangleAlert },
  "off-track": { label: "Off track", icon: CircleAlert },
  none: { label: "No updates", icon: CircleDashed },
};
const HEALTH_VALUES = Object.keys(HEALTH_META) as Health[];
const HEALTH_OPTIONS: ListOption<Health>[] = HEALTH_VALUES.map((value) => ({
  value,
  label: HEALTH_META[value].label,
  icon: <Icon icon={HEALTH_META[value].icon} size="sm" />,
}));

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "No priority",
};
const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low", "none"];

const STATUS_LABEL: Record<ProjectStatusType, string> = {
  backlog: "Backlog",
  planned: "Planned",
  started: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
};
const STATUS_ORDER: ProjectStatusType[] = [
  "backlog",
  "planned",
  "started",
  "completed",
  "canceled",
];

/** Categoria de filtro escolhida pela lista (Health, Lead): "regra 8", em `?filter.<categoria>=`. */
const FILTER_KEYS = ["health", "lead"];

function readFilters(params: URLSearchParams): FilterValue {
  const value: FilterValue = {};
  for (const key of FILTER_KEYS) {
    const raw = params.get(`filter.${key}`);
    if (raw) value[key] = raw.split(",");
  }
  return value;
}

function applyFilters(projects: Project[], filters: FilterValue): Project[] {
  return projects.filter((p) => {
    if (filters.health?.length && !filters.health.includes(p.health)) return false;
    if (filters.lead?.length && (!p.lead || !filters.lead.includes(p.lead))) return false;
    return true;
  });
}

/** Colunas que ordenam (Lead e Issues ficam de fora, como no Linear ao vivo). */
type SortableColumn = "name" | "health" | "priority" | "targetDate" | "status";

const SORTERS: Record<SortableColumn, (p: Project) => string | number> = {
  name: (p) => p.name,
  health: (p) => p.health,
  priority: (p) => p.priority ?? "",
  targetDate: (p) => p.targetDate ?? "",
  status: (p) => p.progress,
};

function sortProjects(projects: Project[], column: SortableColumn | null, dir: SortDirection) {
  if (!column) return projects;
  const key = SORTERS[column];
  const sorted = [...projects].sort((a, b) => {
    const av = key(a);
    const bv = key(b);
    return av < bv ? -1 : av > bv ? 1 : 0;
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

type GroupKey = "status" | "health" | "lead" | "priority";
const GROUP_VALUES: GroupKey[] = ["status", "health", "lead", "priority"];
const NO_LEAD = "__no_lead__";

/** Chave de agrupamento de um projeto para a dimensão escolhida. */
function groupValueOf(p: Project, dim: GroupKey): string {
  switch (dim) {
    case "status":
      return p.status;
    case "health":
      return p.health;
    case "priority":
      return p.priority ?? "none";
    case "lead":
      return p.lead ?? NO_LEAD;
  }
}

/** Rótulo e ordem de exibição de um grupo, pela dimensão escolhida. */
function groupOrder(dim: GroupKey): string[] {
  switch (dim) {
    case "status":
      return STATUS_ORDER;
    case "health":
      return HEALTH_VALUES;
    case "priority":
      return PRIORITY_ORDER;
    case "lead":
      return []; // ordenado por nome, calculado a partir dos dados (ver groupProjects)
  }
}

function groupLabel(dim: GroupKey, key: string): string {
  switch (dim) {
    case "status":
      return STATUS_LABEL[key as ProjectStatusType];
    case "health":
      return HEALTH_META[key as Health].label;
    case "priority":
      return PRIORITY_LABEL[key as Priority];
    case "lead":
      return key === NO_LEAD ? "No lead" : key;
  }
}

type Group = { key: string; label: string; items: Project[] };

function groupProjects(projects: Project[], dim: GroupKey | null): Group[] | null {
  if (!dim) return null;
  const byKey = new Map<string, Project[]>();
  for (const p of projects) {
    const key = groupValueOf(p, dim);
    const list = byKey.get(key);
    if (list) list.push(p);
    else byKey.set(key, [p]);
  }
  const order =
    dim === "lead"
      ? [...byKey.keys()].sort((a, b) =>
          a === NO_LEAD ? 1 : b === NO_LEAD ? -1 : a.localeCompare(b),
        )
      : groupOrder(dim).filter((key) => byKey.has(key));
  return order.map((key) => ({ key, label: groupLabel(dim, key), items: byKey.get(key) ?? [] }));
}

/** Largura fixa de cada coluna, exceto Name (a única flexível) — vale no cabeçalho e nas células,
 * pra alinhar entre a tabela do cabeçalho e as tabelas de cada grupo (agrupado). */
const COLUMN_WIDTH = {
  health: "w-34",
  priority: "w-17",
  lead: "w-15",
  targetDate: "w-23",
  issues: "w-15",
  status: "w-17",
};

export function ProjectsListPage({
  teamSlug,
  teamName,
}: {
  /** Só os projetos deste time; sem ele, todos os projetos do workspace. */
  teamSlug?: string;
  teamName?: string;
}) {
  const [params, setParams] = useSearchParams();
  const { toggleRightPanel } = useAppShell();
  const scoped = projectsForTeam(teamSlug);

  const filters = readFilters(params);
  const filtered = applyFilters(scoped, filters);

  const orderRaw = params.get("order");
  const [orderColumnRaw, orderDir]: [string | null, SortDirection] = orderRaw?.endsWith(":desc")
    ? [orderRaw.slice(0, -":desc".length), "desc"]
    : [orderRaw, "asc"];
  // Coluna desconhecida na URL cai no padrão (sem ordenar), sem quebrar (revisão de código r3,
  // menor 2) — só as colunas que a tabela ordena são aceitas.
  const orderColumn: SortableColumn | null =
    orderColumnRaw && orderColumnRaw in SORTERS ? (orderColumnRaw as SortableColumn) : null;
  const sorted = sortProjects(filtered, orderColumn, orderDir);

  const groupingRaw = params.get("grouping");
  const grouping: GroupKey | null =
    groupingRaw && (GROUP_VALUES as string[]).includes(groupingRaw)
      ? (groupingRaw as GroupKey)
      : null;
  const groups = groupProjects(sorted, grouping);

  const updateParams = (patch: Record<string, string | null>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      return next;
    });
  const setGrouping = (value: string) =>
    updateParams({ grouping: value === "none" ? null : value });
  const setFilters = (value: FilterValue) =>
    updateParams(
      Object.fromEntries(
        FILTER_KEYS.map((key) => [
          `filter.${key}`,
          value[key] && value[key].length > 0 ? value[key].join(",") : null,
        ]),
      ),
    );
  const sortBy = (column: SortableColumn) => {
    if (orderColumn !== column) updateParams({ order: column });
    else if (orderDir === "asc") updateParams({ order: `${column}:desc` });
    else updateParams({ order: null });
  };
  const sortState = (column: SortableColumn): SortDirection | false =>
    orderColumn === column ? orderDir : false;
  // Mesmo mecanismo da estrela do projeto aberto (project-detail.tsx): estado na URL.
  const favorite = params.get("favorite") === "1";
  const setFavorite = (value: boolean) => updateParams({ favorite: value ? "1" : null });
  const team = useWorkspaceTeam(teamSlug);

  const leadOptions: ListOption[] = Array.from(
    new Set(scoped.map((p) => p.lead).filter((l): l is string => Boolean(l))),
  ).map((leadName) => ({
    value: leadName,
    label: leadName,
    icon: <Avatar name={leadName} size="sm" />,
  }));

  const filterSections: FilterCategory[][] = [
    [
      { value: "health", label: "Health", icon: SlidersHorizontal, options: HEALTH_OPTIONS },
      { value: "lead", label: "Lead", icon: UserRoundPen, options: leadOptions },
    ],
  ];
  const hasActiveFilters = Object.values(filters).some((v) => v.length > 0);

  const title = teamSlug ? `${teamName ?? "Team"} › Projects` : "Projects";

  const columnHeaderRow = (
    <TableRow>
      {/* Name sem largura: é a única coluna flexível, absorve o espaço que sobra (medido
          ao vivo no Linear — lá as outras ficam compactas e juntas, o Name é que estica).
          As demais têm largura fixa, medida contra o Linear e arredondada ao grid de 4. */}
      <TableHead sort={sortState("name")} onSort={() => sortBy("name")}>
        Name
      </TableHead>
      <TableHead
        sort={sortState("health")}
        onSort={() => sortBy("health")}
        className={COLUMN_WIDTH.health}
      >
        Health
      </TableHead>
      <TableHead
        sort={sortState("priority")}
        onSort={() => sortBy("priority")}
        className={COLUMN_WIDTH.priority}
      >
        Priority
      </TableHead>
      <TableHead className={COLUMN_WIDTH.lead}>Lead</TableHead>
      <TableHead
        sort={sortState("targetDate")}
        onSort={() => sortBy("targetDate")}
        className={COLUMN_WIDTH.targetDate}
      >
        Target date
      </TableHead>
      <TableHead className={cn(COLUMN_WIDTH.issues, "text-right")}>Issues</TableHead>
      <TableHead
        sort={sortState("status")}
        onSort={() => sortBy("status")}
        className={COLUMN_WIDTH.status}
      >
        Status
      </TableHead>
    </TableRow>
  );

  const renderRow = (project: Project) => (
    <TableRow key={project.id}>
      <TableCell>
        {/* O link é o único alvo de foco da linha (Table já move o foco por coluna com
            ↑ ↓ entre controles focáveis); as outras células só mostram dado. */}
        <Link
          to={`/projects/${project.id}`}
          className="flex items-center gap-2 text-body-md text-primary no-underline focus-ring"
        >
          <ProjectIcon value={project.icon} className="size-icon-sm shrink-0" />
          <span className="truncate font-medium">{project.name}</span>
          {project.milestone && (
            <span className="truncate text-body-sm text-secondary">{project.milestone}</span>
          )}
        </Link>
      </TableCell>
      <TableCell className={COLUMN_WIDTH.health}>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <HealthBadge health={project.health} />
          {project.healthNote && <span className="text-secondary">· {project.healthNote}</span>}
        </span>
      </TableCell>
      <TableCell className={COLUMN_WIDTH.priority}>
        <PriorityIcon priority={project.priority ?? "none"} />
      </TableCell>
      <TableCell className={COLUMN_WIDTH.lead}>{project.lead ?? "···"}</TableCell>
      <TableCell className={COLUMN_WIDTH.targetDate}>{project.targetDate ?? ""}</TableCell>
      <TableCell className={cn(COLUMN_WIDTH.issues, "text-right tabular-nums")}>
        {project.issues}
      </TableCell>
      <TableCell className={COLUMN_WIDTH.status}>
        <span className="flex items-center gap-1.5">
          <ProjectStatusIcon type={project.status} progress={project.progress / 100} />
          <span className="tabular-nums">{project.progress}%</span>
        </span>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-subtle px-2 pl-5">
        {teamSlug ? (
          <>
            <Breadcrumbs
              items={[
                {
                  label: teamName ?? "Team",
                  to: `/teams/${teamSlug}`,
                  icon: team && <ProjectIcon value={team.icon} className="size-icon-sm" />,
                },
                { label: "Projects" },
              ]}
            />
            <IconButton
              icon={Star}
              label={favorite ? "Remove from favorites" : "Add to favorites"}
              variant="ghost"
              className={cn(favorite && "text-warning")}
              onClick={() => setFavorite(!favorite)}
            />
          </>
        ) : (
          <h2 className="text-label-md text-primary">Projects</h2>
        )}
        <Button variant="ghost" icon={Plus} className="ml-auto text-secondary hovered:text-primary">
          New project
        </Button>
      </div>
      <div className="flex h-11 shrink-0 items-center gap-1 px-2">
        <div className="flex h-control-md items-center rounded-full bg-selected px-3 text-label-sm text-primary">
          All projects
        </div>
        <IconButton icon={Plus} label="Add new view" variant="ghost" tone="subtle" />
        <div className="ml-auto flex items-center gap-1.5">
          <FilterMenu sections={filterSections} value={filters} onValueChange={setFilters}>
            {/* Indicador de filtro ativo (como no Linear): o botão fica "pressionado" (o mesmo
                bg-selected da pílula "All projects") quando algum filtro está escolhido. */}
            <IconButton
              icon={ListFilter}
              label="Add filter"
              variant="secondary"
              aria-pressed={hasActiveFilters}
              className={cn(hasActiveFilters && "bg-selected text-primary")}
            />
          </FilterMenu>
          <DisplayOptions
            label="Display options"
            trigger={
              <IconButton icon={SlidersHorizontal} label="Display options" variant="secondary" />
            }
          >
            <DisplayOptionsSection>
              <DisplayOptionsRow label="Grouping">
                {(id) => (
                  <Select
                    id={id}
                    trigger="button"
                    value={grouping ?? "none"}
                    onValueChange={setGrouping}
                    options={[
                      { value: "none", label: "No grouping" },
                      { value: "status", label: "Status" },
                      { value: "health", label: "Health" },
                      { value: "lead", label: "Lead" },
                      { value: "priority", label: "Priority" },
                    ]}
                  />
                )}
              </DisplayOptionsRow>
            </DisplayOptionsSection>
          </DisplayOptions>
          <IconButton
            icon={LayoutPanelLeft}
            label="Toggle details panel"
            variant="secondary"
            onClick={toggleRightPanel}
          />
        </div>
      </div>
      {/* pl-8: recuo extra do começo das colunas, 24 px além do p-2 da página — medido ao vivo
          no Linear (painel + 45 px até o ícone da primeira coluna, contra 21 px daqui sem o
          extra); token mais próximo, sem tocar no px-cell-x do Table (usado em outras fases). */}
      <main className="min-w-0 flex-1 overflow-y-auto p-2 pl-8">
        <h1 className="sr-only">{title}</h1>
        <Table label="Projects">
          <TableHeader>{columnHeaderRow}</TableHeader>
          {!groups && <TableBody>{sorted.map(renderRow)}</TableBody>}
        </Table>
        {groups && (
          <div className="mt-1 flex flex-col gap-2">
            {groups.map((group) => (
              <ListGroup key={group.key} title={group.label} count={group.items.length}>
                <Table label={`${group.label} projects`} className="mt-px">
                  <TableBody>{group.items.map(renderRow)}</TableBody>
                </Table>
              </ListGroup>
            ))}
          </div>
        )}
        {sorted.length === 0 && (
          <p className="p-6 text-center text-body-md text-secondary">No projects yet.</p>
        )}
      </main>
    </div>
  );
}

/** `/teams/:team/projects`: a mesma lista, com o escopo do time da URL. */
export function TeamProjectsListPage() {
  const { team } = useParams<{ team: string }>();
  const found = useWorkspaceTeam(team);
  return <ProjectsListPage teamSlug={team} teamName={found?.name ?? team} />;
}
