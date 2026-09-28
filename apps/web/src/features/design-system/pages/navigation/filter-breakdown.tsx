/**
 * Filter Breakdown (Figma 18:1130, painel da vista Zynox › Active issues): contagem de issues por
 * responsável, label, prioridade e projeto; clicar numa linha filtra por aquele valor.
 */
import { FilterBreakdown, type FilterValue } from "@vyzer/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { BREAKDOWN_GROUPS, describeFilters } from "../../kit/filter-data";

function Example({
  defaultGroup = "project",
  initial = {},
  showActive = false,
}: {
  defaultGroup?: string;
  initial?: FilterValue;
  showActive?: boolean;
}) {
  const [value, setValue] = useState<FilterValue>(initial);
  const active = describeFilters(value);
  return (
    <div className="flex w-full max-w-109 flex-col gap-3">
      <FilterBreakdown
        label="Breakdown"
        groups={BREAKDOWN_GROUPS}
        value={value}
        onValueChange={setValue}
        defaultGroup={defaultGroup}
      />
      {showActive && (
        <p aria-live="polite" className="text-body-sm text-secondary">
          {active.length > 0 ? active.join(" · ") : "No filters"}
        </p>
      )}
    </div>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Filter Breakdown",
        description:
          "Painel da vista (Figma 18:1130): abas em pílula com a contagem de itens por responsável, label, prioridade e projeto. Clicar numa linha liga ou desliga o filtro por aquele valor.",
        whenToUse: [
          "Mostrar a distribuição dos itens de uma vista e filtrar com um clique",
          "Painel lateral de uma lista de issues",
        ],
        whenNotToUse: [
          "Montar filtros compostos ou por categorias sem contagem: use Filter Menu",
          "Gráficos de distribuição ao longo do tempo: Data Visualization",
        ],
        playground: {
          preview: <Example showActive />,
          controls: (
            <p className="text-body-sm text-secondary">
              Troque de aba e clique nas linhas: cada clique liga ou desliga o filtro por aquele
              valor (o mesmo formato de valor do Filter Menu).
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-wrap items-start gap-8">
            <Example />
            <Example defaultGroup="priority" initial={{ priority: ["high"] }} />
          </div>
        ),
        states: null,
        statesNote:
          'Linha: hover como camada de fundo (bg-hover); ligada, bg-selected e aria-pressed. Foco por teclado: linha de 1 px. Aba ativa: camada de pressionado e texto primário. Aba sem itens: "No issues".',
        themes: () => <Example />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Painel da tela (não é overlay): raio 10, hairline border-subtle, bg-panel e 12 px de
            folga, sem sombra. Abas em pílula de 28 px dividindo a largura, 8 px acima da lista.
            Linhas de 44 px (h-row) com 1 px entre elas, 10 px nas laterais e raio 8: ícone de 16, 8
            px até o nome de 13 px e a contagem à direita em text-secondary.
          </p>
        ),
        keyboard: [
          "Tab foca a aba ativa; ← → trocam de aba.",
          "Tab de novo entra na lista; Enter ou Espaço ligam e desligam a linha.",
        ],
        accessibility: [
          'Radix Tabs: role="tablist", "tab" e "tabpanel"; a lista de abas tem nome.',
          "Linhas são botões com aria-pressed; o estado não depende só da cor do fundo.",
          "Contagem em texto, com números tabulares.",
        ],
        content: [
          "Abas no plural (Assignees, Projects)",
          'Valor ausente com "No …" (No assignee, No priority)',
        ],
        dos: ["Ordene as linhas por contagem ou pela ordem natural do valor"],
        donts: ["Não esconda a contagem zero de valores que existem na vista"],
        usage: `import { FilterBreakdown, type FilterValue } from "@vyzer/design-system/components";

const [filters, setFilters] = useState<FilterValue>({});

<FilterBreakdown
  label="Breakdown"
  groups={[{ value: "project", label: "Projects", items: [{ value: "aname", label: "Aname CRM", icon, count: 7 }] }]}
  value={filters}
  onValueChange={setFilters}
/>`,
        props: [
          { name: "label", type: "string", description: "Nome acessível das abas." },
          {
            name: "groups",
            type: "BreakdownGroup[]",
            description: "{ value, label, items: { value, label, icon?, count }[] } por aba.",
          },
          {
            name: "value / onValueChange",
            type: "Record<string, string[]>",
            description: "Filtros ligados por categoria (mesmo formato do Filter Menu).",
          },
          { name: "defaultGroup", type: "string", description: "Aba aberta de início." },
          {
            name: "group / onGroupChange",
            type: "string",
            description:
              "Aba controlada: numa tela, guarde-a nos search params (AGENTS.md, regra 8).",
          },
          {
            name: "emptyText",
            type: "string",
            default: '"No issues"',
            description: "Texto da aba sem itens.",
          },
        ],
        decisions: [
          {
            decision: "Painel da tela: bg-panel, hairline border-subtle, raio 10, 12 px de folga",
            rule: "Figma 18:1130 (#1a1a1b, #222325, r10, p 12)",
          },
          {
            decision: "Sem a sombra de relevo do Figma",
            rule: "ADR-0013: sombra só em overlays (divergência já registrada)",
          },
          {
            decision: "Abas em pílula de 28 px que dividem a largura (Tabs pills)",
            rule: "Figma 18:1132 (h 28, px 12, 12 px/500); reuso das Tabs",
          },
          {
            decision: "Linhas de 44 px (h-row) no lugar de 42",
            rule: "ADR-0013 (linhas de lista de 44 px; 36 no compacto); grid de 4 (skill §1)",
          },
          {
            decision: "10 px nas laterais, raio 8, 1 px entre linhas",
            rule: "Figma 18:1166 (px 10, r8, gap 1)",
          },
          {
            decision: "Ícone de 16 com 8 px até o nome de 13 px; contagem em text-secondary",
            rule: "Figma 18:1167 (16, gap 8, 13 Regular, #98999c)",
          },
          {
            decision: "Clicar na linha liga e desliga o filtro (aria-pressed, bg-selected)",
            rule: "§7 Jakob (comportamento do Linear); §12 selected como camada",
          },
          {
            decision: "Hover como camada de fundo, somando com a seleção",
            rule: "Pedido do responsável (hover só no fundo); skill §12",
          },
          {
            decision:
              "Painel com linhas fora da ordem de Tab (o foco vai da aba direto às linhas); vazio, focável com foco visível",
            rule: "WAI-ARIA Tabs (tabpanel sem conteúdo focável recebe tabindex 0); §12 foco visível",
          },
        ],
      }}
    />
  );
}
