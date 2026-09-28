/**
 * Agent personalization (Figma 27:7372). Fase 7 — spec, item 7. A mesma página real de
 * /settings/agent-personalization, com H2 (o H1 já é o título desta página de documentação).
 */
import { AgentPersonalizationPage } from "@/features/agent/personalization";
import { Decisions, DocPage, DocSection } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

export function Page() {
  return (
    <DocPage
      title="Agent personalization"
      description="Página de settings: Guidance (Field + TextArea), Skills e MCP connectors — linhas vazias com botão dentro de um container com borda."
    >
      <DocSection title="Temas" description="Escuro e claro lado a lado.">
        <ThemePair>
          {() => (
            <div className="max-w-140">
              <AgentPersonalizationPage headingLevel="h2" />
            </div>
          )}
        </ThemePair>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Linha vazia com ícone, título, texto e botão (SettingsEmptyRow)",
            rule: "spec, item 7 — mesmo espírito do EmptyState central da Fase 4, layout de linha dentro de um container com borda",
          },
          {
            decision: "Guidance reaproveita Field + TextArea, sem limite visível de linhas",
            rule: "spec, item 7 e Comportamento",
          },
        ]}
      />
    </DocPage>
  );
}
