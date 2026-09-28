/**
 * Sessão de agente na Activity (Figma 27:17705–27:17756): reaproveita o Timeline (Fase 5), com
 * uma linha recolhível "Finished: …" e o Avatar sem foto (fallback Bot — decisão 2 da spec, sem
 * os logos reais de Cursor/Codex). Fase 7 — spec, item 8.
 */
import { Bot } from "lucide-react";
import {
  Avatar,
  Timeline,
  TimelineItem,
  ToolCallCollapsible,
} from "@vyzer/design-system/components";
import { Decisions, DocPage, DocSection } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

/** Fixo no módulo (não em render, impuro): 6 minutos atrás de quando a página carregou. */
const SESSION_TIME = new Date(Date.now() - 1000 * 60 * 6);

function ActivityDemo() {
  return (
    <Timeline label="Activity">
      <TimelineItem
        icon={<Avatar name="Cursor" icon={Bot} size="sm" />}
        author="Cursor"
        time={SESSION_TIME}
        body={
          <ToolCallCollapsible summary="Finished: updated 3 files, opened 1 pull request">
            Changed apps/web/src/features/agent/index.tsx, data.ts and use-agent-conversation.ts ·
            Opened PR #142
          </ToolCallCollapsible>
        }
      >
        started working on this issue.
      </TimelineItem>
    </Timeline>
  );
}

export function Page() {
  return (
    <DocPage
      title="Sessão de agente na Activity"
      description='Dentro do Timeline da issue: "Cursor started by…" com uma linha "Finished: …" recolhível para o resultado. Sem os logos reais de Cursor/Codex, o Avatar usa o fallback Bot.'
    >
      <DocSection title="Ao vivo">
        <ThemePair>{() => <ActivityDemo />}</ThemePair>
      </DocSection>

      <Decisions
        items={[
          {
            decision:
              "Reaproveita TimelineItem (Fase 5) + o mesmo Collapsible do tool call do chat",
            rule: "spec, item 8 — sem componente novo",
          },
          {
            decision: "Avatar sem foto: fallback Bot (lucide) + nome da ferramenta em texto",
            rule: "spec, decisão 2 (aprovada) — sem os SVGs de Cursor/Codex, pedir os logos atrasaria a entrega",
          },
        ]}
      />
    </DocPage>
  );
}
