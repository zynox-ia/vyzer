/**
 * Motor de simulação de uma conversa isolada (sem estado compartilhado entre rotas — usado pelas
 * páginas de documentação e por qualquer tela que não esteja dentro de um AgentChatProvider): send,
 * cancel e o roteiro fixo de resposta (sem LLM nem API real — fora do escopo, spec
 * fase-7-ai-e-chat.md). O AgentChatProvider (agent-chat-store.tsx) reaproveita o mesmo roteiro
 * (thinking → streaming → done/error) por conversa, para a versão compartilhada entre /agent e o
 * chat do painel direito.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { CANNED_REPLIES, ERROR_TRIGGER, type AgentMessageState } from "./data";

export type { AgentMessageState };

export function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useAgentConversation() {
  const [messages, setMessages] = useState<AgentMessageState[]>([]);
  const [sending, setSending] = useState(false);
  const replyIndex = useRef(0);
  const timeouts = useRef<number[]>([]);

  const trackTimeout = useCallback((id: number) => {
    timeouts.current.push(id);
  }, []);
  const untrackTimeout = useCallback((id: number) => {
    // Revisão de código: guarda só os pendentes, removendo cada id quando o callback roda (não só
    // no unmount) — timeouts.current nunca cresce sem limite numa conversa longa.
    timeouts.current = timeouts.current.filter((t) => t !== id);
  }, []);

  useEffect(
    () => () => {
      for (const id of timeouts.current) window.clearTimeout(id);
    },
    [],
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || sending) return;

      setMessages((prev) => [...prev, { id: makeId(), role: "user", text }]);
      setSending(true);

      // Empurrado para o próximo tick (não junto do push acima): as duas chamadas de setMessages
      // seriam aplicadas no mesmo commit do React (automatic batching), e a mensagem do usuário
      // nunca apareceria sozinha em nenhum render — o anúncio "You: …" do aria-live (spec, testes)
      // ficaria inalcançável, pulando direto para o "thinking" (silencioso).
      const agentId = makeId();
      const addThinking = window.setTimeout(() => {
        untrackTimeout(addThinking);
        setMessages((prev) => [...prev, { id: agentId, role: "agent", phase: "thinking" }]);
      }, 0);
      trackTimeout(addThinking);

      const isError = text.toLowerCase() === ERROR_TRIGGER;
      const thinkFor = window.setTimeout(() => {
        untrackTimeout(thinkFor);
        if (isError) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentId ? { id: agentId, role: "agent", phase: "error" } : m,
            ),
          );
          setSending(false);
          return;
        }
        // CANNED_REPLIES é um array literal não vazio (data.ts): o índice sempre existe.
        const reply = CANNED_REPLIES[replyIndex.current % CANNED_REPLIES.length]!;
        replyIndex.current += 1;
        setMessages((prev) =>
          prev.map((m) =>
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
        );
        const streamFor = window.setTimeout(() => {
          untrackTimeout(streamFor);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentId && m.role === "agent" && m.phase === "streaming"
                ? { ...m, phase: "done" as const }
                : m,
            ),
          );
          setSending(false);
        }, 500);
        trackTimeout(streamFor);
      }, 600);
      trackTimeout(thinkFor);
    },
    [sending, trackTimeout, untrackTimeout],
  );

  /** Cancela a resposta em andamento (revisão de código, "Stop"): o placeholder some sem deixar rastro. */
  const cancel = useCallback(() => {
    for (const id of timeouts.current) window.clearTimeout(id);
    timeouts.current = [];
    setMessages((prev) =>
      prev.filter(
        (m) => !(m.role === "agent" && (m.phase === "thinking" || m.phase === "streaming")),
      ),
    );
    setSending(false);
  }, []);

  const setHelpful = useCallback((id: string, helpful: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id && m.role === "agent" && m.phase === "done"
          ? { ...m, helpful: m.helpful === helpful ? undefined : helpful }
          : m,
      ),
    );
  }, []);

  const reset = useCallback(() => {
    for (const id of timeouts.current) window.clearTimeout(id);
    timeouts.current = [];
    setMessages([]);
    setSending(false);
  }, []);

  return { messages, sending, send, cancel, setHelpful, reset };
}
