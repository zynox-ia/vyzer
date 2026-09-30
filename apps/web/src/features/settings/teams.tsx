/**
 * Settings → Administration → Teams (spec `settings-administration.md`, sub-etapa 2.1; Linear ao
 * vivo, `/zynox-dev/settings/teams`, sem frame no Figma): tabela larga com Name (ícone, nome e
 * key), Members, Issues e Created, ordenável por search param (`?sort=`/`&dir=`, regra 8).
 *
 * Como o Linear ao vivo (29/09, pedido do responsável): barra com filtro por nome (`?q=`), o
 * filtro de estado "Active" e, à direita, Export CSV e Create team; coluna Visibility (hoje só
 * "Workspace") e a linha de grupo "Active N". Issues sempre 0 até o domínio de Issues existir
 * (vem do contrato). A linha inteira leva a
 * `/settings/teams/:team` (o slug, D8): o link real fica na célula do nome e o resto da linha
 * também clica. Menu da linha: "Team settings" e "Delete team…" (`Confirm` danger; "Leave team…"
 * fica de fora, D5/D11). Exclusão imediata, sem janela de restauração (ADR-0016); com Project
 * associado a API devolve CONFLICT e nada é alterado.
 */
import { Ellipsis, LogOut, Settings, Trash2, UsersRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { TeamListItem } from "@vyzer/contract";
import {
  Alert,
  Button,
  ComboboxPanel,
  Confirm,
  EmptyState,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuPanel,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  ProjectIcon,
  SearchInput,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { deleteTeamMutationOptions, teamsQueryOptions } from "@/services/teams";
import { formatShortDate } from "./format";
import { TEAM_DESTINATIONS } from "./team-settings/destinations";

type SortKey = "name" | "members" | "issues" | "created";
type SortDirection = "asc" | "desc";

const SORT_KEYS: SortKey[] = ["name", "members", "issues", "created"];

function parseSortKey(value: string | null): SortKey {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : "name";
}

function compareTeams(a: TeamListItem, b: TeamListItem, key: SortKey) {
  switch (key) {
    case "members":
      return a.memberCount - b.memberCount;
    case "issues":
      return a.issueCount - b.issueCount;
    case "created":
      return a.createdAt.localeCompare(b.createdAt);
    default:
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  }
}

const VISIBILITY = "Workspace";

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** CSV de Teams (Name, Key, Visibility, Members, Issues, Created), baixado pelo navegador. */
function downloadTeamsCsv(teams: TeamListItem[]) {
  const rows = [
    ["Name", "Key", "Visibility", "Members", "Issues", "Created"],
    ...teams.map((t) => [t.name, t.key, VISIBILITY, t.memberCount, t.issueCount, t.createdAt]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "teams.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function TeamsHeader({
  query,
  onQuery,
  onExport,
  onCreate,
}: {
  query: string;
  onQuery: (value: string) => void;
  onExport: () => void;
  onCreate: () => void;
}) {
  return (
    <>
      <h1 className="type-heading-1 pb-4 text-primary">Teams</h1>
      {/* Como no Linear (medido ao vivo): filtro e estado à esquerda; Export CSV e Create team à
          direita, antes da tabela. */}
      <div className="flex items-center gap-2 pb-4">
        <SearchInput
          aria-label="Filter teams by name"
          placeholder="Filter by name..."
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className="w-72"
        />
        <Select
          trigger="button"
          aria-label="Team status"
          value="active"
          options={[{ value: "active", label: "Active" }]}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={onExport}>
            Export CSV
          </Button>
          <Button type="button" variant="primary" onClick={onCreate}>
            Create team
          </Button>
        </div>
      </div>
    </>
  );
}

function TeamsTableSkeleton() {
  return (
    <Table label="Teams" aria-busy="true">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Visibility</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Issues</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[0, 1, 2].map((row) => (
          <tr key={row} aria-hidden={row === 0 ? undefined : true}>
            <td className="px-cell-x py-3">
              {row === 0 && <span className="sr-only">Loading Teams.</span>}
              <Skeleton className="w-40" />
            </td>
            <td className="px-cell-x py-3">
              <Skeleton className="w-16" />
            </td>
            <td className="px-cell-x py-3">
              <Skeleton className="w-8" />
            </td>
            <td className="px-cell-x py-3">
              <Skeleton className="w-8" />
            </td>
            <td className="px-cell-x py-3">
              <Skeleton className="w-12" />
            </td>
            <td className="px-cell-x py-3">
              <Skeleton className="w-6" />
            </td>
          </tr>
        ))}
      </TableBody>
    </Table>
  );
}

export function TeamsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const teams = useQuery(teamsQueryOptions());
  const [deleting, setDeleting] = useState<TeamListItem | null>(null);
  // O Radix devolve o foco ao gatilho do menu ao fechá-lo, tirando-o do Confirm que abriu.
  const openingConfirm = useRef(false);
  const sort = parseSortKey(params.get("sort"));
  const direction: SortDirection = params.get("dir") === "desc" ? "desc" : "asc";

  const remove = useMutation({
    ...deleteTeamMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamsQueryOptions().queryKey });
    },
    onError: (error) => {
      const conflict = "code" in error && error.code === "CONFLICT";
      setDeleting(null);
      toast({
        title: "Could not delete team",
        description: conflict
          ? "This team still has Projects. Nothing was deleted."
          : "Nothing was deleted. Check your connection and try again.",
        variant: "error",
      });
    },
  });

  const query = params.get("q") ?? "";
  const sortedTeams = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = (teams.data ?? []).filter(
      (team) => needle === "" || team.name.toLowerCase().includes(needle),
    );
    const result = matching.sort((a, b) => compareTeams(a, b, sort));
    return direction === "desc" ? result.reverse() : result;
  }, [teams.data, query, sort, direction]);

  const setQuery = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === "") next.delete("q");
    else next.set("q", value);
    setParams(next, { replace: true });
  };

  const sortBy = (key: SortKey) => {
    const next = new URLSearchParams(params);
    next.set("sort", key);
    next.set("dir", sort === key && direction === "asc" ? "desc" : "asc");
    setParams(next);
  };
  const sortState = (key: SortKey) => (sort === key ? direction : false);
  const createTeam = () => navigate("/settings/teams/new");

  if (teams.isPending) {
    return (
      <div className="flex flex-col">
        <TeamsHeader
          query={query}
          onQuery={setQuery}
          onExport={() => downloadTeamsCsv(sortedTeams)}
          onCreate={createTeam}
        />
        <TeamsTableSkeleton />
      </div>
    );
  }

  if (teams.isError) {
    return (
      <div className="flex flex-col">
        <TeamsHeader
          query={query}
          onQuery={setQuery}
          onExport={() => downloadTeamsCsv(sortedTeams)}
          onCreate={createTeam}
        />
        <Alert
          tone="danger"
          role="alert"
          title="Could not load Teams"
          action={
            <Button type="button" variant="secondary" onClick={() => void teams.refetch()}>
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TeamsHeader
        query={query}
        onQuery={setQuery}
        onExport={() => downloadTeamsCsv(sortedTeams)}
        onCreate={createTeam}
      />
      {sortedTeams.length === 0 && query.trim() !== "" ? (
        <EmptyState icon={UsersRound} title="No teams found">
          No team matches “{query.trim()}”.
        </EmptyState>
      ) : sortedTeams.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No teams yet"
          action={
            <Button type="button" variant="primary" onClick={createTeam}>
              Create team
            </Button>
          }
        >
          Teams own Issues, Workflows and Cycles. Create the first one to get started.
        </EmptyState>
      ) : (
        <Table label="Teams">
          <TableHeader>
            <TableRow>
              <TableHead sort={sortState("name")} onSort={() => sortBy("name")}>
                Name
              </TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead sort={sortState("members")} onSort={() => sortBy("members")}>
                Members
              </TableHead>
              <TableHead sort={sortState("issues")} onSort={() => sortBy("issues")}>
                Issues
              </TableHead>
              <TableHead sort={sortState("created")} onSort={() => sortBy("created")}>
                Created
              </TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <tr>
              <td colSpan={6} className="bg-hover px-cell-x py-1.5 text-label-md text-secondary">
                Active <span className="pl-1 text-tertiary">{sortedTeams.length}</span>
              </td>
            </tr>
            {sortedTeams.map((team) => (
              <TableRow
                key={team.id}
                className="group cursor-default"
                onClick={() => navigate(`/settings/teams/${team.slug}`)}
              >
                <TableCell className="min-w-56">
                  <div className="flex min-w-0 items-center gap-2">
                    <ProjectIcon value={team.icon} className="size-icon-14" />
                    <Link
                      to={`/settings/teams/${team.slug}`}
                      onClick={(event) => event.stopPropagation()}
                      className="truncate text-label-md text-primary no-underline focus-ring"
                    >
                      {team.name}
                    </Link>
                    <span className="shrink-0 text-label-md text-secondary">{team.key}</span>
                  </div>
                </TableCell>
                <TableCell>{VISIBILITY}</TableCell>
                <TableCell>
                  <Link
                    to={`/settings/teams/${team.slug}/members`}
                    onClick={(event) => event.stopPropagation()}
                    className="rounded-control text-primary no-underline focus-ring hovered:underline"
                  >
                    {team.memberCount}
                  </Link>
                </TableCell>
                <TableCell>{team.issueCount}</TableCell>
                <TableCell>{formatShortDate(team.createdAt)}</TableCell>
                <TableCell
                  className="w-12 text-right"
                  // A linha inteira navega; o menu fica fora desse clique.
                  onClick={(event) => event.stopPropagation()}
                >
                  <Menu>
                    <MenuTrigger asChild>
                      <IconButton
                        icon={Ellipsis}
                        label={`Open menu for ${team.name}`}
                        className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
                      />
                    </MenuTrigger>
                    <MenuContent
                      variant="dropdown"
                      align="end"
                      onCloseAutoFocus={(event) => {
                        if (openingConfirm.current) {
                          event.preventDefault();
                          openingConfirm.current = false;
                        }
                      }}
                    >
                      <MenuSub>
                        <MenuSubTrigger icon={Settings}>Settings</MenuSubTrigger>
                        <MenuSubContent panelLabel="Team settings" className="w-64">
                          <MenuPanel>
                            <ComboboxPanel
                              label="Team settings"
                              numbered={false}
                              searchPlaceholder="Filter…"
                              options={TEAM_DESTINATIONS.map((d) => ({
                                value: d.path || "overview",
                                label: d.label,
                                icon: <Icon icon={d.icon} size="14" />,
                              }))}
                              onValueChange={(value) =>
                                navigate(
                                  `/settings/teams/${team.slug}${value === "overview" ? "" : `/${value}`}`,
                                )
                              }
                            />
                          </MenuPanel>
                        </MenuSubContent>
                      </MenuSub>
                      <MenuSeparator />
                      <MenuItem icon={LogOut} disabled>
                        Leave team…
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem
                        icon={Trash2}
                        onSelect={() => {
                          openingConfirm.current = true;
                          setDeleting(team);
                        }}
                      >
                        Delete…
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Confirm
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete team?"
        description={`This permanently deletes ${deleting?.name ?? "this team"}. It happens immediately and cannot be undone.`}
        confirmLabel="Delete team"
        onConfirm={() => {
          if (!deleting) return;
          // O Confirm fecha ao confirmar e zera `deleting`; o nome para o aviso sai daqui.
          const { id, name } = deleting;
          remove.mutate(
            { id },
            { onSuccess: () => toast({ title: `${name} deleted`, variant: "success" }) },
          );
        }}
      />
    </div>
  );
}
