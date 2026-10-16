import {
  IconPicker,
  IconPickerPanel,
  PopoverSurface,
  ProjectIcon,
  PropertyButton,
  type ProjectIconValue,
} from "@zynox/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { FREQUENT_EMOJIS } from "../../kit/project-data";

function LiveIconPicker() {
  const [value, setValue] = useState<ProjectIconValue>({
    kind: "icon",
    name: "Box",
    color: "grey",
  });
  return (
    <IconPicker value={value} onValueChange={setValue} frequentEmojis={FREQUENT_EMOJIS}>
      <PropertyButton leading={<ProjectIcon value={value} />}>Icon</PropertyButton>
    </IconPicker>
  );
}

/** Painel aberto e fixo na página, numa das abas. */
function StaticPanel({ initial }: { initial: ProjectIconValue }) {
  const [value, setValue] = useState(initial);
  return (
    <PopoverSurface className="rounded-control">
      <IconPickerPanel value={value} onValueChange={setValue} frequentEmojis={FREQUENT_EMOJIS} />
    </PopoverSurface>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Icon Picker",
        description:
          'Escolha do ícone do projeto (Figma 1:1401, "Icon Project"): abas Icons e Emojis. Icons tem a cor do ícone (nove da paleta ou uma personalizada), busca e grade; Emojis tem busca e seções.',
        whenToUse: ["Ícone de projeto, time, view ou documento"],
        whenNotToUse: ["Ícones de status e prioridade: são fixos (Visual assets)"],
        playground: {
          preview: <LiveIconPicker />,
          controls: (
            <p className="text-body-sm text-secondary">
              Troque a cor, abra a cor personalizada (bolinha colorida depois da divisória) e digite
              um HEX ou arraste na área; busque &quot;rocket&quot; e escolha. Na aba Emojis, busque
              &quot;fire&quot;.
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-wrap items-start gap-8">
            <StaticPanel initial={{ kind: "icon", name: "Rocket", color: "orange" }} />
            <StaticPanel initial={{ kind: "icon", name: "Rocket", color: "#ff2fcd" }} />
            <StaticPanel initial={{ kind: "emoji", emoji: "🚀" }} />
          </div>
        ),
        states: null,
        statesNote:
          'Cor escolhida: amostra com marca branca. Cor personalizada: o botão da roda de cores fica com anel (pressionado), a linha mostra a amostra marcada e o HEX, e abaixo aparecem a área de saturação × brilho e a barra de matiz; HEX inválido fica em vermelho até Enter ou sair do campo, e volta ao valor anterior. Ícone ou emoji atual: fundo bg-selected. Hover: bg-hover. Busca sem resultado: "No icons found".',
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
          "Cor personalizada: Enter no HEX aplica; na área, Saturation e Brightness são controles deslizantes (setas, Home, End); na barra de matiz, ↑ ↓ e Home/End.",
          "Tab leva à busca e à grade; Enter ou Espaço escolhe.",
          "Esc fecha o popover.",
        ],
        accessibility: [
          'Cores são um radiogroup com o nome de cada cor ("Teal", "Orange").',
          "Cada ícone e emoji tem nome acessível; o atual tem aria-pressed.",
          'O botão "Set custom color" é um toggle (aria-pressed); a área é um grupo com dois controles deslizantes nomeados, e a matiz é o Slider do Radix.',
        ],
        content: ['Busca: "Search icons…", "Search emoji…".'],
        dos: ["Mostre o ícone escolhido no gatilho, na cor escolhida"],
        donts: ["Não use a cor do ícone para comunicar estado"],
        usage: `import { IconPicker, ProjectIcon } from "@zynox/design-system/components";

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
          {
            name: "frequentEmojis",
            type: "FrequentEmoji[]",
            description:
              "Emojis frequentes ({ emoji, label }), mostrados acima da lista sem busca. O histórico vem de quem usa o picker.",
          },
          {
            name: "children",
            type: "ReactElement",
            description:
              "Gatilho. Sem ele, o botão de ícone padrão: quadrado de 28 px, raio 4, fundo bg-pressed e o valor atual (Figma 26:6865).",
          },
          {
            name: "triggerLabel",
            type: "string",
            default: '"Choose icon"',
            description: "Nome acessível do botão de ícone padrão.",
          },
          {
            name: "ProjectIcon",
            type: "componente",
            description: "Mostra o valor escolhido em listas e gatilhos.",
          },
        ],
        decisions: [
          { decision: "Abas Icons e Emojis", rule: "Figma 1:1401; componente Tabs" },
          {
            decision:
              "Emojis: Frequently used acima da lista e seletor de tom de pele ao lado da busca",
            rule: "Figma 1:1401 (seção Frequently used); tom de pele pelo Frimousse, pedido do responsável",
          },
          {
            decision: "Nove cores de ícone, as mesmas dos labels",
            rule: "Figma 1:1401 (amostras de 22 px); ColorDot lg",
          },
          {
            decision:
              "Todos os ~1.850 ícones lucide: 371 curados em 15 categorias e os demais em More icons, carregados sob demanda",
            rule: "ADR-0013 (lucide é a biblioteca de ícones); curadoria ampliada pedida pelo responsável",
          },
          {
            decision: "Emojis: conjunto Unicode completo pelo Frimousse, com lista virtualizada",
            rule: "Dependência aprovada pelo responsável; dados Emojibase servidos pelo próprio app (sem CDN)",
          },
          {
            decision:
              "Divisória de 1 px e o botão de cor personalizada de 22 px depois das amostras",
            rule: "Figma 1:1424 e 1:1425",
          },
          {
            decision:
              "Cor personalizada em HSV: área de saturação × brilho e barra de matiz vertical",
            rule: "Referência enviada pelo responsável; modelo padrão de seletores de cor",
          },
          {
            decision: "Espectro e alça como utilitários fixos (bg-hue-spectrum, picker-handle)",
            rule: "AGENTS.md regra 2: o espectro é o dado mostrado, não valor de marca; fica no theme.css",
          },
          {
            decision: "Trocar a cor não fecha o popover; escolher um ícone ou emoji fecha",
            rule: "§7 Jakob (Linear): a cor se ajusta enquanto se vê o ícone",
          },
        ],
      }}
    />
  );
}
