/**
 * Filter Breakdown (Figma 18:1130): painel da vista com abas em pílula (Assignees, Labels,
 * Priority, Projects) e, em cada aba, a contagem de itens por valor. Clicar numa linha liga ou
 * desliga o filtro por aquele valor, no mesmo formato de valor do Filter Menu.
 */
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import type { FilterValue } from "./filter-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export type BreakdownItem = {
  value: string;
  label: string;
  /** Ícone do valor (avatar, StatusIcon, PriorityIcon, ColorDot, ProjectIcon). */
  icon?: ReactNode;
  count: number;
};

export type BreakdownGroup = {
  /** Categoria de filtro (a mesma chave do Filter Menu, ex.: "project"). */
  value: string;
  label: string;
  items: BreakdownItem[];
};

export type FilterBreakdownProps = {
  /** Nome acessível das abas (ex.: "Breakdown"). */
  label: string;
  groups: BreakdownGroup[];
  value: FilterValue;
  onValueChange: (value: FilterValue) => void;
  /** Aba aberta de início, sem controle (padrão: a primeira). */
  defaultGroup?: string;
  /** Aba aberta, controlada (ex.: guardada nos search params da tela). */
  group?: string;
  onGroupChange?: (group: string) => void;
  /** Texto de uma aba sem itens. */
  emptyText?: string;
  className?: string;
};

export function FilterBreakdown({
  label,
  groups,
  value,
  onValueChange,
  defaultGroup,
  group,
  onGroupChange,
  emptyText = "No issues",
  className,
}: FilterBreakdownProps) {
  const toggle = (group: string, item: string) => {
    const current = value[group] ?? [];
    onValueChange({
      ...value,
      [group]: current.includes(item) ? current.filter((v) => v !== item) : [...current, item],
    });
  };

  return (
    <Tabs
      value={group}
      onValueChange={onGroupChange}
      defaultValue={defaultGroup ?? groups[0]?.value}
      // Figma: painel da tela (não overlay), 12 px de folga, raio 10, hairline; sem sombra (ADR-0013).
      className={cn(
        "flex flex-col gap-2 rounded-container border border-subtle bg-panel p-3",
        className,
      )}
    >
      <TabsList variant="pills" aria-label={label}>
        {groups.map((g) => (
          <TabsTrigger key={g.value} value={g.value}>
            {g.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((g) => (
        <TabsContent
          key={g.value}
          value={g.value}
          // Com linhas, o painel sai da ordem de Tab (o foco vai direto às linhas); vazio, ele
          // fica focável para o texto ser alcançado, com o foco visível do sistema.
          tabIndex={g.items.length === 0 ? 0 : -1}
          className="min-h-0 flex-1 overflow-y-auto focus-ring"
        >
          {g.items.length === 0 ? (
            <p className="px-2.5 py-3 text-body-sm text-secondary">{emptyText}</p>
          ) : (
            <ul className="flex flex-col gap-px">
              {g.items.map((item) => {
                const on = value[g.value]?.includes(item.value) ?? false;
                return (
                  <li key={item.value}>
                    <BreakdownRow
                      item={item}
                      pressed={on}
                      onClick={() => toggle(g.value, item.value)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * Linha (Figma 18:1166): 42 → 44 px (h-row), 10 px nas laterais, raio 8, ícone de 16 com 8 px até
 * o nome (13 px) e a contagem à direita em texto secundário. Hover só no fundo; ligada, bg-selected.
 */
function BreakdownRow({
  item,
  pressed,
  onClick,
}: {
  item: BreakdownItem;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "flex h-row w-full items-center gap-2 rounded-control px-2.5 text-left text-body-md select-none focus-ring",
        // Hover como camada sobre o fundo: soma com a seleção em vez de trocá-la.
        "transition-[color,background-color,background-image] duration-fast ease-standard aria-pressed:bg-selected",
        "hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))]",
      )}
    >
      {item.icon && (
        <span className="flex size-4 shrink-0 items-center justify-center">{item.icon}</span>
      )}
      <span className="min-w-0 flex-1 truncate text-primary">{item.label}</span>
      <span className="shrink-0 text-secondary tabular-nums">{item.count}</span>
    </button>
  );
}
