/**
 * Empty state (Figma 1:6091, 1:6250 e 1:6294 como referência geral).
 */
import { Button, EmptyState, KbdSequence } from "@zynox/design-system/components";
import { Inbox, Layers, Plus, SearchX } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

type Example = "issues" | "inbox" | "search";

const EXAMPLES: Record<Example, ReactNode> = {
  issues: (
    <EmptyState
      icon={Layers}
      title="No issues yet"
      action={
        <>
          <Button variant="primary" icon={Plus}>
            Create issue
          </Button>
          <KbdSequence keys={["C"]} />
        </>
      }
    >
      Issues you create in this project show up here.
    </EmptyState>
  ),
  inbox: (
    <EmptyState icon={Inbox} title="You're all caught up">
      New notifications about your issues and projects land here.
    </EmptyState>
  ),
  search: (
    <EmptyState icon={SearchX} title="No results" action={<Button>Clear filters</Button>}>
      Nothing matches the current filters.
    </EmptyState>
  ),
};

function Showcase() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 desktop:grid-cols-3">
      {(Object.keys(EXAMPLES) as Example[]).map((k) => (
        <div key={k} className="rounded-container border border-default bg-panel">
          {EXAMPLES[k]}
        </div>
      ))}
    </div>
  );
}

function usePlayground() {
  const [example, setExample] = useState<Example>("issues");
  return {
    preview: EXAMPLES[example],
    controls: (
      <Field label="exemplo">
        <Segmented
          label="exemplo"
          value={example}
          onChange={setExample}
          options={[
            { value: "issues", label: "lista vazia" },
            { value: "inbox", label: "inbox" },
            { value: "search", label: "sem resultados" },
          ]}
        />
      </Field>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Empty state",
        description:
          "O que aparece quando uma lista, vista ou painel não tem nada: ícone, título, texto e a ação que resolve.",
        whenToUse: [
          "Lista ou vista sem itens (primeiro uso ou tudo resolvido)",
          "Busca ou filtro sem resultados",
        ],
        whenNotToUse: [
          "Enquanto carrega: use Skeleton",
          "Erro ao carregar: use Alert com a ação de tentar de novo",
        ],
        playground,
        showcase: <Showcase />,
        states: null,
        statesNote:
          "Estático. As ações seguem os estados do Button. Três situações: primeiro uso (com a ação de criar), tudo resolvido (sem ação) e sem resultados (limpar filtros).",
        themes: () => EXAMPLES.issues,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Coluna centralizada com 48 px acima e abaixo: ícone lucide de 32 px em text-tertiary,
            título de 16/500, texto de 13 px em text-secondary com até 320 px de largura e as ações
            (Buttons de 28 px) em linha, 16 px entre os blocos.
          </p>
        ),
        keyboard: ["Só as ações recebem foco."],
        accessibility: [
          "O ícone é decorativo (aria-hidden); o título diz o que está vazio.",
          "Texto primário e secundário ≥ 4,5:1 sobre as superfícies (Foundations → Colors).",
        ],
        content: [
          'Título curto sobre o que falta ("No issues yet"), sem culpar ninguém.',
          "Texto diz o que vai aparecer ali ou como mudar o resultado.",
        ],
        dos: ["Ofereça a ação que resolve", "Mostre o atalho da ação principal"],
        donts: ["Não use ilustrações ou cores de status", "Não deixe a área só em branco"],
        usage: `import { EmptyState } from "@zynox/design-system/components";

<EmptyState
  icon={Layers}
  title="No issues yet"
  action={<Button variant="primary" icon={Plus}>Create issue</Button>}
>
  Issues you create in this project show up here.
</EmptyState>`,
        props: [
          { name: "icon", type: "LucideIcon", description: "Ícone de 32 px." },
          { name: "title", type: "ReactNode", description: "O que está vazio." },
          { name: "children", type: "ReactNode", description: "Por que e o que fazer." },
          { name: "action", type: "ReactNode", description: "Botões; a ação principal primeiro." },
        ],
        decisions: [
          {
            decision: "Ícone lucide de 32 px em text-tertiary, sem ilustração",
            rule: "Biblioteca única de ícones (ADR-0013); terciário só em decoração (§4)",
          },
          {
            decision: "Título 16/500 e texto 13 px secundário, até 320 px",
            rule: "Escala de tipos existente; linha curta para centralizado",
          },
        ],
      }}
    />
  );
}
