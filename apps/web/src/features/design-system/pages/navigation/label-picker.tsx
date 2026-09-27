import {
  ColorDot,
  LabelPicker,
  LabelPickerPanel,
  PopoverSurface,
  PropertyButton,
  type LabelColor,
  type LabelItem,
} from "@vyzer/design-system/components";
import { Tag } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { INITIAL_LABELS } from "../../kit/project-data";

function useLabels(initial: LabelItem[], selected: string[] = []) {
  const [labels, setLabels] = useState(initial);
  const [value, setValue] = useState(selected);
  const onCreate = (name: string, color: LabelColor) => {
    const id = `${name.toLowerCase().replaceAll(/\s+/g, "-")}-${labels.length}`;
    setLabels((prev) => [...prev, { value: id, label: name, color }]);
    return id;
  };
  return { labels, value, onValueChange: setValue, onCreate };
}

function LiveLabelPicker() {
  const state = useLabels(INITIAL_LABELS);
  const chosen = state.labels.filter((l) => state.value.includes(l.value));
  const first = chosen[0];
  return (
    <LabelPicker {...state}>
      <PropertyButton
        leading={first ? <ColorDot color={first.color} /> : <Tag />}
        empty={chosen.length === 0}
      >
        {chosen.length === 0
          ? "Labels"
          : chosen.length === 1
            ? first?.label
            : `${chosen.length} labels`}
      </PropertyButton>
    </LabelPicker>
  );
}

/** Painel aberto e fixo na página, num dos estados do Figma. */
function StaticPanel({ initial, selected }: { initial: LabelItem[]; selected?: string[] }) {
  const state = useLabels(initial, selected);
  return (
    <PopoverSurface className="w-72">
      <LabelPickerPanel {...state} />
    </PopoverSurface>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Label Picker",
        description:
          'Multisseleção de labels (Figma 1:1105, "Add labels"): checkbox e bolinha de cor por linha, criação a partir da busca e escolha da cor do label novo.',
        whenToUse: [
          "Labels de issue e de projeto",
          "Qualquer marcação múltipla que a pessoa também cria na hora",
        ],
        whenNotToUse: [
          "Um só valor: use Combobox",
          "Opções fixas que ninguém cria: use Combobox com multiple",
        ],
        playground: {
          preview: <LiveLabelPicker />,
          controls: (
            <p className="text-body-sm text-secondary">
              Marque vários; digite um nome novo e escolha &quot;Create new workspace label&quot;
              para ir à escolha da cor.
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-wrap items-start gap-8">
            <figure className="flex flex-col gap-2">
              <figcaption className="text-caption text-secondary">Sem labels</figcaption>
              <StaticPanel initial={[]} />
            </figure>
            <figure className="flex flex-col gap-2">
              <figcaption className="text-caption text-secondary">Com labels</figcaption>
              <StaticPanel initial={INITIAL_LABELS} />
            </figure>
            <figure className="flex flex-col gap-2">
              <figcaption className="text-caption text-secondary">Com marcados</figcaption>
              <StaticPanel initial={INITIAL_LABELS} selected={["bug", "improvement"]} />
            </figure>
          </div>
        ),
        states: null,
        statesNote:
          'Lista vazia: dica "Start typing to create a new label". Busca sem igual: linha "Create new workspace label: “nome”". Depois de criar: lista de cores com "Pick a color for label"; a cor escolhida cria o label já marcado. Linha destacada: bg-selected em raio 8.',
        themes: () => <StaticPanel initial={INITIAL_LABELS} selected={["bug"]} />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Mesmo painel do Combobox (busca de 36 px, atalho em Kbd, linhas de 32 px). Cada linha
            tem checkbox de 14 px, bolinha de 9 px na cor do label e o nome. Sem números: na
            multisseleção a busca recebe todas as teclas.
          </p>
        ),
        keyboard: [
          "Digitar filtra; ↑ ↓ navegam; Enter marca ou desmarca sem fechar.",
          "Com uma busca sem igual, Enter na linha de criação passa para a escolha da cor.",
          "Esc fecha o popover.",
        ],
        accessibility: [
          "Linhas com aria-selected; a listbox é aria-multiselectable.",
          "A cor nunca é a única informação: o nome do label vem sempre ao lado.",
        ],
        content: [
          'Placeholder: "Add labels…" sem marcados; "Change or add labels…" com marcados.',
          "Nomes curtos, no singular (Bug, Feature, Improvement).",
        ],
        dos: ["Deixe criar na hora, sem sair do fluxo"],
        donts: ["Não use cores sem nome: a cor sozinha não identifica o label"],
        usage: `import { LabelPicker, PropertyButton } from "@vyzer/design-system/components";

<LabelPicker
  labels={labels}
  value={selected}
  onValueChange={setSelected}
  onCreate={(name, color) => createLabel(name, color).id}
>
  <PropertyButton leading={<Tag />} empty>Labels</PropertyButton>
</LabelPicker>`,
        props: [
          {
            name: "labels",
            type: "LabelItem[]",
            description: "{ value, label, color } de cada label.",
          },
          { name: "value", type: "string[]", description: "Labels marcados." },
          { name: "onValueChange", type: "(value: string[]) => void", description: "Marcação." },
          {
            name: "onCreate",
            type: "(name, color) => string",
            description: "Cria o label e devolve o valor dele (é marcado em seguida).",
          },
          {
            name: "shortcut",
            type: "string[]",
            default: '["P", "L"]',
            description: "Atalho mostrado no topo.",
          },
          { name: "children", type: "ReactElement", description: "Gatilho (Property Button)." },
        ],
        decisions: [
          { decision: "Checkbox de 14 px antes da cor", rule: "Figma 1:1105 (14 px, r4)" },
          { decision: "Bolinha de 9 px na cor do label", rule: "Figma 1:1105 (9 × 9)" },
          {
            decision: "Nove cores de label com nomes do Figma",
            rule: "Figma 1:1105 (Grey … Red); paleta OKLCH do design system",
          },
          {
            decision: "Criação em duas etapas: nome, depois cor",
            rule: "Figma 1:1105; §7 Jakob (Linear)",
          },
        ],
      }}
    />
  );
}
