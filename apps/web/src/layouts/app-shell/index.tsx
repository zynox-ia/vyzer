/**
 * Shell da aplicação (Figma 27:6905 → 1:6569): sidebar + área de conteúdo, num painel recuado (8
 * px em cima/direita, 36 px embaixo — a faixa reservada para o rodapé flutuante do agente),
 * raio 12, borda e `shadow-contact` (Fase 8, refino a pedido do André). Compõe o estado do shell
 * (AppShellProvider), a sidebar, o Command Menu (⌘K) e o Composer de criação ("C") — os gatilhos
 * globais funcionam de qualquer tela, como pede a spec.
 */
import { useEffect, useState } from "react";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router";
import { AgentConversationView } from "@/features/agent/agent-conversation-view";
import { AgentChatProvider } from "@/features/agent/agent-chat-store";
import { AgentFloatingActions } from "@/features/agent/agent-floating-actions";
import { useAgentChatStore } from "@/features/agent/agent-chat-store";
import { FLOATING_SUGGESTIONS } from "@/features/agent/data";
import { cn } from "@vyzer/design-system/cn";
import { AppShellProvider } from "./context";
import { CreateIssueDialog } from "./create-issue-dialog";
import { writeLastShellPath } from "./lib/last-path";
import { ShellCommandMenu } from "./shell-command-menu";
import { Sidebar } from "./sidebar";
import { useAppShell } from "./use-app-shell";

/** Guarda a tela atual do shell para o "Back to app" de Settings (review de código, item 3). */
function TrackShellPath() {
  const location = useLocation();
  useEffect(() => {
    writeLastShellPath(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

function ShellFrame() {
  const { sidebarCollapsed } = useAppShell();
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 overflow-hidden pt-2 pr-2 pb-9 pl-2",
        !sidebarCollapsed && "tablet:pl-0",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-surface border border-subtle bg-sidebar shadow-contact">
        <Outlet />
      </div>
    </div>
  );
}

/**
 * Rodapé flutuante "Agent" + "Chat history" (Fase 7, VYZ-37): global, fora do painel, na faixa
 * de 36 px reservada pela Fase 8 — confirmado ao vivo no Linear (Inbox, lista de Projects e
 * projeto aberto mostram os mesmos botões, no mesmo lugar). Em `/projects/:projectId`, o botão
 * abre o chat no painel direito; nas outras telas abre um popover sem scrim, ancorado acima do
 * botão Agent. O item
 * Agent da sidebar continua levando à página cheia `/agent`.
 */
function AgentFooter() {
  const navigate = useNavigate();
  const location = useLocation();
  const agentStore = useAgentChatStore();
  const { rightPanelOpen, setRightPanelOpen, setRightPanelContent } = useAppShell();
  const onProjectDetail = matchPath("/projects/:projectId", location.pathname) !== null;
  const [agentPopoverOpen, setAgentPopoverOpen] = useState(false);

  const openChat = () => {
    if (onProjectDetail) {
      setAgentPopoverOpen(false);
      setRightPanelContent("chat");
      setRightPanelOpen(true);
    } else {
      setAgentPopoverOpen(true);
    }
  };
  const openChatWith = (id: string) => {
    agentStore?.selectChat(id);
    if (onProjectDetail) openChat();
    else setAgentPopoverOpen(true);
  };

  const agentPopoverContent = !onProjectDetail ? (
    <AgentConversationView
      density="floating"
      suggestions={FLOATING_SUGGESTIONS}
      useSharedChat
      onOpenFullPage={() => {
        setAgentPopoverOpen(false);
        navigate("/agent");
      }}
      onMinimize={() => setAgentPopoverOpen(false)}
      onClose={() => setAgentPopoverOpen(false)}
    />
  ) : undefined;

  return (
    <AgentFloatingActions
      panelOpen={rightPanelOpen}
      onOpenAgent={openChat}
      agentPopoverOpen={agentPopoverOpen}
      onAgentPopoverOpenChange={setAgentPopoverOpen}
      agentPopoverContent={agentPopoverContent}
      historyEntries={agentStore?.history ?? []}
      onSelectHistory={openChatWith}
    />
  );
}

export function AppShell() {
  return (
    <AppShellProvider>
      {/* Estado da conversa do agente, compartilhado acima das rotas (revisão de código,
          bloqueante 1): /agent e o chat do painel direito leem a mesma conversa ativa. */}
      <AgentChatProvider>
        <TrackShellPath />
        <div className="flex h-dvh overflow-hidden bg-app text-primary">
          <Sidebar />
          <ShellFrame />
        </div>
        <AgentFooter />
        <ShellCommandMenu />
        <CreateIssueDialog />
      </AgentChatProvider>
    </AppShellProvider>
  );
}
