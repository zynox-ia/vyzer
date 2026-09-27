import {
  IconPicker,
  IconPickerPanel,
  PopoverSurface,
  ProjectIcon,
  PropertyButton,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";

function LiveIconPicker() {
  const [value, setValue] = useState<ProjectIconValue>({
    kind: "icon",
    name: "Box",
    color: "grey",
  });
  return (
    <IconPicker value={value} onValueChange={setValue}>
      <PropertyButton leading={<ProjectIcon value={value} />}>Icon</PropertyButton>
    </IconPicker>
  );
}

/** Painel aberto e fixo na página, numa das abas. */
function StaticPanel({ initial }: { initial: ProjectIconValue }) {
  const [value, setValue] = useState(initial);
  return (
    <PopoverSurface className="rounded-control">
      <IconPickerPanel value={value} onValueChange={setValue} />
    </PopoverSurface>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Icon Picker",
        description:
          'Escolha do ícone do projeto (Figma 1:1401, "Icon Project"): abas Icons e Emojis. Icons tem a cor do ícone, busca e grade; Emojis tem busca e seções.',
        whenToUse: ["Ícone de projeto, time, view ou documento"],
        whenNotToUse: ["Ícones de status e prioridade: são fixos (Visual assets)"],
        playground: {
          preview: <LiveIconPicker />,
          controls: (
            <p className="text-body-sm text-secondary">
              Troque a cor, busque &quot;rocket&quot; e escolha; na aba Emojis, busque
              &quot;fire&quot;.
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-wrap items-start gap-8">
            <StaticPanel initial={{ kind: "icon", name: "Rocket", color: "orange" }} />
            <StaticPanel initial={{ kind: "emoji", emoji: "🚀" }} />
          </div>
        ),
        states: null,
        statesNote:
          'Cor escolhida: amostra com marca branca. Ícone ou emoji atual: fundo bg-selected. Hover: bg-hover. Busca sem resultado: "No icons found".',
        themes: () => <StaticPanel initial={{ kind: "icon", name: "Rocket", color: "orange" }} />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Popover de raio 8 e 408 px. Abas com sublinhado neutro; amostras de cor de 22 px
            distribuídas em 16 px de folga; busca entre hairlines; grade de 13 colunas com botões de
            28 px e ícones de 16 px tingidos na cor escolhida.
          </p>
        ),
        keyboard: [
          "← → trocam de aba (Tabs) e de cor.",
          "Tab leva à busca e à grade; Enter ou Espaço escolhe.",
          "Esc fecha o popover.",
        ],
        accessibility: [
          'Cores são um radiogroup com o nome de cada cor ("Teal", "Orange").',
          "Cada ícone e emoji tem nome acessível; o atual tem aria-pressed.",
        ],
        content: ['Busca: "Search icons…", "Search emoji…".'],
        dos: ["Mostre o ícone escolhido no gatilho, na cor escolhida"],
        donts: ["Não use a cor do ícone para comunicar estado"],
        usage: `import { IconPicker, ProjectIcon } from "@vyzer/design-system/components";

<IconPicker value={icon} onValueChange={setIcon}>
  <PropertyButton leading={<ProjectIcon value={icon} />}>Icon</PropertyButton>
</IconPicker>`,
        props: [
          {
            name: "value",
            type: "ProjectIconValue",
            description: '{ kind: "icon", name, color } ou { kind: "emoji", emoji }.',
          },
          {
            name: "onValueChange",
            type: "(value: ProjectIconValue) => void",
            description: "Escolha (fecha o popover).",
          },
          { name: "children", type: "ReactElement", description: "Gatilho." },
          {
            name: "ProjectIcon",
            type: "componente",
            description: "Mostra o valor escolhido em listas e gatilhos.",
          },
        ],
        decisions: [
          { decision: "Abas Icons e Emojis", rule: "Figma 1:1401; componente Tabs" },
          {
            decision: "Nove cores de ícone, as mesmas dos labels",
            rule: "Figma 1:1401 (amostras de 22 px); ColorDot lg",
          },
          {
            decision: "Ícones lucide e emojis Unicode nativos",
            rule: "ADR-0013 (lucide é a biblioteca de ícones); divergência registrada em .figma/",
          },
          {
            decision: "Botão de cor personalizada não implementado",
            rule: "Fora do escopo desta fase; divergência registrada em .figma/",
          },
        ],
      }}
    />
  );
}
