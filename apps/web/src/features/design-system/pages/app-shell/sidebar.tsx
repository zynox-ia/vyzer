/**
 * Sidebar do workspace (Fase 8, Figma 27:6905 → 1:6569): seletor de workspace, busca/criar issue,
 * navegação principal, seções recolhíveis e o rodapé de ajuda. Documentação da camada de app
 * (`apps/web/src/layouts/app-shell`), não peça de design system (AGENTS.md).
 */
import { Sidebar, SidebarContent } from "@/layouts/app-shell/sidebar";
import { AppShellProvider } from "@/layouts/app-shell/context";
import { Decisions, DocPage, DocSection, Prose } from "../../kit/doc";
import { ShellFrame, suppressLinkNavigation } from "../../kit/shell-frame";
import { THEMES, themeLabel } from "../../kit/theme-frame";

export function Page() {
  return (
    <DocPage
      title="Sidebar"
      description="Seletor de workspace, busca (⌘K) e criar issue (C), navegação principal, seções recolhíveis (Workspace, Favorites, Your teams, Try) e ajuda no rodapé."
    >
      <DocSection
        title="Demonstração"
        description="Escuro e claro lado a lado. Os links não navegam (cliques interceptados na moldura)."
      >
        <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
          {THEMES.map((theme) => (
            <figure key={theme} className="flex flex-col gap-2">
              <figcaption className="type-overline text-secondary">{themeLabel[theme]}</figcaption>
              <ShellFrame theme={theme} shortcuts={theme === "dark"}>
                <Sidebar label={`Sidebar do workspace (${themeLabel[theme]})`} />
                <div className="flex-1 bg-app" />
              </ShellFrame>
            </figure>
          ))}
        </div>
      </DocSection>

      <DocSection title="Estados">
        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-3">
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Expandida (padrão)</figcaption>
            <ShellFrame theme="dark" height="h-100" defaultCollapsed={false}>
              <Sidebar label="Sidebar do workspace (expandida)" />
              <div className="flex-1 bg-app" />
            </ShellFrame>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">
              Recolhida ("[") — some por completo, com um controle discreto para reabrir
            </figcaption>
            <ShellFrame theme="dark" height="h-100" defaultCollapsed={true}>
              <Sidebar label="Sidebar do workspace (recolhida)" />
              <div className="flex-1 bg-app" />
            </ShellFrame>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">
              Gaveta (abaixo de tablet:, 768 px) — aberta, ilustração estática (a real é um Radix
              Dialog com foco preso; veja o playground em <code>/projects</code>)
            </figcaption>
            {/* Estático, sem Dialog nem portal (o mesmo padrão de Dialog → DialogSurface): um
                Dialog modal de verdade marcaria o resto da página como aria-hidden. */}
            <div
              data-theme="dark"
              onClickCapture={suppressLinkNavigation}
              className="flex h-100 overflow-hidden rounded-container border border-subtle bg-app text-primary"
            >
              <AppShellProvider shortcuts={false}>
                <div className="h-full w-70 border-r border-default bg-sidebar shadow-lg">
                  <SidebarContent />
                </div>
              </AppShellProvider>
              <div className="flex-1 bg-scrim" />
            </div>
          </figure>
        </div>
        <Prose>
          Item ativo (aqui, "Projects") em <code className="font-mono text-code">text-accent</code>{" "}
          sobre <code className="font-mono text-code">bg-selected</code> — terracota só no item
          corrente da sidebar (ADR-0013). Hover só muda o fundo (camada{" "}
          <code className="font-mono text-code">bg-hover</code>); foco é a linha de campo (
          <code className="font-mono text-code">focus-ring</code>), sem acento nem halo. A seção
          "Favorites" fica oculta enquanto vazia (sem exemplo populado no Figma atual).
        </Prose>
      </DocSection>

      <DocSection title="Anatomia">
        <ul className="flex max-w-prose list-disc flex-col gap-1 pl-5 text-body-md text-secondary">
          <li>Cabeçalho: WorkspaceMenu (avatar 20 px + nome + chevron), busca e criar issue.</li>
          <li>Navegação principal: Inbox, Reviews (contador), My issues, Agent.</li>
          <li>Seção "Workspace": Projects, Views, More.</li>
          <li>Seção "Favorites": oculta sem itens.</li>
          <li>Seção "Your teams": por time, Home / Issues / Projects / Views indentados.</li>
          <li>
            Seção "Try": Invite people, Initiatives, Cycles ("Connect Cursor"/"Connect Codex" do
            Linear tirados a pedido do responsável, 28/09).
          </li>
          <li>Rodapé: botão de ajuda.</li>
        </ul>
      </DocSection>

      <DocSection title="Diretrizes">
        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="type-heading-3 text-primary">Teclado</h3>
            <ul className="flex flex-col gap-1 pl-5 text-body-md text-secondary">
              <li className="list-disc">"[" recolhe/expande a sidebar, de qualquer tela.</li>
              <li className="list-disc">
                Roving tabindex por lista: um alvo de Tab, ↑ ↓ navegam, Home/End vão às pontas.
              </li>
              <li className="list-disc">Enter ativa o item focado (link nativo).</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="type-heading-3 text-primary">Acessibilidade</h3>
            <ul className="flex flex-col gap-1 pl-5 text-body-md text-secondary">
              <li className="list-disc">
                <code className="font-mono text-code">nav</code> com{" "}
                <code className="font-mono text-code">aria-label</code>; item ativo com{" "}
                <code className="font-mono text-code">aria-current="page"</code>.
              </li>
              <li className="list-disc">
                Redimensionar por arraste é só de mouse; colapsar continua 100% por teclado.
              </li>
              <li className="list-disc">Gaveta do mobile: Radix Dialog (foco preso, Esc fecha).</li>
            </ul>
          </div>
        </div>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Recolher some por completo (não vira trilho de ícones)",
            rule: "Confirmado ao vivo no Linear, 28/09",
          },
          {
            decision: "Redimensionar por arraste, 200–360 px, padrão 244 px, em localStorage",
            rule: "Spec fase-8-app-shell.md, decisão 2 (recomendação aprovada)",
          },
          {
            decision: "Ícones de 16 px (size-icon-sm)",
            rule: "Spec, decisão 3 — pendência dos 14 px registrada em .figma/01-design-tokens.md",
          },
          {
            decision: "Item ativo em accent (terracota); hover e foco sem acento",
            rule: "ADR-0013 — terracota só no item ativo da sidebar e em contadores em destaque",
          },
          {
            decision: "Ícone de workspace via ProjectIcon, não iniciais",
            rule: "Avatar não tem iniciais (decisão já registrada); sem prop nova só para o pixel — divergência em .figma/01-design-tokens.md",
          },
        ]}
      />
    </DocPage>
  );
}
