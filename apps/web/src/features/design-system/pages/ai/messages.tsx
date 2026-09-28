/**
 * Mensagens da conversa (Figma 27:7100–27:7179, 27:17834–27:17870). Fase 7 — spec, item 3.
 */
import { Bot, UserRound } from "lucide-react";
import { useState } from "react";
import {
  Alert,
  AgentMessage,
  MessageFeedback,
  ThinkingMessage,
  ToolCallCollapsible,
  UserMessage,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { Code, Decisions, DocPage, DocSection, Prose } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

function FeedbackDemo() {
  const [helpful, setHelpful] = useState<boolean | undefined>(undefined);
  return (
    <MessageFeedback
      helpful={helpful}
      onHelpful={() => setHelpful((v) => (v === true ? undefined : true))}
      onUnhelpful={() => setHelpful((v) => (v === false ? undefined : false))}
    />
  );
}

function ConversationDemo() {
  return (
    <div className="flex flex-col gap-4">
      <UserMessage avatar={<Icon icon={UserRound} size="xs" className="text-primary" />}>
        Draft a project update for Mv School
      </UserMessage>
      <div className="flex flex-col gap-1.5">
        <AgentMessage icon={<Icon icon={Bot} size="xs" className="text-tertiary" />}>
          Here's the update based on the last two weeks of activity.
        </AgentMessage>
        <ToolCallCollapsible summary="Worked for 8 seconds" className="ml-6">
          Searched 42 issues · Read 3 documents · Summarized findings
        </ToolCallCollapsible>
        <div className="ml-6">
          <FeedbackDemo />
        </div>
      </div>
    </div>
  );
}

export function Page() {
  return (
    <DocPage
      title="Mensagens"
      description="Bolha do usuário à direita, parágrafo do agente à esquerda sem moldura, streaming, pensando, chamada de ferramenta recolhível, feedback e erro."
    >
      <DocSection title="Conversa" description="Uma resposta com chamada de ferramenta e feedback.">
        <ThemePair>{() => <ConversationDemo />}</ThemePair>
      </DocSection>

      <DocSection title="Estados">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Usuário</figcaption>
            <UserMessage avatar={<Icon icon={UserRound} size="xs" className="text-primary" />}>
              Research a topic across the issue backlog
            </UserMessage>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Agente</figcaption>
            <AgentMessage icon={<Icon icon={Bot} size="xs" className="text-tertiary" />}>
              Here's a summary of what I found.
            </AgentMessage>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Streaming</figcaption>
            <AgentMessage icon={<Icon icon={Bot} size="xs" className="text-tertiary" />} streaming>
              I looked through the backlog and found
            </AgentMessage>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Pensando</figcaption>
            <ThinkingMessage />
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Chamada de ferramenta</figcaption>
            <ToolCallCollapsible summary="Worked for 12 seconds">
              Searched 18 issues · Updated 3 fields
            </ToolCallCollapsible>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Erro</figcaption>
            <Alert tone="danger" title="Something went wrong" role="alert">
              The agent couldn't complete this request. Try asking again.
            </Alert>
          </figure>
        </div>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Usuário: pílula à direita (bg-control-strong, rounded-full), ícone + texto",
            rule: "spec, item 3",
          },
          {
            decision: "Streaming: cursor piscando (animate-pulse) no fim do texto",
            rule: "spec, item 3 — reaproveita a animação já usada em Skeleton",
          },
          {
            decision: 'Chamada de ferramenta: Collapsible "Worked for N seconds"',
            rule: "spec, item 3 — o mesmo padrão do cabeçalho de grupo (List Group, Fase 5)",
          },
          {
            decision: "Erro: Alert inline tom danger, dentro do fluxo de mensagens",
            rule: "spec, item 3 — sem componente novo",
          },
        ]}
      />

      <DocSection title="Anúncio para leitor de tela">
        <Prose>
          A lista de mensagens não usa <Code>aria-live</Code> diretamente (reler a conversa inteira
          a cada mensagem nova seria ruim); uma região oculta separada (
          <Code>aria-live=&quot;polite&quot;</Code>) anuncia só a última mensagem enviada ou
          concluída — ver <Code>features/agent/agent-conversation-view.tsx</Code>.
        </Prose>
      </DocSection>
    </DocPage>
  );
}
