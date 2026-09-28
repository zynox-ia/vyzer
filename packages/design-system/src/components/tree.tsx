/**
 * Tree (sub-issues aninhadas; Figma 40:687, a lista do Linear com sub-issues aninhadas): linhas de
 * h-row com recuo de 24 px por nível e linhas-guia de 1 px em border-default. A vertical desce no
 * centro do ícone de prioridade do pai; cada filho sai dela por um ramo curto (curva e diagonal,
 * como no Linear) até o centro da linha. O último irmão fecha a vertical no próprio ramo, e a
 * vertical de um ancestral continua enquanto ele tiver irmãos abaixo. Sem seta, como no Linear.
 * Árvore plana (WAI-ARIA APG): os itens visíveis são irmãos, com aria-level, aria-setsize e
 * aria-posinset.
 *
 * Teclado: ↑ ↓ Home End movem o foco; → expande (ou desce para o primeiro filho); ← recolhe (ou
 * sobe para o pai); Enter abre; Espaço marca ou desmarca; Esc limpa a seleção. Clique abre;
 * Ctrl, ⌘ ou Shift + clique marcam. Com o ponteiro não se recolhe, como no Linear.
 */
import { useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { nextIndex } from "../lib/roving-focus";
import { issueRowStyles } from "./issue-list";

/** Nó da árvore: valor único e filhos opcionais do mesmo tipo. */
export type TreeNode<T> = { value: string; children?: T[] };

type FlatNode<T> = {
  item: T;
  level: number;
  setSize: number;
  posInSet: number;
  parent?: string;
  expandable: boolean;
  /**
   * Uma coluna de guia por ancestral (level − 1). Cada valor diz se a vertical daquela coluna
   * continua abaixo desta linha: nas colunas dos ancestrais, se o ancestral do nível seguinte
   * tem irmãos abaixo; na última (a do pai), se este item tem.
   */
  guides: boolean[];
};

export type TreeProps<T extends TreeNode<T>> = {
  /** Nome acessível da árvore (ex.: "Sub-issues"). */
  label: string;
  items: T[];
  /** Conteúdo da linha (ex.: IssueRowContent). */
  renderItem: (item: T) => ReactNode;
  /** Valores expandidos (controlado). */
  expanded?: string[];
  /** Expandidos de início, sem controle. */
  defaultExpanded?: string[];
  onExpandedChange?: (values: string[]) => void;
  /** Valores marcados. Com onSelectedChange, a árvore vira multisseleção. */
  selected?: string[];
  onSelectedChange?: (values: string[]) => void;
  /** Abrir um item: clique ou Enter. */
  onOpen?: (value: string) => void;
  className?: string;
};

/** Vertical de 1 px no centro da coluna (o centro do ícone de prioridade do ancestral). */
const railStyles = "absolute left-1/2 border-l border-default";

/**
 * Colunas de guia de uma linha, cada uma com a largura do recuo (16 px + o gap de 8). A última é
 * a do pai: a vertical desce até o ramo (ou atravessa a linha, se houver irmãos abaixo) e o
 * primeiro filho começa 4 px acima, no pé da linha do pai.
 */
function Guides({ guides, first }: { guides: boolean[]; first: boolean }) {
  return guides.map((continues, index) => {
    const own = index === guides.length - 1;
    return (
      <span key={index} aria-hidden className="relative w-4 shrink-0 self-stretch">
        {own ? (
          <>
            <span
              className={cn(
                railStyles,
                first ? "-top-1" : "top-0",
                continues ? "bottom-0" : "bottom-1/2 mb-2",
              )}
            />
            {/* Ramo do Linear: 1 px de vertical, curva curta e diagonal até o centro da linha. */}
            <svg
              viewBox="0 0 10 9"
              fill="none"
              className="absolute top-1/2 left-1/2 -mt-2 h-2.25 w-2.5 overflow-visible text-(color:--line-default)"
            >
              <path
                d="M.5 0v1c0 2.5 2.2 3.55 2.2 3.55L9.5 8.5"
                stroke="currentColor"
                strokeLinecap="round"
              />
            </svg>
          </>
        ) : (
          continues && <span className={cn(railStyles, "inset-y-0")} />
        )}
      </span>
    );
  });
}

export function Tree<T extends TreeNode<T>>({
  label,
  items,
  renderItem,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected = [],
  onSelectedChange,
  onOpen,
  className,
}: TreeProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [innerExpanded, setInnerExpanded] = useState(defaultExpanded);
  const expanded = expandedProp ?? innerExpanded;
  const [active, setActive] = useState<string>();
  const selectable = onSelectedChange !== undefined;

  const setExpanded = (next: string[]) => {
    if (expandedProp === undefined) setInnerExpanded(next);
    onExpandedChange?.(next);
  };
  const setOpen = (value: string, open: boolean) =>
    setExpanded(open ? [...expanded, value] : expanded.filter((v) => v !== value));
  const toggleSelected = (value: string) =>
    onSelectedChange?.(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );

  // Pai de cada item (todos, visíveis ou não) e a lista plana dos visíveis, com as guias.
  const parentOf = new Map<string, string | undefined>();
  const flat: FlatNode<T>[] = [];
  const walk = (
    nodes: T[],
    level: number,
    parent: string | undefined,
    visible: boolean,
    parentGuides: boolean[],
  ) => {
    nodes.forEach((item, index) => {
      parentOf.set(item.value, parent);
      const expandable = (item.children?.length ?? 0) > 0;
      const guides = level === 1 ? [] : [...parentGuides, index < nodes.length - 1];
      if (visible) {
        flat.push({
          item,
          level,
          setSize: nodes.length,
          posInSet: index + 1,
          parent,
          expandable,
          guides,
        });
      }
      if (expandable) {
        walk(
          item.children ?? [],
          level + 1,
          item.value,
          visible && expanded.includes(item.value),
          guides,
        );
      }
    });
  };
  walk(items, 1, undefined, true, []);

  // Alvo de Tab: o item ativo; se ele sumiu (pai recolhido), o ancestral visível mais próximo.
  const isVisible = (value?: string) => flat.some((f) => f.item.value === value);
  let tabStop = active;
  while (tabStop !== undefined && !isVisible(tabStop)) tabStop = parentOf.get(tabStop);
  tabStop ??= flat[0]?.item.value;

  const focusValue = (value: string) => {
    setActive(value);
    ref.current?.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const index = flat.findIndex((f) => f.item.value === target.dataset.value);
    const node = flat[index];
    if (!node || target.getAttribute("role") !== "treeitem" || event.altKey) return;
    const value = node.item.value;
    const open = expanded.includes(value);
    const next = nextIndex(event.key, index, flat.length);
    if (next !== undefined) {
      event.preventDefault();
      const to = flat[next];
      if (to) focusValue(to.item.value);
      return;
    }
    switch (event.key) {
      case "ArrowRight": {
        event.preventDefault();
        if (!node.expandable) return;
        const child = flat[index + 1];
        if (!open) setOpen(value, true);
        else if (child) focusValue(child.item.value);
        return;
      }
      case "ArrowLeft":
        event.preventDefault();
        if (node.expandable && open) setOpen(value, false);
        else if (node.parent) focusValue(node.parent);
        return;
      case "Enter":
        event.preventDefault();
        onOpen?.(value);
        return;
      case " ":
        if (!selectable) return;
        event.preventDefault();
        toggleSelected(value);
        return;
      case "Escape":
        if (!selectable || selected.length === 0) return;
        event.preventDefault();
        onSelectedChange?.([]);
        return;
    }
  };

  const handleClick = (event: MouseEvent, value: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      if (selectable) toggleSelected(value);
    } else {
      onOpen?.(value);
    }
  };

  return (
    // Árvore com itens focáveis (roving tabindex): o foco fica nos itens, não na árvore.
    // oxlint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      ref={ref}
      // Não há elemento nativo equivalente.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="tree"
      aria-label={label}
      aria-multiselectable={selectable || undefined}
      onKeyDown={handleKeyDown}
      className={cn("flex flex-col", className)}
    >
      {flat.map((node) => {
        const value = node.item.value;
        return (
          // O teclado do item fica na árvore (onKeyDown delegado), como no Issue List.
          // oxlint-disable-next-line jsx-a11y/click-events-have-key-events
          <div
            key={value}
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="treeitem"
            aria-level={node.level}
            aria-setsize={node.setSize}
            aria-posinset={node.posInSet}
            aria-expanded={node.expandable ? expanded.includes(value) : undefined}
            aria-selected={selected.includes(value)}
            tabIndex={value === tabStop ? 0 : -1}
            data-value={value}
            onFocus={(event) => {
              if (event.target === event.currentTarget) setActive(value);
            }}
            onClick={(event) => handleClick(event, value)}
            className={issueRowStyles}
          >
            <Guides guides={node.guides} first={node.posInSet === 1} />
            {renderItem(node.item)}
          </div>
        );
      })}
    </div>
  );
}
