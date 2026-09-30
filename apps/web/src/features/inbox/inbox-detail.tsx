/**
 * Painel de detalhe da Inbox: a issue da notificação selecionada. Composição local de leitura,
 * a partir de `issue.get`; a página real da issue (Time B) pode substituí-la sem mudar a lista.
 */
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import type { Notification } from "@vyzer/contract";
import { Alert, Button, IconButton, Skeleton } from "@vyzer/design-system/components";
import { issueQueryOptions } from "@/services/issues";
import { priorityValue, statusValue } from "./inbox-model";

function IssueBody({ identifier }: { identifier: string }) {
  const issue = useQuery(issueQueryOptions(identifier));

  if (issue.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <span className="sr-only">Loading issue.</span>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="w-full" />
        <Skeleton className="w-5/6" />
      </div>
    );
  }
  if (issue.isError) {
    return (
      <Alert
        tone="danger"
        title="Could not load the issue"
        action={
          <Button variant="ghost" onClick={() => void issue.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const { title, description, status, priority, assignee } = issue.data;
  const statusItem = statusValue(status);
  const priorityItem = priorityValue(priority);
  return (
    <div className="flex flex-col gap-6">
      <h2 className="type-heading-1 text-primary">{title}</h2>
      {description && (
        <p className="text-body-md whitespace-pre-wrap text-primary">{description}</p>
      )}
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 text-body-md">
        <dt className="text-secondary">Status</dt>
        <dd className="flex items-center gap-2 text-primary">
          {statusItem.icon}
          {statusItem.label}
        </dd>
        <dt className="text-secondary">Priority</dt>
        <dd className="flex items-center gap-2 text-primary">
          {priorityItem.icon}
          {priorityItem.label}
        </dd>
        <dt className="text-secondary">Assignee</dt>
        <dd className="text-primary">{assignee?.name ?? "No assignee"}</dd>
      </dl>
    </div>
  );
}

export function InboxDetail({
  notification,
  onDelete,
}: {
  notification: Notification;
  onDelete: () => void;
}) {
  const { issue } = notification;
  return (
    <section aria-label="Notification detail" className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-default px-4">
        <span className="font-mono text-code text-secondary">{issue?.identifier}</span>
        <IconButton icon={Trash2} label="Delete notification" onClick={onDelete} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {issue ? (
          <IssueBody identifier={issue.identifier} />
        ) : (
          <p className="text-body-md text-secondary">This notification has no issue.</p>
        )}
      </div>
    </section>
  );
}
