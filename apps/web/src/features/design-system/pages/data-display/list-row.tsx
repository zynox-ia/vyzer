/**
 * List Row: a linha de issue dentro da Issue List (Figma 1:7477, lista agrupada; 27:17223, Inbox).
 */
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  IssueList,
  IssueRow,
  MenuItem,
  MenuSeparator,
} from "@vyzer/design-system/components";
import { CircleDashed, Link2, SignalHigh, UserRound } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { ISSUES, issueById, rowProps } from "../../kit/issue-data";
import { StatesStack } from "../../kit/states";

const SAMPLE = ["ZYN-41", "ZYN-33", "ZYN-29"].map(issueById);

type Density = "comfortable" | "compact";

/** Lista com seleção, abrir e menu de contexto em cada linha. */
function LiveList({ density, chips }: { density: Density; chips: boolean }) {
  const [selected, setSelected] = useState<string[]>(["ZYN-33"]);
  const [last, setLast] = useState<string>();
  return (
    <div data-density={density} className="flex w-full flex-col gap-3">
      <IssueList
        label="Issues"
        selected={selected}
        onSelectedChange={setSelected}
        onOpen={(id) => setLast(`Open ${id}`)}
      >
        {SAMPLE.map((issue) => (
          <ContextMenu key={issue.id}>
            <ContextMenuTrigger asChild>
              <IssueRow
                value={issue.id}
                {...rowProps(issue)}
                chips={chips ? rowProps(issue).chips : undefined}
              />
            </ContextMenuTrigger>
            <ContextMenuContent>
              <MenuItem icon={CircleDashed} shortcut={["S"]} onSelect={() => setLast("Status")}>
                Change status…
              </MenuItem>
              <MenuItem icon={UserRound} shortcut={["A"]} onSelect={() => setLast("Assign")}>
                Assign to…
              </MenuItem>
              <MenuItem icon={SignalHigh} shortcut={["P"]} onSelect={() => setLast("Priority")}>
                Change priority…
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={Link2} onSelect={() => setLast("Copy link")}>
                Copy link
              </MenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </IssueList>
      <p className="text-body-sm text-secondary" aria-live="polite">
        {selected.length} selected{last ? ` · ${last}` : ""}
      </p>
    </div>
  );
}

function usePlayground() {
  const [density, setDensity] = useState<Density>("comfortable");
  const [chips, setChips] = useState<"yes" | "no">("yes");
  return {
    preview: <LiveList density={density} chips={chips === "yes"} />,
    controls: (
      <>
        <Field label="densidade">
          <Segmented
            label="densidade"
            value={density}
            onChange={setDensity}
            options={[
              { value: "comfortable", label: "padrão" },
              { value: "compact", label: "compacta" },
            ]}
          />
        </Field>
        <Field label="chips">
          <Segmented
            label="chips"
            value={chips}
            onChange={setChips}
            options={[
              { value: "yes", label: "sim" },
              { value: "no", label: "não" },
            ]}
          />
        </Field>
        <p className="self-end text-body-sm text-secondary">
          ↑ ↓ movem, Enter abre, Espaço marca, Esc limpa; clique direito ou Shift+F10 abrem o menu.
        </p>
      </>
    ),
  };
}

/** Uma linha estática dentro de uma lista própria (a linha precisa da Issue List). */
function StaticRow({
  id,
  selected = false,
  preview,
  noAssignee = false,
}: {
  id: string;
  selected?: boolean;
  preview?: string;
  noAssignee?: boolean;
}) {
  const issue = issueById(id);
  return (
    <IssueList label={`Issue ${id}`} selected={selected ? [id] : []} onSelectedChange={() => {}}>
      <IssueRow
        value={id}
        {...rowProps(issue)}
        assignee={noAssignee ? undefined : issue.assignee}
        data-preview={preview}
      />
    </IssueList>
  );
}

function DensityList({ density }: { density: Density }) {
  return (
    <div data-density={density} className="flex flex-col gap-2">
      <span className="text-caption text-secondary">
        {density === "comfortable" ? "padrão · 44 px" : "compacta · 36 px"}
      </span>
      <IssueList label={`Issues, ${density === "comfortable" ? "padrão" : "compacta"}`}>
        {ISSUES.slice(0, 4).map((issue) => (
          <IssueRow key={issue.id} value={issue.id} {...rowProps(issue)} />
        ))}
      </IssueList>
    </div>
  );
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "List Row",
        description:
          "Linha de issue da lista (Figma 1:7477 e o Inbox, 27:17223): prioridade, ID, status, título, chips, responsável e data. Vive dentro de uma Issue List, que dá o teclado e a seleção. 44 px, ou 36 px na densidade compacta.",
        whenToUse: [
          "Listas de issues: vistas, backlog, sub-issues de uma issue, Inbox",
          "Quando cada linha abre um item e a lista aceita seleção em lote",
        ],
        whenNotToUse: [
          "Dados com colunas comparáveis (projetos): use Table",
          "Issues por status lado a lado: use Board",
          "Hierarquia com expandir e recolher: use Tree",
        ],
        playground,
        showcase: (
          <div className="flex flex-col gap-6">
            <DensityList density="comfortable" />
            <DensityList density="compact" />
          </div>
        ),
        states: (
          <StatesStack
            states={[
              { label: "padrão", node: <StaticRow id="ZYN-35" /> },
              { label: "hover", node: <StaticRow id="ZYN-35" preview="hover" /> },
              { label: "focus-visible", node: <StaticRow id="ZYN-35" preview="focus" /> },
              { label: "selecionada", node: <StaticRow id="ZYN-35" selected /> },
              {
                label: "selecionada + hover",
                node: <StaticRow id="ZYN-35" selected preview="hover" />,
              },
              { label: "sem responsável", node: <StaticRow id="ZYN-29" noAssignee /> },
            ]}
          />
        ),
        themes: () => (
          <IssueList label="Issues" selected={["ZYN-33"]} onSelectedChange={() => {}}>
            {SAMPLE.map((issue) => (
              <IssueRow key={issue.id} value={issue.id} {...rowProps(issue)} />
            ))}
          </IssueList>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Linha de h-row (44 px; 36 com data-density=&quot;compact&quot; num contêiner), raio 8,
            px-cell-x (12 px; 8 no compacto) e 8 px entre as células: prioridade (16 px), ID em mono
            de 12 px, status (16 px), título de 13 px/500 que ocupa o espaço e trunca, chips outline
            de 24 px alinhados à direita (o que não cabe some inteiro), responsável de 20 px e data
            de 12 px em text-secondary.
          </p>
        ),
        keyboard: [
          "Tab entra na lista pela linha ativa (um só alvo de Tab); ↑ ↓ Home End movem o foco.",
          "Enter abre a issue; Espaço marca ou desmarca; Esc limpa a seleção.",
          "Clique abre; Ctrl, ⌘ ou Shift + clique marcam.",
          "Com Context Menu: Shift+F10 ou a tecla de menu abrem o menu da linha focada.",
        ],
        accessibility: [
          'Issue List é role="listbox" com nome (label) e aria-multiselectable quando há seleção; cada linha é role="option" com aria-selected.',
          'Prioridade e status leem o rótulo ("Priority: Urgent", "In Progress"); chips sem texto trazem label; sem responsável, o ícone diz "No assignee".',
          "Seleção pelo fundo (bg-selected) e pelo estado anunciado; o foco é a linha de 1 px, visível sobre a seleção.",
        ],
        content: [
          "Título curto, no imperativo ou no nome da tarefa; o ID vem do time (ZYN-41).",
          "Data curta (Sep 13); a completa fica na issue.",
        ],
        dos: [
          "Use o mesmo IssueValue (ListOption) dos seletores de status e prioridade",
          "Deixe a densidade no contêiner (data-density), não na linha",
        ],
        donts: [
          "Não ponha botões ou links dentro da linha: a linha inteira é a opção",
          "Não use cor como único sinal de estado",
        ],
        usage: `import { IssueList, IssueRow } from "@vyzer/design-system/components";

<IssueList label="In Progress issues" selected={selected} onSelectedChange={setSelected} onOpen={openIssue}>
  <IssueRow
    value="ZYN-33"
    identifier="ZYN-33"
    title="Creation composer for new issues"
    priority={{ label: "High", icon: <PriorityIcon priority="high" /> }}
    status={{ label: "In Progress", icon: <StatusIcon type="started" /> }}
    chips={<Chip icon={<ProjectIcon value={plugga} />}>Plugga OS</Chip>}
    assignee={{ name: "André Júnio" }}
    date="Sep 10"
  />
</IssueList>`,
        props: [
          { name: "IssueList.label", type: "string", description: "Nome acessível da lista." },
          {
            name: "IssueList.selected",
            type: "string[]",
            default: "[]",
            description: "Valores marcados.",
          },
          {
            name: "IssueList.onSelectedChange",
            type: "(values) => void",
            description: "Liga a multisseleção (Espaço, Ctrl/⌘/Shift + clique, Esc).",
          },
          {
            name: "IssueList.onOpen",
            type: "(value) => void",
            description: "Abrir: clique ou Enter.",
          },
          { name: "value", type: "string", description: "Valor da linha (o ID)." },
          { name: "identifier", type: "string", description: "ID visível, em mono." },
          { name: "title", type: "string", description: "Título; trunca." },
          {
            name: "priority, status",
            type: "{ label, icon }",
            description: "Ícone de 16 px e rótulo lido por leitores de tela (ListOption serve).",
          },
          { name: "chips", type: "ReactNode", description: "Chips outline à direita." },
          {
            name: "assignee",
            type: "{ name, src? }",
            description: 'Avatar de 20 px; sem ele, o ícone "No assignee".',
          },
          { name: "date", type: "string", description: "Data curta à direita." },
        ],
        decisions: [
          {
            decision: "Linha de h-row com raio 8 e px-cell-x; 36 px e 8 px no compacto",
            rule: "Tokens de densidade (skill §13: muda espaço, não fonte); Figma 1:6898 (44 px)",
          },
          {
            decision: "Listbox com roving tabindex: um alvo de Tab e setas entre as linhas",
            rule: "WAI-ARIA APG (listbox multisseleção); spec VYZ-34",
          },
          {
            decision: "ID em mono de 12 px (text-code); título em 13 px/500",
            rule: "Foundations → Typography (identificadores); Figma 1:6911",
          },
          {
            decision:
              "Chips que não cabem somem inteiros (quebra escondida), sem cortar pela metade",
            rule: "Linear (Jakob, §7); o título mantém ao menos 128 px",
          },
          {
            decision: "Responsável com Avatar md (20 px) no lugar dos 18 px do Figma",
            rule: "Reuso do Avatar existente (sem tamanho novo)",
          },
          {
            decision: "Hover e seleção como camadas; foco pela linha de campo",
            rule: "ADR-0013; §12 estados",
          },
        ],
      }}
    />
  );
}
