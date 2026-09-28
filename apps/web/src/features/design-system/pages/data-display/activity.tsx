/**
 * Activity: a linha do tempo de uma issue ou projeto (Figma 25:4689, Project Details; 27:17223,
 * Inbox).
 */
import { Avatar, Timeline, TimelineItem } from "@vyzer/design-system/components";
import { Icon, PriorityIcon, StatusIcon } from "@vyzer/design-system/icons";
import { Link2, Plus, Tag } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

/** Referência fixa do tempo relativo: a página é igual em qualquer dia. */
const NOW = new Date("2026-09-28T15:00:00Z");

const at = (hoursAgo: number) => new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000);

function Activity({ comments = true }: { comments?: boolean }) {
  return (
    <Timeline label="Activity" className="w-full max-w-prose">
      <TimelineItem
        icon={<Icon icon={Plus} className="text-secondary" />}
        author="André Júnio"
        time={at(24 * 9)}
        now={NOW}
      >
        created the issue
      </TimelineItem>
      <TimelineItem
        icon={<Icon icon={Tag} className="text-secondary" />}
        author="André Júnio"
        time={at(24 * 9 - 1)}
        now={NOW}
      >
        added the label Feature
      </TimelineItem>
      <TimelineItem
        icon={<PriorityIcon priority="high" />}
        author="Marina Costa"
        time={at(24 * 3)}
        now={NOW}
      >
        set the priority to High
      </TimelineItem>
      {comments && (
        <TimelineItem
          icon={<Avatar name="Marina Costa" size="sm" />}
          author="Marina Costa"
          time={at(26)}
          now={NOW}
          body="The footer should keep the property buttons in the same order as the list. Can we reuse the New Project pickers?"
        >
          commented
        </TimelineItem>
      )}
      <TimelineItem
        icon={<StatusIcon type="started" progress={1 / 3} />}
        author="André Júnio"
        time={at(3)}
        now={NOW}
      >
        changed the status from Backlog to In Progress
      </TimelineItem>
      <TimelineItem
        icon={<Icon icon={Link2} className="text-secondary" />}
        author="Rafael Brito"
        time={new Date(NOW.getTime() - 20 * 1000)}
        now={NOW}
      >
        linked ZYN-45
      </TimelineItem>
    </Timeline>
  );
}

function usePlayground() {
  const [comments, setComments] = useState<"yes" | "no">("yes");
  return {
    preview: <Activity comments={comments === "yes"} />,
    controls: (
      <Field label="comentários">
        <Segmented
          label="comentários"
          value={comments}
          onChange={setComments}
          options={[
            { value: "yes", label: "sim" },
            { value: "no", label: "não" },
          ]}
        />
      </Field>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Activity",
        description:
          "Linha do tempo de uma issue ou de um projeto (Figma 25:4689 e o Inbox, 27:17223): cada evento com ícone num trilho, autor, a ação e o tempo relativo; comentários trazem o texto num cartão.",
        whenToUse: [
          "Histórico de uma issue ou projeto",
          "Feed de notificações do Inbox (evento por linha)",
        ],
        whenNotToUse: [
          "Lista de itens para abrir: use List Row",
          "Mudanças de status ao longo do tempo em gráfico: Data Visualization (Fase 9)",
        ],
        playground,
        showcase: <Activity />,
        states: null,
        statesNote:
          'Não interativo. O tempo relativo usa o horário atual (ou now); passar o ponteiro sobre ele mostra a data completa. Menos de um minuto: "just now".',
        themes: () => <Activity />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Trilho de 20 px com o ícone do evento (16 px) e uma hairline border-default até o
            próximo; 12 px até o texto. Texto de 12 px em text-secondary com o autor em 12 px/500
            text-primary, ponto médio e o tempo relativo. Comentário: cartão em bg-surface com
            hairline, raio 10 e texto de 13 px. 16 px entre eventos.
          </p>
        ),
        keyboard: ["Não recebe foco; links e ações dentro de um comentário seguem a ordem do Tab."],
        accessibility: [
          "Lista ordenada com nome (label); cada evento é um item.",
          "O ícone é decorativo: o texto diz quem fez o quê.",
          "O tempo é um elemento time com a data ISO em datetime.",
        ],
        content: [
          'Ação no passado, sem sujeito repetido: "changed the status from Backlog to In Progress".',
          'Tempo relativo em inglês, a língua da interface ("3 hours ago", "yesterday").',
        ],
        dos: ["Agrupe eventos seguidos do mesmo autor quando ficarem longos"],
        donts: [
          "Não use cor para distinguir autores",
          "Não mostre a data completa no lugar do tempo relativo",
        ],
        usage: `import { Timeline, TimelineItem } from "@vyzer/design-system/components";

<Timeline label="Activity">
  <TimelineItem icon={<StatusIcon type="started" />} author="André Júnio" time={event.at}>
    changed the status from Backlog to In Progress
  </TimelineItem>
  <TimelineItem icon={<Avatar name="Marina Costa" size="sm" />} author="Marina Costa" time={comment.at} body={comment.text}>
    commented
  </TimelineItem>
</Timeline>`,
        props: [
          { name: "Timeline.label", type: "string", description: "Nome acessível da lista." },
          { name: "icon", type: "ReactNode", description: "Ícone de 16 px do evento." },
          { name: "author", type: "string", description: "Quem fez." },
          { name: "children", type: "ReactNode", description: "A ação." },
          { name: "time", type: "Date | string", description: "Quando (data ou ISO)." },
          {
            name: "now",
            type: "Date",
            default: "new Date()",
            description: "Referência do tempo relativo.",
          },
          { name: "body", type: "ReactNode", description: "Corpo (comentário) num cartão." },
          {
            name: "formatRelativeTime",
            type: "(date, now?) => string",
            description: "O mesmo formato, para usar fora da timeline.",
          },
        ],
        decisions: [
          {
            decision: "Texto de 12 px com o autor em 12/500",
            rule: "Figma 1:6330 e 1:6331 (12 px Medium e Regular)",
          },
          {
            decision: "Trilho com hairline border-default entre os ícones",
            rule: "Mesma hairline dos cartões (ADR-0013: profundidade por hairline)",
          },
          {
            decision: "Tempo relativo com Intl.RelativeTimeFormat (en, numeric auto)",
            rule: "Sem dependência nova; interface em inglês",
          },
          {
            decision: "Comentário num cartão bg-surface, sem sombra",
            rule: "Mesmo cartão do Composer (ADR-0013: sombra só em overlays)",
          },
        ],
      }}
    />
  );
}
