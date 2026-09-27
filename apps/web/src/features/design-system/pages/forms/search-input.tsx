import { SearchInput, type InputSize } from "@vyzer/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { StatesGrid } from "../../kit/states";

function usePlayground() {
  const [size, setSize] = useState<InputSize>("md");
  return {
    preview: (
      <div className="w-72">
        <SearchInput
          aria-label="Search issues"
          size={size}
          placeholder="Search issues…"
          defaultValue="login"
        />
      </div>
    ),
    controls: (
      <Field label="size">
        <Segmented
          label="size"
          value={size}
          onChange={setSize}
          options={(["sm", "md", "lg", "xl"] as InputSize[]).map((s) => ({ value: s, label: s }))}
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
        title: "Search Input",
        description: "Campo de busca com lupa, botão de limpar e Esc para limpar.",
        whenToUse: ["Filtrar uma lista ou tabela na tela", "Busca dentro de menus e seletores"],
        whenNotToUse: ["Busca global do produto: use o Command Menu (⌘K, Fase 6)"],
        playground,
        showcase: (
          <div className="flex max-w-72 flex-col gap-3">
            {(["sm", "md", "lg", "xl"] as InputSize[]).map((s) => (
              <SearchInput
                key={s}
                aria-label={`Search ${s}`}
                size={s}
                placeholder="Search issues…"
              />
            ))}
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              { label: "vazio", node: <SearchInput aria-label="vazio" placeholder="Search…" /> },
              {
                label: "com texto",
                node: <SearchInput aria-label="com texto" defaultValue="login" />,
              },
              {
                label: "focus",
                node: <SearchInput aria-label="focus" defaultValue="login" data-preview="focus" />,
              },
              {
                label: "disabled",
                node: <SearchInput aria-label="disabled" placeholder="Search…" disabled />,
              },
            ]}
          />
        ),
        themes: () => (
          <SearchInput
            aria-label="Search projects"
            placeholder="Search projects…"
            defaultValue="Mobile"
          />
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Text Input com ícone de lupa à esquerda e, quando há texto, Icon Button de limpar (24
            px) à direita.
          </p>
        ),
        keyboard: [
          "Esc limpa o texto (quando há texto) e mantém o foco.",
          "Tab alcança o botão de limpar.",
        ],
        accessibility: [
          'type="search" (papel searchbox); passe aria-label ou use dentro de Field.',
          'Botão de limpar com nome "Clear search".',
        ],
        content: ['Placeholder diz o que se busca: "Search issues…".'],
        dos: ["Filtre enquanto digita quando a lista é local"],
        donts: ["Não esconda o botão de limpar quando há texto"],
        usage: `import { SearchInput } from "@vyzer/design-system/components";

<SearchInput aria-label="Search issues" placeholder="Search issues…" onChange={…} onClear={…} />`,
        props: [
          {
            name: "onClear",
            type: "() => void",
            description:
              "Chamado ao limpar pelo botão ou Esc; o onChange também recebe o valor vazio (busca na URL continua funcionando).",
          },
          {
            name: "size",
            type: "InputSize",
            default: '"md"',
            description: "24 · 28 · 32 · 40 px.",
          },
          { name: "…", type: "TextInputProps", description: "Exceto icon, trailing e type." },
        ],
        decisions: [
          { decision: "Busca de 28 px com raio 8", rule: "Figma: busca da sidebar 28 × r8" },
          { decision: "Esc limpa", rule: "§7 lei de Jakob (padrão do Linear)" },
          { decision: "Botão de limpar só com texto", rule: "§7 divulgação progressiva" },
        ],
      }}
    />
  );
}
