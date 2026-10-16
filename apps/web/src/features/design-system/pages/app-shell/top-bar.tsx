/**
 * Top bar de página (Fase 8, Figma 1:5931): breadcrumbs + estrela de favorito + menu "…", abas de
 * view (Tabs) e ações à direita. Sem componente de Breadcrumb no design system hoje: composição
 * nova a partir dos tokens de texto e do IconButton.
 */
import { Box, Copy } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import { PageTabs, TopBar } from "@/layouts/app-shell/top-bar";
import { Decisions, DocPage, DocSection } from "../../kit/doc";
import { suppressLinkNavigation } from "../../kit/shell-frame";
import { ThemePair } from "../../kit/theme-frame";

function Demo({ label, favorite: initialFavorite = false }: { label: string; favorite?: boolean }) {
  const [tab, setTab] = useState("overview");
  const [favorite, setFavorite] = useState(initialFavorite);
  return (
    // Os breadcrumbs são links de verdade: a captura evita navegar para fora da documentação.
    <div onClickCapture={suppressLinkNavigation}>
      <TopBar
        className="rounded-container border-x border-t border-default"
        breadcrumbLabel={label}
        breadcrumbs={[
          { label: "Zynox", to: "/" },
          { label: "Projects", to: "/projects" },
          { label: "Mv School", icon: <Icon icon={Box} size="sm" /> },
        ]}
        favorite={favorite}
        onFavoriteChange={setFavorite}
        breadcrumbActions={<IconButton icon={Copy} label="Copy page URL" variant="ghost" />}
        tabs={
          <PageTabs
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: "overview", label: "Overview" },
              { value: "activity", label: "Activity" },
              { value: "issues", label: "Issues" },
            ]}
          />
        }
      />
    </div>
  );
}

export function Page() {
  return (
    <DocPage
      title="Top bar"
      description="Breadcrumb com estrela de favorito e menu de ações, abas de view (Tabs) e ações à direita — o padrão de cabeçalho das telas do shell (Figma 1:5931, e o equivalente dentro das telas completas)."
    >
      <DocSection title="Demonstração" description="Escuro e claro lado a lado.">
        <ThemePair>{(theme) => <Demo label={`Breadcrumb (${theme})`} />}</ThemePair>
      </DocSection>

      <DocSection title="Estados">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Sem favorito</figcaption>
            <div data-theme="dark" className="bg-app p-4">
              <Demo label="Breadcrumb (sem favorito)" favorite={false} />
            </div>
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Favoritado</figcaption>
            <div data-theme="dark" className="bg-app p-4">
              <Demo label="Breadcrumb (favoritado)" favorite={true} />
            </div>
          </figure>
        </div>
      </DocSection>

      <DocSection title="Diretrizes">
        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="type-heading-3 text-primary">Acessibilidade</h3>
            <ul className="flex flex-col gap-1 pl-5 text-body-md text-secondary">
              <li className="list-disc">
                Breadcrumb como <code className="font-mono text-code">nav</code> com{" "}
                <code className="font-mono text-code">aria-label="Breadcrumb"</code> e{" "}
                <code className="font-mono text-code">ol</code>/
                <code className="font-mono text-code">li</code>.
              </li>
              <li className="list-disc">
                A página atual é texto, não link, com{" "}
                <code className="font-mono text-code">aria-current="page"</code>.
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="type-heading-3 text-primary">Conteúdo</h3>
            <ul className="flex flex-col gap-1 pl-5 text-body-md text-secondary">
              <li className="list-disc">
                Mestre-detalhe (Inbox, Reviews): duas colunas na mesma área, sem painel adicional.
              </li>
              <li className="list-disc">
                Ações à direita: filtro, display options, notificações, fechar painel.
              </li>
            </ul>
          </div>
        </div>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Breadcrumb é composição de página, não componente de design system",
            rule: "Spec fase-8-app-shell.md, item 2 — sem frame isolado no Figma hoje",
          },
          {
            decision: "Abas de view reaproveitam Tabs (variant pills)",
            rule: "Spec, item 2 — Figma 1:5988",
          },
        ]}
      />
    </DocPage>
  );
}
