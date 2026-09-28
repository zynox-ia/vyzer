/**
 * Conteúdo de uma conversa do agente: vazio com sugestões, mensagens e composer (spec, itens 1–4
 * e 6). Reaproveitado pela tela cheia (/agent), pelo painel direito (Fase 8) e pelo popover do
 * rodapé — mesmo conteúdo, o contêiner muda conforme a densidade.
 *
 * Medido ao vivo em linear.app/zynox-dev/agent: no vazio, o composer vem ANTES do rótulo
 * "Get started with some examples" e da grade de sugestões (não depois, como o texto da spec
 * descrevia). A área central usa três quartos da largura a partir de tablet, com `p-8` ao redor;
 * a tela do Linear media 712 px num conteúdo de 1026 px. `.figma/01-design-tokens.md`, seção Fase 7.
 */
import {
  Bot,
  Box,
  ChevronDown,
  Ellipsis,
  Maximize2,
  Minus,
  MousePointer2,
  SquarePen,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  AgentComposer,
  Alert,
  Button,
  Chip,
  ChatHistoryPopover,
  ConversationHeader,
  IconButton,
  AgentMessage,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  MessageFeedback,
  SuggestionCard,
  ThinkingMessage,
  ToolCallCollapsible,
  UserMessage,
  type ChatHistoryEntry,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { cn } from "@vyzer/design-system/cn";
import { useAgentChatStore } from "./agent-chat-store";
import { CHAT_HISTORY, SKILLS, type SuggestionData } from "./data";
import { useAgentConversation } from "./use-agent-conversation";

/**
 * Título trocável "Switch agent chat" (confirmado ao vivo em linear.app/zynox-dev/agent): abre o
 * histórico de conversas. Reaproveitado pela página cheia (TopBar, breadcrumbActions) e pelo
 * cabeçalho do painel compacto — mesmo gatilho, dois lugares (revisão de fidelidade, bloqueante 1).
 */
export function ChatSwitcherButton({
  title,
  entries,
  onSelect,
  open,
  onOpenChange,
}: {
  title: string;
  entries: ChatHistoryEntry[];
  onSelect: (id: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <ChatHistoryPopover
      entries={entries}
      onSelect={onSelect}
      open={open}
      onOpenChange={onOpenChange}
    >
      <button
        type="button"
        aria-label="Switch agent chat"
        className="flex h-7 min-w-0 items-center gap-1 rounded-control px-1.5 text-left select-none focus-ring hovered:bg-hover"
      >
        <span className="min-w-0 truncate text-label-md text-primary">{title}</span>
        <Icon icon={ChevronDown} size="xs" className="shrink-0 text-secondary" />
      </button>
    </ChatHistoryPopover>
  );
}

function SkillsMenuTrigger({ floating = false }: { floating?: boolean }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" icon={floating ? Box : undefined} trailingIcon={ChevronDown}>
          Skills
        </Button>
      </MenuTrigger>
      <MenuContent variant="dropdown" align="start">
        {SKILLS.length === 0 ? (
          <p className="px-2.5 py-1.5 text-body-sm text-secondary">No skills created</p>
        ) : (
          SKILLS.map((skill) => <MenuItem key={skill.id}>{skill.name}</MenuItem>)
        )}
      </MenuContent>
    </Menu>
  );
}

function FloatingWelcome({
  suggestions,
  onSelect,
}: {
  suggestions: SuggestionData[];
  onSelect: (title: string) => void;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-end overflow-hidden pb-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 inset-y-0 flex items-center justify-center overflow-hidden"
      >
        <div className="grid grid-cols-10 gap-x-5 gap-y-4 text-tertiary opacity-10">
          {Array.from({ length: 100 }, (_, index) => (
            <Icon key={index} icon={MousePointer2} size="xs" />
          ))}
        </div>
      </div>
      <div className="relative flex flex-col items-center gap-2 text-center">
        <Icon icon={MousePointer2} size="sm" className="text-secondary" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-label-md text-primary">Welcome to Vyzer</p>
          <p className="text-body-sm text-secondary">Ask anything or tell Vyzer what you need</p>
        </div>
        <div className="mt-1 flex max-w-full flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <Chip
              key={suggestion.title}
              variant="filled"
              icon={<Icon icon={suggestion.icon} size="xs" />}
              onClick={() => onSelect(suggestion.title)}
            >
              {suggestion.title}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

export type AgentConversationViewProps = {
  /** full: página cheia; compact: painel direito; floating: janela sem scrim ancorada ao Agent. */
  density: "full" | "compact" | "floating";
  suggestions: SuggestionData[];
  /**
   * true: lê/escreve a conversa ativa do AgentChatProvider (App Shell) — mesma conversa entre
   * /agent e o painel direito, sobrevive à navegação e ao recarregar (revisão de código,
   * bloqueante 1). false (padrão): conversa local, isolada — páginas de documentação e testes.
   */
  useSharedChat?: boolean;
  /** Compact/floating: abre a tela cheia (navega para /agent). */
  onOpenFullPage?: () => void;
  /** Floating: minimiza a janela sem perder o histórico. */
  onMinimize?: () => void;
  /** Compact/floating: fecha a conversa sem perder o histórico. */
  onClose?: () => void;
  className?: string;
};

/**
 * Mensagens + composer de uma conversa (sem chamada real a LLM — roteiro fixo, fora do escopo).
 * Enter envia, Shift+Enter quebra linha (Linear ao vivo); clique numa sugestão preenche o
 * composer sem enviar, como no Linear; Stop generating cancela uma resposta em andamento.
 */
export function AgentConversationView({
  density,
  suggestions,
  useSharedChat = false,
  onOpenFullPage,
  onMinimize,
  onClose,
  className,
}: AgentConversationViewProps) {
  const store = useAgentChatStore();
  const shared = useSharedChat ? store : null;
  const standalone = useAgentConversation();
  // Favoritar fora do AgentChatProvider (páginas de documentação): estado local, sem persistência.
  const [standaloneFavorite, setStandaloneFavorite] = useState(false);
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const messages = shared ? shared.messages : standalone.messages;
  const sending = shared ? shared.sending : standalone.sending;
  const title = shared ? shared.title : "New chat";
  const favorite = shared ? shared.favorite : standaloneFavorite;
  const toggleFavorite = shared ? shared.toggleFavorite : () => setStandaloneFavorite((v) => !v);
  const historyEntries: ChatHistoryEntry[] = shared ? shared.history : CHAT_HISTORY;
  const setHelpful = shared ? shared.setHelpful : standalone.setHelpful;
  const newChat = shared ? shared.newChat : standalone.reset;
  const cancelSend = shared ? shared.cancel : standalone.cancel;
  const sendText = shared ? shared.send : standalone.send;

  const empty = messages.length === 0;
  const placeholder =
    density === "floating"
      ? "@ to mention any issue, project, or document"
      : empty
        ? "Ask Vyzer…"
        : "Reply…";

  const selectHistory = (id: string) => {
    setDraft("");
    setHistoryOpen(false);
    if (shared) shared.selectChat(id);
    // Sem AgentChatProvider (documentação), o histórico é só ilustrativo — não há para onde
    // carregar a conversa escolhida.
  };

  // Estado próprio (revisão de código, menor): não deriva de messages.at(-1) a cada render — isso
  // limpava o anúncio no tick seguinte ("You: …" some assim que o setTimeout(0) insere o
  // "thinking", antes de um leitor de tela ter tempo de lê-lo). Só troca em envio e conclusão;
  // thinking/streaming não mexem nele, o texto anterior fica visível até o próximo anúncio real.
  // O erro fica só no Alert (role="alert", abaixo) — anunciar os dois duplicaria a mesma falha.
  const [announcement, setAnnouncement] = useState("");
  // O anúncio sincroniza com o histórico de mensagens (um "sistema externo" ao componente, vindo
  // do hook/loja) — não deriva dele a cada render (ver comentário acima). A alternativa sem
  // efeito (ajustar durante o render comparando com o valor anterior) se mostrou instável no
  // teste automatizado desta tela; o efeito é o caminho mais previsível aqui.
  useEffect(() => {
    const last = messages.at(-1);
    // oxlint-disable-next-line react/set-state-in-effect
    if (last?.role === "user") setAnnouncement(`You: ${last.text}`);
    // oxlint-disable-next-line react/set-state-in-effect
    else if (last?.role === "agent" && last.phase === "done")
      setAnnouncement(`Agent: ${last.text}`);
  }, [messages]);

  const composer = (
    <AgentComposer
      value={draft}
      onValueChange={setDraft}
      onSend={() => {
        sendText(draft);
        setDraft("");
      }}
      onCancel={cancelSend}
      placeholder={placeholder}
      sending={sending}
      skills={<SkillsMenuTrigger floating={density === "floating"} />}
      onAttach={() => {}}
      className={density === "floating" ? "p-2.5" : undefined}
      // Não é o autofocus nativo do DOM (a11y hazard real): AgentComposer só chama .focus() num
      // useEffect próprio — o mesmo padrão de forms/creation-composer.tsx. Garante que o campo
      // fique focado depois do remonte vazio→conversa (revisão de código, item 5, "Foco").
      // oxlint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
    />
  );

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {density === "compact" && (
        <ConversationHeader
          title={
            <ChatSwitcherButton
              title={title}
              entries={historyEntries}
              onSelect={selectHistory}
              open={historyOpen}
              onOpenChange={setHistoryOpen}
            />
          }
          actions={
            <>
              <IconButton
                icon={Star}
                label={favorite ? "Remove from favorites" : "Add to favorites"}
                variant="ghost"
                className={cn(favorite && "text-warning")}
                onClick={toggleFavorite}
              />
              {onOpenFullPage && (
                <IconButton
                  icon={Maximize2}
                  label="Open full page"
                  variant="ghost"
                  onClick={onOpenFullPage}
                />
              )}
              {onClose && (
                <IconButton icon={X} label="Close agent chat" variant="ghost" onClick={onClose} />
              )}
              <Menu>
                <MenuTrigger asChild>
                  <IconButton icon={Ellipsis} label="Chat options" variant="ghost" />
                </MenuTrigger>
                <MenuContent variant="dropdown" align="end">
                  <MenuItem icon={SquarePen} onSelect={newChat}>
                    New chat
                  </MenuItem>
                </MenuContent>
              </Menu>
            </>
          }
        />
      )}

      {density === "floating" && (
        <ConversationHeader
          className="h-12 px-2.5"
          title={<span className="text-label-md text-primary">{title}</span>}
          actions={
            <>
              <IconButton
                icon={Minus}
                label="Minimize agent chat"
                variant="ghost"
                onClick={onMinimize ?? onClose}
              />
              {onOpenFullPage && (
                <IconButton
                  icon={Maximize2}
                  label="Open full page"
                  variant="ghost"
                  onClick={onOpenFullPage}
                />
              )}
              {onClose && (
                <IconButton icon={X} label="Close agent chat" variant="ghost" onClick={onClose} />
              )}
            </>
          }
        />
      )}

      {empty && density !== "floating" ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6 tablet:p-8">
          <div
            className={cn(
              "flex w-full max-w-content flex-col gap-4",
              density === "full" && "tablet:w-3/4",
            )}
          >
            {composer}
            <div className="flex flex-col gap-2">
              <p className="text-label-sm text-secondary">Get started with some examples</p>
              {density === "full" ? (
                <div className="grid grid-cols-1 gap-2 tablet:grid-cols-3">
                  {suggestions.map((s) => (
                    <SuggestionCard
                      key={s.title}
                      icon={s.icon}
                      title={s.title}
                      description={s.description}
                      onClick={() => setDraft(s.title)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-1.5">
                  {suggestions.map((s) => (
                    <Chip
                      key={s.title}
                      variant="filled"
                      icon={<Icon icon={s.icon} />}
                      onClick={() => setDraft(s.title)}
                    >
                      {s.title}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            aria-label="Conversation"
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
          >
            {empty ? (
              <FloatingWelcome suggestions={suggestions} onSelect={setDraft} />
            ) : (
              messages.map((m) => {
                if (m.role === "user") {
                  return (
                    <UserMessage
                      key={m.id}
                      avatar={<Icon icon={UserRound} size="xs" className="text-primary" />}
                    >
                      {m.text}
                    </UserMessage>
                  );
                }
                if (m.phase === "thinking") return <ThinkingMessage key={m.id} />;
                if (m.phase === "error") {
                  return (
                    <Alert key={m.id} tone="danger" title="Something went wrong" role="alert">
                      The agent couldn't complete this request. Try asking again.
                    </Alert>
                  );
                }
                return (
                  <div key={m.id} className="flex flex-col gap-1.5">
                    <AgentMessage
                      icon={<Icon icon={Bot} size="xs" className="text-tertiary" />}
                      streaming={m.phase === "streaming"}
                    >
                      {m.text}
                    </AgentMessage>
                    {m.toolCall && (
                      <ToolCallCollapsible summary={m.toolCall.summary} className="ml-6">
                        {m.toolCall.detail}
                      </ToolCallCollapsible>
                    )}
                    {m.phase === "done" && (
                      <div className="ml-6">
                        <MessageFeedback
                          helpful={m.helpful}
                          onHelpful={() => setHelpful(m.id, true)}
                          onUnhelpful={() => setHelpful(m.id, false)}
                          onCopy={() => {
                            void navigator.clipboard?.writeText(m.text);
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div
            className={cn(
              "flex shrink-0 justify-center",
              density === "floating"
                ? "px-2 py-1.5"
                : "border-t border-default px-3 py-3 tablet:px-8",
            )}
          >
            <div className={cn("w-full max-w-content", density !== "floating" && "tablet:w-3/4")}>
              {composer}
            </div>
          </div>
        </>
      )}

      {/* Anúncio das mensagens novas para leitor de tela (spec, testes): região oculta separada
          da lista visível — evita reler a conversa inteira a cada mudança. */}
      <output aria-live="polite" className="sr-only">
        {announcement}
      </output>
    </div>
  );
}
