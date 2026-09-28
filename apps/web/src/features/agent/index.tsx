/**
 * Tela cheia do agente (Figma 27:6907/27:7058, "/agent" — confirmado ao vivo no Linear: a rota
 * do item "Agent" da sidebar redireciona para lá). TopBar do shell (breadcrumb "Agent") + a mesma
 * conversa do chat do painel direito, agora compartilhada pelo AgentChatProvider (spec, item 5;
 * revisão de código, bloqueante 1): `?chat=<id>` reflete a conversa ativa, para o Back e o
 * recarregar restaurarem o contexto — spec fase-7-ai-e-chat.md.
 */
import { Bot, Ellipsis, PanelRight, SquarePen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { TopBar } from "@/layouts/app-shell/top-bar";
import { useAgentChatStore } from "./agent-chat-store";
import { ChatSwitcherButton, AgentConversationView } from "./agent-conversation-view";
import { FULL_SUGGESTIONS } from "./data";

export function AgentPage() {
  const [params, setParams] = useSearchParams();
  const store = useAgentChatStore();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // "?chat=<id>" é a fonte de verdade só na entrada (link direto, Back, recarregar) — capturado
  // uma vez (useRef ignora reavaliações do argumento depois da primeira), não a cada render:
  // senão, brigaria com o efeito de baixo (troca pelo switcher muda activeChatId antes do param
  // acompanhar; nesse intervalo os dois seriam diferentes e este efeito reverteria a troca de
  // volta para o valor antigo do param). Lido de `params` (react-router), não de
  // `window.location`, para funcionar também com MemoryRouter (testes).
  const initialChatParam = useRef(params.get("chat")).current;
  useEffect(() => {
    if (initialChatParam) store?.selectChat(initialChatParam);
    // Só na entrada: o efeito de baixo é quem mantém o param em dia depois disso.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dali em diante, o app manda: toda troca da conversa ativa (switcher, nova conversa, o painel
  // direito de Projects) empurra pro param — replace, não push, para não poluir o Back a cada
  // resposta.
  const activeChatId = store?.activeChatId;
  useEffect(() => {
    if (!activeChatId) return;
    setParams(
      (prev) => {
        if (prev.get("chat") === activeChatId) return prev;
        const next = new URLSearchParams(prev);
        next.set("chat", activeChatId);
        return next;
      },
      { replace: true },
    );
  }, [activeChatId, setParams]);

  // Esc cancela a resposta em andamento sem sair da página (revisão de código, item 4) — só
  // liga o listener enquanto sending, para não competir com nenhum outro atalho da página.
  const sending = store?.sending;
  const cancel = store?.cancel;
  useEffect(() => {
    if (!sending) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        cancel?.();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sending, cancel]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        breadcrumbs={[{ label: "Agent", icon: <Icon icon={Bot} size="sm" /> }]}
        favorite={store?.favorite}
        onFavoriteChange={store ? () => store.toggleFavorite() : undefined}
        breadcrumbActions={
          <>
            <ChatSwitcherButton
              title={store?.title ?? "New chat"}
              entries={store?.history ?? []}
              onSelect={(id) => {
                store?.selectChat(id);
                setSwitcherOpen(false);
              }}
              open={switcherOpen}
              onOpenChange={setSwitcherOpen}
            />
            <Menu>
              <MenuTrigger asChild>
                <IconButton icon={Ellipsis} label="Chat options" variant="ghost" />
              </MenuTrigger>
              <MenuContent variant="dropdown" align="end">
                {/* Mesmo item do painel compacto (agent-conversation-view.tsx) — o Figma
                    (27:7085/27:7091) mostra "Move to toolbar" como um botão avulso, irmão do
                    "⋯", não um item dentro dele (revisão de fidelidade, rodada 2, bloqueante 3). */}
                <MenuItem icon={SquarePen} onSelect={() => store?.newChat()}>
                  New chat
                </MenuItem>
              </MenuContent>
            </Menu>
            {/* Avulso, fora do menu — mesma posição relativa do Figma (27:7091): ícone só, sem
                lugar de verdade para mover ainda (Fase 10, Patterns), como outras ações inertes
                já registradas nesta fase. */}
            <IconButton icon={PanelRight} label="Move to toolbar" variant="ghost" />
          </>
        }
      />
      <AgentConversationView density="full" suggestions={FULL_SUGGESTIONS} useSharedChat />
    </div>
  );
}
