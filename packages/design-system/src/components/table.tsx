/**
 * Table (lista de projetos, Figma 25:4964 e 1:4813): tabela nativa com cabeçalho de 32 px em
 * texto secundário, botões de ordenação e linhas de h-row (44 px; 36 no compacto). Hover e
 * seleção são camadas no fundo da linha, com raio 8 nas pontas; sem divisórias.
 *
 * Teclado: Tab percorre os controles (seleção, ordenação, links); ↑ ↓ levam o foco ao controle da
 * mesma coluna na linha de cima ou de baixo, do cabeçalho até a última linha.
 */
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  createContext,
  use,
  type HTMLAttributes,
  type KeyboardEvent,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Campos de texto usam ↑ ↓ para o cursor: a tabela não intercepta. */
const TEXT_ENTRY = 'input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable]';

/** Parte da tabela em que a linha está: o cabeçalho não tem hover nem seleção. */
const SectionContext = createContext<"head" | "body">("body");

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** Nome acessível da tabela (ex.: "Projects"). */
  label: string;
};

export function Table({ label, className, onKeyDown, ...rest }: TableProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    const target = event.target as HTMLElement;
    if (target.closest(TEXT_ENTRY)) return;
    const table = event.currentTarget;
    const cell = target.closest<HTMLTableCellElement>("td, th");
    const row = cell?.parentElement as HTMLTableRowElement | null | undefined;
    if (!cell || !row || row.closest("table") !== table) return;
    const rows = [...table.rows];
    const step = event.key === "ArrowDown" ? 1 : -1;
    // Pula linhas sem controle na coluna (ex.: linha sem link).
    for (let i = rows.indexOf(row) + step; i >= 0 && i < rows.length; i += step) {
      const next = rows[i]?.cells[cell.cellIndex]?.querySelector<HTMLElement>(FOCUSABLE);
      if (next) {
        event.preventDefault();
        next.focus();
        return;
      }
    }
  };
  return (
    // Delegação: as setas chegam dos controles das células, que são os alvos interativos.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <table
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn("w-full border-separate border-spacing-0 text-left", className)}
      {...rest}
    />
  );
}

export function TableHeader(props: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <SectionContext value="head">
      <thead {...props} />
    </SectionContext>
  );
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Linha marcada: bg-selected (a marcação em si é o Checkbox da linha). */
  selected?: boolean;
};

/**
 * Hover e seleção entram como variáveis lidas pelas células: fundo de linha não aceita raio, a
 * célula aceita (raio 8 na primeira e na última).
 */
export function TableRow({ selected = false, className, ...rest }: TableRowProps) {
  const section = use(SectionContext);
  return (
    <tr
      data-state={section === "body" && selected ? "selected" : undefined}
      className={cn(
        section === "head"
          ? "h-8"
          : "h-row data-[state=selected]:[--row-bg:var(--bg-selected)] hovered:[--row-layer:linear-gradient(var(--bg-hover),var(--bg-hover))]",
        className,
      )}
      {...rest}
    />
  );
}

const cellBase =
  "px-cell-x align-middle first:rounded-l-control last:rounded-r-control bg-(--row-bg) [background-image:var(--row-layer,none)] transition-[background-color] duration-fast ease-standard";

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

/** Célula: 12 px Regular em text-secondary (metadados); o conteúdo principal escolhe a cor. */
export function TableCell({ className, ...rest }: TableCellProps) {
  return <td className={cn(cellBase, "text-body-sm text-secondary", className)} {...rest} />;
}

export type SortDirection = "asc" | "desc";

export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  /** Ordenação atual desta coluna; false ou omitido: não ordenada. */
  sort?: SortDirection | false;
  /** Torna o título um botão de ordenação. */
  onSort?: () => void;
};

/**
 * Título de coluna (12 px Regular, text-secondary). Com onSort, vira um botão em pílula de 24 px;
 * a coluna ordenada fica em text-primary com a seta da direção e aria-sort.
 */
export function TableHead({ sort, onSort, className, children, ...rest }: TableHeadProps) {
  const ariaSort = sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined;
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        cellBase,
        "text-body-sm font-normal whitespace-nowrap text-secondary",
        className,
      )}
      {...rest}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          data-sorted={sort ? "" : undefined}
          className="-mx-1.5 inline-flex h-control-sm cursor-default items-center gap-1 rounded-full px-1.5 select-none focus-ring transition-[color,background-image] duration-fast ease-standard hovered:text-primary hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))] data-sorted:text-primary"
        >
          {children}
          {sort && <Icon icon={sort === "asc" ? ArrowUp : ArrowDown} size="xs" />}
        </button>
      ) : (
        children
      )}
    </th>
  );
}
