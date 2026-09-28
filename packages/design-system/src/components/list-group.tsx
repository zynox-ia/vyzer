/**
 * List Group (cabeçalho de grupo da lista de issues, Figma 1:6877 em 1:7477): faixa de 36 px em
 * bg-surface com raio 8. O cabeçalho recolhe e expande o grupo (Radix Collapsible) e mostra o
 * ícone, o nome e a contagem; o botão + à direita cria um item no grupo.
 */
import { ChevronRight, Plus } from "lucide-react";
import { Collapsible } from "radix-ui";
import type { ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { Counter } from "./badge";
import { IconButton } from "./button";

export type ListGroupProps = {
  /** Nome do grupo (ex.: "In Progress"). */
  title: string;
  /** Ícone de 16 px do grupo (StatusIcon, PriorityIcon, Avatar). */
  icon?: ReactNode;
  /** Quantidade de itens do grupo. */
  count?: number;
  /** Mostra o botão + (criar um item no grupo). */
  onAdd?: () => void;
  /** Nome do botão + (padrão: "Add to" + o nome do grupo). */
  addLabel?: string;
  /** Aberto (controlado). */
  open?: boolean;
  /** Aberto de início, sem controle (padrão: true). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Conteúdo do grupo (uma IssueList). */
  children: ReactNode;
  className?: string;
};

export function ListGroup({
  title,
  icon,
  count,
  onAdd,
  addLabel,
  open,
  defaultOpen = true,
  onOpenChange,
  children,
  className,
}: ListGroupProps) {
  return (
    <Collapsible.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      className={cn("flex flex-col gap-px", className)}
    >
      <div
        className={cn(
          "flex h-9 items-center gap-1 rounded-control bg-surface pr-1.5",
          // Hover só no fundo, como camada sobre a faixa (inclui a área do botão +).
          "transition-[background-image] duration-fast ease-standard hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))]",
        )}
      >
        <Collapsible.Trigger className="group flex h-full min-w-0 flex-1 cursor-default items-center gap-2 rounded-control pr-2 pl-2.5 text-left select-none focus-ring">
          <Icon
            icon={ChevronRight}
            size="xs"
            className="text-secondary transition-transform duration-fast ease-standard group-data-[state=open]:rotate-90"
          />
          {icon && (
            <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
              {icon}
            </span>
          )}
          <span className="min-w-0 truncate text-label-md text-primary">{title}</span>
          {count !== undefined && <Counter count={count} />}
        </Collapsible.Trigger>
        {onAdd && (
          <IconButton size="sm" icon={Plus} label={addLabel ?? `Add to ${title}`} onClick={onAdd} />
        )}
      </div>
      <Collapsible.Content>{children}</Collapsible.Content>
    </Collapsible.Root>
  );
}
