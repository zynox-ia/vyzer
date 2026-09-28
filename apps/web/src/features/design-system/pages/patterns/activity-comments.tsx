/**
 * Atividade e comentários (spec Fase 10, item 7; seção Activity de 25:4689 e 27:17223). Estende a
 * composição Timeline/TimelineItem (Fase 5, data-display/activity.tsx) com um cabeçalho
 * Unsubscribe/Subscribe e o Composer em modo comment (Forms, existente) para postar um novo
 * comentário — que, ao publicar, entra como um TimelineItem otimista no fim da lista.
 */
import {
  Avatar,
  Button,
  EmptyState,
  IconButton,
  TextArea,
  Timeline,
  TimelineItem,
} from "@vyzer/design-system/components";
import { Icon, PriorityIcon, StatusIcon } from "@vyzer/design-system/icons";
import {
  Activity as ActivityIcon,
  Bell,
  BellOff,
  Link2,
  ListChecks,
  Paperclip,
  Plus,
  Tag,
} from "lucide-react";
import { type KeyboardEvent, type ReactNode, useState } from "react";
import { PatternPage } from "../../kit/pattern-page";
import { StatesGrid, StatesStack } from "../../kit/states";

/** Referência fixa do tempo relativo: a página é igual em qualquer dia (mesma regra da Activity). */
const NOW = new Date("2026-09-28T15:00:00Z");
const at = (hoursAgo: number) => new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000);

type ActivityEvent = {
  id: string;
  icon: ReactNode;
  author: string;
  time: Date;
  body?: string;
  action: ReactNode;
};

const INITIAL_EVENTS: ActivityEvent[] = [
  {
    id: "created",
    icon: <Icon icon={Plus} className="text-secondary" />,
    author: "André Júnio",
    time: at(24 * 6),
    action: "created the project",
  },
  {
    id: "label",
    icon: <Icon icon={Tag} className="text-secondary" />,
    author: "André Júnio",
    time: at(24 * 6 - 1),
    action: "added the label Feature",
  },
  {
    id: "status",
    icon: <StatusIcon type="started" progress={1 / 3} />,
    author: "Marina Costa",
    time: at(24 * 2),
    action: "changed the status from Backlog to In Progress",
  },
  {
    id: "comment-1",
    icon: <Avatar name="Rafael Brito" size="sm" />,
    author: "Rafael Brito",
    time: at(5),
    body: "Beta launch milestone is close — should we bump the target date a few days?",
    action: "commented",
  },
  {
    id: "priority",
    icon: <PriorityIcon priority="high" />,
    author: "Marina Costa",
    time: at(3),
    action: "set the priority to High",
  },
  {
    id: "link",
    icon: <Icon icon={Link2} className="text-secondary" />,
    author: "André Júnio",
    time: new Date(NOW.getTime() - 20 * 1000),
    action: "linked ZYN-45",
  },
];

/**
 * Composer em modo comment (Forms, existente): mantém o comportamento já definido (Enter quebra
 * linha, ⌘/Ctrl+Enter publica). Sem o alternador Comment/Update do Composer avulso — aqui o
 * contexto já fixa o modo comment, mesma decisão do Project Update para o modo update.
 */
function CommentComposer({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex w-full flex-col rounded-container border border-default bg-surface focus-ring-within"
    >
      <TextArea
        variant="plain"
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Comment"
        placeholder="Leave a comment…"
        className="mt-3"
      />
      <div className="flex items-center justify-between px-3 py-3">
        <Button icon={ListChecks}>Write with Agent</Button>
        <div className="flex items-center gap-3">
          <IconButton icon={Paperclip} label="Attach images, files, or videos" size="md" />
          <Button type="submit">Comment</Button>
        </div>
      </div>
    </form>
  );
}

function ActivityAndCommentsExample() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [subscribed, setSubscribed] = useState(true);

  const addComment = (text: string) => {
    setEvents((prev) => [
      ...prev,
      {
        id: `comment-${prev.length}`,
        icon: <Avatar name="André Júnio" size="sm" />,
        author: "André Júnio",
        time: NOW,
        body: text,
        action: "commented",
      },
    ]);
  };

  return (
    <div className="flex w-full max-w-prose flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="type-heading-3 text-primary">Activity</h3>
        <Button
          variant="ghost"
          icon={subscribed ? BellOff : Bell}
          onClick={() => setSubscribed((v) => !v)}
        >
          {subscribed ? "Unsubscribe" : "Subscribe"}
        </Button>
      </div>
      <Timeline label="Activity">
        {events.map((event) => (
          <TimelineItem
            key={event.id}
            icon={event.icon}
            author={event.author}
            time={event.time}
            now={NOW}
            body={event.body}
          >
            {event.action}
          </TimelineItem>
        ))}
      </Timeline>
      <CommentComposer onSubmit={addComment} />
    </div>
  );
}

function States() {
  return (
    <div className="flex flex-col gap-6">
      <StatesGrid
        states={[
          {
            label: "cabeçalho · inscrito",
            node: (
              <Button variant="ghost" icon={BellOff}>
                Unsubscribe
              </Button>
            ),
          },
          {
            label: "cabeçalho · não inscrito",
            node: (
              <Button variant="ghost" icon={Bell}>
                Subscribe
              </Button>
            ),
          },
          {
            label: "cabeçalho · hover",
            node: (
              <Button variant="ghost" icon={BellOff} data-preview="hover">
                Unsubscribe
              </Button>
            ),
          },
          {
            label: "cabeçalho · foco",
            node: (
              <Button variant="ghost" icon={BellOff} data-preview="focus">
                Unsubscribe
              </Button>
            ),
          },
        ]}
      />
      <StatesStack
        states={[
          {
            label: "timeline vazia",
            node: (
              <EmptyState icon={ActivityIcon} title="No activity yet">
                Changes to this project show up here.
              </EmptyState>
            ),
          },
        ]}
      />
      <p className="max-w-prose text-body-sm text-secondary">
        Carregando usa <code className="font-mono text-code">Skeleton</code> (Fase 4) nas linhas do
        trilho, autor e cartão de comentário (mesmo padrão do detalhe de issue). Erro não se aplica
        a publicar um comentário nesta documentação, sem chamada real à API.
      </p>
    </div>
  );
}

export function Page() {
  return (
    <PatternPage
      doc={{
        title: "Activity & Comments",
        description:
          "Linha do tempo de um projeto ou issue (Fase 5, Timeline/TimelineItem; Figma: seção Activity em 25:4689 e 27:17223), com Unsubscribe/Subscribe no cabeçalho e o Composer em modo comment (Forms, existente) para postar um novo comentário.",
        live: <ActivityAndCommentsExample />,
        liveDescription:
          "Escreva um comentário e publique com ⌘/Ctrl+Enter (ou o botão Comment): ele entra como um novo evento no fim da timeline. Enter quebra linha; Unsubscribe alterna para Subscribe.",
        states: <States />,
        themes: (theme) => <ActivityAndCommentsExample key={theme} />,
        composition: [
          <>
            <code className="font-mono text-code">Timeline</code>/
            <code className="font-mono text-code">TimelineItem</code> (Fase 5, existentes) para os
            eventos; o comentário usa o slot <code className="font-mono text-code">body</code> do{" "}
            <code className="font-mono text-code">TimelineItem</code>.
          </>,
          <>
            Cabeçalho da Activity: <code className="font-mono text-code">Button</code>{" "}
            <code className="font-mono text-code">variant=&quot;ghost&quot;</code> com o ícone
            Bell/BellOff, alternando Unsubscribe/Subscribe — texto e estado só locais, sem
            assinatura real (fora do escopo).
          </>,
          <>
            Composer em modo comment (Forms, existente):{" "}
            <code className="font-mono text-code">TextArea variant=&quot;plain&quot;</code> e os
            mesmos <code className="font-mono text-code">Button</code>/
            <code className="font-mono text-code">IconButton</code> do rodapé, sem o{" "}
            <code className="font-mono text-code">SegmentedControl</code> Comment/Update (o contexto
            já fixa o modo).
          </>,
          <>
            Ao publicar, o comentário entra como um{" "}
            <code className="font-mono text-code">TimelineItem</code> otimista no fim da lista —
            toque opcional sugerido pela spec, sem chamada real à API.
          </>,
        ],
        decisions: [
          {
            decision: "Unsubscribe/Subscribe como Button ghost, sem peça nova",
            rule: "Spec Fase 10, item 7",
          },
          {
            decision:
              "Composer sem o SegmentedControl Comment/Update do Composer avulso; aqui é sempre comment",
            rule: "Contexto da Activity de um projeto/issue já fixa o modo (mesma decisão do Project Update para update)",
          },
          {
            decision: "⌘/Ctrl+Enter publica; Enter quebra linha",
            rule: "Spec Fase 10, §Comportamento (item 7): “Composer em modo comment mantém o comportamento já definido”",
          },
          {
            decision: "Novo comentário some da composer e vira um TimelineItem otimista",
            rule: "Spec Fase 10, item 7 (toque opcional, sem chamada real à API)",
          },
        ],
      }}
    />
  );
}
