/**
 * Conteúdo do Display Options de uma vista de issues (Figma 18:722 "List" e 18:930 "Board"),
 * compartilhado pelas páginas Display Options e Creation Composer.
 */
import {
  Button,
  DisplayOptionsFooter,
  DisplayOptionsHeading,
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
} from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpWideNarrow,
  LayoutGrid,
  TextAlignJustify,
} from "lucide-react";
import { useState } from "react";
import {
  BOARD_PROPERTIES,
  DEFAULT_PROPERTIES,
  GROUPINGS,
  LIST_PROPERTIES,
  NESTED_SUB_ISSUES,
  ORDERINGS,
} from "./filter-data";

type Layout = "list" | "board";

export type ViewState = {
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
export const VIEW_DEFAULTS: ViewState = {
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
export function ViewOptions({
  initial = VIEW_DEFAULTS,
  alwaysShowFooter = false,
  portal = true,
}: {
  initial?: ViewState;
  alwaysShowFooter?: boolean;
  /** Sem portal, os selects herdam o tema do contêiner (exemplos de tema). */
  portal?: boolean;
}) {
  const [defaults, setDefaults] = useState(VIEW_DEFAULTS);
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
