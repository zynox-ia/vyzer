/**
 * Rodapé flutuante "Agent" + "Chat history" (Figma 1:5319/1:5325). Revisão de código, item 3: o
 * gatilho real do chat lateral em Issues/Projects, confirmado ao vivo em linear.app/zynox-dev
 * (projeto real) — não um botão na top bar (removido de ProjectsPage). Linha sem fundo/borda,
 * ancorada no canto inferior direito da área de conteúdo, `position: fixed` (sobrevive à rolagem,
 * como no Linear); desloca quando o painel direito está aberto para não ficar por baixo dele.
 */
import { History, MousePointer2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Button,
  ChatHistoryPopover,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  type ChatHistoryEntry,
} from "@zynox/design-system/components";
import { cn } from "@zynox/design-system/cn";

export function AgentFloatingActions({
  onOpenAgent,
  agentPopoverOpen = false,
  onAgentPopoverOpenChange,
  agentPopoverContent,
  historyEntries,
  onSelectHistory,
  panelOpen,
}: {
  onOpenAgent: () => void;
  agentPopoverOpen?: boolean;
  onAgentPopoverOpenChange?: (open: boolean) => void;
  agentPopoverContent?: ReactNode;
  historyEntries: ChatHistoryEntry[];
  onSelectHistory: (id: string) => void;
  /** O painel direito (400 px) está aberto: desloca a linha para a esquerda dele. */
  panelOpen?: boolean;
}) {
  // Controlado (revisão de código, menor): sem isso, o Popover não fecha ao escolher uma
  // conversa (só clique fora/Esc fecham um Popover não controlado) e fica sobre o painel que
  // acabou de abrir. O Radix devolve o foco ao gatilho ("Chat history") ao fechar.
  const [historyOpen, setHistoryOpen] = useState(false);
  return (
    <div
      className={cn(
        // Medido ao vivo (revisão de fidelidade, rodada 2): 4 px embaixo, 10 px até a borda da
        // janela — bottom-1/right-2.5, os degraus exatos da grade de 4 (2.5 é um meio-passo já
        // padrão da escala, não um valor fora dela). Com o painel aberto, soma a largura dele
        // (w-100, 400 px) ao gutter: 410 px cai fora da grade de 4 — arredondado pro degrau mais
        // próximo (right-103, 412 px), a mesma regra já aplicada à alça de redimensionar da
        // sidebar (.figma/01-design-tokens.md, Fase 8).
        "pointer-events-none fixed bottom-1 right-2.5 z-sticky flex items-center gap-1",
        panelOpen && "right-103",
      )}
    >
      {agentPopoverContent ? (
        <Popover open={agentPopoverOpen} onOpenChange={onAgentPopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button
              icon={MousePointer2}
              variant="ghost"
              className="pointer-events-auto data-[state=open]:bg-hover"
            >
              Agent
            </Button>
          </PopoverTrigger>
          <PopoverContent
            label="Agent chat"
            side="top"
            align="end"
            sideOffset={4}
            className="flex h-150 max-h-(--radix-popover-content-available-height) w-100 max-w-full overflow-hidden p-0"
          >
            {agentPopoverContent}
          </PopoverContent>
        </Popover>
      ) : (
        <Button
          icon={MousePointer2}
          variant="ghost"
          onClick={onOpenAgent}
          className="pointer-events-auto"
        >
          Agent
        </Button>
      )}
      <ChatHistoryPopover
        entries={historyEntries}
        onSelect={(id) => {
          onSelectHistory(id);
          setHistoryOpen(false);
        }}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        // O gatilho fica a 4 px do rodapé da tela: abrir para baixo (o padrão) estouraria a
        // viewport, sem virada automática (regra do Popover, pedido do responsável).
        side="top"
      >
        <IconButton
          icon={History}
          label="Chat history"
          variant="ghost"
          className="pointer-events-auto"
        />
      </ChatHistoryPopover>
    </div>
  );
}
