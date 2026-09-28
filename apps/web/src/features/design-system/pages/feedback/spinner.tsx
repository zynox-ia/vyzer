/**
 * Spinner: o glifo de carregamento do Button (LoaderCircle girando), solto.
 */
import { Button, Spinner } from "@vyzer/design-system/components";
import type { IconSize } from "@vyzer/design-system/icons";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

const SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];

function Showcase() {
  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-4">
        {SIZES.map((size) => (
          <Spinner key={size} size={size} />
        ))}
      </div>
      <p className="inline-flex items-center gap-2 text-body-md text-secondary">
        <Spinner />
        Loading issues…
      </p>
      <Button loading>Save</Button>
    </div>
  );
}

function usePlayground() {
  const [size, setSize] = useState<IconSize>("md");
  return {
    preview: <Spinner size={size} />,
    controls: (
      <Field label="size">
        <Segmented
          label="size"
          value={size}
          onChange={setSize}
          options={SIZES.map((s) => ({ value: s, label: s }))}
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
        title: "Spinner",
        description:
          "Carregamento sem valor conhecido: o mesmo glifo do Button em loading, girando, na cor do texto ao redor.",
        whenToUse: [
          "Espera curta sem andamento medido (buscar resultados, salvar)",
          "Dentro de um botão: use o loading do Button",
        ],
        whenNotToUse: [
          "Andamento medido: use Progress",
          "Carregar uma lista ou página: use Skeleton (mostra o layout que vem)",
        ],
        playground,
        showcase: <Showcase />,
        states: null,
        statesNote: "Sempre girando; some quando o conteúdo chega.",
        themes: () => <Showcase />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            LoaderCircle do lucide com o traço de 2,5 px, nos tamanhos de ícone (12 a 32 px),
            girando em 800 ms (animate-spin). Cor text-secondary por padrão; herda a do contexto com
            className.
          </p>
        ),
        keyboard: ["Não recebe foco."],
        accessibility: [
          'role="status" com o rótulo em texto oculto ("Loading"): anunciado quando aparece.',
          "Ao terminar, mova o foco ou anuncie o resultado; o spinner só some.",
        ],
        content: ['Rótulo diz o que carrega quando há mais de um ("Loading issues").'],
        dos: ["Ao lado de um texto curto que explica a espera"],
        donts: ["Não mostre vários spinners ao mesmo tempo", "Não bloqueie a tela inteira"],
        usage: `import { Spinner } from "@vyzer/design-system/components";

<Spinner />
<Spinner size="lg" label="Loading issues" />`,
        props: [
          {
            name: "size",
            type: '"xs" | "sm" | "md" | "lg" | "xl"',
            default: '"sm"',
            description: "12, 16, 20, 24 ou 32 px.",
          },
          {
            name: "label",
            type: "string",
            default: '"Loading"',
            description: "Texto para leitor de tela.",
          },
          { name: "className", type: "string", description: "Cor (text-*) e posição." },
        ],
        decisions: [
          {
            decision: "O glifo do Button em loading (LoaderCircle), sem desenho próprio",
            rule: "Reuso: uma forma só para carregar em todo o sistema",
          },
          { decision: "Giro de 800 ms, linear", rule: "Token animate-spin (Foundations → Motion)" },
        ],
      }}
    />
  );
}
