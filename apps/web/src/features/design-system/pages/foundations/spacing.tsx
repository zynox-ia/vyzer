import { Code, Decisions, DocPage, DocSection, DocTable } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

/** Escala recomendada (px) e o sufixo Tailwind correspondente (unidade de 4 px). */
const scale = [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96];

const suffix = (px: number) => String(px / 4);

const groups = [
  { title: "Status", items: ["Backlog", "Todo", "In Progress"] },
  { title: "Priority", items: ["Urgent", "High", "Medium"] },
];

export function Page() {
  return (
    <DocPage
      title="Spacing"
      description="Grid de 4 px. O passo cresce com o tamanho, porque a diferença percebida é relativa: 4 → 8 é óbvio, 44 → 48 não é."
    >
      <DocSection
        title="Escala"
        description={
          <>
            Use o utilitário do Tailwind com o sufixo da tabela (<Code>p-2</Code> = 8 px,{" "}
            <Code>gap-3</Code> = 12 px). Valores fora da escala só com justificativa óptica
            documentada.
          </>
        }
      >
        <DocTable
          caption="Escala de espaçamento"
          columns={["px", "Sufixo", "Amostra"]}
          rows={scale.map((px) => [
            `${px}`,
            <Code key="s">{suffix(px)}</Code>,
            <span
              key="b"
              aria-hidden
              className="block h-control-xs rounded-inline bg-inverse"
              style={{ width: `calc(var(--spacing) * ${suffix(px)})` }}
            />,
          ])}
        />
      </DocSection>

      <DocSection
        title="Proximidade"
        description="Dentro do grupo, menos espaço que entre grupos: itens contíguos (passo de 32 px, como no Figma) e 12 px entre seções."
      >
        <ThemePair>
          {() => (
            <div className="flex w-56 flex-col gap-3 rounded-container border border-strong bg-popover p-1.5 shadow-md">
              {groups.map((g) => (
                <div key={g.title} className="flex flex-col">
                  <p className="px-2 type-overline text-secondary">{g.title}</p>
                  {g.items.map((i) => (
                    <p
                      key={i}
                      className="flex h-menu-item items-center rounded-control px-2 text-body-md text-primary hover:bg-hover"
                    >
                      {i}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ThemePair>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Unidade de 4 px; bordas de 1 px são a exceção",
            rule: "§1 Grid e espaçamento",
          },
          {
            decision: "Escala 0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96",
            rule: "§1 progressão quase geométrica (Weber-Fechner)",
          },
          {
            decision: "Itens de menu contíguos, seções a 12 px",
            rule: "Figma 6:1558 (passo 32); §1 proximidade entre grupos",
          },
          {
            decision: "Padding horizontal de controles 8–12 px, maior que o vertical",
            rule: "§1 padding interno de controles",
          },
        ]}
      />
    </DocPage>
  );
}
