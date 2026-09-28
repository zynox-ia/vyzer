/**
 * Filter Menu (Figma 18:353, "Add Filter…"): busca no topo com o atalho à direita e a lista de
 * categorias de filtro, agrupadas por separadores. Categoria com valores abre um submenu com
 * busca e multisseleção (ComboboxPanel); com subcategorias, um submenu simples (Figma 22:2039:
 * Project properties, Dates, Relations); sem nenhum dos dois, a linha é uma ação (AI filter,
 * Advanced filter, Auto-closed).
 *
 * Radix DropdownMenu dá foco, setas, submenus e fechamento com Esc. A busca do topo filtra as
 * categorias: ↓ leva à lista, ↑ na primeira linha volta à busca e letras digitadas na lista vão
 * para a busca (no lugar do typeahead). Enter na busca escolhe a primeira categoria visível.
 */
import type { LucideIcon } from "lucide-react";
import {
  Fragment,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type Ref,
} from "react";
import { cn } from "../lib/cn";
import { ComboboxPanel } from "./combobox";
import { KbdSequence } from "./kbd";
import type { ListOption } from "./listbox";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuPanel,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "./menu";

export type FilterCategory = {
  value: string;
  label: string;
  icon: LucideIcon;
  /** Valores do filtro, num submenu com busca e multisseleção (ícone, tag e hint por valor). */
  options?: ListOption[];
  /** Subcategorias, num submenu simples sem busca (ex.: Project properties, Dates). */
  children?: FilterCategory[];
  /** Placeholder da busca do submenu (padrão: "Filter…", Figma 22:1222). */
  searchPlaceholder?: string;
};

/** Valores escolhidos por categoria: { status: ["backlog", "in-progress"], … }. */
export type FilterValue = Record<string, string[]>;

export type FilterMenuProps = {
  /** Grupos de categorias, na ordem; um separador entre cada grupo. */
  sections: FilterCategory[][];
  value: FilterValue;
  onValueChange: (value: FilterValue) => void;
  /** Categoria sem valores escolhida (ex.: "ai-filter"). */
  onAction?: (category: string) => void;
  /** Gatilho (normalmente um Button). */
  children: ReactElement;
  /** Placeholder da busca do topo. */
  searchPlaceholder?: string;
  /** Atalho que abre o menu, mostrado na busca (ex.: ["F"]). */
  shortcut?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Sem portal, o menu herda o tema do contêiner. */
  portal?: boolean;
};

/**
 * Cabeçalho de busca (Figma 18:354): 36 px, 14 px à esquerda e 12 px à direita, hairline #292a2d
 * embaixo (border-default, a mesma dos separadores deste menu).
 */
const filterSearchStyles = {
  header: "flex h-9 shrink-0 items-center gap-2 border-b border-default pr-3 pl-3.5",
  input:
    "h-full min-w-0 flex-1 bg-transparent text-body-md text-primary outline-none placeholder:text-placeholder",
};

const ITEM = '[role="menuitem"]';

export function FilterMenu({
  sections,
  value,
  onValueChange,
  onAction,
  children,
  searchPlaceholder = "Add Filter…",
  shortcut,
  open: openProp,
  onOpenChange,
  portal = true,
}: FilterMenuProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const setOpen = (next: boolean) => {
    setInnerOpen(next);
    onOpenChange?.(next);
    if (!next) setQuery("");
  };

  const q = query.trim().toLowerCase();
  const visible = sections
    .map((section) => section.filter((c) => c.label.toLowerCase().includes(q)))
    .filter((section) => section.length > 0);

  const items = () => [...(listRef.current?.querySelectorAll<HTMLElement>(ITEM) ?? [])];

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items()[0]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Ação: escolhe e fecha. Categoria com valores: abre o submenu (a busca dele recebe o foco).
      items()[0]?.click();
    }
    // Esc e Tab seguem para o menu (fechar, prender o foco); o resto fica na busca, longe do
    // typeahead do Radix.
    if (e.key !== "Escape" && e.key !== "Tab") e.stopPropagation();
  };

  // Teclas no menu fora da busca: numa linha ou no próprio conteúdo (que o Radix foca quando o
  // ponteiro sai de uma linha). Os submenus ficam em portais, fora do DOM do conteúdo.
  const onContentKeyDownCapture = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!e.currentTarget.contains(target) || target === inputRef.current) return;
    if (e.key === "ArrowUp" && target === items()[0]) {
      e.preventDefault();
      e.stopPropagation();
      inputRef.current?.focus();
      return;
    }
    const printable = e.key.length === 1 && e.key !== " ";
    if (printable && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      setQuery((prev) => prev + e.key);
      inputRef.current?.focus();
    }
  };

  const toggle = (category: string, next: string[]) =>
    onValueChange({ ...value, [category]: next });

  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger asChild aria-haspopup="dialog">
        {children}
      </MenuTrigger>
      <MenuContent
        variant="dropdown"
        portal={portal}
        // Com a busca, o conteúdo é um diálogo: um role="menu" só pode conter itens. O elemento
        // é do Radix (não dá para usar <dialog>); só o papel muda, como no MenuSubContent.
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="dialog"
        aria-label={searchPlaceholder.replace(/…$/, "")}
        aria-orientation={undefined}
        className="flex w-59 flex-col overflow-hidden p-0"
        onKeyDownCapture={onContentKeyDownCapture}
      >
        <FilterSearch
          ref={inputRef}
          focusOnMount
          value={query}
          onValueChange={setQuery}
          placeholder={searchPlaceholder}
          shortcut={shortcut}
          controls={visible.length > 0 ? listId : undefined}
          onKeyDown={onSearchKeyDown}
        />
        {visible.length === 0 ? (
          <p className="px-3.5 py-2.5 text-body-sm text-secondary">No results</p>
        ) : (
          <div
            ref={listRef}
            id={listId}
            role="menu"
            aria-label="Filters"
            className="min-h-0 flex-1 overflow-y-auto p-1.5"
          >
            {visible.map((section, i) => (
              <Fragment key={section[0]?.value}>
                {i > 0 && <MenuSeparator className="border-default" />}
                {section.map((c) => (
                  <CategoryItem
                    key={c.value}
                    category={c}
                    value={value}
                    onToggle={toggle}
                    onAction={onAction}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        )}
      </MenuContent>
    </Menu>
  );
}

/**
 * Uma categoria do menu (Figma 22:2039). Com valores: submenu com busca e multisseleção
 * (Project status, Agent, Creator…). Com subcategorias: submenu simples, sem busca (Project
 * properties, Dates, Relations), que pode abrir outro nível. Sem nenhum dos dois: ação.
 * Submenus na largura do conteúdo, com no mínimo 208 px (Figma: 204 px por dentro).
 */
function CategoryItem({
  category: c,
  value,
  onToggle,
  onAction,
}: {
  category: FilterCategory;
  value: FilterValue;
  onToggle: (category: string, next: string[]) => void;
  onAction?: (category: string) => void;
}) {
  if (c.options) {
    return (
      <MenuSub>
        <MenuSubTrigger icon={c.icon}>{c.label}</MenuSubTrigger>
        <MenuSubContent panelLabel={c.label} className="w-max max-w-125 min-w-52">
          <MenuPanel>
            <ComboboxPanel
              multiple
              label={c.label}
              searchPlaceholder={c.searchPlaceholder ?? "Filter…"}
              options={c.options}
              value={value[c.value] ?? []}
              onValueChange={(next) => onToggle(c.value, next)}
            />
          </MenuPanel>
        </MenuSubContent>
      </MenuSub>
    );
  }
  if (c.children) {
    return (
      <MenuSub>
        <MenuSubTrigger icon={c.icon}>{c.label}</MenuSubTrigger>
        <MenuSubContent className="max-w-125">
          {c.children.map((child) => (
            <CategoryItem
              key={child.value}
              category={child}
              value={value}
              onToggle={onToggle}
              onAction={onAction}
            />
          ))}
        </MenuSubContent>
      </MenuSub>
    );
  }
  return (
    <MenuItem icon={c.icon} onSelect={() => onAction?.(c.value)}>
      {c.label}
    </MenuItem>
  );
}

/** Campo de busca do topo, com o atalho do menu à direita. */
export function FilterSearch({
  value,
  onValueChange,
  placeholder,
  shortcut,
  controls,
  onKeyDown,
  focusOnMount = false,
  className,
  ref,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  shortcut?: string[];
  /** Id da lista que a busca filtra. */
  controls?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  /** Foca a busca ao montar (menu que acabou de abrir). */
  focusOnMount?: boolean;
  className?: string;
  ref?: Ref<HTMLInputElement | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
    ref,
    () => inputRef.current,
    [],
  );
  useEffect(() => {
    if (!focusOnMount) return;
    // O Radix foca o conteúdo do menu ao abrir, depois dos efeitos dos filhos: a busca pega o
    // foco no quadro seguinte (como o MenuPanel).
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [focusOnMount]);
  return (
    <div className={cn(filterSearchStyles.header, className)}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={placeholder.replace(/…$/, "")}
        aria-controls={controls}
        autoComplete="off"
        spellCheck={false}
        className={filterSearchStyles.input}
      />
      {shortcut && <KbdSequence keys={shortcut} />}
    </div>
  );
}
