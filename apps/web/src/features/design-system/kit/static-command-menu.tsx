/**
 * Command Menu aberto de forma estática, para mostrar a aparência na documentação. Usa as mesmas
 * classes e peças do menu (commandMenuStyles, CommandItemContent, Chip), sem cmdk nem janela: o
 * cmdk rola a página até a linha destacada ao montar. Para testar o comportamento, use o
 * playground.
 */
import {
  Chip,
  CommandItemContent,
  commandMenuStyles,
  dialogStyles,
  menuStyles,
  type CommandItemContentProps,
} from "@zynox/design-system/components";
import { cn } from "@zynox/design-system/cn";
import { Icon } from "@zynox/design-system/icons";
import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export type StaticCommandRow =
  | ({ kind: "item"; label: ReactNode } & Omit<CommandItemContentProps, "children">)
  | { kind: "label"; label: string }
  | { kind: "separator" };

export function StaticCommandMenu({
  label,
  rows,
  highlighted,
  pages = [],
  placeholder = "Type a command or search…",
  search,
  loading = false,
  emptyText = "No results",
  scroll = false,
}: {
  /** Descrição do exemplo para leitores de tela. */
  label: string;
  rows: StaticCommandRow[];
  /** Índice da linha destacada. */
  highlighted?: number;
  pages?: string[];
  placeholder?: string;
  /** Texto já digitado na busca (no lugar do placeholder). */
  search?: string;
  loading?: boolean;
  /** Texto da lista sem itens. */
  emptyText?: string;
  /** Lista com a altura do menu real (400 px) e rolagem; sem ela, mostra todas as linhas. */
  scroll?: boolean;
}) {
  const s = commandMenuStyles;
  const empty = !loading && !rows.some((row) => row.kind === "item");
  const list = (
    <>
      {loading && (
        <div className={cn(s.item, "text-secondary")}>
          <span className={menuStyles.iconSlot}>
            <Icon icon={LoaderCircle} className="animate-spin" />
          </span>
          Loading…
        </div>
      )}
      {empty && <div className={s.empty}>{emptyText}</div>}
      {rows.map((row, i) => {
        if (row.kind === "separator") {
          // oxlint-disable-next-line react/no-array-index-key
          return <div key={i} className={s.separator} />;
        }
        if (row.kind === "label") {
          return (
            // oxlint-disable-next-line react/no-array-index-key
            <div key={i} className={s.groupHeading}>
              {row.label}
            </div>
          );
        }
        const { kind: _, label: text, ...content } = row;
        return (
          // oxlint-disable-next-line react/no-array-index-key
          <div key={i} className={cn(s.item, i === highlighted && "bg-selected")}>
            <CommandItemContent {...content}>{text}</CommandItemContent>
          </div>
        );
      })}
    </>
  );
  return (
    <figure aria-label={label} className={cn(dialogStyles.content, s.surface)}>
      <div className={s.header}>
        {pages.length > 0 && (
          <div className={s.trail}>
            {pages.map((p) => (
              <Chip key={p}>{p}</Chip>
            ))}
          </div>
        )}
        <span
          className={cn(s.input, "flex items-center", search ? "text-primary" : "text-placeholder")}
        >
          {search || placeholder}
        </span>
      </div>
      {scroll ? (
        <section
          aria-label={`${label}: lista`}
          // Rola como o menu real: a região recebe foco para rolar pelo teclado.
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className={s.list}
        >
          {list}
        </section>
      ) : (
        // Sem limite de altura: a figura mostra todas as linhas, sem rolagem.
        <div className={cn(s.list, "max-h-none")}>{list}</div>
      )}
    </figure>
  );
}
