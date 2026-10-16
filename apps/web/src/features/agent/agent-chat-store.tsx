/**
 * Estado da conversa do agente compartilhado acima das rotas (revisão de código, bloqueante 1):
 * um `AgentChatProvider` dentro do AppShell guarda todas as conversas (por `chatId`) e qual está
 * ativa, para o chat do painel direito (Projects) e a página cheia (/agent) mostrarem — e
 * continuarem — a mesma conversa. Persistido em localStorage (lib/storage.ts, o mesmo usado pela
 * sidebar): recarregar a página restaura a conversa ativa.
 *
 * O motor de envio é o mesmo roteiro fixo de use-agent-conversation.ts (thinking → streaming →
 * done/error), só que por chatId em vez de um estado local único.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { readStored, writeStored } from "@/layouts/app-shell/lib/storage";
import { CANNED_REPLIES, CHAT_SEEDS, ERROR_TRIGGER, type AgentMessageState } from "./data";
import { makeId } from "./use-agent-conversation";

const STORAGE_KEY = "zynox:agent:chats";

type ChatRecord = {
  id: string;
  title: string;
  messages: AgentMessageState[];
  favorite: boolean;
  updatedAt: number;
};

type PersistedShape = { activeChatId: string; chats: Record<string, ChatRecord> };

function freshChat(): ChatRecord {
  const id = makeId();
  return { id, title: "New chat", messages: [], favorite: false, updatedAt: Date.now() };
}

/**
 * Remove respostas presas em "thinking"/"streaming" (revisão de código, menor): os timers que as
 * concluiriam só existem em memória — sem isso, uma resposta interrompida por um recarregar ficaria
 * com "Stop generating" para sempre, sem nenhum jeito de sair desse estado a não ser cancelar à
 * mão. Mesmo efeito de um cancelamento (o placeholder sai, a mensagem do usuário fica).
 */
function dropPendingReplies(chats: Record<string, ChatRecord>): Record<string, ChatRecord> {
  const result: Record<string, ChatRecord> = {};
  for (const [id, chat] of Object.entries(chats)) {
    result[id] = {
      ...chat,
      messages: chat.messages.filter(
        (m) => !(m.role === "agent" && (m.phase === "thinking" || m.phase === "streaming")),
      ),
    };
  }
  return result;
}

function loadInitial(): PersistedShape {
  const raw = readStored(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PersistedShape;
      if (parsed?.activeChatId && parsed.chats?.[parsed.activeChatId]) {
        return { ...parsed, chats: dropPendingReplies(parsed.chats) };
      }
    } catch {
      // JSON inválido (versão antiga, storage corrompido): recria do zero.
    }
  }
  const chat = freshChat();
  return { activeChatId: chat.id, chats: { [chat.id]: chat } };
}

function isPending(chat: ChatRecord | undefined) {
  return Boolean(
    chat?.messages.some(
      (m) => m.role === "agent" && (m.phase === "thinking" || m.phase === "streaming"),
    ),
  );
}

export type AgentChatSummary = { id: string; title: string; updatedAt: Date };

export type AgentChatStoreValue = {
  activeChatId: string;
  title: string;
  messages: AgentMessageState[];
  favorite: boolean;
  sending: boolean;
  history: AgentChatSummary[];
  send: (text: string) => void;
  cancel: () => void;
  setHelpful: (messageId: string, helpful: boolean) => void;
  toggleFavorite: () => void;
  selectChat: (chatId: string) => void;
  newChat: () => void;
};

const AgentChatStoreContext = createContext<AgentChatStoreValue | null>(null);

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedShape>(loadInitial);
  // Um Map de timers por chatId: cancelar uma conversa não deve mexer nos timers de outra.
  const timeouts = useRef<Map<string, number[]>>(new Map());
  const replyIndex = useRef(0);
  // Leitura síncrona do estado atual dentro de send() (abaixo), sem colocar `state` nas
  // dependências dela: send precisa checar "essa conversa já está respondendo?" antes de
  // agendar timers novos, não só dentro do updater assíncrono do setState. Atualizado num efeito
  // (não durante o render): mexer em ref.current no corpo do componente é lido como side effect.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    writeStored(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(
    () => () => {
      for (const ids of timeouts.current.values()) for (const id of ids) window.clearTimeout(id);
    },
    [],
  );

  const trackTimeout = (chatId: string, id: number) => {
    const list = timeouts.current.get(chatId) ?? [];
    list.push(id);
    timeouts.current.set(chatId, list);
  };
  const untrackTimeout = (chatId: string, id: number) => {
    const list = timeouts.current.get(chatId);
    if (list)
      timeouts.current.set(
        chatId,
        list.filter((t) => t !== id),
      );
  };
  const clearTimeoutsFor = (chatId: string) => {
    for (const id of timeouts.current.get(chatId) ?? []) window.clearTimeout(id);
    timeouts.current.set(chatId, []);
  };

  const updateChat = useCallback((chatId: string, updater: (chat: ChatRecord) => ChatRecord) => {
    setState((prev) => {
      const chat = prev.chats[chatId];
      if (!chat) return prev;
      return { ...prev, chats: { ...prev.chats, [chatId]: updater(chat) } };
    });
  }, []);

  const send = useCallback(
    (chatId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isPending(stateRef.current.chats[chatId])) return;

      updateChat(chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, { id: makeId(), role: "user", text: trimmed }],
      }));

      const agentId = makeId();
      const addThinking = window.setTimeout(() => {
        untrackTimeout(chatId, addThinking);
        updateChat(chatId, (chat) => ({
          ...chat,
          messages: [...chat.messages, { id: agentId, role: "agent", phase: "thinking" }],
        }));
      }, 0);
      trackTimeout(chatId, addThinking);

      const isError = trimmed.toLowerCase() === ERROR_TRIGGER;
      const thinkFor = window.setTimeout(() => {
        untrackTimeout(chatId, thinkFor);
        if (isError) {
          updateChat(chatId, (chat) => ({
            ...chat,
            messages: chat.messages.map((m) =>
              m.id === agentId ? { id: agentId, role: "agent", phase: "error" } : m,
            ),
          }));
          return;
        }
        const reply = CANNED_REPLIES[replyIndex.current % CANNED_REPLIES.length]!;
        replyIndex.current += 1;
        updateChat(chatId, (chat) => ({
          ...chat,
          messages: chat.messages.map((m) =>
            m.id === agentId
              ? {
                  id: agentId,
                  role: "agent",
                  phase: "streaming",
                  text: reply.text,
                  toolCall: reply.toolCall,
                }
              : m,
          ),
        }));
        const streamFor = window.setTimeout(() => {
          untrackTimeout(chatId, streamFor);
          updateChat(chatId, (chat) => ({
            ...chat,
            messages: chat.messages.map((m) =>
              m.id === agentId && m.role === "agent" && m.phase === "streaming"
                ? { ...m, phase: "done" as const }
                : m,
            ),
            updatedAt: Date.now(),
          }));
        }, 500);
        trackTimeout(chatId, streamFor);
      }, 600);
      trackTimeout(chatId, thinkFor);
    },
    [updateChat],
  );

  const cancel = useCallback(
    (chatId: string) => {
      clearTimeoutsFor(chatId);
      updateChat(chatId, (chat) => ({
        ...chat,
        messages: chat.messages.filter(
          (m) => !(m.role === "agent" && (m.phase === "thinking" || m.phase === "streaming")),
        ),
      }));
    },
    [updateChat],
  );

  const setHelpful = useCallback(
    (chatId: string, messageId: string, helpful: boolean) => {
      updateChat(chatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === messageId && m.role === "agent" && m.phase === "done"
            ? { ...m, helpful: m.helpful === helpful ? undefined : helpful }
            : m,
        ),
      }));
    },
    [updateChat],
  );

  const toggleFavorite = useCallback(
    (chatId: string) => {
      updateChat(chatId, (chat) => ({ ...chat, favorite: !chat.favorite }));
    },
    [updateChat],
  );

  const selectChat = useCallback((chatId: string) => {
    setState((prev) => {
      if (prev.chats[chatId]) return { ...prev, activeChatId: chatId };
      const seed = CHAT_SEEDS[chatId];
      const chat: ChatRecord = seed
        ? {
            id: chatId,
            title: seed.title,
            messages: seed.messages,
            favorite: false,
            updatedAt: seed.updatedAt,
          }
        : freshChat();
      return { activeChatId: chat.id, chats: { ...prev.chats, [chat.id]: chat } };
    });
  }, []);

  const newChat = useCallback(() => {
    const chat = freshChat();
    setState((prev) => ({ activeChatId: chat.id, chats: { ...prev.chats, [chat.id]: chat } }));
  }, []);

  const activeChat = state.chats[state.activeChatId];

  const value = useMemo<AgentChatStoreValue>(() => {
    // O histórico soma o que já foi tocado nesta sessão (state.chats) com o catálogo de exemplo
    // (CHAT_SEEDS) ainda não escolhido — sem isso, um recarregar fresco não mostraria nenhuma
    // conversa de exemplo até a pessoa clicar numa (revisão de código, bloqueante 2).
    const touchedIds = new Set(Object.keys(state.chats));
    const fromState = Object.values(state.chats)
      .filter((c) => c.id !== state.activeChatId || c.messages.length > 0)
      .map((c) => ({ id: c.id, title: c.title, updatedAt: new Date(c.updatedAt) }));
    const fromSeeds = Object.entries(CHAT_SEEDS)
      .filter(([id]) => !touchedIds.has(id))
      .map(([id, seed]) => ({ id, title: seed.title, updatedAt: new Date(seed.updatedAt) }));
    const history = [...fromState, ...fromSeeds].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
    return {
      activeChatId: state.activeChatId,
      title: activeChat?.title ?? "New chat",
      messages: activeChat?.messages ?? [],
      favorite: activeChat?.favorite ?? false,
      sending: isPending(activeChat),
      history,
      send: (text: string) => send(state.activeChatId, text),
      cancel: () => cancel(state.activeChatId),
      setHelpful: (messageId, helpful) => setHelpful(state.activeChatId, messageId, helpful),
      toggleFavorite: () => toggleFavorite(state.activeChatId),
      selectChat,
      newChat,
    };
  }, [state, activeChat, send, cancel, setHelpful, toggleFavorite, selectChat, newChat]);

  return <AgentChatStoreContext value={value}>{children}</AgentChatStoreContext>;
}

/** `null` fora de um AgentChatProvider (páginas de documentação, testes isolados). */
export function useAgentChatStore(): AgentChatStoreValue | null {
  return useContext(AgentChatStoreContext);
}
