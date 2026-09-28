/**
 * Lista de issues (Figma 1:7477, lista agrupada; 27:17223, Inbox): Issue List é a lista navegável
 * pelo teclado (listbox) e Issue Row, a linha de uma issue. A linha mostra prioridade, ID, status,
 * título, chips, responsável e data, em h-row: 44 px, ou 36 px com data-density="compact" num
 * contêiner. O cartão do board (Board Card) é outra opção da mesma lista.
 *
 * Teclado: ↑ ↓ Home End movem o foco (um só alvo de Tab na lista); Enter abre a issue; Espaço
 * marca ou desmarca; Esc limpa a seleção. Clique abre; Ctrl, ⌘ ou Shift + clique marcam.
 */
import { UserRound } from "lucide-react";
import {
  createContext,
  use,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { nextIndex, useRovingFocus } from "../lib/roving-focus";
import { Avatar } from "./avatar";

/** Seletor das opções (linhas e cartões) de uma Issue List. */
const OPTION = '[role="option"]';

/**
 * Estados de uma opção, como camadas (§12): hover soma bg-hover sobre o fundo, seleção pinta
 * bg-selected e o foco por teclado é a linha de 1 px de campo, sem acento nem halo.
 */
export const optionStateStyles =
  "cursor-default select-none focus-ring transition-[background-color,background-image] duration-fast ease-standard aria-selected:bg-selected hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))]";

type IssueListContextValue = {
  selectable: boolean;
  isSelected: (value: string) => boolean;
  toggle: (value: string) => void;
  open: (value: string) => void;
};

const IssueListContext = createContext<IssueListContextValue | null>(null);

function useIssueList(component: string) {
  const ctx = use(IssueListContext);
  if (!ctx) throw new Error(`${component} precisa estar dentro de uma IssueList.`);
  return ctx;
}

export type IssueListProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Nome acessível da lista (ex.: "In Progress issues"). */
  label: string;
  /** Valores marcados. Com onSelectedChange, a lista vira multisseleção. */
  selected?: string[];
  onSelectedChange?: (values: string[]) => void;
  /** Abrir uma issue: clique ou Enter. */
  onOpen?: (value: string) => void;
  children: ReactNode;
};

export function IssueList({
  label,
  selected = [],
  onSelectedChange,
  onOpen,
  className,
  children,
  onKeyDown,
  onFocus,
  ...rest
}: IssueListProps) {
  const {
    ref,
    onFocus: onRovingFocus,
    items,
    itemFrom,
    rootProps,
  } = useRovingFocus<HTMLDivElement>(OPTION);
  const selectable = onSelectedChange !== undefined;

  const toggle = (value: string) =>
    onSelectedChange?.(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const item = itemFrom(event.target);
    if (event.defaultPrevented || !item || event.altKey) return;
    const list = items();
    const next = nextIndex(event.key, list.indexOf(item), list.length);
    if (next !== undefined) {
      event.preventDefault();
      list[next]?.focus();
      return;
    }
    const value = item.dataset.value ?? "";
    if (event.key === "Enter") {
      event.preventDefault();
      onOpen?.(value);
    } else if (event.key === " " && selectable) {
      event.preventDefault();
      toggle(value);
    } else if (event.key === "Escape" && selectable && selected.length > 0) {
      event.preventDefault();
      onSelectedChange?.([]);
    }
  };

  return (
    <IssueListContext
      value={{
        selectable,
        isSelected: (value) => selected.includes(value),
        toggle,
        open: (value) => onOpen?.(value),
      }}
    >
      {/* Listbox com opções focáveis (roving tabindex): o foco fica nas opções, não na lista. */}
      {/* oxlint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={ref}
        // Não há elemento nativo equivalente (o select não aceita linhas com conteúdo).
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="listbox"
        aria-label={label}
        aria-multiselectable={selectable || undefined}
        {...rootProps}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          onFocus?.(event);
          onRovingFocus(event);
        }}
        className={cn("flex flex-col", className)}
        {...rest}
      >
        {children}
      </div>
    </IssueListContext>
  );
}

/** Props de uma opção da lista: o valor e o que a raiz do elemento aceita (ContextMenuTrigger). */
export type IssueOptionProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> & {
  /** Valor da opção (ex.: o identificador "ZYN-12"). */
  value: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Props comuns à raiz de uma opção: role, seleção, foco e o clique que abre ou marca. Usado pela
 * Issue Row e pelo Board Card.
 */
export function useIssueOption(
  component: string,
  { value, onClick }: { value: string; onClick?: (event: MouseEvent<HTMLDivElement>) => void },
) {
  const ctx = useIssueList(component);
  return {
    role: "option" as const,
    "aria-selected": ctx.isSelected(value),
    tabIndex: -1,
    "data-value": value,
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        if (ctx.selectable) ctx.toggle(value);
      } else {
        ctx.open(value);
      }
    },
  };
}

/** Valor de uma propriedade com ícone (compatível com ListOption: status, prioridade). */
export type IssueValue = { label: string; icon: ReactNode };

/** Responsável: foto (ou ícone de pessoa) e nome acessível. */
export type IssueAssignee = { name: string; src?: string };

export type IssueRowContentProps = {
  /** Identificador (ex.: "ZYN-12"), em mono. */
  identifier: string;
  title: string;
  /** Prioridade: ícone de 16 px; o rótulo é lido depois de "Priority:". */
  priority?: IssueValue;
  /** Status: ícone de 16 px; o rótulo é lido por leitores de tela. */
  status?: IssueValue;
  /** Chips outline (projeto, labels, relações). Os que não cabem somem inteiros. */
  chips?: ReactNode;
  /** Sem responsável, mostra o ícone de pessoa ("No assignee"). */
  assignee?: IssueAssignee;
  /** Data curta (ex.: "Sep 13"). */
  date?: string;
};

/** Ícone de 16 px com o rótulo só para leitores de tela. */
function ValueIcon({ value, prefix = "" }: { value: IssueValue; prefix?: string }) {
  return (
    <>
      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
        {value.icon}
      </span>
      <span className="sr-only">{`${prefix}${value.label}`}</span>
    </>
  );
}

/** Responsável de 20 px (Avatar md) ou o ícone de pessoa em text-secondary, sem fundo. */
export function IssueAssigneeSlot({ assignee }: { assignee?: IssueAssignee }) {
  return assignee ? (
    <Avatar name={assignee.name} src={assignee.src} size="md" />
  ) : (
    <span className="flex size-icon-md shrink-0 items-center justify-center text-secondary">
      <Icon icon={UserRound} label="No assignee" />
    </span>
  );
}

/**
 * Células da linha, sem a raiz: prioridade, ID, status, título, chips, responsável e data.
 * Reaproveitadas pela Tree (sub-issues).
 */
export function IssueRowContent({
  identifier,
  title,
  priority,
  status,
  chips,
  assignee,
  date,
}: IssueRowContentProps) {
  return (
    <>
      {priority && <ValueIcon value={priority} prefix="Priority: " />}
      <span className="min-w-14 shrink-0 font-mono text-code text-secondary">{identifier}</span>
      {status && <ValueIcon value={status} />}
      <span className="min-w-32 flex-1 truncate text-label-md text-primary">{title}</span>
      {chips && (
        // Altura de um chip e quebra de linha escondida: o chip que não cabe some inteiro.
        <span className="flex h-control-sm min-w-0 flex-wrap justify-end gap-1 overflow-hidden">
          {chips}
        </span>
      )}
      <IssueAssigneeSlot assignee={assignee} />
      {date && (
        // Largura mínima de "Sep 10": avatares alinhados de linha a linha.
        <span className="min-w-10 shrink-0 text-right text-body-sm whitespace-nowrap text-secondary tabular-nums">
          {date}
        </span>
      )}
    </>
  );
}

/** Classes da linha (h-row, 12 px nas laterais, raio 8), exportadas para a Tree. */
export const issueRowStyles = cn(
  "flex h-row w-full items-center gap-2 rounded-control px-cell-x text-body-md",
  optionStateStyles,
);

export type IssueRowProps = IssueOptionProps & IssueRowContentProps;

export function IssueRow({
  value,
  identifier,
  title,
  priority,
  status,
  chips,
  assignee,
  date,
  onClick,
  className,
  ...rest
}: IssueRowProps) {
  const option = useIssueOption("IssueRow", { value, onClick });
  return (
    <div {...rest} {...option} className={cn(issueRowStyles, className)}>
      <IssueRowContent
        identifier={identifier}
        title={title}
        priority={priority}
        status={status}
        chips={chips}
        assignee={assignee}
        date={date}
      />
    </div>
  );
}
