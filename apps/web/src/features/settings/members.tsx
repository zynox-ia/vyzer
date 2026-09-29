/** Members in the resolved Workspace (settings-administration.md, sub-etapa 1.2). */
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { Ellipsis, Pencil } from "lucide-react";
import {
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
  useToast,
} from "@vyzer/design-system/components";
import { FormLabel, FormMessage } from "@vyzer/design-system/components";
import { currentWorkspaceQueryOptions } from "@/services/workspace";
import { membersQueryOptions, updateMemberMutationOptions } from "@/services/members";

type SortKey = "name" | "email" | "role" | "createdAt";
type SortDirection = "asc" | "desc";
type WorkspaceMember = Awaited<
  ReturnType<NonNullable<ReturnType<typeof membersQueryOptions>["queryFn"]>>
>[number];

const SORT_KEYS: SortKey[] = ["name", "email", "role", "createdAt"];

function parseSortKey(value: string | null): SortKey {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : "name";
}

function formatRole(role: string) {
  return role.length === 0 ? role : `${role[0]?.toUpperCase()}${role.slice(1)}`;
}

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function compareMembers(a: WorkspaceMember, b: WorkspaceMember, key: SortKey) {
  if (key === "createdAt") return a.createdAt.localeCompare(b.createdAt);
  return a[key].localeCompare(b[key], "en", { sensitivity: "base" });
}

function MembersTableSkeleton() {
  return (
    <Table label="Members" aria-busy="true">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <tr>
          <td className="px-cell-x py-3">
            <span className="sr-only">Loading Members.</span>
            <Skeleton shape="avatar" />
          </td>
          <td className="px-cell-x py-3">
            <Skeleton />
          </td>
          <td className="px-cell-x py-3">
            <Skeleton className="w-16" />
          </td>
          <td className="px-cell-x py-3">
            <Skeleton className="w-12" />
          </td>
        </tr>
        <tr aria-hidden="true">
          <td className="px-cell-x py-3">
            <Skeleton shape="avatar" />
          </td>
          <td className="px-cell-x py-3">
            <Skeleton />
          </td>
          <td className="px-cell-x py-3">
            <Skeleton className="w-16" />
          </td>
          <td className="px-cell-x py-3">
            <Skeleton className="w-12" />
          </td>
        </tr>
        <tr aria-hidden="true">
          <td className="px-cell-x py-3">
            <Skeleton shape="avatar" />
          </td>
          <td className="px-cell-x py-3">
            <Skeleton />
          </td>
          <td className="px-cell-x py-3">
            <Skeleton className="w-16" />
          </td>
          <td className="px-cell-x py-3">
            <Skeleton className="w-12" />
          </td>
        </tr>
      </TableBody>
    </Table>
  );
}

function UpdateMemberNameDialog({
  member,
  onClose,
  onSave,
  saving,
}: {
  member: WorkspaceMember;
  onClose: () => void;
  onSave: (name: string) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(member.name);

  const trimmedName = name.trim();
  const invalid = trimmedName.length === 0;
  const unchanged = member?.name === trimmedName;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (invalid || unchanged || saving) return;
    onSave(trimmedName);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent title="Update name" description="Change this Member's display name.">
        <form onSubmit={submit} className="contents">
          <DialogBody>
            <div className="flex flex-col gap-1.5">
              <FormLabel htmlFor="member-name">Name</FormLabel>
              <TextInput
                id="member-name"
                autoComplete="off"
                value={name}
                invalid={invalid}
                onChange={(event) => setName(event.target.value)}
              />
              {invalid && <FormMessage>Name is required.</FormMessage>}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={invalid || unchanged || saving}
              loading={saving}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MembersPage() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const members = useQuery(membersQueryOptions());
  const current = useQuery(currentWorkspaceQueryOptions());
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(null);
  const sort = parseSortKey(params.get("sort"));
  const direction: SortDirection = params.get("dir") === "desc" ? "desc" : "asc";
  const canEdit = current.data?.member.role === "admin";

  const update = useMutation({
    ...updateMemberMutationOptions(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: membersQueryOptions().queryKey }),
        queryClient.invalidateQueries({ queryKey: currentWorkspaceQueryOptions().queryKey }),
      ]);
      setEditingMember(null);
      toast({ title: "Member name updated", variant: "success" });
    },
    onError: () => {
      toast({
        title: "Could not update Member name",
        description: "Check your connection and try again.",
        variant: "error",
      });
    },
  });

  const sortedMembers = useMemo(() => {
    const result = [...(members.data ?? [])].sort((a, b) => compareMembers(a, b, sort));
    return direction === "desc" ? result.reverse() : result;
  }, [members.data, sort, direction]);

  const sortBy = (key: SortKey) => {
    const nextDirection = sort === key && direction === "asc" ? "desc" : "asc";
    const next = new URLSearchParams(params);
    next.set("sort", key);
    next.set("dir", nextDirection);
    setParams(next);
  };

  const sortState = (key: SortKey) => (sort === key ? direction : false);

  if (members.isPending || current.isPending) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Members</h1>
        <MembersTableSkeleton />
      </div>
    );
  }

  if (members.isError || current.isError) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Members</h1>
        <Alert
          tone="danger"
          role="alert"
          title="Could not load Members"
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void members.refetch();
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

  return (
    <div className="flex flex-col gap-1">
      <h1 className="type-heading-1 pb-6 text-primary">Members</h1>
      <Table label="Members">
        <TableHeader>
          <TableRow>
            <TableHead sort={sortState("name")} onSort={() => sortBy("name")}>
              Name
            </TableHead>
            <TableHead sort={sortState("email")} onSort={() => sortBy("email")}>
              Email
            </TableHead>
            <TableHead sort={sortState("role")} onSort={() => sortBy("role")}>
              Status
            </TableHead>
            <TableHead sort={sortState("createdAt")} onSort={() => sortBy("createdAt")}>
              Joined
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.map((member) => (
            <TableRow key={member.id} className="group">
              <TableCell className="min-w-56">
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar name={member.name} />
                    <span className="truncate text-primary">{member.name}</span>
                  </div>
                  {canEdit && (
                    <Menu>
                      <MenuTrigger asChild>
                        <IconButton
                          icon={Ellipsis}
                          label="Open menu"
                          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
                        />
                      </MenuTrigger>
                      <MenuContent variant="dropdown" align="end">
                        <MenuItem icon={Pencil} onSelect={() => setEditingMember(member)}>
                          Update name…
                        </MenuItem>
                      </MenuContent>
                    </Menu>
                  )}
                </div>
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{formatRole(member.role)}</TableCell>
              <TableCell>{formatJoinedDate(member.createdAt)}</TableCell>
            </TableRow>
          ))}
          {sortedMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>No Members found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {editingMember && (
        <UpdateMemberNameDialog
          key={editingMember.id}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={(name) => update.mutate({ id: editingMember.id, name })}
          saving={update.isPending}
        />
      )}
    </div>
  );
}
