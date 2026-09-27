/**
 * Menu aberto de forma estática, para mostrar a aparência na documentação. Usa as mesmas
 * classes do Menu do design system (menuStyles), mas sem Radix: não rouba o foco, não flutua
 * com a rolagem e não fica preso à tela. Para testar o comportamento, use o playground.
 */
import {
  MenuItemContent,
  dropdownMenuStyles,
  menuStyles,
  type MenuVariant,
} from "@vyzer/design-system/components";
import { cn } from "@vyzer/design-system/cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type StaticMenuRow =
  | { kind: "item"; label: string; icon?: LucideIcon; shortcut?: string[]; submenu?: boolean }
  | { kind: "separator" }
  | { kind: "label"; label: string };

export function StaticMenu({
  rows,
  highlighted,
  variant = "command",
  label,
  trailing,
}: {
  rows: StaticMenuRow[];
  /** Índice da linha destacada (como no Figma). */
  highlighted?: number;
  variant?: MenuVariant;
  /** Descrição do exemplo para leitores de tela. */
  label: string;
  trailing?: (row: StaticMenuRow) => ReactNode;
}) {
  const s = variant === "dropdown" ? { ...menuStyles, ...dropdownMenuStyles } : menuStyles;
  return (
    <figure aria-label={label} className={cn(s.content, "relative w-max")}>
      {rows.map((row, i) => {
        if (row.kind === "separator") {
          // oxlint-disable-next-line react/no-array-index-key
          return <div key={i} className={s.separator} />;
        }
        if (row.kind === "label") {
          // oxlint-disable-next-line react/no-array-index-key
          return (
            <div key={i} className={s.label}>
              {row.label}
            </div>
          );
        }
        return (
          // oxlint-disable-next-line react/no-array-index-key
          <div key={i} className={cn(s.item, i === highlighted && "bg-selected")}>
            <MenuItemContent icon={row.icon} shortcut={row.shortcut} trailing={trailing?.(row)}>
              {row.label}
            </MenuItemContent>
          </div>
        );
      })}
    </figure>
  );
}
