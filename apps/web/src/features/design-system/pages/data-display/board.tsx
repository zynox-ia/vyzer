/**
 * Board: coluna de status e cartão de issue (Figma 1:8749, cartão 1:8859).
 */
import {
  BoardCard,
  BoardColumn,
  IconButton,
  IssueList,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@zynox/design-system/components";
import { ArrowDownUp, EyeOff, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import {
  CardChips,
  issueById,
  issuesIn,
  statusValue,
  type SampleIssue,
} from "../../kit/issue-data";
import type { ProjectStatus } from "../../kit/project-data";
import { StatesGrid } from "../../kit/states";

function Card({ issue, preview }: { issue: SampleIssue; preview?: string }) {
  return (
    <BoardCard
      value={issue.id}
      identifier={issue.id}
      title={issue.title}
      status={statusValue(issue.status)}
      assignee={issue.assignee}
      footer={`Created ${issue.date}`}
      data-preview={preview}
    >
      <CardChips issue={issue} />
    </BoardCard>
  );
}

/** Menu "…" do cabeçalho da coluna (Menu existente, Icon Button de 24 px). */
function ColumnMenu({ title }: { title: string }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton size="sm" icon={MoreHorizontal} label={`${title} column options`} />
      </MenuTrigger>
      <MenuContent variant="dropdown" align="end">
        <MenuItem icon={ArrowDownUp}>Sort cards…</MenuItem>
        <MenuItem icon={EyeOff}>Hide column</MenuItem>
      </MenuContent>
    </Menu>
  );
}

function Column({
  status,
  selected,
  onSelectedChange,
  onOpen,
}: {
  status: ProjectStatus;
  selected: string[];
  onSelectedChange: (values: string[]) => void;
  onOpen: (id: string) => void;
}) {
  const value = statusValue(status);
  const issues = issuesIn(status);
  return (
    <BoardColumn
      title={value.label}
      icon={value.icon}
      count={issues.length}
      actions={<ColumnMenu title={value.label} />}
      onAdd={() => onOpen(`new issue in ${value.label}`)}
      addLabel={`Create issue in ${value.label}`}
    >
      <IssueList
        label={`${value.label} issues`}
        selected={selected}
        onSelectedChange={onSelectedChange}
        onOpen={onOpen}
        className="gap-2"
      >
        {issues.map((issue) => (
          <Card key={issue.id} issue={issue} />
        ))}
      </IssueList>
    </BoardColumn>
  );
}

function Board({ columns }: { columns: ProjectStatus[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [last, setLast] = useState<string>();
  return (
    <div className="flex w-full flex-col gap-3">
      {/* Rola na horizontal; o teclado chega pelos cartões e botões de cada coluna. */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((status) => (
          <Column
            key={status}
            status={status}
            selected={selected}
            onSelectedChange={setSelected}
            onOpen={(id) => setLast(`Open ${id}`)}
          />
        ))}
      </div>
      <p className="text-body-sm text-secondary" aria-live="polite">
        {selected.length} selected{last ? ` · ${last}` : ""}
      </p>
    </div>
  );
}

function StaticCard({
  id,
  selected = false,
  preview,
}: {
  id: string;
  selected?: boolean;
  preview?: string;
}) {
  return (
    <IssueList
      label={`Card ${id}`}
      selected={selected ? [id] : []}
      onSelectedChange={() => {}}
      className="w-full"
    >
      <Card issue={issueById(id)} preview={preview} />
    </IssueList>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Board",
        description:
          "Coluna de status com cartões de issue (Figma 1:8749). O cartão (1:8859) mostra ID, responsável, status, título, chips e a data; a coluna tem ícone, nome, contagem, menu e +. Os cartões de uma coluna são uma Issue List: mesmo teclado e mesma seleção da lista.",
        whenToUse: [
          "Ver issues por status (ou outro agrupamento) lado a lado",
          "Acompanhar o fluxo de um ciclo ou projeto",
        ],
        whenNotToUse: [
          "Muitas issues para ler em sequência: use List Row",
          "Comparar propriedades: use Table",
        ],
        playground: {
          preview: <Board columns={["in-progress", "blocked"]} />,
          controls: (
            <p className="text-body-sm text-secondary">
              Tab entra em cada coluna; ↑ ↓ andam pelos cartões, Enter abre, Espaço marca. O menu …
              e o + ficam no cabeçalho. Arrastar cartões fica para a tela de board.
            </p>
          ),
        },
        showcase: <Board columns={["blocked", "verifying", "in-progress", "backlog"]} />,
        states: (
          <StatesGrid
            states={[
              { label: "padrão", node: <StaticCard id="ZYN-35" /> },
              { label: "hover", node: <StaticCard id="ZYN-35" preview="hover" /> },
              { label: "focus-visible", node: <StaticCard id="ZYN-35" preview="focus" /> },
              { label: "selecionado", node: <StaticCard id="ZYN-35" selected /> },
            ]}
          />
        ),
        themes: () => (
          <div className="flex flex-col gap-2">
            <StaticCard id="ZYN-41" />
            <StaticCard id="ZYN-33" selected />
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Coluna de 340 px sem fundo próprio: cabeçalho de h-row com ícone de 16 px, nome em 13
            px/500, contagem e, à direita, os Icon Buttons de 24 px (… e +); cartões a 8 px um do
            outro. Cartão em bg-surface com hairline border-default, raio 10 e 12 px de respiro: ID
            em mono de 12 px e o avatar de 20 px no topo; status de 16 px e título de 13 px/500 em
            até duas linhas; chips outline de 24 px (a prioridade só com ícone vem primeiro); rodapé
            de 12 px em text-secondary.
          </p>
        ),
        keyboard: [
          "Tab entra na coluna pelo cartão ativo e segue para a próxima coluna.",
          "↑ ↓ Home End movem entre os cartões da coluna; Enter abre; Espaço marca; Esc limpa.",
          "Os botões … e + do cabeçalho são alcançados pelo Tab antes dos cartões.",
        ],
        accessibility: [
          'Coluna é role="group" nomeado pelo título; os cartões são opções (role="option", aria-selected) de uma Issue List.',
          "Status do cartão lido pelo rótulo; prioridade só com ícone traz label no chip.",
          "Hover e seleção no fundo; foco pela linha de 1 px de campo.",
        ],
        content: [
          "Título em até duas linhas; o resto na issue.",
          'Rodapé curto ("Created Sep 13").',
        ],
        dos: ["Mantenha a mesma ordem de chips da lista", "Dê nome aos botões do cabeçalho"],
        donts: [
          "Não ponha botões dentro do cartão: o cartão inteiro é a opção",
          "Não use sombra no cartão (só overlays têm sombra)",
        ],
        usage: `import { BoardCard, BoardColumn, IssueList } from "@zynox/design-system/components";

<BoardColumn title="In Progress" icon={<StatusIcon type="started" />} count={3} onAdd={createIssue}>
  <IssueList label="In Progress issues" selected={selected} onSelectedChange={setSelected} onOpen={openIssue} className="gap-2">
    <BoardCard
      value="ZYN-33"
      identifier="ZYN-33"
      title="Creation composer for new issues"
      status={{ label: "In Progress", icon: <StatusIcon type="started" /> }}
      assignee={{ name: "André Júnio" }}
      footer="Created Sep 10"
    >
      <Chip icon={<PriorityIcon priority="high" />} label="High priority" />
    </BoardCard>
  </IssueList>
</BoardColumn>`,
        props: [
          { name: "BoardColumn.title", type: "string", description: "Nome da coluna." },
          { name: "BoardColumn.icon", type: "ReactNode", description: "Ícone de 16 px." },
          { name: "BoardColumn.count", type: "number", description: "Contagem (Counter)." },
          {
            name: "BoardColumn.actions",
            type: "ReactNode",
            description: "Ações antes do + (Menu com Icon Button).",
          },
          {
            name: "BoardColumn.onAdd / addLabel",
            type: "() => void / string",
            description: "Botão + e o nome dele.",
          },
          { name: "BoardCard.value", type: "string", description: "Valor da opção (o ID)." },
          {
            name: "BoardCard.identifier, title",
            type: "string",
            description: "ID em mono e título (até duas linhas).",
          },
          {
            name: "BoardCard.status",
            type: "{ label, icon }",
            description: "Ícone antes do título; rótulo lido.",
          },
          { name: "BoardCard.assignee", type: "{ name, src? }", description: "Avatar de 20 px." },
          { name: "BoardCard.children", type: "ReactNode", description: "Chips outline." },
          { name: "BoardCard.footer", type: "ReactNode", description: "Rodapé secundário." },
        ],
        decisions: [
          {
            decision: "Coluna sem fundo (o Figma escurece com um degradê)",
            rule: "ADR-0013 (contenção); cartões em bg-surface com hairline já separam",
          },
          {
            decision: "Cartão com border-default, raio 10 e sem sombra",
            rule: "Papel de contêiner da escala de raios; sombra só em overlays (ADR-0013)",
          },
          {
            decision: "Cartão como opção de Issue List",
            rule: "Reuso do teclado e da seleção da lista (spec VYZ-34)",
          },
          {
            decision: "Coluna de 340 px, cartões a 8 px",
            rule: "Figma 1:8834 (340) e 1:8858 (8 px entre cartões)",
          },
        ],
      }}
    />
  );
}
