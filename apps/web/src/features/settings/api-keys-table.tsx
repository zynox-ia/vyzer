/**
 * Settings → Administration → API → Issued keys (`/settings/api/keys`, spec
 * `settings-security-api-usage.md`, API.3). Referência: Linear ao vivo, 29/09: título "API keys",
 * filtro por chave ou membro, filtro de status (All API keys / Active / Inactive) e a tabela com
 * Key, Created by, Permissions, Created, Last used e Status. Cada linha tem um checkbox: marcar
 * abre a barra flutuante "N selected · Actions · ✕", cujo único item é "Revoke API key" (em
 * lote); o menu da linha também só tem "Revoke API key". Só Admin vê as chaves do Workspace;
 * um Member comum vê as próprias (`scope: "mine"`, a mesma tabela).
 *
 * Busca, filtro e ordenação ficam na URL (regra 8). Export CSV fica adiado (D11).
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useSearchParams } from "react-router";
import {
  Alert,
  Button,
  Checkbox,
  Confirm,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectionBar,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
  useToast,
  type ListOption,
} from "@zynox/design-system/components";
import { api } from "@/services/api";
import { apiKeysQueryOptions, revokeApiKeyMutationOptions } from "@/services/api-keys";
import { currentWorkspaceQueryOptions } from "@/services/workspace";
import {
  API_SETTINGS_PATH,
  ApiKeyMenu,
  formatPermissions,
  formatShortDate,
  PageBackLink,
  PERMISSION_OPTIONS,
  type ApiKey,
} from "./api-key-shared";

type SortKey = "name" | "member" | "permissions" | "created" | "lastUsed" | "status";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive";

const SORT_KEYS: SortKey[] = ["name", "member", "permissions", "created", "lastUsed", "status"];
const STATUS_OPTIONS: ListOption[] = [
  { value: "all", label: "All API keys" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const isActive = (key: ApiKey) => key.revokedAt === null;

function parseSortKey(value: string | null): SortKey {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : "created";
}

function parseStatus(value: string | null): StatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

function compareKeys(a: ApiKey, b: ApiKey, key: SortKey) {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    case "member":
      return a.memberName.localeCompare(b.memberName, "en", { sensitivity: "base" });
    case "permissions":
      return formatPermissions(a.permissions).localeCompare(formatPermissions(b.permissions));
    case "created":
      return a.createdAt.localeCompare(b.createdAt);
    case "lastUsed":
      // Nunca usada vem antes de qualquer data na ordem crescente.
      return (a.lastUsedAt ?? "").localeCompare(b.lastUsedAt ?? "");
    case "status":
      return Number(isActive(b)) - Number(isActive(a));
  }
}

function PermissionsCell({ apiKey }: { apiKey: ApiKey }) {
  if (apiKey.permissions === "full") return <span>Full access</span>;
  const permissions: string[] = apiKey.permissions;
  const granted = PERMISSION_OPTIONS.filter((option) => permissions.includes(option.value));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`View permissions for ${apiKey.name}`}
          className="rounded-inline text-left underline decoration-dotted underline-offset-2 focus-ring hovered:text-primary"
        >
          {formatPermissions(apiKey.permissions)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex flex-col gap-2 p-3">
        {granted.map((option) => (
          <div key={option.value} className="flex flex-col">
            <span className="text-label-md text-primary">{option.label}</span>
            <span className="text-caption text-secondary">{option.description}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function TableSkeleton() {
  return (
    <Table label="Issued API keys" aria-busy="true">
      <TableHeader>
        <TableRow>
          <TableHead>
            <span className="sr-only">Select</span>
          </TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Created by</TableHead>
          <TableHead>Permissions</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last used</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[0, 1, 2].map((row) => (
          <tr key={row} aria-hidden={row === 0 ? undefined : true}>
            {Array.from({ length: 8 }, (_, cell) => (
              <td key={cell} className="px-cell-x py-3">
                {row === 0 && cell === 0 && <span className="sr-only">Loading API keys.</span>}
                <Skeleton className="w-16" />
              </td>
            ))}
          </tr>
        ))}
      </TableBody>
    </Table>
  );
}

export function ApiKeysTablePage() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const current = useQuery(currentWorkspaceQueryOptions());
  const isAdmin = current.data?.member.role === "admin";
  const keys = useQuery({
    ...apiKeysQueryOptions(isAdmin ? "workspace" : "mine"),
    enabled: current.isSuccess,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const sort = parseSortKey(params.get("sort"));
  const direction: SortDirection = params.get("dir") === "asc" ? "asc" : "desc";
  const status = parseStatus(params.get("status"));
  const query = params.get("q") ?? "";

  const setParam = (name: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  };

  const revoke = useMutation(revokeApiKeyMutationOptions());
  const revokeSelected = async (ids: string[]) => {
    const results = await Promise.allSettled(ids.map((id) => revoke.mutateAsync({ id })));
    await queryClient.invalidateQueries({ queryKey: api.apiKey.key() });
    const failed = results.filter((result) => result.status === "rejected").length;
    setSelected([]);
    if (failed === 0) {
      toast({
        title: ids.length === 1 ? "API key revoked" : `${ids.length} API keys revoked`,
        variant: "success",
      });
    } else {
      toast({
        title: "Could not revoke every API key",
        description: `${failed} of ${ids.length} were not revoked. Check your connection and try again.`,
        variant: "error",
      });
    }
  };

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = (keys.data ?? []).filter((key) => {
      if (status === "active" && !isActive(key)) return false;
      if (status === "inactive" && isActive(key)) return false;
      if (!needle) return true;
      return [key.name, key.memberName, key.memberEmail].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
    const sorted = filtered.sort((a, b) => compareKeys(a, b, sort));
    return direction === "desc" ? sorted.reverse() : sorted;
  }, [keys.data, query, status, sort, direction]);

  // Só o que está à vista e ainda ativo continua marcado quando o filtro muda.
  const selectedVisible = selected.filter((id) =>
    rows.some((key) => key.id === id && isActive(key)),
  );

  useEffect(() => {
    if (selectedVisible.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Esc fecha primeiro o menu, o popover ou a janela aberta; só depois limpa a seleção.
      const open = '[role="menu"], [role="listbox"], [role="dialog"], [role="alertdialog"]';
      if (document.querySelector(open)) return;
      setSelected([]);
    };
    // Captura em window: roda antes do Esc do Radix (document, captura), que já teria tirado o
    // menu do DOM e faria este Esc limpar a seleção junto com o fechamento do menu.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [selectedVisible.length]);

  const header = (
    <>
      <PageBackLink to={API_SETTINGS_PATH} label="API" />
      <h1 className="type-heading-1 pb-4 text-primary">API keys</h1>
    </>
  );

  if (current.isPending || (current.isSuccess && keys.isPending)) {
    return (
      <div className="flex flex-col">
        {header}
        <TableSkeleton />
      </div>
    );
  }

  if (current.isError || keys.isError) {
    return (
      <div className="flex flex-col">
        {header}
        <Alert
          tone="danger"
          role="alert"
          title="Could not load API keys"
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void current.refetch();
                void keys.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      </div>
    );
  }

  const sortBy = (key: SortKey) => {
    const nextDirection = sort === key && direction === "desc" ? "asc" : "desc";
    const next = new URLSearchParams(params);
    next.set("sort", key);
    next.set("dir", nextDirection);
    setParams(next, { replace: true });
  };
  const sortState = (key: SortKey) => (sort === key ? direction : false);
  const toggle = (id: string, checked: boolean) =>
    setSelected((previous) =>
      checked ? [...new Set([...previous, id])] : previous.filter((item) => item !== id),
    );

  return (
    <div className="relative flex flex-col gap-1">
      {header}
      <div className="flex items-center gap-2 pb-3">
        <TextInput
          type="search"
          aria-label="Filter API keys"
          placeholder="Filter by key or member…"
          value={query}
          onChange={(event) => setParam("q", event.target.value)}
          className="w-64"
        />
        <Select
          aria-label="API key status"
          trigger="button"
          value={status}
          onValueChange={(next) => setParam("status", next === "all" ? null : next)}
          options={STATUS_OPTIONS}
        />
      </div>
      <Table label="Issued API keys">
        <TableHeader>
          <TableRow>
            <TableHead>
              <span className="sr-only">Select</span>
            </TableHead>
            <TableHead sort={sortState("name")} onSort={() => sortBy("name")}>
              Key
            </TableHead>
            <TableHead sort={sortState("member")} onSort={() => sortBy("member")}>
              Created by
            </TableHead>
            <TableHead sort={sortState("permissions")} onSort={() => sortBy("permissions")}>
              Permissions
            </TableHead>
            <TableHead sort={sortState("created")} onSort={() => sortBy("created")}>
              Created
            </TableHead>
            <TableHead sort={sortState("lastUsed")} onSort={() => sortBy("lastUsed")}>
              Last used
            </TableHead>
            <TableHead sort={sortState("status")} onSort={() => sortBy("status")}>
              Status
            </TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((key) => (
            <TableRow key={key.id} selected={selectedVisible.includes(key.id)} className="group">
              <TableCell className="w-10">
                <Checkbox
                  aria-label={`Select ${key.name}`}
                  disabled={!isActive(key)}
                  checked={selectedVisible.includes(key.id)}
                  onCheckedChange={(checked) => toggle(key.id, checked === true)}
                />
              </TableCell>
              <TableCell className="min-w-48">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-label-md text-primary">{key.name}</span>
                  <span className="truncate text-caption text-secondary">{key.tokenPrefix}…</span>
                </div>
              </TableCell>
              <TableCell>{key.memberName}</TableCell>
              <TableCell>
                <PermissionsCell apiKey={key} />
              </TableCell>
              <TableCell>{formatShortDate(key.createdAt)}</TableCell>
              <TableCell>{key.lastUsedAt ? formatShortDate(key.lastUsedAt) : "Never"}</TableCell>
              <TableCell>{isActive(key) ? "Active" : "Inactive"}</TableCell>
              <TableCell className="w-12 text-right">
                {isActive(key) && (
                  <ApiKeyMenu
                    apiKey={key}
                    edit={false}
                    className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                {(keys.data ?? []).length === 0
                  ? "No API keys."
                  : "No API keys match your filters."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {selectedVisible.length > 0 && (
        <div className="sticky bottom-4 flex justify-center pt-4">
          <SelectionBar
            count={selectedVisible.length}
            onClear={() => setSelected([])}
            clearLabel="Clear selected"
          >
            <MenuItem icon={Trash2} onSelect={() => setConfirming(true)}>
              Revoke API key
            </MenuItem>
          </SelectionBar>
        </div>
      )}
      <Confirm
        open={confirming}
        onOpenChange={setConfirming}
        title={selectedVisible.length === 1 ? "Revoke API key?" : "Revoke API keys?"}
        description="Anything using the selected keys stops working immediately. This cannot be undone."
        confirmLabel="Revoke API key"
        onConfirm={() => void revokeSelected(selectedVisible)}
      />
    </div>
  );
}
