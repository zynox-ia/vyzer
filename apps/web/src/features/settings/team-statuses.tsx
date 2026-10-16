/** Issue statuses of one Team (issue-workflow.md, etapa 3.1): the Workflow grouped by category. */
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ORPCError } from "@orpc/client";
import { ArrowDown, ArrowUp, Ellipsis, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router";
import {
  Alert,
  Button,
  ColorDot,
  Combobox,
  Confirm,
  EmptyState,
  IconButton,
  LABEL_COLORS,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  ProjectIcon,
  Skeleton,
  TextInput,
  useToast,
  type LabelColor,
} from "@zynox/design-system/components";
import { StatusIcon } from "@zynox/design-system/icons";
import type { WorkflowStatus } from "@zynox/contract";
import {
  createStatusMutationOptions,
  deleteStatusMutationOptions,
  reorderStatusMutationOptions,
  setDefaultStatusMutationOptions,
  statusesQueryOptions,
  updateStatusMutationOptions,
} from "@/services/statuses";
import { teamQueryOptions } from "@/services/teams";
import { currentWorkspaceQueryOptions } from "@/services/workspace";

type Category = WorkflowStatus["category"];

/** Fixed category order of the Linear workflow; Duplicate is its own group after Canceled. */
const CATEGORY_ORDER: Category[] = [
  "triage",
  "backlog",
  "unstarted",
  "started",
  "completed",
  "canceled",
  "duplicate",
];

const CATEGORY_TITLES: Record<Category, string> = {
  triage: "Triage",
  backlog: "Backlog",
  unstarted: "Unstarted",
  started: "Started",
  completed: "Completed",
  canceled: "Canceled",
  duplicate: "Duplicate",
};

/** Triage and Duplicate belong to the system: no "+" and no row menu (Linear, ao vivo). */
const isSystemCategory = (category: Category) => category === "triage" || category === "duplicate";

/** Only Backlog and Unstarted statuses can be the Team default (issue-workflow.md, 3.1). */
const canBeDefault = (category: Category) => category === "backlog" || category === "unstarted";

type Editing = { kind: "edit"; id: string } | { kind: "create"; category: Category };

const COLOR_OPTIONS = LABEL_COLORS.map((c) => ({
  value: c.value,
  label: c.label,
  icon: <ColorDot color={c.value} />,
}));

/** Started icons fill a bigger slice the further they sit in the category: 1/(n+1) … n/(n+1). */
function StatusGlyph({
  category,
  color,
  index,
  count,
}: {
  category: Category;
  color: LabelColor;
  index: number;
  count: number;
}) {
  return (
    <StatusIcon
      type={category}
      color={color}
      progress={category === "started" ? (index + 1) / (count + 1) : undefined}
    />
  );
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ORPCError && (error.code === "BAD_REQUEST" || error.code === "CONFLICT")) {
    return error.message;
  }
  return fallback;
}

type FormValues = { name: string; description: string | null; color: LabelColor };

const rowClass = "flex h-15 items-center border-b border-default px-4";

function StatusForm({
  category,
  status,
  index,
  count,
  saving,
  onCancel,
  onSave,
}: {
  category: Category;
  status?: WorkflowStatus;
  index: number;
  count: number;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: FormValues) => void;
}) {
  const [name, setName] = useState(status?.name ?? "");
  const [description, setDescription] = useState(status?.description ?? "");
  const [color, setColor] = useState<LabelColor>(status?.color ?? "grey");

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => nameRef.current?.focus(), []);

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const unchanged =
    status !== undefined &&
    status.name === trimmedName &&
    (status.description ?? "") === trimmedDescription &&
    status.color === color;
  const cannotSave = trimmedName.length === 0 || unchanged || saving;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cannotSave) return;
    onSave({
      name: trimmedName,
      description: trimmedDescription.length > 0 ? trimmedDescription : null,
      color,
    });
  };

  const cancelOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && !event.defaultPrevented) onCancel();
  };

  return (
    <form onSubmit={submit} className={`${rowClass} gap-3`}>
      <Combobox<LabelColor>
        label="Status color"
        searchPlaceholder="Search…"
        numbered={false}
        options={COLOR_OPTIONS}
        value={color}
        onValueChange={setColor}
        width="sm"
      >
        <Button
          type="button"
          variant="ghost"
          aria-label="Choose color"
          className="size-control-md shrink-0 px-0"
        >
          <StatusGlyph category={category} color={color} index={index} count={count} />
        </Button>
      </Combobox>
      <TextInput
        aria-label="Name"
        autoComplete="off"
        ref={nameRef}
        className="w-36 shrink-0"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={cancelOnEscape}
      />
      <TextInput
        aria-label="Description"
        autoComplete="off"
        placeholder="Description"
        className="min-w-0 flex-1"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        onKeyDown={cancelOnEscape}
      />
      <Button type="button" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" disabled={cannotSave} loading={saving}>
        Save
      </Button>
    </form>
  );
}

function StatusRowMenu({
  status,
  index,
  count,
  onMakeDefault,
  onMove,
  onEdit,
  onDelete,
}: {
  status: WorkflowStatus;
  index: number;
  count: number;
  onMakeDefault: () => void;
  onMove: (position: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // Radix returns focus to the trigger when the menu closes, which would pull it out of the
  // inline form or Confirm that the selected item just opened.
  const openingOverlay = useRef(false);
  const open = (action: () => void) => () => {
    openingOverlay.current = true;
    action();
  };

  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton
          icon={Ellipsis}
          label="Open menu"
          className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
        />
      </MenuTrigger>
      <MenuContent
        variant="dropdown"
        align="end"
        onCloseAutoFocus={(event) => {
          if (openingOverlay.current) {
            event.preventDefault();
            openingOverlay.current = false;
          }
        }}
      >
        {canBeDefault(status.category) && !status.isDefault && (
          <MenuItem icon={Star} onSelect={onMakeDefault}>
            Make default
          </MenuItem>
        )}
        {index > 0 && (
          <MenuItem icon={ArrowUp} onSelect={() => onMove(index - 1)}>
            Move up
          </MenuItem>
        )}
        {index < count - 1 && (
          <MenuItem icon={ArrowDown} onSelect={() => onMove(index + 1)}>
            Move down
          </MenuItem>
        )}
        <MenuItem icon={Pencil} onSelect={open(onEdit)}>
          Edit
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={Trash2} className="text-danger-strong" onSelect={open(onDelete)}>
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function StatusRow({
  status,
  index,
  count,
  canEdit,
  ...actions
}: {
  status: WorkflowStatus;
  index: number;
  count: number;
  canEdit: boolean;
  onMakeDefault: () => void;
  onMove: (position: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className={`${rowClass} group gap-3`}>
      <span className="flex size-control-lg shrink-0 items-center justify-center">
        <StatusGlyph category={status.category} color={status.color} index={index} count={count} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline gap-1">
          <span className="truncate text-label-md text-primary">{status.name}</span>
          {status.isDefault && (
            <>
              <span aria-hidden className="text-body-md text-secondary">
                ·
              </span>
              <span className="text-body-md text-secondary">Default</span>
            </>
          )}
        </div>
        {status.description && (
          <p className="truncate text-body-sm text-secondary">{status.description}</p>
        )}
      </div>
      {canEdit && !isSystemCategory(status.category) && (
        <StatusRowMenu status={status} index={index} count={count} {...actions} />
      )}
    </li>
  );
}

function PageHeader({ team }: { team: string }) {
  const teamQuery = useQuery(teamQueryOptions(team));
  return (
    <div className="flex flex-col gap-1 px-4 pb-6">
      <Link
        to={`/settings/teams/${team}`}
        className="mb-4 flex h-control-md w-fit items-center gap-1.5 rounded-full px-2 text-label-md text-secondary no-underline transition-colors focus-ring hovered:bg-hover hovered:text-primary"
      >
        {teamQuery.data && <ProjectIcon value={teamQuery.data.icon} />}
        {teamQuery.data?.name ?? team}
      </Link>
      <h1 className="type-heading-1 text-primary">Issue statuses</h1>
      <p className="text-body-md text-secondary">
        Issue statuses define the workflow that issues go through from start to completion.
      </p>
    </div>
  );
}

function StatusesSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Loading statuses.</span>
      {[1, 2, 3].map((group) => (
        <div key={group} aria-hidden="true" className="flex flex-col">
          <Skeleton className="mx-3 h-9 rounded-sm" />
          <div className={`${rowClass} gap-3`}>
            <Skeleton className="size-control-lg" />
            <Skeleton className="w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TeamStatusesPage() {
  const { team = "" } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const statuses = useQuery(statusesQueryOptions(team));
  const current = useQuery(currentWorkspaceQueryOptions());
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<WorkflowStatus | null>(null);
  const canEdit = current.data?.member.role === "admin";

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: statusesQueryOptions(team).queryKey });
  const fail = (title: string) => (error: unknown) =>
    toast({
      title,
      description: errorMessage(error, "Check your connection and try again."),
      variant: "error",
    });

  const create = useMutation({
    ...createStatusMutationOptions(),
    onSuccess: async () => {
      await refresh();
      setEditing(null);
    },
    onError: fail("Could not create status"),
  });
  const update = useMutation({
    ...updateStatusMutationOptions(),
    onSuccess: async () => {
      await refresh();
      setEditing(null);
    },
    onError: fail("Could not update status"),
  });
  const remove = useMutation({
    ...deleteStatusMutationOptions(),
    onSuccess: async () => {
      await refresh();
      setDeleting(null);
    },
    onError: (error) => {
      setDeleting(null);
      fail("Could not delete status")(error);
    },
  });
  const reorder = useMutation({
    ...reorderStatusMutationOptions(),
    onSuccess: refresh,
    onError: fail("Could not move status"),
  });
  const setDefault = useMutation({
    ...setDefaultStatusMutationOptions(),
    onSuccess: refresh,
    onError: fail("Could not change the default status"),
  });

  if (statuses.isPending || current.isPending) {
    return (
      <div className="-mx-10 flex flex-col">
        <PageHeader team={team} />
        <StatusesSkeleton />
      </div>
    );
  }

  if (
    statuses.isError &&
    statuses.error instanceof ORPCError &&
    statuses.error.code === "NOT_FOUND"
  ) {
    return (
      <div className="-mx-10 flex flex-col">
        <PageHeader team={team} />
        <EmptyState title="Team not found">
          This Team does not exist in the current Workspace.
        </EmptyState>
      </div>
    );
  }

  if (statuses.isError || current.isError) {
    return (
      <div className="-mx-10 flex flex-col">
        <PageHeader team={team} />
        <Alert
          tone="danger"
          role="alert"
          title="Could not load statuses"
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void statuses.refetch();
                void current.refetch();
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

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: statuses.data.filter((status) => status.category === category),
  })).filter((group) => group.items.length > 0 || (canEdit && !isSystemCategory(group.category)));

  return (
    <div className="-mx-10 flex flex-col">
      <PageHeader team={team} />
      <div className="flex flex-col">
        {groups.map(({ category, items }) => (
          <section key={category} aria-label={CATEGORY_TITLES[category]} className="flex flex-col">
            <header className="mx-3 flex h-9 items-center justify-between rounded-sm bg-subtle pr-1.5 pl-4">
              <h3 className="text-label-md text-secondary">{CATEGORY_TITLES[category]}</h3>
              {canEdit && !isSystemCategory(category) && (
                <IconButton
                  icon={Plus}
                  label="Create new workflow state"
                  size="sm"
                  onClick={() => setEditing({ kind: "create", category })}
                />
              )}
            </header>
            <ul className="flex flex-col">
              {items.map((status, index) =>
                editing?.kind === "edit" && editing.id === status.id ? (
                  <li key={status.id} className="contents">
                    <StatusForm
                      category={category}
                      status={status}
                      index={index}
                      count={items.length}
                      saving={update.isPending}
                      onCancel={() => setEditing(null)}
                      onSave={(values) => update.mutate({ id: status.id, ...values })}
                    />
                  </li>
                ) : (
                  <StatusRow
                    key={status.id}
                    status={status}
                    index={index}
                    count={items.length}
                    canEdit={canEdit}
                    onMakeDefault={() => setDefault.mutate({ id: status.id })}
                    onMove={(position) => reorder.mutate({ id: status.id, position })}
                    onEdit={() => setEditing({ kind: "edit", id: status.id })}
                    onDelete={() => setDeleting(status)}
                  />
                ),
              )}
              {editing?.kind === "create" && editing.category === category && (
                <li className="contents">
                  <StatusForm
                    category={category}
                    index={items.length}
                    count={items.length + 1}
                    saving={create.isPending}
                    onCancel={() => setEditing(null)}
                    onSave={(values) => create.mutate({ team, category, ...values })}
                  />
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>
      <Confirm
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description="This status will be removed from the Team's workflow. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleting && remove.mutate({ id: deleting.id })}
      />
    </div>
  );
}
