/**
 * Template das páginas de Patterns (Fase 10): título e descrição · ao vivo · estados · temas ·
 * composição (peças e tokens usados, com o porquê) · decisões. Mais simples que o Component Page
 * (patterns são composições, não um componente com props e playground), mas cobre os mesmos
 * requisitos da spec: estados lado a lado e os dois temas.
 */
import type { ReactNode } from "react";
import { Decisions, DocPage, DocSection, Prose, type Decision } from "./doc";
import { ThemePair, type ThemeName } from "./theme-frame";

export type PatternDoc = {
  title: string;
  description: ReactNode;
  /** Demonstração interativa. */
  live: ReactNode;
  liveDescription?: ReactNode;
  /** Estados lado a lado (StatesGrid/StatesStack) ou um bloco próprio (ex.: lista vazia). */
  states: ReactNode;
  themes: (theme: ThemeName) => ReactNode;
  /** Itens da lista de composição: a peça, o token ou a regra que ela segue. */
  composition: ReactNode[];
  decisions: Decision[];
};

export function PatternPage({ doc }: { doc: PatternDoc }) {
  return (
    <DocPage title={doc.title} description={doc.description}>
      <DocSection title="Ao vivo" description={doc.liveDescription}>
        {doc.live}
      </DocSection>

      <DocSection title="Estados">{doc.states}</DocSection>

      <DocSection title="Temas" description="Escuro e claro lado a lado.">
        <ThemePair>{doc.themes}</ThemePair>
      </DocSection>

      <DocSection title="Composição" description="Só peças e tokens já existentes no sistema.">
        <Prose>
          <ul className="flex max-w-none list-disc flex-col gap-1.5 pl-5">
            {doc.composition.map((item, i) => (
              // A lista é estática (conteúdo fixo da página).
              // oxlint-disable-next-line react/no-array-index-key
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Prose>
      </DocSection>

      <Decisions items={doc.decisions} />
    </DocPage>
  );
}
