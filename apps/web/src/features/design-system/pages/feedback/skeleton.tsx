/**
 * Skeleton: sem desenho no Figma; a forma do conteúdo que carrega, pulsando na camada neutra.
 */
import { Avatar, Skeleton } from "@vyzer/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

const PEOPLE = [
  { name: "André Júnio", role: "Product" },
  { name: "Marina Costa", role: "Design" },
  { name: "Rafael Lima", role: "Engineering" },
];

/** Linhas de pessoas: avatar, nome e papel. */
function PeopleList({ loading }: { loading: boolean }) {
  return (
    <section
      aria-busy={loading}
      aria-label="Members"
      className="flex w-full max-w-80 flex-col gap-3"
    >
      {loading && <span className="sr-only">Loading members…</span>}
      {PEOPLE.map((p) =>
        loading ? (
          <div key={p.name} className="flex items-center gap-2">
            <Skeleton shape="avatar" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="w-2/3" />
              <Skeleton className="w-1/3" />
            </div>
          </div>
        ) : (
          <div key={p.name} className="flex items-center gap-2">
            <Avatar name={p.name} />
            <div className="flex flex-col">
              <span className="text-body-md text-primary">{p.name}</span>
              <span className="text-body-sm text-secondary">{p.role}</span>
            </div>
          </div>
        ),
      )}
    </section>
  );
}

function Showcase() {
  return (
    <div className="flex w-full max-w-80 flex-col gap-4">
      <Skeleton />
      <Skeleton className="w-2/3" />
      <Skeleton shape="block" />
      <div className="flex items-center gap-2">
        <Skeleton shape="avatar" size="sm" />
        <Skeleton shape="avatar" />
      </div>
    </div>
  );
}

function usePlayground() {
  const [state, setState] = useState<"loading" | "loaded">("loading");
  return {
    preview: <PeopleList loading={state === "loading"} />,
    controls: (
      <Field label="estado">
        <Segmented
          label="estado"
          value={state}
          onChange={setState}
          options={[
            { value: "loading", label: "carregando" },
            { value: "loaded", label: "carregado" },
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
        title: "Skeleton",
        description:
          "A forma do conteúdo que ainda está carregando: linha de texto, bloco e avatar, pulsando devagar. Sem desenho no Figma.",
        whenToUse: [
          "Primeira carga de uma lista, card ou painel cujo layout já se conhece",
          "Trocar o conteúdo sem pular a página quando ele chega",
        ],
        whenNotToUse: [
          "Espera curta de uma ação: use Spinner ou o loading do Button",
          "Andamento medido: use Progress",
        ],
        playground,
        showcase: <Showcase />,
        states: null,
        statesNote:
          "Pulsando (1,6 s, entre 100% e 50% de opacidade); com movimento reduzido fica parado. Some quando o conteúdo chega.",
        themes: () => <Showcase />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Camada neutra a 15% (bg-neutral-subtle, o fundo do Avatar sem foto). Linha de 12 px em
            pílula (cabe na linha de 20 px do texto de 13), bloco de raio de contêiner com a altura
            do que substitui e avatar nos tamanhos do Avatar (16 e 20 px).
          </p>
        ),
        keyboard: ["Não recebe foco."],
        accessibility: [
          "Cada forma é aria-hidden: não há nada a ler.",
          'O contêiner que carrega leva aria-busy="true" e um texto oculto ("Loading members…").',
          "Com prefers-reduced-motion, a pulsação para.",
        ],
        content: ["Imite o layout real: mesmo número de linhas e larguras variadas."],
        dos: ["Use as mesmas medidas do conteúdo final"],
        donts: ["Não misture skeleton e spinner na mesma área"],
        usage: `import { Skeleton } from "@vyzer/design-system/components";

<div aria-busy="true">
  <span className="sr-only">Loading members…</span>
  <Skeleton shape="avatar" />
  <Skeleton className="w-2/3" />
  <Skeleton shape="block" className="h-32" />
</div>`,
        props: [
          {
            name: "shape",
            type: '"line" | "block" | "avatar"',
            default: '"line"',
            description: "Linha de texto, bloco ou círculo.",
          },
          {
            name: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description: "Só no avatar: 16 ou 20 px.",
          },
          { name: "className", type: "string", description: "Largura e altura (w-2/3, h-32)." },
        ],
        decisions: [
          {
            decision: "Camada neutra a 15%, a do Avatar sem foto",
            rule: "Token existente (bg-neutral-subtle); sem cor nova",
          },
          {
            decision: "Pulsação de 1,6 s, parada com movimento reduzido",
            rule: "Token animate-pulse; §8 respeitar prefers-reduced-motion",
          },
        ],
      }}
    />
  );
}
