import { Code, Decisions, DocPage, DocSection, DocTable } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

const breakpoints = [
  ["(padrão)", "0", "Mobile: uma coluna, sidebar vira drawer"],
  ["tablet:", "768 px", "Sidebar fixa, conteúdo em uma coluna"],
  ["desktop:", "1024 px", "Duas colunas (lista + painel de detalhes)"],
  ["wide:", "1440 px", "Painéis laterais abertos por padrão"],
];

const containers = [
  ["max-w-prose", "66ch", "Texto corrido (descrição de issue, docs)"],
  ["max-w-content", "72rem", "Conteúdo de página"],
  ["max-w-wide", "90rem", "Telas de dados largas"],
];

export function Page() {
  return (
    <DocPage
      title="Grid"
      description="Grid de 4 px, mobile primeiro, três pontos de quebra e larguras máximas nomeadas."
    >
      <DocSection title="Pontos de quebra">
        <DocTable
          caption="Pontos de quebra"
          columns={["Prefixo", "A partir de", "Layout"]}
          rows={breakpoints.map(([p, w, l]) => [<Code key="p">{p}</Code>, w, l])}
        />
      </DocSection>

      <DocSection title="Larguras máximas">
        <DocTable
          caption="Contêineres"
          columns={["Utilitário", "Largura", "Uso"]}
          rows={containers.map(([u, w, use]) => [<Code key="u">{u}</Code>, w, use])}
        />
        <ThemePair>
          {() => (
            <p className="max-w-prose text-body-md text-primary">
              Redesign the onboarding flow so a new workspace can create its first team, invite
              members and open an issue in under two minutes. Keep the existing sign-in providers.
            </p>
          )}
        </ThemePair>
      </DocSection>

      <DocSection
        title="Calha e alinhamento"
        description={
          <>
            Calha de 24 px (<Code>gap-gutter</Code>, <Code>px-gutter</Code>) entre colunas. Tudo
            alinha às mesmas linhas: um desvio de 1–2 px é lido como erro.
          </>
        }
      >
        <div aria-hidden className="grid grid-cols-12 gap-gutter">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="h-control-xl rounded-inline bg-selected" />
          ))}
        </div>
      </DocSection>

      <Decisions
        items={[
          { decision: "Unidade de 4 px em espaço, alturas e dimensões", rule: "§1 grid" },
          { decision: "Texto corrido até 66ch", rule: "§2 comprimento de linha 45–75, ideal 66" },
          { decision: "Calha de 24 px", rule: "§1 escala (24) e §11 alinhamento e continuidade" },
          {
            decision: "Mobile primeiro, tablet 768, desktop 1024, wide 1440",
            rule: "Tokens de breakpoint (theme.css)",
          },
        ]}
      />
    </DocPage>
  );
}
