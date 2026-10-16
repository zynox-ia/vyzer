/**
 * Janela "Customize sidebar" de Preferences → App sidebar (spec `customize-sidebar-preferences.md`;
 * Linear ao vivo, 30/09): "Default badge style" no topo e dois grupos, Personal (Inbox, Reviews, My
 * issues, Agent, Drafts) e Workspace (Projects, Views, Members, Teams), cada linha com a alça de
 * arrastar, o ícone, o nome e o seletor de visibilidade. Arrastar uma linha a leva por cima das
 * outras, que cedem o lugar com uma transição; a alça também reordena pelo teclado (setas).
 *
 * Lê e grava pela API (`sidebarPreferences.get/update`, TanStack Query) por Member: cada mudança
 * atualiza o cache na hora e volta atrás, com aviso, se a gravação falhar. A sidebar real lê o
 * mesmo cache e obedece visibilidade e ordem.
 */
import {
  Box,
  Bot,
  GitPullRequest,
  GripVertical,
  Inbox,
  Layers,
  PenLine,
  UserRound,
  UsersRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogTrigger,
  Select,
  Skeleton,
  useToast,
} from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import {
  SIDEBAR_GROUPS,
  resolveSidebar,
  type SidebarGroupKey,
  type SidebarItemKey,
  type SidebarPreferencesData,
  type SidebarVisibility,
} from "@/layouts/app-shell/sidebar-items";
import {
  sidebarPreferencesQueryOptions,
  updateSidebarPreferencesMutationOptions,
} from "@/services/sidebar-preferences";

type Visibility = SidebarVisibility;
type GroupKey = SidebarGroupKey;
type ItemKey = SidebarItemKey;

type Item = {
  label: string;
  icon: LucideIcon;
  group: GroupKey;
  /** Opções de visibilidade que o item aceita; a primeira é sempre "Always show". */
  options: Visibility[];
  fallback: Visibility;
};

const ITEMS: Record<ItemKey, Item> = {
  inbox: {
    label: "Inbox",
    icon: Inbox,
    group: "personal",
    options: ["always", "when-badged"],
    fallback: "always",
  },
  reviews: {
    label: "Reviews",
    icon: GitPullRequest,
    group: "personal",
    options: ["always", "when-badged", "hidden"],
    fallback: "always",
  },
  "my-issues": {
    label: "My issues",
    icon: UserRound,
    group: "personal",
    options: ["always", "hidden"],
    fallback: "always",
  },
  agent: {
    label: "Agent",
    icon: Bot,
    group: "personal",
    options: ["always", "hidden"],
    fallback: "always",
  },
  drafts: {
    label: "Drafts",
    icon: PenLine,
    group: "personal",
    options: ["always", "when-badged", "hidden"],
    fallback: "when-badged",
  },
  projects: {
    label: "Projects",
    icon: Box,
    group: "workspace",
    options: ["always", "hidden"],
    fallback: "always",
  },
  views: {
    label: "Views",
    icon: Layers,
    group: "workspace",
    options: ["always", "hidden"],
    fallback: "always",
  },
  members: {
    label: "Members",
    icon: UsersRound,
    group: "workspace",
    options: ["always", "hidden"],
    fallback: "hidden",
  },
  teams: {
    label: "Teams",
    icon: Users,
    group: "workspace",
    options: ["always", "hidden"],
    fallback: "hidden",
  },
};

const GROUPS: { key: GroupKey; title: string; items: ItemKey[] }[] = [
  {
    key: "personal",
    title: "Personal",
    items: ["inbox", "reviews", "my-issues", "agent", "drafts"],
  },
  { key: "workspace", title: "Workspace", items: ["projects", "views", "members", "teams"] },
];

const VISIBILITY_LABEL: Record<Visibility, string> = {
  always: "Always show",
  "when-badged": "Show when badged",
  hidden: "Don't show",
};

type DragState = {
  key: ItemKey;
  group: GroupKey;
  from: number;
  over: number;
  dy: number;
  rowHeight: number;
  /** Soltou: a linha assenta no lugar antes de a ordem ser gravada. */
  settling?: boolean;
};

/** Deslocamento de uma linha enquanto outra é arrastada: quem o cartão ultrapassa cede o lugar. */
function shiftOf(index: number, drag: DragState | null, group: GroupKey) {
  if (!drag || drag.group !== group || index === drag.from) return 0;
  if (drag.from < drag.over && index > drag.from && index <= drag.over) return -drag.rowHeight;
  if (drag.over < drag.from && index >= drag.over && index < drag.from) return drag.rowHeight;
  return 0;
}

function Row({
  itemKey,
  visibility,
  onVisibility,
  onPointerDown,
  onMove,
  dragging,
  dimmed,
  settling,
  committing,
  shift,
  dy,
}: {
  itemKey: ItemKey;
  visibility: Visibility;
  onVisibility: (value: Visibility) => void;
  onPointerDown: (event: PointerEvent<HTMLLIElement>) => void;
  onMove: (direction: -1 | 1) => void;
  /** Esta linha é a que está sendo arrastada: segue o ponteiro, por cima das outras. */
  dragging: boolean;
  /** Há outra linha sendo arrastada: esta fica mais apagada, como no Linear. */
  dimmed: boolean;
  /** Ao soltar, a linha arrastada assenta no lugar com uma transição. */
  settling: boolean;
  /** Troca de ordem em andamento: sem transição neste quadro, para não "voltar" a animar. */
  committing: boolean;
  /** Quanto esta linha cede (px) para a arrastada passar. */
  shift: number;
  dy: number;
}) {
  const item = ITEMS[itemKey];
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onMove(event.key === "ArrowUp" ? -1 : 1);
    }
  };
  const animate = dragging ? settling : !committing;
  return (
    // O arrastar com o mouse é um atalho; o caminho acessível é a alça (setas), no botão abaixo.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li
      aria-roledescription="sortable"
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      // Sem transform quando parada (só durante o arrasto e a cedência de lugar).
      style={
        (dragging ? dy : shift) !== 0
          ? { transform: `translateY(${dragging ? dy : shift}px)` }
          : undefined
      }
      // Sem sombra nem fundo: o visual é chapado (Linear). Só a opacidade diz quem está no ar.
      className={`relative flex min-h-9 touch-none items-center justify-between gap-4 select-none ${
        dragging ? "z-10 cursor-grabbing" : ""
      } ${dimmed ? "opacity-60" : ""} ${
        animate ? "transition-[transform,opacity] duration-fast ease-standard" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label={`Reorder ${item.label} (arrow keys)`}
          onKeyDown={onKeyDown}
          className="flex w-2 shrink-0 cursor-move items-center justify-center text-tertiary focus-ring hovered:text-secondary"
        >
          <Icon icon={GripVertical} size="xs" />
        </button>
        <Icon icon={item.icon} size="14" className="shrink-0 text-secondary" />
        <span className="min-w-0 truncate text-label-md text-primary">{item.label}</span>
      </div>
      <Select
        trigger="button"
        aria-label={`${item.label} visibility`}
        value={visibility}
        onValueChange={(value) => onVisibility(value as Visibility)}
        options={item.options.map((value) => ({ value, label: VISIBILITY_LABEL[value] }))}
        className="h-control-md bg-transparent text-body-md text-primary"
      />
    </li>
  );
}

type Patch = {
  badgeStyle?: "count" | "dot";
  items?: { key: ItemKey; visibility?: Visibility; sortOrder?: number }[];
};

/** Aplica o patch no cache, como a API vai aplicar, para a tela responder sem esperar a rede. */
function applyPatch<T extends SidebarPreferencesData>(data: T, patch: Patch): T {
  return {
    ...data,
    badgeStyle: patch.badgeStyle ?? data.badgeStyle,
    items: data.items.map((item) => ({
      ...item,
      ...patch.items?.find((p) => p.key === item.key),
    })),
  };
}

/** O conteúdo só monta com a janela aberta: a página não consulta a API antes de a pessoa abrir. */
function CustomizeSidebarBody() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const preferences = useQuery(sidebarPreferencesQueryOptions());
  const queryKey = sidebarPreferencesQueryOptions().queryKey;
  const update = useMutation({
    ...updateSidebarPreferencesMutationOptions(),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) queryClient.setQueryData(queryKey, applyPatch(previous, patch));
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast({
        title: "Could not save sidebar settings",
        description: "Check your connection and try again.",
        variant: "error",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
  const saved = resolveSidebar(preferences.data);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [committing, setCommitting] = useState(false);
  // O "assentar" do arrasto grava a ordem 160 ms depois de soltar; se a janela fechar antes, o
  // temporizador é cancelado para não gravar (nem atualizar estado) depois de desmontada.
  const settleTimer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  // A ordem guardada é um número por item (Personal 0 a 4, Workspace 5 a 8).
  const reorder = (group: GroupKey, list: ItemKey[]) => {
    const offset = group === "personal" ? 0 : SIDEBAR_GROUPS[0]!.items.length;
    update.mutate({ items: list.map((key, index) => ({ key, sortOrder: offset + index })) });
  };
  const move = (group: GroupKey, from: ItemKey, to: ItemKey) => {
    if (from === to || ITEMS[from].group !== group || ITEMS[to].group !== group) return;
    const list = saved.order[group].filter((k) => k !== from);
    list.splice(saved.order[group].indexOf(to), 0, from);
    reorder(group, list);
  };
  // Arrastar: o cartão segue o ponteiro por cima das outras linhas, e quem ele ultrapassa cede o
  // lugar com uma transição; ao soltar, a ordem é gravada. Só sai do lugar depois de 4 px, para
  // um clique simples (no seletor, por exemplo) não virar arrasto.
  const startDrag = (
    event: PointerEvent<HTMLLIElement>,
    group: GroupKey,
    key: ItemKey,
    from: number,
    count: number,
  ) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("[role=combobox], select")) {
      return;
    }
    const row = event.currentTarget;
    const rowHeight = row.getBoundingClientRect().height;
    const startY = event.clientY;
    let active = false;
    let last: DragState = { key, group, from, over: from, dy: 0, rowHeight };

    const onMoveEvent = (move: globalThis.PointerEvent) => {
      const raw = move.clientY - startY;
      if (!active && Math.abs(raw) < 4) return;
      active = true;
      // O cartão não sai da lista: limita o deslocamento ao primeiro e ao último lugar.
      const dy = Math.max(-from * rowHeight, Math.min((count - 1 - from) * rowHeight, raw));
      const over = Math.max(0, Math.min(count - 1, from + Math.round(dy / rowHeight)));
      last = { key, group, from, over, dy, rowHeight };
      setDrag(last);
    };
    const finish = () => {
      window.removeEventListener("pointermove", onMoveEvent);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (!active) {
        setDrag(null);
        return;
      }
      // Assenta no lugar mais próximo (com transição) e só então grava a nova ordem.
      setDrag({ ...last, dy: (last.over - from) * rowHeight, settling: true });
      settleTimer.current = window.setTimeout(() => {
        setCommitting(true);
        if (last.over !== from) {
          const target = saved.order[group][last.over];
          if (target) move(group, key, target);
        }
        setDrag(null);
        window.requestAnimationFrame(() => setCommitting(false));
      }, 160);
    };
    window.addEventListener("pointermove", onMoveEvent);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };
  const nudge = (group: GroupKey, key: ItemKey, direction: -1 | 1) => {
    const list = [...saved.order[group]];
    const index = list.indexOf(key);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target]!, list[index]!];
    reorder(group, list);
  };

  return (
    <DialogBody>
      {preferences.isPending ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading sidebar settings.</span>
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} shape="block" className="h-control-lg" />
          ))}
        </div>
      ) : preferences.isError ? (
        <Alert
          tone="danger"
          role="alert"
          title="Could not load sidebar settings"
          action={
            <Button type="button" variant="secondary" onClick={() => void preferences.refetch()}>
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      ) : (
        <>
          <div className="flex min-h-12 items-center justify-between gap-4 rounded-sm border border-default bg-hover px-3">
            <span className="text-label-md text-primary">Default badge style</span>
            <Select
              trigger="button"
              aria-label="Default badge style"
              value={saved.badgeStyle}
              onValueChange={(badgeStyle) =>
                update.mutate({ badgeStyle: badgeStyle as "count" | "dot" })
              }
              options={[
                { value: "count", label: "1 Count" },
                { value: "dot", label: "Dot" },
              ]}
              className="h-control-md bg-transparent text-body-md text-primary"
            />
          </div>
          {GROUPS.map((group) => (
            <section key={group.key} className="flex flex-col gap-1.5">
              <h3 className="text-label-md text-primary">{group.title}</h3>
              <ul
                aria-label={group.title}
                className="flex flex-col rounded-sm border border-default bg-hover px-3 py-1.5"
              >
                {saved.order[group.key].map((key, index) => (
                  <Row
                    key={key}
                    itemKey={key}
                    visibility={saved.visibility[key]}
                    onVisibility={(visibility) => update.mutate({ items: [{ key, visibility }] })}
                    onPointerDown={(event) =>
                      startDrag(event, group.key, key, index, saved.order[group.key].length)
                    }
                    onMove={(direction) => nudge(group.key, key, direction)}
                    dragging={drag?.key === key}
                    dimmed={drag !== null && drag.key !== key}
                    settling={drag?.key === key && drag.settling === true}
                    committing={committing}
                    dy={drag?.key === key ? drag.dy : 0}
                    shift={shiftOf(index, drag, group.key)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </DialogBody>
  );
}

export function CustomizeSidebarDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent title="Customize sidebar" className="max-w-120">
        <CustomizeSidebarBody />
      </DialogContent>
    </Dialog>
  );
}
