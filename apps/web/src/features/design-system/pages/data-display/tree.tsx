/**
 * Tree: sub-issues aninhadas com linhas-guia (Figma 40:687, a lista do Linear com sub-issues
 * aninhadas; a linha é a da lista de issues de 1:7477).
 */
import { IssueRowContent, Tree } from "@zynox/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { NESTED_ISSUES, parentValues, rowProps, type SubIssue } from "../../kit/issue-data";
import { StatesStack } from "../../kit/states";

const renderIssue = (issue: SubIssue) => <IssueRowContent {...rowProps(issue)} />;

/** Todos os pais: a árvore começa aberta, como no Linear. */
const ALL_OPEN = parentValues(NESTED_ISSUES);

function LiveTree() {
  const [expanded, setExpanded] = useState(ALL_OPEN);
  const [selected, setSelected] = useState<string[]>([]);
  const [last, setLast] = useState<string>();
  return (
    <div className="flex w-full flex-col gap-3">
      <Tree
        label="Sub-issues"
        items={NESTED_ISSUES}
        renderItem={renderIssue}
        expanded={expanded}
        onExpandedChange={setExpanded}
        selected={selected}
        onSelectedChange={setSelected}
        onOpen={(id) => setLast(`Open ${id}`)}
      />
      <p className="text-body-sm text-secondary" aria-live="polite">
        {selected.length} selected{last ? ` · ${last}` : ""}
      </p>
    </div>
  );
}

/** Árvore estática num estado. */
function StateTree({
  expanded = ALL_OPEN,
  selected = [],
}: {
  expanded?: string[];
  selected?: string[];
}) {
  return (
    <Tree
      label="Sub-issues"
      items={NESTED_ISSUES}
      renderItem={renderIssue}
      expanded={expanded}
      selected={selected}
      onSelectedChange={() => {}}
    />
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Tree",
        description:
          "Linhas aninhadas de sub-issues, ligadas por linhas-guia como no Linear. Cada nível recua 24 px; a vertical desce do pai e cada filho sai dela por um ramo curto. Sem seta: começa aberta e recolhe pelo teclado. A linha é a mesma da List Row (IssueRowContent).",
        whenToUse: [
          "Sub-issues de uma issue, com mais de um nível",
          "Qualquer hierarquia em que o pai resume os filhos",
        ],
        whenNotToUse: [
          "Lista plana: use List Row",
          "Agrupar por um valor (status, responsável): use Group Header",
        ],
        playground: {
          preview: <LiveTree />,
          controls: (
            <p className="text-body-sm text-secondary">
              → expande ou desce para o primeiro filho; ← recolhe ou sobe para o pai; ↑ ↓ andam
              pelas linhas visíveis; Enter abre; Espaço marca. Com o ponteiro, o clique abre (como
              no Linear, não recolhe).
            </p>
          ),
        },
        showcase: <StateTree />,
        states: (
          <StatesStack
            states={[
              { label: "aberta (padrão)", node: <StateTree /> },
              { label: "VYZ-12 recolhido (← no pai)", node: <StateTree expanded={["VYZ-1"]} /> },
              { label: "tudo recolhido", node: <StateTree expanded={[]} /> },
              {
                label: "selecionado (pai e um filho)",
                node: <StateTree selected={["VYZ-12", "VYZ-30"]} />,
              },
            ]}
          />
        ),
        themes: () => <StateTree selected={["VYZ-30"]} />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Linha da List Row (h-row, raio 8, px-cell-x) com uma coluna de 16 px por ancestral (mais
            o gap de 8, 24 px por nível) antes da prioridade. Na coluna de cada ancestral, uma
            vertical de 1 px em border-default passa no centro do ícone de prioridade dele e
            atravessa a linha enquanto ele tiver filhos abaixo. Na coluna do pai, a vertical desce
            até o ramo (curva curta e diagonal até o centro da linha, parando 6 px antes da
            prioridade do filho); no último irmão, ela para no ramo e fecha o L. O primeiro filho
            começa 4 px acima, no pé da linha do pai. Hover e seleção como camadas; foco pela linha
            de campo.
          </p>
        ),
        keyboard: [
          "Tab entra na árvore pelo item ativo (um só alvo de Tab).",
          "↑ ↓ Home End movem pelas linhas visíveis.",
          "→ expande; se já aberto, vai ao primeiro filho. ← recolhe; se fechado, vai ao pai.",
          "Enter abre; Espaço marca ou desmarca; Esc limpa a seleção.",
          "Com o ponteiro: clique abre (o chip x/y também); Ctrl, ⌘ ou Shift + clique marcam. Sem seta, o ponteiro não recolhe, como no Linear.",
        ],
        accessibility: [
          'role="tree" com nome; itens role="treeitem" com aria-level, aria-setsize, aria-posinset e aria-expanded (só nos que têm filhos).',
          "Árvore plana (APG): os filhos visíveis vêm depois do pai, sem role=group aninhado.",
          "Linhas-guia decorativas (aria-hidden): a hierarquia chega pelo aria-level.",
          "aria-selected em todos os itens; aria-multiselectable quando há seleção.",
        ],
        content: [
          "Títulos como na lista; o pai resume o conjunto.",
          "No pai, o chip x/y conta as sub-issues concluídas.",
        ],
        dos: ["Comece com tudo aberto, como no Linear", "Mantenha a mesma linha da lista"],
        donts: [
          "Não passe de três níveis",
          "Não desenhe as linhas com imagem: elas saem da estrutura",
        ],
        usage: `import { IssueRowContent, Tree } from "@zynox/design-system/components";

<Tree
  label="Sub-issues"
  items={subIssues}              // { value, children?, ... }
  renderItem={(issue) => <IssueRowContent {...rowOf(issue)} />}
  expanded={expanded}            // de início, todos os pais (aberta, como no Linear)
  onExpandedChange={setExpanded}
  selected={selected}
  onSelectedChange={setSelected}
  onOpen={openIssue}
/>`,
        props: [
          { name: "label", type: "string", description: "Nome acessível da árvore." },
          {
            name: "items",
            type: "T[] (T = { value, children?: T[] })",
            description: "Nós, com filhos do mesmo tipo.",
          },
          { name: "renderItem", type: "(item: T) => ReactNode", description: "Conteúdo da linha." },
          {
            name: "expanded, defaultExpanded, onExpandedChange",
            type: "string[]",
            description: "Itens abertos (controlado ou não). Passe todos os pais para abrir tudo.",
          },
          {
            name: "selected, onSelectedChange",
            type: "string[]",
            description: "Seleção; com onSelectedChange, multisseleção.",
          },
          { name: "onOpen", type: "(value) => void", description: "Abrir: clique ou Enter." },
        ],
        decisions: [
          {
            decision: "Linhas-guia de 1 px em border-default, no centro do ícone de prioridade",
            rule: "Linear (Figma 40:687): a hairline dos chips; recuo de 24 px (16 + gap de 8)",
          },
          {
            decision: "Ramo em curva e diagonal (SVG inline), sem raio",
            rule: "Curva do Linear; a cor sai do token pela currentColor",
          },
          {
            decision: "Sem seta; começa aberta e recolhe só pelo teclado (→ ←)",
            rule: "Linear (as sub-issues ficam abertas); teclado da árvore do APG",
          },
          {
            decision: "Árvore plana com aria-level no lugar de grupos aninhados",
            rule: "WAI-ARIA APG (tree); o foco fica só na linha, sem contornar os filhos",
          },
          {
            decision: "Mesma linha da List Row (IssueRowContent)",
            rule: "Reuso; o chip x/y (Chip com ProgressRing) abre a issue, como no Linear",
          },
        ],
      }}
    />
  );
}
