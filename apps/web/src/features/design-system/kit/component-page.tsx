/**
 * Template único das páginas de componente em /design-system:
 * 1. título e quando usar / não usar · 2. playground · 3. showcase · 4. estados · 5. temas
 * 6. anatomia, teclado, acessibilidade, conteúdo, do / don't · 7. uso e props · 8. decisões.
 */
import type { ReactNode } from "react";
import {
  CodeBlock,
  Decisions,
  DocPage,
  DocSection,
  DocSubsection,
  DocTable,
  Prose,
  type Decision,
} from "./doc";
import { ThemePair, type ThemeName } from "./theme-frame";

export type PropRow = { name: string; type: string; default?: string; description: string };

export type ComponentDoc = {
  title: string;
  description: ReactNode;
  whenToUse: ReactNode[];
  whenNotToUse: ReactNode[];
  playground: { controls: ReactNode; preview: ReactNode };
  showcase: ReactNode;
  /** Estados lado a lado; `null` quando o componente não é interativo (explique em `statesNote`). */
  states: ReactNode | null;
  statesNote?: ReactNode;
  themes: (theme: ThemeName) => ReactNode;
  anatomy: ReactNode;
  keyboard: ReactNode[];
  accessibility: ReactNode[];
  content: ReactNode[];
  dos: ReactNode[];
  donts: ReactNode[];
  usage: string;
  props: PropRow[];
  decisions: Decision[];
};

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex max-w-prose list-disc flex-col gap-1 pl-5 text-body-md text-secondary">
      {items.map((item, i) => (
        // oxlint-disable-next-line react/no-array-index-key
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function ComponentPage({ doc }: { doc: ComponentDoc }) {
  return (
    <DocPage title={doc.title} description={doc.description}>
      <DocSection title="Quando usar">
        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
          <DocSubsection title="Use para">
            <List items={doc.whenToUse} />
          </DocSubsection>
          <DocSubsection title="Não use para">
            <List items={doc.whenNotToUse} />
          </DocSubsection>
        </div>
      </DocSection>

      <DocSection title="Playground" description="O componente ao vivo; mude as opções abaixo.">
        <div className="flex flex-col overflow-hidden rounded-container border border-subtle">
          <div className="flex min-h-40 items-center justify-center bg-panel p-8">
            {doc.playground.preview}
          </div>
          <div className="flex flex-wrap gap-4 border-t border-subtle bg-subtle p-4">
            {doc.playground.controls}
          </div>
        </div>
      </DocSection>

      <DocSection title="Showcase" description="Todas as variantes em todos os tamanhos.">
        {doc.showcase}
      </DocSection>

      <DocSection title="Estados">{doc.states ?? <Prose>{doc.statesNote}</Prose>}</DocSection>

      <DocSection title="Temas" description="Escuro e claro lado a lado.">
        <ThemePair>{doc.themes}</ThemePair>
      </DocSection>

      <DocSection title="Anatomia">{doc.anatomy}</DocSection>

      <DocSection title="Diretrizes">
        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
          <DocSubsection title="Teclado">
            <List items={doc.keyboard} />
          </DocSubsection>
          <DocSubsection title="Acessibilidade">
            <List items={doc.accessibility} />
          </DocSubsection>
          <DocSubsection title="Conteúdo">
            <List items={doc.content} />
          </DocSubsection>
          <DocSubsection title="Faça">
            <List items={doc.dos} />
          </DocSubsection>
          <DocSubsection title="Não faça">
            <List items={doc.donts} />
          </DocSubsection>
        </div>
      </DocSection>

      <DocSection title="Uso">
        <CodeBlock code={doc.usage} />
        <DocTable
          caption={`Props de ${doc.title}`}
          columns={["Prop", "Tipo", "Padrão", "Descrição"]}
          rows={doc.props.map((p) => [
            <code key="n" className="font-mono text-code">
              {p.name}
            </code>,
            <code key="t" className="font-mono text-code">
              {p.type}
            </code>,
            p.default ? (
              <code key="d" className="font-mono text-code">
                {p.default}
              </code>
            ) : (
              "—"
            ),
            p.description,
          ])}
        />
      </DocSection>

      <Decisions items={doc.decisions} />
    </DocPage>
  );
}
