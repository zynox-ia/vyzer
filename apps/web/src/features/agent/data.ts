/**
 * Dados de exemplo do agente (spec fase-7-ai-e-chat.md): sugestões da tela vazia (medidas ao vivo
 * em linear.app/zynox-dev/agent — mesmos 3 textos), Skills, MCP connectors e histórico de
 * conversas, com mensagens de exemplo (revisão de código: o histórico precisa trocar de verdade
 * de conversa). Sem chamada real a LLM nem à API (fora do escopo): as respostas são roteiro fixo.
 */
import { Box, FolderGit2, NotebookPen, Search, Zap } from "lucide-react";

export type SuggestionData = { icon: typeof Search; title: string; description: string };

/** Densidade "página cheia" (27:6907): os 3 exemplos confirmados ao vivo no Linear. */
export const FULL_SUGGESTIONS: SuggestionData[] = [
  {
    icon: FolderGit2,
    title: "Create a new project",
    description: "Turn an idea into a well-scoped project",
  },
  {
    icon: Search,
    title: "Research a topic",
    description: "Research a topic across the issue backlog",
  },
  {
    icon: NotebookPen,
    title: "Draft a project update",
    description: "Turn project progress into a clear update",
  },
];

/** SugestÃµes do chat flutuante (rodapÃ©), com os Ã­cones curtos da referÃªncia do Linear. */
export const FLOATING_SUGGESTIONS: SuggestionData[] = [
  {
    icon: Box,
    title: "Create a new project",
    description: "Turn an idea into a well-scoped project",
  },
  {
    icon: Search,
    title: "Research a topic",
    description: "Research a topic across the issue backlog",
  },
  {
    icon: Zap,
    title: "Draft a project update",
    description: "Turn project progress into a clear update",
  },
];

/** Densidade "painel compacto" (27:7230, 1:3581): rótulos curtos, empilhados (spec, item 1). */
export const COMPACT_SUGGESTIONS: SuggestionData[] = [
  {
    icon: FolderGit2,
    title: "Outline the scope",
    description: "Turn an idea into a well-scoped project",
  },
  {
    icon: Search,
    title: "Research customer requests",
    description: "Research a topic across the issue backlog",
  },
];

export type CannedReply = {
  text: string;
  toolCall?: { summary: string; detail: string };
};

/** Roteiro fixo de respostas (fora do escopo qualquer chamada real a LLM). */
export const CANNED_REPLIES: CannedReply[] = [
  {
    text: "I looked through the issue backlog and found 6 related issues. Here's a summary of what's blocking the Fase 7 rollout.",
    toolCall: {
      summary: "Worked for 8 seconds",
      detail: "Searched 42 issues · Read 3 documents · Summarized findings",
    },
  },
  {
    text: "Done — I drafted the project update from the last 2 weeks of activity. Let me know if you want a different tone.",
  },
  {
    text: "Here's the outline: goals, scope, milestones and open risks. Want me to turn this into a project?",
  },
];

/** Roteiro de erro (spec, "Estados"): digitar "error" no composer aciona o Alert de erro inline. */
export const ERROR_TRIGGER = "error";

export type SkillData = { id: string; name: string };
export const SKILLS: SkillData[] = [];

export type ConnectorData = { id: string; name: string };
export const MCP_CONNECTORS: ConnectorData[] = [];

/**
 * Uma mensagem da conversa: pílula do usuário, parágrafo do agente (com sub-estados) ou erro.
 * Fica aqui (não em use-agent-conversation.ts) para o histórico (CHAT_SEEDS) e o motor de
 * simulação (standalone e o AgentChatProvider compartilhado) usarem o mesmo tipo sem import cíclico.
 */
export type AgentMessageState =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "agent"; phase: "thinking" }
  | {
      id: string;
      role: "agent";
      phase: "streaming" | "done";
      text: string;
      toolCall?: { summary: string; detail: string };
      helpful?: boolean;
    }
  | { id: string; role: "agent"; phase: "error" };

type HistorySeed = {
  id: string;
  title: string;
  offsetMs: number;
  messages: AgentMessageState[];
};

const now = Date.now();

/**
 * Histórico de conversas de exemplo, já concluídas (fase "done"): ao escolher uma no Popover, o
 * AgentChatProvider carrega essas mensagens (revisão de código, bloqueante 2 — o histórico
 * precisa trocar de conversa de verdade, não só a UI de seleção).
 */
const HISTORY_SEEDS: HistorySeed[] = [
  {
    id: "h1",
    title: "Draft update for Mv School",
    offsetMs: 1000 * 60 * 42,
    messages: [
      { id: "h1-u1", role: "user", text: "Draft a project update for Mv School" },
      {
        id: "h1-a1",
        role: "agent",
        phase: "done",
        text: "Here's the update based on the last two weeks of activity: scope is on track, 3 of 5 milestones done.",
        toolCall: {
          summary: "Worked for 6 seconds",
          detail: "Read project activity · Summarized progress since Sep 18",
        },
      },
    ],
  },
  {
    id: "h2",
    title: "Research onboarding backlog",
    offsetMs: 1000 * 60 * 60 * 5,
    messages: [
      { id: "h2-u1", role: "user", text: "Research a topic across the issue backlog" },
      {
        id: "h2-a1",
        role: "agent",
        phase: "done",
        text: "I found 4 issues related to onboarding friction, mostly around the invite flow.",
        toolCall: {
          summary: "Worked for 11 seconds",
          detail: "Searched 18 issues · Grouped by theme",
        },
      },
    ],
  },
  {
    id: "h3",
    title: "Outline Fase 9 charts scope",
    offsetMs: 1000 * 60 * 60 * 26,
    messages: [
      { id: "h3-u1", role: "user", text: "Outline the scope" },
      {
        id: "h3-a1",
        role: "agent",
        phase: "done",
        text: "Here's the outline: goals, scope, milestones and open risks. Want me to turn this into a project?",
      },
    ],
  },
];

export type HistoryEntryData = { id: string; title: string; updatedAt: Date };

/** Só para exibição (Popover de histórico fora de um AgentChatProvider — páginas de documentação). */
export const CHAT_HISTORY: HistoryEntryData[] = HISTORY_SEEDS.map((seed) => ({
  id: seed.id,
  title: seed.title,
  updatedAt: new Date(now - seed.offsetMs),
}));

/** Para o AgentChatProvider semear uma conversa na primeira vez que ela é escolhida no histórico. */
export const CHAT_SEEDS: Record<
  string,
  { title: string; updatedAt: number; messages: AgentMessageState[] }
> = Object.fromEntries(
  HISTORY_SEEDS.map((seed) => [
    seed.id,
    { title: seed.title, updatedAt: now - seed.offsetMs, messages: seed.messages },
  ]),
);
