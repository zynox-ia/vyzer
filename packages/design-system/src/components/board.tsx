/**
 * Board (Figma 1:8749): coluna de status com cabeçalho (ícone, nome, contagem e ações) e cartões
 * de issue empilhados. O cartão (Figma 1:8859) é uma opção de Issue List: dentro da coluna, a
 * lista dá o teclado (↑ ↓, Enter abre, Espaço marca) e a seleção. Arrastar fica para a tela.
 */
import { Plus } from "lucide-react";
import { useId, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Counter } from "./badge";
import { IconButton } from "./button";
import {
  IssueAssigneeSlot,
  optionStateStyles,
  useIssueOption,
  type IssueAssignee,
  type IssueOptionProps,
  type IssueValue,
} from "./issue-list";

export type BoardColumnProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Nome da coluna (ex.: "In Progress"). */
  title: string;
  /** Ícone de 16 px (StatusIcon). */
  icon?: ReactNode;
  count?: number;
  /** Ações extras no cabeçalho, antes do + (ex.: Icon Button com Menu). */
  actions?: ReactNode;
  /** Mostra o botão + (criar um cartão na coluna). */
  onAdd?: () => void;
  /** Nome do botão + (padrão: "Add to" + o nome da coluna). */
  addLabel?: string;
  /** Os cartões (uma IssueList). */
  children: ReactNode;
};

/** Coluna de 340 px, sem fundo próprio: os cartões em relevo de superfície fazem a leitura. */
export function BoardColumn({
  title,
  icon,
  count,
  actions,
  onAdd,
  addLabel,
  children,
  className,
  ...rest
}: BoardColumnProps) {
  const titleId = useId();
  return (
    <div
      // Grupo nomeado pelo título, sem landmark (várias colunas por tela); fieldset é de formulário.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-labelledby={titleId}
      className={cn("flex w-85 shrink-0 flex-col gap-1", className)}
      {...rest}
    >
      <div className="flex h-row items-center gap-2 pr-1 pl-3">
        {icon && (
          <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
            {icon}
          </span>
        )}
        <span id={titleId} className="min-w-0 truncate text-label-md text-primary">
          {title}
        </span>
        {count !== undefined && <Counter count={count} />}
        <span className="ml-auto flex items-center gap-0.5">
          {actions}
          {onAdd && (
            <IconButton
              size="sm"
              icon={Plus}
              label={addLabel ?? `Add to ${title}`}
              onClick={onAdd}
            />
          )}
        </span>
      </div>
      {children}
    </div>
  );
}

export type BoardCardProps = IssueOptionProps & {
  identifier: string;
  title: string;
  /** Status: ícone de 16 px antes do título; o rótulo é lido por leitores de tela. */
  status?: IssueValue;
  assignee?: IssueAssignee;
  /** Chips outline (prioridade só com ícone, projeto, labels, relações). */
  children?: ReactNode;
  /** Linha de rodapé em texto secundário (ex.: "Created Sep 13"). */
  footer?: ReactNode;
};

/**
 * Cartão (Figma 1:8859): bg-surface com hairline e raio de contêiner, 12 px de respiro. ID e
 * responsável no topo, status e título (até duas linhas), chips e rodapé.
 */
export function BoardCard({
  value,
  identifier,
  title,
  status,
  assignee,
  children,
  footer,
  onClick,
  className,
  ...rest
}: BoardCardProps) {
  const option = useIssueOption("BoardCard", { value, onClick });
  return (
    <div
      {...rest}
      {...option}
      className={cn(
        "flex w-full flex-col gap-2 rounded-container border border-default bg-surface p-3 text-left text-body-md",
        optionStateStyles,
        // Seleção como camada sobre a superfície do cartão (bg-selected sozinho ficaria igual ao
        // hover); com hover, as duas camadas somam.
        "aria-selected:bg-surface aria-selected:[background-image:linear-gradient(var(--bg-selected),var(--bg-selected))] aria-selected:hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover)),linear-gradient(var(--bg-selected),var(--bg-selected))]",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-mono text-code text-secondary">
          {identifier}
        </span>
        <IssueAssigneeSlot assignee={assignee} />
      </span>
      <span className="flex items-start gap-2">
        {status && (
          <>
            {/* Alinhado à primeira linha do título (20 px). */}
            <span aria-hidden className="flex h-5 shrink-0 items-center">
              {status.icon}
            </span>
            <span className="sr-only">{status.label}</span>
          </>
        )}
        <span className="line-clamp-2 min-w-0 flex-1 text-label-md text-primary">{title}</span>
      </span>
      {children && <span className="flex flex-wrap gap-1">{children}</span>}
      {footer && (
        <span className="flex items-center gap-1 text-body-sm text-secondary">{footer}</span>
      )}
    </div>
  );
}
