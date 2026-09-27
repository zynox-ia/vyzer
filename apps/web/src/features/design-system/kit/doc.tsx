/**
 * Peças de layout das páginas de /design-system: página, seção, tabela, código e decisões.
 * Só apresentação; os valores vêm dos tokens do design system.
 */
import { cn } from "@vyzer/design-system/cn";
import type { ReactNode } from "react";

export function DocPage({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-12">
      <header className="flex max-w-prose flex-col gap-2">
        <h1 className="type-title text-primary">{title}</h1>
        <p className="text-body-lg text-secondary">{description}</p>
      </header>
      {children}
    </article>
  );
}

export function DocSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex max-w-prose flex-col gap-1">
        <h2 className="type-heading-2 text-primary">{title}</h2>
        {description && <p className="text-body-md text-secondary">{description}</p>}
      </header>
      {children}
    </section>
  );
}

export function DocSubsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="type-heading-3 text-primary">{title}</h3>
      {children}
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-prose flex-col gap-2 text-body-md text-secondary">{children}</div>
  );
}

/** Tabela simples: a primeira coluna é o cabeçalho da linha. */
export function DocTable({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: ReactNode[][];
  caption: string;
}) {
  return (
    <section
      aria-label={caption}
      // Rola na horizontal em telas estreitas: a região recebe foco para rolar pelo teclado.
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="overflow-x-auto rounded-container border border-subtle"
    >
      <table className="w-full min-w-max border-collapse text-left text-body-md">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-subtle">
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                scope="col"
                className="h-row px-cell-x type-label-caps whitespace-nowrap text-secondary"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            // As linhas são estáticas e não reordenam.
            // oxlint-disable-next-line react/no-array-index-key
            <tr key={i} className="border-t border-subtle align-top">
              {row.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="px-cell-x py-2 font-normal text-primary">
                    {cell}
                  </th>
                ) : (
                  <td key={j} className="px-cell-x py-2 text-secondary">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-code text-primary">{children}</code>;
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre
      aria-label="Exemplo de código"
      // Rola na horizontal: recebe foco para rolar pelo teclado.
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="overflow-x-auto rounded-container border border-subtle bg-subtle p-4 text-code text-primary"
    >
      <code>{code}</code>
    </pre>
  );
}

/** Decisões de uma página: o valor escolhido e a regra da skill (ou a origem) que o justifica. */
export type Decision = { decision: ReactNode; rule: ReactNode };

export function Decisions({ items }: { items: Decision[] }) {
  return (
    <DocSection
      title="Decisões"
      description="Cada valor com a regra que o justifica (skill vyzer-ui-design, ADR ou Figma)."
    >
      <ul className="flex flex-col rounded-container border border-subtle">
        {items.map((d, i) => (
          // oxlint-disable-next-line react/no-array-index-key
          <li
            key={i}
            className="flex flex-col gap-1 border-t border-subtle px-4 py-3 first:border-t-0 tablet:flex-row tablet:gap-6"
          >
            <span className="text-body-md text-primary tablet:w-1/2">{d.decision}</span>
            <span className="text-body-md text-secondary tablet:w-1/2">{d.rule}</span>
          </li>
        ))}
      </ul>
    </DocSection>
  );
}

/** Rótulo pequeno sobre uma amostra (nome do token, valor). */
export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-caption text-secondary", className)}>{children}</span>;
}
