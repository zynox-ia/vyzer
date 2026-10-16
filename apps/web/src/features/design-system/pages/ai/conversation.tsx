/**
 * Cabeçalho da conversa, painel flutuante / chat lateral e histórico (Figma 27:7065–27:7096,
 * 27:7239–27:7260, 27:7230, 27:17787; sem frame para o histórico — só o gatilho 1:5325).
 * Fase 7 — spec, itens 4, 5 e 6.
 */
import { Bot, Ellipsis, Maximize2, PanelRight, SquarePen, Star } from "lucide-react";
import { useState } from "react";
import {
  ChatHistoryPopover,
  ConversationHeader,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  type ChatHistoryEntry,
} from "@zynox/design-system/components";
import { Decisions, DocPage, DocSection, Prose } from "../../kit/doc";
import { ShellFrame } from "../../kit/shell-frame";
import { RightPanel } from "@/layouts/app-shell/right-panel";
import {
  AgentConversationView,
  ChatSwitcherButton,
} from "@/features/agent/agent-conversation-view";
import { COMPACT_SUGGESTIONS, CHAT_HISTORY } from "@/features/agent/data";

/** Painel compacto: favoritar, abrir página cheia e opções — o "×" do próprio painel fecha. */
function CompactHeaderDemo({ history }: { history: ChatHistoryEntry[] }) {
  return (
    <ConversationHeader
      title={<ChatSwitcherButton title="New chat" entries={history} onSelect={() => {}} />}
      actions={
        <>
          <IconButton icon={Star} label="Add to favorites" variant="ghost" />
          <IconButton icon={Maximize2} label="Open full page" variant="ghost" />
          <Menu>
            <MenuTrigger asChild>
              <IconButton icon={Ellipsis} label="Chat options" variant="ghost" />
            </MenuTrigger>
            <MenuContent variant="dropdown" align="end">
              <MenuItem>New chat</MenuItem>
            </MenuContent>
          </Menu>
        </>
      }
    />
  );
}

/**
 * Página cheia: o mesmo switcher na TopBar do shell, favoritar nativo, "⋯" com "New chat" e
 * "Move to toolbar" avulso ao lado — quatro controles distintos (Figma 27:7071/27:7080/27:7085/
 * 27:7091), não um dentro do outro (revisão de fidelidade, rodada 2, bloqueante 3).
 */
function FullPageHeaderDemo({ history }: { history: ChatHistoryEntry[] }) {
  return (
    <div className="flex h-11 items-center gap-1 border-b border-default px-2">
      <span className="text-label-md text-primary">Agent</span>
      <IconButton icon={Star} label="Add to favorites" variant="ghost" />
      <div className="ml-auto flex items-center gap-1">
        <ChatSwitcherButton title="New chat" entries={history} onSelect={() => {}} />
        <Menu>
          <MenuTrigger asChild>
            <IconButton icon={Ellipsis} label="Chat options" variant="ghost" />
          </MenuTrigger>
          <MenuContent variant="dropdown" align="end">
            <MenuItem icon={SquarePen}>New chat</MenuItem>
          </MenuContent>
        </Menu>
        <IconButton icon={PanelRight} label="Move to toolbar" variant="ghost" />
      </div>
    </div>
  );
}

function PanelDemo() {
  return (
    <ShellFrame theme="dark" height="h-140" defaultRightPanelOpen>
      <div className="flex min-w-0 flex-1 items-center justify-center">
        <p className="text-body-md text-secondary">Conteúdo da tela</p>
      </div>
      <RightPanel
        label="Agent chat"
        closeLabel="Close agent chat"
        bodyClassName="min-h-0 flex-1 gap-0 p-0"
      >
        <AgentConversationView density="compact" suggestions={COMPACT_SUGGESTIONS} />
      </RightPanel>
    </ShellFrame>
  );
}

function HistoryStates() {
  const [openFilled, setOpenFilled] = useState(true);
  const [openEmpty, setOpenEmpty] = useState(true);
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-caption text-secondary">Com conversas</figcaption>
        <ChatHistoryPopover
          entries={CHAT_HISTORY}
          onSelect={() => {}}
          open={openFilled}
          onOpenChange={setOpenFilled}
        >
          <IconButton icon={Bot} label="Chat history" variant="secondary" />
        </ChatHistoryPopover>
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-caption text-secondary">Vazio</figcaption>
        <ChatHistoryPopover
          entries={[]}
          onSelect={() => {}}
          open={openEmpty}
          onOpenChange={setOpenEmpty}
        >
          <IconButton icon={Bot} label="Chat history" variant="secondary" />
        </ChatHistoryPopover>
      </figure>
    </div>
  );
}

export function Page() {
  return (
    <DocPage
      title="Cabeçalho, painel e histórico"
      description="Título trocável (Switch agent chat), favoritar, opções e — no painel compacto — abrir a página cheia. O painel do agente usa o painel direito do App Shell (Fase 8); o histórico é um Popover com a lista de conversas."
    >
      <DocSection
        title="Cabeçalho"
        description="Título trocável, favoritar e opções em comum às duas densidades; abrir página cheia só no compacto, Move to toolbar só na página cheia."
      >
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Painel compacto</figcaption>
            <div className="overflow-hidden rounded-container border border-subtle bg-app">
              <CompactHeaderDemo history={CHAT_HISTORY} />
            </div>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Página cheia (TopBar)</figcaption>
            <div className="overflow-hidden rounded-container border border-subtle bg-app">
              <FullPageHeaderDemo history={CHAT_HISTORY} />
            </div>
          </figure>
        </div>
      </DocSection>

      <DocSection
        title="Chat no painel direito"
        description="O painel flutuante da spec (item 5) entra pelo painel direito do App Shell (Fase 8) — troca de contêiner, não de conteúdo (ver Dependências entre fases da spec)."
      >
        <PanelDemo />
      </DocSection>

      <DocSection
        title="Histórico"
        description="Popover com título + hora relativa (formatRelativeTime). ↑ ↓ navegam, Enter troca de conversa, Esc fecha."
      >
        <HistoryStates />
      </DocSection>

      <Decisions
        items={[
          {
            decision: 'Título trocável: "Switch agent chat"',
            rule: "Confirmado ao vivo em linear.app/zynox-dev/agent",
          },
          {
            decision:
              "Painel flutuante entra pelo painel direito do App Shell (Fase 8), não um Dialog isolado",
            rule: "Decisão do responsável em 28/09 (revisa a decisão 3 da spec, escrita antes da Fase 8 existir nesta branch)",
          },
          {
            decision: '"Minimizar" fica de fora no contêiner do painel direito',
            rule: "Sem sentido nesse contêiner (o painel só abre/fecha, sem estado minimizado) — o fechar do próprio painel (×) cobre o caso; só sobra Open full page",
          },
          {
            decision: 'Histórico vazio: "No agent chats"',
            rule: "spec, item 6 — mesmo texto do Command Menu (kit/command-catalog.tsx)",
          },
        ]}
      />

      <DocSection title="Gatilhos existentes (spec, item 9)">
        <Prose>
          &quot;Agent&quot; e &quot;Chat history&quot; no rodapé flutuante de Issues/Projects
          (1:5319/1:5325) e &quot;Create with Agent&quot; no formulário de New Project (1:3262)
          ainda não têm um rodapé flutuante construído (Fase 10, Patterns) nem uma variação de New
          Project nesta branch — ficam registrados aqui, com o mesmo ícone de agente (Bot), para
          quando essa infraestrutura existir. &quot;Write with Agent&quot; (forms/composer.tsx) e
          &quot;AI filter&quot; (navigation/filter-menu.tsx) já foram atualizados para o ícone Bot
          nesta fase.
        </Prose>
      </DocSection>
    </DocPage>
  );
}
