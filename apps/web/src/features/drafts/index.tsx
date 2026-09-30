/**
 * Drafts (item "Drafts" da sidebar, spec `customize-sidebar-preferences.md`): os rascunhos de issue
 * do Member. Fechar o "Create new issue" com texto salva um rascunho (sem Team nem Status); aqui a
 * pessoa lista, retoma (título, descrição e Team), publica — vira uma issue real no Team, com o
 * Status inicial dele — ou descarta.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { useState } from "react";
import {
  Alert,
  Button,
  Confirm,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  EmptyState,
  Select,
  Skeleton,
  TextArea,
  TextInput,
  useToast,
} from "@vyzer/design-system/components";
import { TopBar } from "@/layouts/app-shell/top-bar";
import {
  discardIssueDraftMutationOptions,
  issueDraftsQueryOptions,
  publishIssueDraftMutationOptions,
  updateIssueDraftMutationOptions,
} from "@/services/issue-drafts";
import { teamsQueryOptions } from "@/services/teams";

type Draft = NonNullable<ReturnType<typeof useDrafts>["data"]>[number];

function useDrafts() {
  return useQuery(issueDraftsQueryOptions());
}

const NO_TEAM = "none";

function EditDraftDialog({
  draft,
  teams,
  onClose,
}: {
  draft: Draft;
  teams: { id: string; name: string }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description ?? "");
  const [teamId, setTeamId] = useState(draft.teamId ?? NO_TEAM);
  const save = useMutation({
    ...updateIssueDraftMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: issueDraftsQueryOptions().queryKey });
      onClose();
    },
    onError: () =>
      toast({
        title: "Could not save draft",
        description: "Check your connection and try again.",
        variant: "error",
      }),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent title="Edit draft" size="md">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({
              id: draft.id,
              title: title.trim(),
              description: description.trim() === "" ? null : description.trim(),
              teamId: teamId === NO_TEAM ? null : teamId,
            });
          }}
        >
          <DialogBody>
            <TextInput
              aria-label="Draft title"
              placeholder="Issue title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <TextArea
              aria-label="Draft description"
              placeholder="Add description…"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
            />
            <Select
              aria-label="Draft team"
              value={teamId}
              onValueChange={setTeamId}
              options={[
                { value: NO_TEAM, label: "No team" },
                ...teams.map((team) => ({ value: team.id, label: team.name })),
              ]}
            />
          </DialogBody>
          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={save.isPending}>
              Save draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DraftsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const drafts = useDrafts();
  const teams = useQuery(teamsQueryOptions());
  const [editing, setEditing] = useState<Draft | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: issueDraftsQueryOptions().queryKey });
  const publish = useMutation({
    ...publishIssueDraftMutationOptions(),
    onSuccess: async (issue) => {
      await refresh();
      toast({ title: "Issue created", subject: { label: `${issue.identifier} ${issue.title}` } });
    },
    onError: () =>
      toast({
        title: "Could not publish draft",
        description: "A draft needs a title and a team before it becomes an issue.",
        variant: "error",
      }),
  });
  const discard = useMutation({
    ...discardIssueDraftMutationOptions(),
    onSuccess: async () => {
      await refresh();
      toast({ title: "Draft discarded" });
    },
    onError: () =>
      toast({
        title: "Could not discard draft",
        description: "Check your connection and try again.",
        variant: "error",
      }),
  });

  const teamName = (id: string | null) => teams.data?.find((team) => team.id === id)?.name;

  return (
    <>
      <TopBar breadcrumbs={[{ label: "Drafts" }]} />
      <main aria-label="Drafts" className="flex min-h-0 flex-1 flex-col border-t border-default">
        <h1 className="sr-only">Drafts</h1>
        {drafts.isPending ? (
          <div aria-busy="true" className="flex flex-col gap-2 p-4">
            <span className="sr-only">Loading drafts.</span>
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} shape="block" className="h-control-xl" />
            ))}
          </div>
        ) : drafts.isError ? (
          <div className="p-4">
            <Alert
              tone="danger"
              role="alert"
              title="Could not load drafts"
              action={
                <Button type="button" variant="secondary" onClick={() => void drafts.refetch()}>
                  Retry
                </Button>
              }
            >
              Check your connection and try again.
            </Alert>
          </div>
        ) : drafts.data.length === 0 ? (
          <EmptyState icon={PenLine} title="No drafts">
            Close “Create new issue” with something written and it is saved here.
          </EmptyState>
        ) : (
          <ul className="flex flex-col">
            {drafts.data.map((draft) => {
              const title = draft.title.trim();
              return (
                <li
                  key={draft.id}
                  className="flex items-center gap-3 border-b border-default px-4 py-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className={`truncate text-label-md ${title ? "text-primary" : "text-secondary"}`}
                    >
                      {title || "Untitled draft"}
                    </span>
                    <span className="text-body-sm text-secondary">
                      {teamName(draft.teamId) ?? "No team"} ·{" "}
                      {new Date(draft.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => setEditing(draft)}>
                    Open draft
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={title === "" || draft.teamId === null}
                    loading={publish.isPending && publish.variables?.id === draft.id}
                    onClick={() => publish.mutate({ id: draft.id })}
                  >
                    Publish
                  </Button>
                  <Confirm
                    title="Discard draft?"
                    description="This permanently deletes the draft."
                    confirmLabel="Discard draft"
                    onConfirm={() => discard.mutate({ id: draft.id })}
                  >
                    <Button type="button" variant="ghost">
                      Discard
                    </Button>
                  </Confirm>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      {editing && (
        <EditDraftDialog
          draft={editing}
          teams={teams.data ?? []}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
