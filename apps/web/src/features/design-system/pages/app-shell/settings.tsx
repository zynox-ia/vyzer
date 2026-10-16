/**
 * Layout de Settings (Fase 8, Figma 33:20122 + 33:20615): "Back to app" e busca no topo da nav,
 * seções (Personal, Issues, Projects, Features, Administration, Your teams) e o slot de conteúdo.
 * Exemplo de conteúdo nesta fase: só Preferences (spec, "Escopo de Settings").
 */
import { SettingsLayout } from "@/layouts/app-shell/settings-layout";
import { DEFAULT_PREFERENCE_VALUES, PreferencesView } from "@/features/settings/preferences";
import { setThemePreference } from "@zynox/design-system/theme";
import { useState } from "react";
import { SETTINGS_GROUPS } from "@/features/settings/nav-data";
import { Decisions, DocPage, DocSection } from "../../kit/doc";
import { suppressLinkNavigation } from "../../kit/shell-frame";
import { ThemePair } from "../../kit/theme-frame";

/** A documentação mostra a tela com estado local, sem chamar a API de preferências. */
function DocPreferences() {
  const [values, setValues] = useState(DEFAULT_PREFERENCE_VALUES);
  return (
    <PreferencesView
      headingLevel="h2"
      values={values}
      onChange={(patch) => {
        setValues((current) => ({ ...current, ...patch }));
        if (patch.interfaceTheme) setThemePreference(patch.interfaceTheme);
      }}
    />
  );
}

function Demo({ label }: { label: string }) {
  return (
    // A nav de Settings é feita de links de verdade: a captura evita navegar para fora da
    // documentação (react-router não aceita um <Router> aninhado dentro do já ativo aqui).
    <div
      onClickCapture={suppressLinkNavigation}
      className="h-150 overflow-hidden rounded-container border border-subtle"
    >
      <SettingsLayout backTo="/projects" groups={SETTINGS_GROUPS} label={label} landmark={false}>
        <DocPreferences />
      </SettingsLayout>
    </div>
  );
}

export function Page() {
  return (
    <DocPage
      title="Settings"
      description="Nav lateral por seções (Personal, Issues, Projects, Features, Administration, Your teams) e o slot de conteúdo, no mesmo template das outras telas. Só o container e o exemplo de Preferences: as demais páginas ficam para quando cada área do produto for construída."
    >
      <DocSection title="Demonstração" description="Escuro e claro lado a lado.">
        <ThemePair>{(theme) => <Demo label={`Settings (${theme})`} />}</ThemePair>
      </DocSection>

      <DocSection title="Anatomia">
        <ul className="flex max-w-prose list-disc flex-col gap-1 pl-5 text-body-md text-secondary">
          <li>"Back to app" volta para a última tela do shell (não reabre a home).</li>
          <li>Busca (client-side, sem dados reais nesta fase).</li>
          <li>Seções: Personal, Issues, Projects, Features, Administration, Your teams.</li>
          <li>
            Slot de conteúdo: só Preferences nesta fase (reaproveita Select, Switch e Field já
            existentes).
          </li>
        </ul>
      </DocSection>

      <DocSection title="Diretrizes">
        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="type-heading-3 text-primary">Teclado e acessibilidade</h3>
            <ul className="flex flex-col gap-1 pl-5 text-body-md text-secondary">
              <li className="list-disc">Lista de links comum, roteada por react-router.</li>
              <li className="list-disc">
                Item ativo com <code className="font-mono text-code">aria-current="page"</code>.
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="type-heading-3 text-primary">Fora do escopo</h3>
            <ul className="flex flex-col gap-1 pl-5 text-body-md text-secondary">
              <li className="list-disc">
                Conteúdo das demais páginas (Profile, Labels, Members…).
              </li>
              <li className="list-disc">
                Regra de visibilidade por Role (Admin vê Administration).
              </li>
            </ul>
          </div>
        </div>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Só o container e o exemplo de Preferences nesta fase",
            rule: "Spec fase-8-app-shell.md, decisão 4 (recomendação aprovada)",
          },
          {
            decision: "Administration e Your teams sempre no container, sem regra de Role",
            rule: "Spec, item 4 — visibilidade por Role é comportamento de produto",
          },
        ]}
      />
    </DocPage>
  );
}
