/**
 * Peças de chat de agente (Figma, seção Agent 27:7480: New chat 27:6907, conversa 27:7058,
 * diálogo 27:7230; Inbox 27:19467). Composições de página (AGENTS.md), não componentes de base:
 * o cartão de sugestão e o composer do agente não existem no design system, como o Composer de
 * comentário (forms/composer.tsx).
 *
 * Medido ao vivo em linear.app/zynox-dev/agent (regra do responsável: Linear ao vivo > Figma >
 * texto da spec quando divergem):
 * - O composer vem ANTES das sugestões (spec descrevia o composer abaixo) — layout: composer,
 *   rótulo "Get started with some examples", grade de 3 cartões.
 * - Cartão de sugestão: raio 8 (rounded-control, não rounded-container como o texto da spec
 *   dizia), título 13/500 (text-label-md) e descrição 12 px 2 linhas (text-body-sm) — não
 *   type-heading-3/text-secondary como o texto da spec dizia.
 * - Composer: aria-label "Send a message to Linear AI"; footer com "Skills" (menu, pílula),
 *   "Attach images, files, or videos" e "Send message" (seta, desabilitado vazio).
 * - Cabeçalho da conversa: gatilho de título "Switch agent chat" (confirmado ao vivo).
 * - Enter envia, Shift+Enter quebra linha (instrução do coordenador da fase, contrária ao texto
 *   da spec que pedia ⌘/Ctrl+Enter para enviar — Linear usa Enter/Shift+Enter, o padrão de chat).
 */
import {
  ArrowUp,
  ChevronRight,
  Copy,
  MessageSquarePlus,
  Paperclip,
  Square,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { Collapsible } from "radix-ui";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { nextIndex, useRovingFocus } from "../lib/roving-focus";
import { IconButton } from "./button";
import { TextArea } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Spinner } from "./progress";
import { formatRelativeTime } from "./timeline";

/* ------------------------------------------------------------------------------------------- */
/* Sugestões da tela vazia (spec, item 1)                                                       */
/* ------------------------------------------------------------------------------------------- */

export type SuggestionCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
};

/**
 * Densidade "página cheia" (Figma 27:6907): ícone, título de 1 linha e descrição de até 2 linhas.
 * Clique preenche o composer (não envia), como no Linear — quem chama decide o que fazer.
 */
export function SuggestionCard({
  icon,
  title,
  description,
  onClick,
  className,
}: SuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-control border border-default pt-4 px-4 pb-3 text-left transition-[background-image] duration-fast ease-standard select-none focus-ring hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))]",
        className,
      )}
    >
      <Icon icon={icon} size="sm" className="text-tertiary" />
      <span className="text-label-md text-primary">{title}</span>
      <span className="line-clamp-2 text-body-sm text-secondary">{description}</span>
    </button>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* Composer do agente (spec, item 2)                                                            */
/* ------------------------------------------------------------------------------------------- */

export type AgentComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  /** Enter (sem Shift) chama onSend; nada acontece com o campo vazio. */
  onSend: () => void;
  /** Chamado pelo botão "Stop generating" (só aparece com sending, revisão de código). */
  onCancel?: () => void;
  placeholder?: string;
  /** Mensagem em andamento: desabilita o campo; o enviar vira "Stop generating" (com onCancel). */
  sending?: boolean;
  /** Gatilho "Skills" (Menu existente, com chevron): slot porque o menu é da página que chama. */
  skills?: ReactNode;
  onAttach?: () => void;
  autoFocus?: boolean;
  className?: string;
};

/**
 * Campo de texto plano que cresce (sem editor rico — decisão 1 da spec, aprovada) com o rodapé de
 * ações. Enter envia; Shift+Enter quebra linha (Linear ao vivo e instrução do coordenador).
 */
export function AgentComposer({
  value,
  onValueChange,
  onSend,
  onCancel,
  placeholder = "Ask Vyzer…",
  sending = false,
  skills,
  onAttach,
  autoFocus,
  className,
}: AgentComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // Revisão de código, "Foco": o campo fica desabilitado enquanto sending (abaixo), e o navegador
  // tira o foco dele sozinho ao desabilitar — sem isso, o foco não volta ao terminar a resposta.
  const wasSending = useRef(sending);
  useEffect(() => {
    if (wasSending.current && !sending) ref.current?.focus();
    wasSending.current = sending;
  }, [sending]);

  const canSend = value.trim().length > 0 && !sending;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-container border border-default bg-surface p-4 focus-ring-within",
        className,
      )}
    >
      <TextArea
        ref={ref}
        variant="plain"
        autoGrow
        rows={1}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={sending}
        aria-label={placeholder}
        className="min-h-5 p-0 text-body-md"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">{skills}</div>
        <div className="flex items-center gap-1">
          {onAttach && (
            <IconButton
              icon={Paperclip}
              label="Attach images, files, or videos"
              variant="ghost"
              size="sm"
              onClick={onAttach}
              disabled={sending}
            />
          )}
          {sending && onCancel ? (
            <IconButton
              icon={Square}
              label="Stop generating"
              variant="secondary"
              size="sm"
              onClick={onCancel}
            />
          ) : (
            <IconButton
              icon={ArrowUp}
              label="Send message"
              variant="primary"
              size="sm"
              disabled={!canSend}
              onClick={onSend}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* Mensagens (spec, item 3)                                                                     */
/* ------------------------------------------------------------------------------------------- */

export function UserMessage({ children, avatar }: { children: ReactNode; avatar?: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[85%] items-center gap-1.5 rounded-full bg-control-strong py-1.5 pr-3 pl-1.5 text-body-md text-primary">
        {avatar}
        <span className="min-w-0">{children}</span>
      </div>
    </div>
  );
}

export type AgentMessageProps = {
  children: ReactNode;
  icon?: ReactNode;
  /** Cursor piscando no fim do texto (reaproveita animate-pulse), enquanto a resposta chega. */
  streaming?: boolean;
};

/** Sem moldura, à esquerda, ícone pequeno à frente (Figma 27:7100–27:7179). */
export function AgentMessage({ children, icon, streaming }: AgentMessageProps) {
  return (
    <div className="flex items-start gap-2">
      {icon && (
        <span aria-hidden className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      <p className="min-w-0 flex-1 text-body-md break-words text-primary">
        {children}
        {streaming && (
          <span
            aria-hidden
            className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-current motion-reduce:animate-none"
          />
        )}
      </p>
    </div>
  );
}

/** "Pensando": Spinner (Fase 4) + texto secundário, no lugar da resposta. */
export function ThinkingMessage({ label = "Thinking…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-body-md text-secondary">
      <Spinner size="sm" label={label} />
      <span aria-hidden>{label}</span>
    </div>
  );
}

export type ToolCallCollapsibleProps = {
  /** Resumo sempre visível (ex.: "Worked for 12 seconds", "Finished: updated 3 files"). */
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

/**
 * Chamada de ferramenta / ação, ou a linha "Finished: …" da Activity (spec, itens 3 e 8): linha
 * recolhível com chevron (Radix Collapsible, como o cabeçalho do Group Header/List Group da Fase
 * 5). Enter/Espaço expandem e recolhem (o Trigger já é um button nativo).
 */
export function ToolCallCollapsible({
  summary,
  children,
  defaultOpen = false,
  className,
}: ToolCallCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className={cn("flex flex-col", className)}>
      <Collapsible.Trigger className="group flex h-7 w-fit items-center gap-1 rounded-control px-1.5 text-left select-none focus-ring hovered:bg-hover">
        <Icon
          icon={ChevronRight}
          size="xs"
          className="text-secondary transition-transform duration-fast ease-standard group-data-[state=open]:rotate-90"
        />
        <span className="text-label-sm text-secondary">{summary}</span>
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-1.5 rounded-container border border-default bg-surface px-3 py-2.5 text-body-md text-primary">
        {children}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export type MessageFeedbackProps = {
  /** true: útil marcado. false: não útil marcado. undefined: nenhum ainda. */
  helpful?: boolean;
  onHelpful?: () => void;
  onUnhelpful?: () => void;
  onLeaveFeedback?: () => void;
  onCopy?: () => void;
};

/** Rodapé de feedback (spec, item 3): IconButtons ghost — útil, não útil, deixar feedback, copiar. */
export function MessageFeedback({
  helpful,
  onHelpful,
  onUnhelpful,
  onLeaveFeedback,
  onCopy,
}: MessageFeedbackProps) {
  return (
    <div className="flex items-center gap-0.5">
      <IconButton
        icon={ThumbsUp}
        label="Helpful"
        variant="ghost"
        size="sm"
        aria-pressed={helpful === true}
        className={cn(helpful === true && "text-primary")}
        onClick={onHelpful}
      />
      <IconButton
        icon={ThumbsDown}
        label="Not helpful"
        variant="ghost"
        size="sm"
        aria-pressed={helpful === false}
        className={cn(helpful === false && "text-primary")}
        onClick={onUnhelpful}
      />
      <IconButton
        icon={MessageSquarePlus}
        label="Leave feedback"
        variant="ghost"
        size="sm"
        onClick={onLeaveFeedback}
      />
      <IconButton icon={Copy} label="Copy" variant="ghost" size="sm" onClick={onCopy} />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* Cabeçalho da conversa (spec, item 4)                                                         */
/* ------------------------------------------------------------------------------------------- */

export type ConversationHeaderProps = {
  /** O título (texto simples) ou o gatilho "Switch agent chat" (Menu/Popover da página). */
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Título trocável + ações à direita (favoritar, opções, e — só no painel compacto — minimizar,
 * abrir página cheia e fechar; na página cheia, "Move to toolbar" no lugar do fechar). Cada ação
 * é montada por quem chama com IconButton/Switch/Menu, como a TopBar do shell.
 */
export function ConversationHeader({ title, actions, className }: ConversationHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-11 shrink-0 items-center gap-1 border-b border-default px-2",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center">{title}</div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* Histórico de conversas (spec, item 6)                                                        */
/* ------------------------------------------------------------------------------------------- */

export type ChatHistoryEntry = { id: string; title: string; updatedAt: Date };

export type ChatHistoryPopoverProps = {
  entries: ChatHistoryEntry[];
  onSelect: (id: string) => void;
  /** Gatilho ("Chat history", 1:5325): um IconButton ou Button, com asChild embutido. */
  children: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * "bottom" (padrão, como o Menu — pedido do responsável, sem virada automática do Radix).
   * "top": para um gatilho perto do rodapé da tela (ex.: AgentFloatingActions), onde abrir para
   * baixo estouraria a viewport.
   */
  side?: "top" | "bottom";
};

const HISTORY_ITEM_SELECTOR = "button[data-history-item]";

/**
 * Popover com a lista de conversas (título + hora relativa, reaproveitando formatRelativeTime da
 * Timeline). ↑ ↓ navegam a lista (roving tabindex, como a Sidebar), Enter troca de conversa (o
 * item já é um button), Esc fecha o Popover (o Radix já faz isso). Vazio: "No agent chats" —
 * mesmo texto do Command Menu (kit/command-catalog.tsx).
 */
export function ChatHistoryPopover({
  entries,
  onSelect,
  children,
  open,
  onOpenChange,
  side = "bottom",
}: ChatHistoryPopoverProps) {
  const { ref, onFocus, items, itemFrom, rootProps } =
    useRovingFocus<HTMLUListElement>(HISTORY_ITEM_SELECTOR);

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const item = itemFrom(event.target);
    if (!item) return;
    const list = items();
    const next = nextIndex(event.key, list.indexOf(item), list.length);
    if (next !== undefined) {
      event.preventDefault();
      list[next]?.focus();
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent label="Chat history" side={side} align="end" className="w-72 p-1">
        {entries.length === 0 ? (
          <p className="px-3 py-6 text-center text-body-sm text-secondary">No agent chats</p>
        ) : (
          // Roving tabindex (WAI-ARIA APG): o foco fica nos itens, não na lista.
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <ul
            ref={ref}
            aria-label="Recent agent chats"
            {...rootProps}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            className="flex flex-col gap-px"
          >
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  data-history-item
                  onClick={() => onSelect(entry.id)}
                  className="flex h-9 w-full items-center justify-between gap-3 rounded-control px-2.5 text-left select-none focus-ring hovered:bg-hover"
                >
                  <span className="min-w-0 truncate text-label-md text-primary">{entry.title}</span>
                  <span className="shrink-0 text-caption text-secondary">
                    {formatRelativeTime(entry.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* Agent personalization (spec, item 7)                                                         */
/* ------------------------------------------------------------------------------------------- */

export type SettingsEmptyRowProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Ação que resolve o vazio (ex.: Button "+", Button "Add connector"). */
  action: ReactNode;
  className?: string;
};

/**
 * Linha vazia dentro de um container com borda (Skills, MCP connectors): diferente do EmptyState
 * central da Fase 4 — mesmo espírito (ícone, título, texto, ação), layout de linha.
 */
export function SettingsEmptyRow({
  icon,
  title,
  description,
  action,
  className,
}: SettingsEmptyRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-container border border-subtle px-4 py-3",
        className,
      )}
    >
      <Icon icon={icon} size="md" className="shrink-0 text-tertiary" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-label-md text-primary">{title}</p>
        <p className="text-body-sm text-secondary">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
