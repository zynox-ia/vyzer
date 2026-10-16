/**
 * Group Header: cabeçalho recolhível de um grupo da lista de issues (Figma 1:6877 em 1:7477).
 */
import { IssueList, IssueRow, ListGroup } from "@zynox/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { GROUPS, issuesIn, rowProps, statusValue } from "../../kit/issue-data";
import { StatesStack } from "../../kit/states";

/** Lista agrupada por status, como a tela de issues. */
function GroupedList({ groups = GROUPS }: { groups?: typeof GROUPS }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [last, setLast] = useState<string>();
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2">
        {groups.map((status) => {
          const value = statusValue(status);
          const issues = issuesIn(status);
          return (
            <ListGroup
              key={status}
              title={value.label}
              icon={value.icon}
              count={issues.length}
              onAdd={() => setLast(`New issue in ${value.label}`)}
              addLabel={`Create issue in ${value.label}`}
            >
              <IssueList
                label={`${value.label} issues`}
                selected={selected}
                onSelectedChange={setSelected}
                onOpen={(id) => setLast(`Open ${id}`)}
              >
                {issues.map((issue) => (
                  <IssueRow key={issue.id} value={issue.id} {...rowProps(issue)} />
                ))}
              </IssueList>
            </ListGroup>
          );
        })}
      </div>
      {last && (
        <p className="text-body-sm text-secondary" aria-live="polite">
          {last}
        </p>
      )}
    </div>
  );
}

function Header({ open, add = true }: { open: boolean; add?: boolean }) {
  const value = statusValue("in-progress");
  return (
    <ListGroup
      title={value.label}
      icon={value.icon}
      count={issuesIn("in-progress").length}
      onAdd={add ? () => {} : undefined}
      open={open}
    >
      <p className="px-3 py-2 text-body-sm text-secondary">Conteúdo do grupo</p>
    </ListGroup>
  );
}

function usePlayground() {
  const [add, setAdd] = useState<"yes" | "no">("yes");
  const [open, setOpen] = useState(true);
  const value = statusValue("blocked");
  const issues = issuesIn("blocked");
  return {
    preview: (
      <div className="w-full">
        <ListGroup
          title={value.label}
          icon={value.icon}
          count={issues.length}
          open={open}
          onOpenChange={setOpen}
          onAdd={add === "yes" ? () => {} : undefined}
        >
          <IssueList label="Blocked issues">
            {issues.map((issue) => (
              <IssueRow key={issue.id} value={issue.id} {...rowProps(issue)} />
            ))}
          </IssueList>
        </ListGroup>
      </div>
    ),
    controls: (
      <>
        <Field label="aberto">
          <Segmented
            label="aberto"
            value={open ? "yes" : "no"}
            onChange={(v) => setOpen(v === "yes")}
            options={[
              { value: "yes", label: "sim" },
              { value: "no", label: "não" },
            ]}
          />
        </Field>
        <Field label="botão +">
          <Segmented
            label="botão +"
            value={add}
            onChange={setAdd}
            options={[
              { value: "yes", label: "sim" },
              { value: "no", label: "não" },
            ]}
          />
        </Field>
      </>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Group Header",
        description:
          "Cabeçalho de um grupo da lista (Figma 1:6877): recolhe e expande o grupo, mostra o ícone, o nome e a contagem, e o botão + cria um item no grupo. Radix Collapsible.",
        whenToUse: [
          "Agrupar uma lista por status, prioridade, responsável ou projeto",
          "Deixar recolher grupos longos ou já resolvidos",
        ],
        whenNotToUse: [
          "Seção de página ou de formulário: use um título",
          "Hierarquia de itens (pai e filhos): use Tree",
        ],
        playground,
        showcase: <GroupedList />,
        states: (
          <StatesStack
            states={[
              { label: "aberto", node: <Header open /> },
              { label: "recolhido", node: <Header open={false} /> },
              { label: "sem o botão +", node: <Header open={false} add={false} /> },
            ]}
          />
        ),
        themes: () => <GroupedList groups={["blocked", "verifying"]} />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Faixa de 36 px em bg-surface com raio 8. O gatilho ocupa a faixa: seta de 12 px (gira
            90° aberto), ícone de 16 px, nome em 13 px/500 e a contagem (Counter) em text-secondary.
            À direita, o Icon Button de 24 px com +. Hover só no fundo; foco pela linha de campo no
            gatilho. 1 px entre a faixa e as linhas.
          </p>
        ),
        keyboard: [
          "Tab foca o gatilho; Enter ou Espaço recolhem e expandem.",
          "Tab segue para o botão + e depois para a lista do grupo.",
        ],
        accessibility: [
          "Radix Collapsible: o gatilho é um botão com aria-expanded e aria-controls.",
          'O nome do gatilho inclui a contagem ("In Progress 3"); o + tem nome próprio ("Create issue in In Progress").',
          "Recolhido, o conteúdo sai da página (e do leitor de tela).",
        ],
        content: ["Nome do valor do agrupamento, sem verbo; a contagem é o total do grupo."],
        dos: ["Mantenha a mesma ordem de grupos em todas as vistas", "Dê nome ao botão +"],
        donts: ["Não esconda a contagem", "Não aninhe grupos dentro de grupos"],
        usage: `import { IssueList, ListGroup } from "@zynox/design-system/components";

<ListGroup
  title="In Progress"
  icon={<StatusIcon type="started" />}
  count={3}
  onAdd={createIssue}
  addLabel="Create issue in In Progress"
>
  <IssueList label="In Progress issues">…</IssueList>
</ListGroup>`,
        props: [
          { name: "title", type: "string", description: "Nome do grupo." },
          { name: "icon", type: "ReactNode", description: "Ícone de 16 px." },
          { name: "count", type: "number", description: "Contagem (Counter)." },
          { name: "onAdd", type: "() => void", description: "Mostra o botão +." },
          {
            name: "addLabel",
            type: "string",
            default: '"Add to " + title',
            description: "Nome do botão +.",
          },
          {
            name: "open, defaultOpen, onOpenChange",
            type: "Radix Collapsible",
            default: "defaultOpen true",
            description: "Estado aberto.",
          },
        ],
        decisions: [
          {
            decision: "Faixa de 36 px em bg-surface, raio 8, sem o degradê por status",
            rule: "Figma 1:6877 (36 px, r8); a cor do status fica no ícone (ADR-0013: contenção)",
          },
          {
            decision: "Contagem com o Counter existente (text-secondary, tabular)",
            rule: "Reuso; Figma 1:6892",
          },
          {
            decision: "+ como Icon Button ghost de 24 px",
            rule: "Figma: ações de linha e coluna em 24 px (inventário C)",
          },
          { decision: "Seta gira 90° em duration-fast", rule: "§8 micro-interação" },
        ],
      }}
    />
  );
}
