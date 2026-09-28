/**
 * Selection Bar (Figma 1:5613): pílula flutuante que aparece na base de uma lista com seleção em
 * massa ("N selected · Actions · ✕"). Peça nova (Fase 10, aprovada): a seleção em si já existe em
 * IssueList e Table; faltava só a barra. Composta com Button, IconButton e Menu, tokens já
 * existentes (bg-surface, shadow-raised, rounded-full, --z-index-sticky).
 *
 * O nó tem um terceiro botão entre "Actions" e "✕" ("Button - Ask Linear", um atalho de IA) — fora
 * do escopo desta fase (Fase 7, IA), por isso não está aqui. "Actions" leva um ícone no Figma
 * ("Button - Open command menu"); o rótulo do nó sugere abrir o Command Menu (⌘K), mas a spec
 * Fase 10 pede explicitamente o Menu já existente, não o Command Menu — só o ícone foi reaproveitado
 * (Button já aceita `icon`, sem prop nova).
 */
import { ListChecks, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button, IconButton } from "./button";
import { Menu, MenuContent, MenuTrigger } from "./menu";

export type SelectionBarProps = {
  /** Quantidade marcada; a página só deve renderizar a barra quando > 0. */
  count: number;
  /** Limpa a seleção (botão ✕ e o Esc da lista, já tratado por quem chama). */
  onClear: () => void;
  /** Rótulo do botão que abre o menu de ações (padrão: "Actions"). */
  actionsLabel?: string;
  /** Nome do botão de fechar (padrão: "Clear selection"). */
  clearLabel?: string;
  /** Itens do Menu de ações (MenuItem, MenuSeparator…). */
  children: ReactNode;
  className?: string;
};

/**
 * role="toolbar": os três controles (contagem, Actions, fechar) navegam juntos. A contagem fica
 * numa região aria-live, já que muda sem navegação (a barra pode ficar montada entre trocas).
 */
export function SelectionBar({
  count,
  onClear,
  actionsLabel = "Actions",
  clearLabel = "Clear selection",
  children,
  className,
}: SelectionBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        "z-sticky inline-flex items-center gap-2 rounded-full border border-transparent bg-surface p-2 shadow-raised",
        className,
      )}
    >
      <span aria-live="polite" className="px-2.5 text-label-sm text-primary tabular-nums">
        {count} selected
      </span>
      <Menu>
        <MenuTrigger asChild>
          <Button variant="ghost" icon={ListChecks}>
            {actionsLabel}
          </Button>
        </MenuTrigger>
        <MenuContent variant="dropdown">{children}</MenuContent>
      </Menu>
      <IconButton icon={X} label={clearLabel} onClick={onClear} />
    </div>
  );
}
