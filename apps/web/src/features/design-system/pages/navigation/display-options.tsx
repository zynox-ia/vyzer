/**
 * Display Options (Figma 18:722 "List" e 18:930 "Board", vista Zynox › Active issues). Os
 * painéis abertos da página são estáticos (DisplayOptionsPanel); o popover real está no
 * playground.
 */
import {
  Button,
  DisplayOptions,
  DisplayOptionsFooter,
  DisplayOptionsHeading,
  DisplayOptionsPanel,
  DisplayOptionsRow,
  DisplayOptionsSection,
  DisplayProperties,
  IconButton,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpWideNarrow,
  LayoutGrid,
  SlidersHorizontal,
  TextAlignJustify,
} from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import {
  BOARD_PROPERTIES,
  DEFAULT_PROPERTIES,
  GROUPINGS,
  LIST_PROPERTIES,
  NESTED_SUB_ISSUES,
  ORDERINGS,
} from "../../kit/filter-data";

type Layout = "list" | "board";

type ViewState = {
  layout: Layout;
  grouping: string;
  subGrouping: string;
  groupsReversed: boolean;
  ordering: string;
  descending: boolean;
  completedByRecency: boolean;
  showSubIssues: boolean;
  nestedSubIssues: string;
  showEmpty: boolean;
  properties: string[];
};

/** Valores do Figma 18:722 (Status, No grouping, Priority, sub-issues ligado). */
const DEFAULTS: ViewState = {
  layout: "list",
  grouping: "status",
  subGrouping: "no-grouping",
  groupsReversed: false,
  ordering: "priority",
  descending: true,
  completedByRecency: false,
  showSubIssues: true,
  nestedSubIssues: "show-matching",
  showEmpty: false,
  properties: DEFAULT_PROPERTIES,
};

const same = (a: ViewState, b: ViewState) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Conteúdo do painel: abas List / Board e as seções de cada layout. O rodapé aparece quando a
 * vista difere do padrão do time (como no Linear: o quadro do Figma 18:930 tem o rodapé).
 */
function ViewOptions({
  initial = DEFAULTS,
  alwaysShowFooter = false,
  portal = true,
}: {
  initial?: ViewState;
  alwaysShowFooter?: boolean;
  /** Sem portal, os selects herdam o tema do contêiner (exemplos de tema). */
  portal?: boolean;
}) {
  const [defaults, setDefaults] = useState(DEFAULTS);
  const [state, setState] = useState(initial);
  const set = <K extends keyof ViewState>(key: K, value: ViewState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));
  const showFooter = alwaysShowFooter || !same(state, defaults);

  return (
    <Tabs value={state.layout} onValueChange={(v) => set("layout", v as Layout)}>
      <DisplayOptionsSection>
        <TabsList variant="pills" aria-label="Layout">
          <TabsTrigger value="list">
            <Icon icon={TextAlignJustify} />
            List
          </TabsTrigger>
          <TabsTrigger value="board">
            <Icon icon={LayoutGrid} />
            Board
          </TabsTrigger>
        </TabsList>
      </DisplayOptionsSection>
      {(["list", "board"] as const).map((layout) => {
        const board = layout === "board";
        return (
          <TabsContent key={layout} value={layout} tabIndex={-1} className="flex flex-col">
            <DisplayOptionsSection>
              <DisplayOptionsRow label={board ? "Columns" : "Grouping"}>
                {(id) => (
                  <>
                    <IconButton
                      size="sm"
                      icon={ArrowUpDown}
                      label="Group ordering"
                      aria-pressed={state.groupsReversed}
                      className="text-primary"
                      onClick={() => set("groupsReversed", !state.groupsReversed)}
                    />
                    <Select
                      id={id}
                      trigger="button"
                      className="w-30"
                      options={GROUPINGS}
                      value={state.grouping}
                      onValueChange={(v) => set("grouping", v)}
                      portal={portal}
                    />
                  </>
                )}
              </DisplayOptionsRow>
              <DisplayOptionsRow label={board ? "Rows" : "Sub-grouping"}>
                {(id) => (
                  <Select
                    id={id}
                    trigger="button"
                    className="w-30"
                    options={GROUPINGS}
                    value={state.subGrouping}
                    onValueChange={(v) => set("subGrouping", v)}
                    portal={portal}
                  />
                )}
              </DisplayOptionsRow>
              <DisplayOptionsRow label="Ordering">
                {(id) => (
                  <>
                    <IconButton
                      size="sm"
                      icon={state.descending ? ArrowUpWideNarrow : ArrowDownWideNarrow}
                      label={`Direction: ${state.descending ? "descending" : "ascending"}`}
                      className="text-primary"
                      onClick={() => set("descending", !state.descending)}
                    />
                    <Select
                      id={id}
                      trigger="button"
                      className="w-30"
                      options={ORDERINGS}
                      value={state.ordering}
                      onValueChange={(v) => set("ordering", v)}
                      portal={portal}
                    />
                  </>
                )}
              </DisplayOptionsRow>
              <DisplayOptionsRow label="Order completed by recency">
                {(id) => (
                  <Switch
                    id={id}
                    checked={state.completedByRecency}
                    onCheckedChange={(v) => set("completedByRecency", v)}
                  />
                )}
              </DisplayOptionsRow>
            </DisplayOptionsSection>
            <DisplayOptionsSection>
              <DisplayOptionsRow label="Show sub-issues">
                {(id) => (
                  <Switch
                    id={id}
                    checked={state.showSubIssues}
                    onCheckedChange={(v) => set("showSubIssues", v)}
                  />
                )}
              </DisplayOptionsRow>
            </DisplayOptionsSection>
            <DisplayOptionsSection>
              <DisplayOptionsHeading>
                {board ? "Board options" : "List options"}
              </DisplayOptionsHeading>
              {!board && (
                <DisplayOptionsRow label="Nested sub-issues">
                  {(id) => (
                    <Select
                      id={id}
                      trigger="button"
                      className="w-30"
                      options={NESTED_SUB_ISSUES}
                      value={state.nestedSubIssues}
                      onValueChange={(v) => set("nestedSubIssues", v)}
                      portal={portal}
                    />
                  )}
                </DisplayOptionsRow>
              )}
              <DisplayOptionsRow label={board ? "Show empty columns" : "Show empty groups"}>
                {(id) => (
                  <Switch
                    id={id}
                    checked={state.showEmpty}
                    onCheckedChange={(v) => set("showEmpty", v)}
                  />
                )}
              </DisplayOptionsRow>
              <DisplayProperties
                label="Display properties"
                options={board ? BOARD_PROPERTIES : LIST_PROPERTIES}
                value={state.properties}
                onValueChange={(v) => set("properties", v)}
              />
            </DisplayOptionsSection>
            {showFooter && (
              <DisplayOptionsFooter>
                <Button variant="ghost" onClick={() => setState(defaults)}>
                  Reset
                </Button>
                <Button variant="ghost" onClick={() => setDefaults(state)}>
                  Set default for everyone
                </Button>
              </DisplayOptionsFooter>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function LiveDisplayOptions() {
  return (
    <DisplayOptions
      label="Display options"
      trigger={<Button icon={SlidersHorizontal}>Display</Button>}
    >
      <ViewOptions />
    </DisplayOptions>
  );
}

/** Os dois painéis do Figma, abertos e fixos na página. */
function StaticPanels({ portal = true }: { portal?: boolean }) {
  return (
    <div className="flex flex-wrap items-start gap-8">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-caption text-secondary">List (Figma 18:722)</figcaption>
        <DisplayOptionsPanel label="Display options, List">
          <ViewOptions portal={portal} />
        </DisplayOptionsPanel>
      </figure>
      <figure className="flex flex-col gap-2">
        <figcaption className="text-caption text-secondary">Board (Figma 18:930)</figcaption>
        <DisplayOptionsPanel label="Display options, Board">
          <ViewOptions
            initial={{ ...DEFAULTS, layout: "board" }}
            alwaysShowFooter
            portal={portal}
          />
        </DisplayOptionsPanel>
      </figure>
    </div>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Display Options",
        description:
          "Opções de exibição de uma vista (Figma 18:722 e 18:930): layout em lista ou quadro, agrupamento, ordenação, interruptores e as propriedades visíveis em cada linha ou cartão.",
        whenToUse: [
          "Ajustar como uma vista mostra os itens, sem mudar quais itens aparecem",
          "Preferências da vista que o time pode salvar como padrão",
        ],
        whenNotToUse: [
          "Filtrar itens: use Filter Menu",
          "Configurações da conta ou do workspace: use uma página de configurações",
        ],
        playground: {
          preview: <LiveDisplayOptions />,
          controls: (
            <p className="text-body-sm text-secondary">
              Abra, troque o layout e mude qualquer opção: o rodapé Reset / Set default aparece
              quando a vista difere do padrão.
            </p>
          ),
        },
        showcase: <StaticPanels />,
        states: null,
        statesNote:
          "Aba e chip ligados: camada de pressionado e texto primário; desligados: relevo e texto secundário. Hover só no fundo (bg-hover). Foco por teclado: linha de 1 px. Switch e Select seguem os seus componentes. Rodapé só quando a vista difere do padrão.",
        themes: (theme) => (
          // O painel é uma região nomeada: cada tema precisa de um nome próprio.
          <DisplayOptionsPanel label={`Display options, ${theme} theme`}>
            <ViewOptions portal={false} />
          </DisplayOptionsPanel>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Popover de 300 px (raio 12, borda forte, sombra md) com 8 px no topo. Seções com 16 px
            nas laterais e 8 px em cima e embaixo, separadas por hairline border-default. Abas em
            pílula de 28 px dividindo a largura. Linhas de no mínimo 32 px: rótulo de 12 px/500 à
            esquerda; à direita, Icon Button de 24 e Select em botão de 24 px (120 px de largura)
            com 4 px entre eles, ou Switch. Chips de 24 px com 6 px entre si. Rodapé com hairline
            border-strong: Reset à esquerda, as demais ações à direita. As listas dos selects só
            reservam o slot de ícone quando alguma opção tem ícone.
          </p>
        ),
        keyboard: [
          "Ao abrir, o foco vai para a aba ativa; ← → trocam de layout.",
          "Tab percorre os controles na ordem visual; Espaço liga e desliga Switch e chips.",
          "Enter ou ↓ abrem um Select; Esc fecha o Select e, depois, o painel.",
        ],
        accessibility: [
          'Radix Popover com nome (aria-label); abas Radix Tabs (role="tablist").',
          "Cada rótulo de linha é um <label> ligado ao Select ou Switch da linha.",
          "Chips: Radix ToggleGroup com aria-pressed, nomeado pelo rótulo do grupo.",
          "Icon Buttons com nome (Group ordering, Direction) e aria-pressed.",
        ],
        content: [
          "Rótulos curtos em sentence case (Grouping, Show sub-issues)",
          "Ações do rodapé com verbo (Reset, Set default for everyone)",
        ],
        dos: [
          "Mostre só as opções que mudam a vista atual",
          "Mantenha os selects alinhados numa coluna",
        ],
        donts: ["Não use o painel para filtrar itens", "Não misture ações destrutivas no rodapé"],
        usage: `import {
  DisplayOptions, DisplayOptionsRow, DisplayOptionsSection, DisplayProperties,
  Select, Switch, Tabs, TabsList, TabsTrigger, TabsContent,
} from "@vyzer/design-system/components";

<DisplayOptions label="Display options" trigger={<Button icon={SlidersHorizontal}>Display</Button>}>
  <Tabs value={layout} onValueChange={setLayout}>
    <DisplayOptionsSection>
      <TabsList variant="pills" aria-label="Layout">…</TabsList>
    </DisplayOptionsSection>
    <TabsContent value="list" tabIndex={-1}>
      <DisplayOptionsSection>
        <DisplayOptionsRow label="Grouping">
          {(id) => <Select id={id} trigger="button" className="w-30" options={groupings} … />}
        </DisplayOptionsRow>
        <DisplayOptionsRow label="Show sub-issues">
          {(id) => <Switch id={id} checked={on} onCheckedChange={setOn} />}
        </DisplayOptionsRow>
      </DisplayOptionsSection>
      <DisplayOptionsSection>
        <DisplayProperties label="Display properties" options={props} value={v} onValueChange={setV} />
      </DisplayOptionsSection>
    </TabsContent>
  </Tabs>
</DisplayOptions>`,
        props: [
          {
            name: "DisplayOptions.trigger",
            type: "ReactElement",
            description: "Gatilho do popover (Button).",
          },
          {
            name: "DisplayOptions.label",
            type: "string",
            description: "Nome acessível do painel.",
          },
          {
            name: "DisplayOptions.align",
            type: '"start" | "end"',
            default: '"end"',
            description: "Alinhamento com o gatilho; abre sempre para baixo.",
          },
          {
            name: "DisplayOptionsPanel",
            type: "componente",
            description: "O painel aberto, fixo na página (documentação ou tela).",
          },
          {
            name: "DisplayOptionsSection",
            type: "componente",
            description: "Seção com hairline entre seções.",
          },
          {
            name: "DisplayOptionsRow",
            type: "{ label; children: (id) => ReactNode }",
            description: "Rótulo à esquerda ligado ao controle que recebe o id.",
          },
          {
            name: "DisplayOptionsHeading",
            type: "componente",
            description: 'Título de grupo ("List options").',
          },
          {
            name: "DisplayProperties",
            type: "{ label; options; value; onValueChange }",
            description: "Chips de propriedades visíveis (multisseleção).",
          },
          {
            name: "DisplayOptionsFooter",
            type: "componente",
            description: "Rodapé de ações: a primeira (Reset) à esquerda, as demais à direita.",
          },
          {
            name: 'Select trigger="button"',
            type: "variante",
            description: "Select compacto de 24 px com chevron (Forms → Select).",
          },
          {
            name: 'TabsList variant="pills"',
            type: "variante",
            description: "Abas em pílula (Navigation → Tabs).",
          },
        ],
        decisions: [
          {
            decision: "Popover de 300 px, raio 12, borda border-strong, sombra md, 8 px no topo",
            rule: "Figma 18:722 (w 300, r12, #323336, pt 8); sombra de 3 camadas → 2 (skill §9)",
          },
          {
            decision: "Seções com 16 × 8 px e hairline border-default entre elas",
            rule: "Figma 18:725, 18:827 (px 16, py 8, #292a2d)",
          },
          {
            decision: "16 px entre as abas e a primeira linha (Figma: 18)",
            rule: "Grid de 4 (skill §1)",
          },
          {
            decision: "Abas List / Board em pílula de 28 px, ícone de 16 (Figma: 14)",
            rule: "Figma 18:729; ícones na escala 12 · 16 (divergência já registrada)",
          },
          {
            decision: "Linhas de no mínimo 32 px com rótulo de 12 px/500 em text-secondary",
            rule: "Figma 18:751 (min-h 32, 12 Medium #9c9d9f)",
          },
          {
            decision: "Select em botão: 24 px, raio 8, relevo, 12 px Regular, chevron de 12",
            rule: "Figma 18:757 (h 24, r8, pl 8); chevron 10 × 5 → ícone xs",
          },
          {
            decision: "Selects com 120 px de largura (Figma: 117) para alinhar numa coluna",
            rule: 'Figma 18:757; grid de 4 (skill §1): 116 px corta "Show matching" em Figtree',
          },
          {
            decision: "Icon Buttons de 24 px em text-primary antes do select, 4 px de distância",
            rule: "Figma 18:768, 18:811 (24 px, px 4, ícone claro)",
          },
          {
            decision: "Switch do sistema: ligado em bg-checked, não no azul do Linear",
            rule: "ADR-0013 (controles ativos sem acento); divergência já registrada",
          },
          {
            decision: "Chips de 24 px, 12 px/500, 6 px entre si (Figma: ~5)",
            rule: "Figma 18:870; grid (skill §1)",
          },
          {
            decision:
              "Chip ligado: camada de pressionado e texto primário; desligado: relevo e texto secundário",
            rule: "Figma 18:871 / 18:883; mesmo padrão do Segmented Control em pílulas",
          },
          {
            decision: "Rodapé com Button ghost de 28 px (Figma: 24, px 8)",
            rule: "ADR-0013: Button de tamanho único (28 px, 12 px de padding)",
          },
          {
            decision: "Reset à esquerda do rodapé; Set default for everyone à direita",
            rule: "Pedido do responsável (no Figma 18:1120, as duas à direita)",
          },
          {
            decision: "Lista do select sem slot de ícone quando nenhuma opção tem ícone",
            rule: "Pedido do responsável: o recuo vazio parecia um ícone faltando",
          },
          {
            decision: '"Set default for everyone" em texto primário, sem o azul do Linear',
            rule: "ADR-0013 (sem o acento do Linear; terracota só na sidebar e contadores)",
          },
          {
            decision: "Abre sempre para baixo, alinhado ao fim do gatilho, com rolagem interna",
            rule: "Pedido do responsável (mesma regra do Menu)",
          },
        ],
      }}
    />
  );
}
