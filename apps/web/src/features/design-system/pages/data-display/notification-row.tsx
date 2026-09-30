/**
 * Notification Row: a linha de notificação da Inbox (sem frame no Figma; medida no Linear ao vivo,
 * ver .figma/02-inbox-notifications.md).
 */
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  IssueList,
  MenuItem,
  NotificationRow,
  NotificationRowSkeleton,
  type NotificationRowProps,
} from "@vyzer/design-system/components";
import { PriorityIcon, StatusIcon } from "@vyzer/design-system/icons";
import { Bot, Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { StatesStack } from "../../kit/states";

type Sample = Omit<NotificationRowProps, "unread">;

const urgent = { label: "Urgent", icon: <PriorityIcon priority="urgent" /> };
const inProgress = { label: "In Progress", icon: <StatusIcon type="started" progress={1 / 3} /> };
const done = { label: "Done", icon: <StatusIcon type="completed" /> };

const SAMPLES: Sample[] = [
  {
    value: "n-1",
    actor: { name: "Marina Costa" },
    identifier: "ZYN-241",
    title: "Sync Linear webhooks with the issue feed",
    priority: urgent,
    status: inProgress,
    summary: "assigned you",
    time: "2d",
  },
  {
    value: "n-2",
    actor: { name: "Cursor", icon: Bot },
    identifier: "ZYN-238",
    title: "Add single sign-on to the workspace settings page and the invite flow",
    status: done,
    summary: "unassigned you",
    time: "18d",
  },
  {
    value: "n-3",
    actor: { name: "Rafael B" },
    identifier: "ZYN-230",
    title: "Fix billing rounding",
    summary: "assigned you",
    time: "3h",
  },
];

/** Lista com abrir, marcar como lida (clique) e menu de contexto em cada linha. */
function LiveList({ unread }: { unread: "all" | "some" | "none" }) {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [last, setLast] = useState<string>();
  const isUnread = (index: number, id: string) =>
    !readIds.includes(id) && (unread === "all" || (unread === "some" && index !== 1));
  return (
    <div className="flex w-96 max-w-full flex-col gap-3">
      <IssueList
        label="Notifications"
        onOpen={(id) => {
          setReadIds((ids) => [...ids, id]);
          setLast(`Open ${id}`);
        }}
      >
        {SAMPLES.map((sample, index) => (
          <ContextMenu key={sample.value}>
            <ContextMenuTrigger asChild>
              <NotificationRow {...sample} unread={isUnread(index, sample.value)} />
            </ContextMenuTrigger>
            <ContextMenuContent>
              <MenuItem icon={Check} shortcut={["U"]} onSelect={() => setLast("Mark as unread")}>
                Mark as unread
              </MenuItem>
              <MenuItem icon={Trash2} onSelect={() => setLast("Delete")}>
                Delete notification
              </MenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </IssueList>
      <p className="text-body-sm text-secondary" aria-live="polite">
        {last ?? "↑ ↓ movem, Enter abre (e marca como lida)"}
      </p>
    </div>
  );
}

function usePlayground() {
  const [unread, setUnread] = useState<"all" | "some" | "none">("some");
  return {
    preview: <LiveList key={unread} unread={unread} />,
    controls: (
      <Field label="não lidas">
        <Segmented
          label="não lidas"
          value={unread}
          onChange={setUnread}
          options={[
            { value: "all", label: "todas" },
            { value: "some", label: "algumas" },
            { value: "none", label: "nenhuma" },
          ]}
        />
      </Field>
    ),
  };
}

/** Uma linha estática dentro de uma lista própria (a linha precisa da Issue List). */
function StaticRow({
  sample = SAMPLES[0]!,
  unread = false,
  selected = false,
  preview,
}: {
  sample?: Sample;
  unread?: boolean;
  selected?: boolean;
  preview?: string;
}) {
  return (
    <div className="w-96 max-w-full">
      <IssueList
        label={`Notification ${sample.identifier}`}
        selected={selected ? [sample.value] : []}
        onSelectedChange={() => {}}
      >
        <NotificationRow {...sample} unread={unread} data-preview={preview} />
      </IssueList>
    </div>
  );
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Notification Row",
        description:
          "Linha de duas linhas de uma notificação da Inbox (medida no Linear ao vivo; sem frame no Figma): avatar do ator de 32 px, ID + título + ícones de prioridade e status, resumo do evento e tempo relativo. Vive dentro de uma Issue List, que dá o teclado e a seleção.",
        whenToUse: [
          "A lista de notificações da Inbox, com o detalhe da issue ao lado",
          "Eventos com ator (pessoa, agente ou sistema) sobre uma issue",
        ],
        whenNotToUse: [
          "Lista de issues sem ator nem evento: use List Row",
          "Registro de atividade dentro de uma issue: use Timeline",
        ],
        playground,
        showcase: (
          <div className="flex flex-col gap-6">
            <StaticRow unread />
            <StaticRow sample={SAMPLES[1]} />
            <StaticRow sample={SAMPLES[2]} unread />
          </div>
        ),
        states: (
          <StatesStack
            states={[
              { label: "lida", node: <StaticRow /> },
              { label: "não lida", node: <StaticRow unread /> },
              { label: "hover", node: <StaticRow preview="hover" /> },
              { label: "focus-visible", node: <StaticRow preview="focus" /> },
              { label: "selecionada", node: <StaticRow selected /> },
              { label: "não lida + selecionada", node: <StaticRow unread selected /> },
              {
                label: "carregando",
                node: (
                  <div className="w-96 max-w-full">
                    <NotificationRowSkeleton />
                  </div>
                ),
              },
            ]}
          />
        ),
        themes: () => (
          <div className="w-96 max-w-full">
            <IssueList label="Notifications" selected={["n-2"]} onSelectedChange={() => {}}>
              {SAMPLES.map((sample, index) => (
                <NotificationRow key={sample.value} {...sample} unread={index === 0} />
              ))}
            </IssueList>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Altura pelo conteúdo: py-2.5 e duas linhas de texto (20 px do ID e título, 16 px do
            resumo), 56 px no total. 20 px à esquerda (espaço do ponto de não lida, size-2 em
            bg-accent), px-cell-x à direita, raio 8 e 12 px entre o avatar de 32 px e o texto. Linha
            1: ID (body-md, ou label-md se não lida), título em label-md que trunca e os ícones de
            prioridade e status de 16 px. Linha 2: nome do ator e resumo em body-sm, que trunca, e o
            tempo relativo em text-secondary, à direita.
          </p>
        ),
        keyboard: [
          "Tab entra na lista pela linha ativa (um só alvo de Tab); ↑ ↓ Home End movem o foco.",
          "Enter abre a notificação; clique abre.",
          "Com Context Menu: Shift+F10 ou a tecla de menu abrem o menu da linha focada.",
        ],
        accessibility: [
          'Issue List é role="listbox" com nome; cada linha é role="option" com aria-selected.',
          'Um texto só para leitores de tela abre cada linha com "Unread" ou "Read"; o ponto de destaque é decorativo e o peso do ID também muda.',
          'Prioridade lê "Priority: Urgent"; o status lê o rótulo; o avatar lê o nome do ator.',
          "O tempo é um <time>; passe dateTime com o instante completo.",
        ],
        content: [
          "Resumo no passado, sem repetir o nome do ator: “assigned you”, “unassigned you”.",
          "Tempo relativo curto (5m, 3h, 2d); o instante completo fica no dateTime.",
        ],
        dos: [
          "Passe a prioridade só quando ela ajudar a decidir (o Linear só mostra a Urgent)",
          "Use o menu de contexto e atalhos para as ações da linha",
        ],
        donts: [
          "Não ponha botões ou links dentro da linha: a linha inteira é a opção",
          "Não use cor como único sinal de não lida",
        ],
        usage: `import { IssueList, NotificationRow } from "@vyzer/design-system/components";

<IssueList label="Notifications" selected={[selectedId]} onSelectedChange={() => {}} onOpen={open}>
  <NotificationRow
    value={notification.id}
    unread={notification.readAt === null}
    actor={{ name: "Marina Costa" }}
    identifier="ZYN-241"
    title="Sync Linear webhooks with the issue feed"
    priority={{ label: "Urgent", icon: <PriorityIcon priority="urgent" /> }}
    summary="assigned you"
    time="2d"
    dateTime={notification.createdAt}
  />
</IssueList>`,
        props: [
          { name: "value", type: "string", description: "Valor da opção (o id da notificação)." },
          {
            name: "unread",
            type: "boolean",
            default: "false",
            description: "Ponto de destaque, texto primário e ID em label-md.",
          },
          {
            name: "actor",
            type: "{ name, src?, icon? }",
            description: "Avatar lg; sem foto, o ícone (Bot para agentes).",
          },
          { name: "identifier, title", type: "string", description: "ID da issue e título." },
          {
            name: "priority, status",
            type: "{ label, icon }",
            description: "Ícone de 16 px e rótulo lido por leitores de tela.",
          },
          { name: "summary", type: "string", description: "O que houve, depois do nome do ator." },
          { name: "time, dateTime", type: "string", description: "Tempo relativo e instante." },
        ],
        decisions: [
          {
            decision: "Altura pelo conteúdo (56 px), sem h-* fixo",
            rule: "Linear ao vivo mede 55 px; o menor degrau dos tokens de linha de texto é 1 px maior (registrado em .figma/02)",
          },
          {
            decision: "ID em body-md (400) na lida e label-md (500) na não lida",
            rule: "Linear ao vivo usa 450 e 500; o DS não tem o peso 450 (registrado em .figma/02)",
          },
          {
            decision: "Ponto de não lida em bg-accent (size-2), à esquerda do avatar",
            rule: "Linear ao vivo: ponto de destaque junto ao avatar; token de acento já existente",
          },
          {
            decision: "Avatar lg (32 px) novo, com ícone de 20 px",
            rule: "Linear ao vivo: avatar de 32 px; ícone segue a regra do quadrado inscrito (≈ 0,7 × o diâmetro)",
          },
          {
            decision: "Sem botões dentro da linha; ações por atalho e menu de contexto",
            rule: "ARIA: option tem filhos apresentacionais (axe nested-interactive); a linha inteira é a opção, como a List Row",
          },
          {
            decision: "Reaproveita Issue List, useIssueOption e optionStateStyles",
            rule: "AGENTS.md regra 1: reutilizar o mecanismo de teclado e seleção existente",
          },
        ],
      }}
    />
  );
}
