/**
 * Sidebar do workspace (Unifie Refinement):
 * Barra lateral única (276 px) com wordmark, sitemap V3, card promocional e atalhos rápidos.
 * Documentação da camada de app (`apps/web/src/layouts/app-shell`), não peça de design system (AGENTS.md).
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
      description="Sidebar única (276 px) refinada no padrão Unifie, com logotipo Zynox, ações rápidas no cabeçalho (+, 🔍, ⋮), sitemap V3 com árvore minimalista e destaque âmbar, card promocional e rodapé de suporte/configurações."
    >
      <DocSection
        title="Demonstração"
        description="Escuro e claro lado a lado. A sidebar permanece escura com variáveis locais escopadas (.vz-sidebar)."
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
            <figcaption className="text-caption text-secondary">
              Recolhida — controle discreto para reabrir
            </figcaption>
            <ShellFrame theme="dark" height="h-100" defaultCollapsed={true}>
              <Sidebar label="Sidebar do workspace (recolhida)" />
              <div className="flex-1 bg-app" />
            </ShellFrame>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">
              Expandida ("[" ou toggle) — 276 px completa (+15%)
            </figcaption>
            <ShellFrame theme="dark" height="h-100" defaultCollapsed={false}>
              <Sidebar label="Sidebar do workspace (expandida)" />
              <div className="flex-1 bg-app" />
            </ShellFrame>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">
              Gaveta (abaixo de tablet:, 768 px) — aberta, ilustração estática (Radix Dialog)
            </figcaption>
            <div
              data-theme="dark"
              onClickCapture={suppressLinkNavigation}
              className="flex h-100 overflow-hidden rounded-container border border-subtle bg-app text-primary"
            >
              <AppShellProvider shortcuts={false}>
                <div className="vz-sidebar h-full w-[280px] border-r border-[var(--vz-sb-divider)] bg-[var(--vz-sb-bg)] shadow-lg">
                  <SidebarContent />
                </div>
              </AppShellProvider>
              <div className="flex-1 bg-scrim" />
            </div>
          </figure>
        </div>
        <Prose>
          Sidebar escura em qualquer tema (.vz-sidebar). Item ativo em container elevado (#151516),
          texto branco e borda sutil com 70% de opacidade (rgba(44, 44, 48, 0.7)), com chevron "&gt;" à direita.
          Subitens possuem conector de árvore contínuo com ticks horizontais e espaçamento discreto,
          destacando o item ativo em tom âmbar (#f5d18d) e alinhado perfeitamente com o texto superior.
        </Prose>
      </DocSection>

      <DocSection title="Anatomia">
        <ul className="flex max-w-prose list-disc flex-col gap-1 pl-5 text-body-md text-secondary">
          <li>Cabeçalho (64 px): Monograma em tile ("V"), logotipo Zynox e ações rápidas (+, 🔍, ⋮).</li>
          <li>Seções Home, Business e Platform com legendas pequenas muted.</li>
          <li>
            Itens raiz ativos: container rounded-[10px], fundo #151516, borda sutil (rgba(44, 44, 48, 0.7)), chevron
            "&gt;" à direita.
          </li>
          <li>
            Árvore de subitens: linha vertical contínua a x=20px com ticks horizontais flutuantes (espaçamento de 3px),
            alinhado horizontalmente com o texto do item superior.
          </li>
          <li>
            Card promocional: container com borda âmbar, título com dot brilhante, descrição e link
            com botão de seta externa.
          </li>
          <li>Rodapé: item "Support" com indicador "• Online" e item "Settings" abaixo.</li>
        </ul>
      </DocSection>

      <DocSection title="Diretrizes">
        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="type-heading-3 text-primary">Teclado</h3>
            <ul className="flex flex-col gap-1 pl-5 text-body-md text-secondary">
              <li className="list-disc">"[" recolhe/expande a barra lateral, de qualquer tela.</li>
              <li className="list-disc">
                Roving tabindex por lista: um alvo de Tab, ↑ ↓ navegam, Home/End vão às pontas.
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="type-heading-3 text-primary">Acessibilidade</h3>
            <ul className="flex flex-col gap-1 pl-5 text-body-md text-secondary">
              <li className="list-disc">
                Elemento raiz &lt;nav aria-label="Sidebar do workspace"&gt;.
              </li>
              <li className="list-disc">
                Contraste elevado mantido em todos os estados, obedecendo às preferências de
                acessibilidade.
              </li>
            </ul>
          </div>
        </div>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Barra lateral única com padrão Unifie",
            rule: "Remoção do trilho secundário de fundo escuro a pedido, unificando a navegação em uma única barra lateral elegante de 276 px de largura (+15%), com alta fidelidade visual às referências.",
          },
          {
            decision: "Árvore de subitens contínua com ticks horizontais e recuo refinado",
            rule: "Navegação hierárquica clara com conector vertical contínuo, ticks horizontais discretos separados por espaçamento de 3px e alinhamento do texto interno com o texto superior.",
          },
        ]}
      />
    </DocPage>
  );
}
