/**
 * Inbox (spec inbox-notifications, etapa 4.1): lista de notificações do Member e, ao lado, a issue
 * da notificação selecionada. Selecionar grava `/inbox/:notificationId` (D10); "Show unreads only"
 * vive em `?unread=1` (regra 8). Abrir uma notificação a marca como lida.
 */
import { useQuery } from "@tanstack/react-query";
import { Ellipsis, Inbox as InboxIcon, ListFilter, Trash2 } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import {
  Alert,
  Button,
  EmptyState,
  IconButton,
  IssueList,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  NotificationRow,
  NotificationRowSkeleton,
  Tooltip,
} from "@vyzer/design-system/components";
import { TopBar } from "@/layouts/app-shell/top-bar";
import {
  notificationsQueryOptions,
  unreadNotificationsCountQueryOptions,
} from "@/services/notifications";
import { InboxDetail } from "./inbox-detail";
import { notificationRowProps } from "./inbox-model";
import { INBOX_LIST_INPUT, useNotificationMutations } from "./use-notification-mutations";

const SKELETON_ROWS = ["a", "b", "c", "d", "e"];

function ListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col p-2">
      <span className="sr-only">Loading notifications.</span>
      {SKELETON_ROWS.map((key) => (
        <NotificationRowSkeleton key={key} />
      ))}
    </div>
  );
}

export function InboxPage() {
  const { notificationId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const unreadOnly = searchParams.get("unread") === "1";

  const list = useQuery(notificationsQueryOptions(INBOX_LIST_INPUT));
  const unreadCount = useQuery(unreadNotificationsCountQueryOptions());
  const { markRead, markUnread, archive, archiveAll } = useNotificationMutations();
  const listRef = useRef<HTMLDivElement>(null);

  const items = list.data?.items ?? [];
  // A notificação aberta continua na lista mesmo depois de lida, para o painel não sumir.
  const visible = unreadOnly
    ? items.filter((item) => item.readAt === null || item.id === notificationId)
    : items;
  const selected = items.find((item) => item.id === notificationId);

  // Abrir marca como lida uma vez por notificação; "U" depois disso não é desfeito.
  const autoRead = useRef<string>(undefined);
  useEffect(() => {
    if (selected && selected.readAt === null && autoRead.current !== selected.id) {
      autoRead.current = selected.id;
      markRead.mutate({ ids: [selected.id] });
    }
  }, [selected, markRead]);

  const open = (id: string | undefined) =>
    navigate({ pathname: id ? `/inbox/${id}` : "/inbox", search });

  /** A próxima notificação da lista (ou a anterior, se era a última) depois de sair a de `id`. */
  const neighbor = (id: string) => {
    const index = visible.findIndex((item) => item.id === id);
    return (visible[index + 1] ?? visible[index - 1])?.id;
  };

  const focusOption = (id: string | undefined) => {
    if (!id) return;
    setTimeout(() => listRef.current?.querySelector<HTMLElement>(`[data-value="${id}"]`)?.focus());
  };

  const remove = (id: string) => {
    const next = neighbor(id);
    if (id === notificationId) void open(next);
    focusOption(next);
    archive.mutate({ ids: [id] });
  };

  const removeRead = () => {
    const selectedRemoved = selected !== undefined && selected.readAt !== null;
    if (selectedRemoved) void open(undefined);
    archiveAll.mutate({ onlyRead: true });
  };

  const toggleRead = (id: string) => {
    const item = items.find((n) => n.id === id);
    if (!item) return;
    if (item.readAt === null) markRead.mutate({ ids: [id] });
    else markUnread.mutate({ ids: [id] });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const option = (event.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (event.target !== option || !option || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const id = option.dataset.value ?? "";
    if (event.key === "Backspace" && event.shiftKey) {
      event.preventDefault();
      removeRead();
    } else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      remove(id);
    } else if (event.key.toLowerCase() === "u" && !event.shiftKey) {
      event.preventDefault();
      toggleRead(id);
    }
  };

  const setUnreadOnly = (next: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set("unread", "1");
    else params.delete("unread");
    setSearchParams(params, { replace: true });
  };

  const unread = unreadCount.data ?? items.filter((item) => item.readAt === null).length;

  const actions = (
    <>
      <Menu>
        <MenuTrigger asChild>
          <IconButton icon={Ellipsis} label="Notification actions" />
        </MenuTrigger>
        <MenuContent variant="dropdown" align="end">
          <MenuItem
            icon={Trash2}
            onSelect={() => {
              void open(undefined);
              archiveAll.mutate({});
            }}
          >
            Delete all
          </MenuItem>
          <MenuItem icon={Trash2} shortcut={["⇧", "⌫"]} onSelect={removeRead}>
            Delete all read
          </MenuItem>
          <MenuSeparator />
          <MenuItem asChild>
            <Link to="/settings/notifications">Go to settings</Link>
          </MenuItem>
        </MenuContent>
      </Menu>
      <Tooltip content="Show unreads only">
        <IconButton
          icon={ListFilter}
          label="Show unreads only"
          aria-pressed={unreadOnly}
          variant={unreadOnly ? "secondary" : "ghost"}
          onClick={() => setUnreadOnly(!unreadOnly)}
        />
      </Tooltip>
    </>
  );

  let listContent;
  if (list.isPending) {
    listContent = <ListSkeleton />;
  } else if (list.isError) {
    listContent = (
      <div className="p-2">
        <Alert
          tone="danger"
          title="Could not load notifications"
          action={
            <Button variant="ghost" onClick={() => void list.refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  } else if (visible.length === 0) {
    listContent = unreadOnly ? (
      <EmptyState
        icon={InboxIcon}
        title="No unread notifications"
        action={
          <Button variant="secondary" onClick={() => setUnreadOnly(false)}>
            Show all
          </Button>
        }
      >
        Everything in your inbox has been read.
      </EmptyState>
    ) : (
      <EmptyState icon={InboxIcon} title="No notifications">
        You are all caught up. New activity on issues you follow shows up here.
      </EmptyState>
    );
  } else {
    listContent = (
      <div ref={listRef} className="p-2">
        <IssueList
          label="Notifications"
          selected={notificationId ? [notificationId] : []}
          onOpen={(id) => void open(id)}
          onKeyDown={handleKeyDown}
        >
          {visible.map((item) => (
            <NotificationRow
              key={item.id}
              value={item.id}
              unread={item.readAt === null}
              {...notificationRowProps(item)}
            />
          ))}
        </IssueList>
      </div>
    );
  }

  let detail;
  if (notificationId && list.isSuccess && !selected) {
    detail = (
      <EmptyState icon={InboxIcon} title="Notification not found" className="m-auto">
        It may have been deleted.
      </EmptyState>
    );
  } else if (selected) {
    detail = <InboxDetail notification={selected} onDelete={() => remove(selected.id)} />;
  } else if (notificationId) {
    detail = null;
  } else {
    detail = (
      <p className="m-auto text-body-md text-secondary">
        {unread > 0
          ? `${unread} unread notification${unread === 1 ? "" : "s"}`
          : "No notification selected"}
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar breadcrumbs={[{ label: "Inbox" }]} breadcrumbActions={actions} />
      <main aria-label="Inbox" className="flex min-h-0 flex-1 border-t border-default">
        <h1 className="sr-only">Inbox</h1>
        <div className="flex w-96 shrink-0 flex-col overflow-y-auto border-r border-default">
          {listContent}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">{detail}</div>
      </main>
    </div>
  );
}
