/**
 * Activity / Timeline (Figma 25:4689, atividade do projeto; 27:17223, Inbox): eventos em ordem,
 * cada um com ícone num trilho vertical, autor, a ação e o tempo relativo. Um evento pode trazer um
 * corpo (comentário) num cartão abaixo do texto.
 */
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

/**
 * Tempo relativo em inglês, a língua da interface ("2 hours ago", "yesterday", "last week").
 * Menos de um minuto vira "just now".
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const seconds = (date.getTime() - now.getTime()) / 1000;
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

const absolute = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export type TimelineProps = {
  /** Nome acessível da lista (ex.: "Activity"). */
  label: string;
  children: ReactNode;
  className?: string;
};

export function Timeline({ label, children, className }: TimelineProps) {
  return (
    <ol aria-label={label} className={cn("flex flex-col", className)}>
      {children}
    </ol>
  );
}

export type TimelineItemProps = {
  /** Ícone de 16 px do evento (StatusIcon, Avatar, Icon). Decorativo: o texto diz o que houve. */
  icon: ReactNode;
  /** Quem fez (ex.: "André Júnio"), em text-primary. */
  author?: string;
  /** A ação (ex.: "changed status from Todo to In Progress"). */
  children: ReactNode;
  /** Quando: data ou texto ISO. */
  time: Date | string;
  /** Referência do tempo relativo (padrão: agora). */
  now?: Date;
  /** Corpo do evento (ex.: o texto de um comentário), num cartão abaixo. */
  body?: ReactNode;
};

/**
 * Evento: trilho de 20 px com o ícone e a linha até o próximo evento (border-default), texto de
 * 12 px em text-secondary com o autor em 12/500 primário, e o tempo relativo (a data completa no
 * title do elemento time).
 */
export function TimelineItem({ icon, author, children, time, now, body }: TimelineItemProps) {
  const date = typeof time === "string" ? new Date(time) : time;
  return (
    <li className="group/event flex gap-3">
      <span aria-hidden className="flex w-5 shrink-0 flex-col items-center">
        <span className="flex size-5 items-center justify-center">{icon}</span>
        <span className="my-1 w-0 flex-1 border-l border-default group-last/event:hidden" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 pb-4 group-last/event:pb-0">
        <p className="pt-0.5 text-body-sm text-secondary">
          {author && <span className="text-label-sm text-primary">{author}</span>} {children}
          <span aria-hidden> · </span>
          <time dateTime={date.toISOString()} title={absolute.format(date)}>
            {formatRelativeTime(date, now)}
          </time>
        </p>
        {body && (
          <div className="rounded-container border border-default bg-surface px-3 py-2.5 text-body-md text-primary">
            {body}
          </div>
        )}
      </div>
    </li>
  );
}
