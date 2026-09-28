/**
 * Painel de detalhes à direita (Fase 8, Figma 1:6113): largura fixa (~400 px), seções recolhíveis
 * (Properties, Milestones, Progress, Activity) no cabeçalho do ListGroup (Fase 5). O conteúdo de
 * cada seção é Fase 10 (Patterns) — fora do escopo aqui.
 */
import { Skeleton } from "@vyzer/design-system/components";
import { RightPanel, RightPanelSection } from "@/layouts/app-shell/right-panel";
import { AppShellProvider } from "@/layouts/app-shell/context";
import { Decisions, DocPage, DocSection, Prose } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

function Demo({ label, loading = false }: { label: string; loading?: boolean }) {
  return (
    // shortcuts=false: várias molduras na mesma página não podem competir pelo mesmo atalho.
    <AppShellProvider shortcuts={false} defaultRightPanelOpen>
      <RightPanel label={label} className="h-100 rounded-container border">
        {loading ? (
          <div className="flex flex-col gap-3 p-3">
            <Skeleton shape="line" className="h-4 w-24" />
            <Skeleton shape="block" className="h-20 w-full" />
            <Skeleton shape="line" className="h-4 w-32" />
            <Skeleton shape="block" className="h-16 w-full" />
          </div>
        ) : (
          <>
            <RightPanelSection title="Properties">
              <p className="text-body-sm text-secondary">Status, priority, lead, members, dates…</p>
            </RightPanelSection>
            <RightPanelSection title="Milestones">
              <p className="text-body-sm text-secondary">Sem milestones ainda.</p>
            </RightPanelSection>
            <RightPanelSection title="Progress" defaultOpen={false}>
              <p className="text-body-sm text-secondary">Scope 1 · Completed 0.</p>
            </RightPanelSection>
            <RightPanelSection title="Activity">
              <p className="text-body-sm text-secondary">
                André Júnio created the project · Sep 18
              </p>
            </RightPanelSection>
          </>
        )}
      </RightPanel>
    </AppShellProvider>
  );
}

export function Page() {
  return (
    <DocPage
      title="Painel de detalhes"
      description='Painel fixo ao lado do conteúdo (~400 px, não redimensionável), sem scrim — o nó do Figma para o scrim está vazio. Fecha com "]", Ctrl/⌘+I (sinônimos, aprovado em 28/09) ou pelo "×".'
    >
      <DocSection title="Demonstração" description="Escuro e claro lado a lado.">
        <ThemePair>{(theme) => <Demo label={`Project details (${theme})`} />}</ThemePair>
      </DocSection>

      <DocSection title="Estados">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Padrão</figcaption>
            <div data-theme="dark" className="bg-app p-4">
              <Demo label="Project details (padrão)" />
            </div>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Carregando</figcaption>
            <div data-theme="dark" className="bg-app p-4">
              <Demo label="Project details (carregando)" loading />
            </div>
          </figure>
        </div>
        <Prose>
          Fechado, o painel não ocupa espaço (sem trilho nem ícone residual): reabre pelo mesmo
          atalho ou pelo botão de ações da top bar.
        </Prose>
      </DocSection>

      <Decisions
        items={[
          {
            decision: 'Ctrl/⌘+I é sinônimo de "]"',
            rule: 'Decidido em 28/09 (spec fase-8-app-shell.md, decisão 1) — Linear: "Open sidebar details · Ctrl I"',
          },
          {
            decision: "Sem scrim: painel fixo ao lado do conteúdo, não overlay",
            rule: "Figma 1:6112 vazio — nenhum desenho de scrim hoje",
          },
          {
            decision: "Seções recolhíveis reaproveitam o cabeçalho do ListGroup (Fase 5)",
            rule: "Spec, item 3 — sem componente novo",
          },
        ]}
      />
    </DocPage>
  );
}
