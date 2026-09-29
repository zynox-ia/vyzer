/** Members in the resolved Workspace (settings-administration.md, sub-etapa 1.2). */
import { useMemo, useRef, useState, type FormEvent } from "react";
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
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
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
          <td className="px-cell-x py-3">
            <Skeleton className="w-6" />
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
          <td className="px-cell-x py-3">
            <Skeleton className="w-6" />
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
          <td className="px-cell-x py-3">
            <Skeleton className="w-6" />
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
  // Como o Linear (medido ao vivo, aberto e cancelado): campo vazio com o nome atual de
  // placeholder, "Cancel" e "Update".
  const [name, setName] = useState("");

  const trimmedName = name.trim();
  const unchanged = member.name === trimmedName;
  const cannotSave = trimmedName.length === 0 || unchanged || saving;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cannotSave) return;
    onSave(trimmedName);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent title={`Please enter the new full name for ${member.name}`}>
        <form onSubmit={submit} className="contents">
          <DialogBody>
            <TextInput
              aria-label="Full name"
              autoComplete="off"
              placeholder={member.name}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={cannotSave} loading={saving}>
              Update
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
  // O Radix devolve o foco ao gatilho ao fechar o menu, tirando-o do Dialog que acabou de abrir.
  const openingDialog = useRef(false);
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
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.map((member) => (
            <TableRow key={member.id} className="group">
              <TableCell className="min-w-56">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={member.name} />
                  <span className="truncate text-label-md text-primary">{member.name}</span>
                </div>
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{formatRole(member.role)}</TableCell>
              <TableCell>{formatJoinedDate(member.createdAt)}</TableCell>
              <TableCell className="w-12 text-right">
                {canEdit && (
                  <Menu>
                    <MenuTrigger asChild>
                      <IconButton
                        icon={Ellipsis}
                        label="Open menu"
                        className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
                      />
                    </MenuTrigger>
                    <MenuContent
                      variant="dropdown"
                      align="end"
                      onCloseAutoFocus={(event) => {
                        if (openingDialog.current) {
                          event.preventDefault();
                          openingDialog.current = false;
                        }
                      }}
                    >
                      <MenuItem
                        icon={Pencil}
                        onSelect={() => {
                          openingDialog.current = true;
                          setEditingMember(member);
                        }}
                      >
                        Update name…
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                )}
              </TableCell>
            </TableRow>
          ))}
          {sortedMembers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>No Members found.</TableCell>
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
