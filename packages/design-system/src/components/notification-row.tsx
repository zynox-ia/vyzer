/**
 * Notification Row (sem frame no Figma; medida no Linear ao vivo, Inbox): a linha de duas linhas
 * de uma notificação, avatar do ator de 32 px, ID + título + ícones, resumo do evento e tempo
 * relativo. Vive dentro de uma Issue List (que dá o listbox, o teclado e a seleção) e usa o mesmo
 * mecanismo de opção da Issue Row. A altura vem do conteúdo (20 + 16 px de texto + respiro), sem
 * altura fixa.
 *
 * Não lida: ponto de destaque (bg-accent) à esquerda do avatar, ID em label-md e as duas linhas em
 * text-primary. Lida: ID em body-md e resumo em text-secondary. A cor nunca é o único sinal: o peso
 * do ID muda e um texto só para leitores de tela diz "Unread" ou "Read".
 */
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Avatar, type AvatarProps } from "./avatar";
import {
  optionStateStyles,
  useIssueOption,
  ValueIcon,
  type IssueOptionProps,
  type IssueValue,
} from "./issue-list";
import { Skeleton } from "./skeleton";

/** Ator do evento: pessoa, agente ou sistema (ícone genérico quando não há foto). */
export type NotificationActor = Pick<AvatarProps, "name" | "src" | "icon">;

export type NotificationRowContentProps = {
  /** Sem ler ainda: ponto de destaque e texto em cor primária. */
  unread?: boolean;
  actor: NotificationActor;
  /** Identificador da issue (ex.: "ZYN-241"). */
  identifier: string;
  title: string;
  /** Prioridade: ícone de 16 px; o rótulo é lido depois de "Priority:". */
  priority?: IssueValue;
  /** Status: ícone de 16 px; o rótulo é lido por leitores de tela. */
  status?: IssueValue;
  /** O que aconteceu, depois do nome do ator (ex.: "assigned you"). */
  summary: string;
  /** Tempo relativo curto (ex.: "2d"). */
  time: string;
  /** Instante completo, no atributo datetime do <time>. */
  dateTime?: string;
};

/** Classes da linha: 20 px à esquerda (espaço do ponto), px-cell-x à direita, raio 8. */
export const notificationRowStyles = cn(
  "relative flex w-full items-center gap-3 rounded-control py-2.5 pr-cell-x pl-5 text-body-md",
  optionStateStyles,
);

export type NotificationRowProps = IssueOptionProps & NotificationRowContentProps;

export function NotificationRow({
  value,
  unread = false,
  actor,
  identifier,
  title,
  priority,
  status,
  summary,
  time,
  dateTime,
  onClick,
  className,
  ...rest
}: NotificationRowProps) {
  const option = useIssueOption("NotificationRow", { value, onClick });
  return (
    <div {...rest} {...option} className={cn(notificationRowStyles, className)}>
      {unread && (
        <span
          aria-hidden
          data-unread-dot
          className="absolute top-1/2 left-2 size-2 -translate-y-1/2 rounded-full bg-accent"
        />
      )}
      <span className="sr-only">{unread ? "Unread" : "Read"}</span>
      <Avatar name={actor.name} src={actor.src} icon={actor.icon} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "shrink-0",
              unread ? "text-label-md text-primary" : "text-body-md text-secondary",
            )}
          >
            {identifier}
          </span>
          <span className="min-w-0 flex-1 truncate text-label-md text-primary">{title}</span>
          {priority && <ValueIcon value={priority} prefix="Priority: " />}
          {status && <ValueIcon value={status} />}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 text-body-sm",
            unread ? "text-primary" : "text-secondary",
          )}
        >
          <span className="min-w-0 flex-1 truncate">{`${actor.name} ${summary}`}</span>
          <time
            dateTime={dateTime}
            className="shrink-0 text-right whitespace-nowrap text-secondary tabular-nums"
          >
            {time}
          </time>
        </div>
      </div>
    </div>
  );
}

/** Forma da linha enquanto carrega: mesmas medidas da Notification Row, sem deslocar a lista. */
export function NotificationRowSkeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("flex w-full items-center gap-3 py-2.5 pr-cell-x pl-5", className)}
      {...rest}
    >
      <Skeleton shape="avatar" size="lg" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-5 items-center gap-2">
          <Skeleton className="w-14 shrink-0" />
          <Skeleton className="w-3/5" />
        </div>
        <div className="flex h-4 items-center gap-2">
          <Skeleton className="w-2/5" />
        </div>
      </div>
    </div>
  );
}
