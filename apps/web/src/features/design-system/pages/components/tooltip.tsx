/**
 * Tooltip: sem desenho no Figma; segue o Linear (rótulo curto, atalho à direita). Os exemplos
 * abertos são estáticos (TooltipSurface); o comportamento real está no playground.
 */
import {
  IconButton,
  Tooltip,
  TooltipProvider,
  TooltipSurface,
} from "@vyzer/design-system/components";
import { Filter, Link2, SlidersHorizontal, SquarePen } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

type Side = "top" | "bottom";

/** Barra de ícones do topo de uma lista: tooltips vizinhos abrem na hora depois do primeiro. */
function Toolbar({ side }: { side: Side }) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip content="Create issue" shortcut={["C"]} side={side}>
          <IconButton icon={SquarePen} label="Create issue" />
        </Tooltip>
        <Tooltip content="Filter" shortcut={["F"]} side={side}>
          <IconButton icon={Filter} label="Filter" />
        </Tooltip>
        <Tooltip
          content="Display options"
          shortcut={["Ctrl", "⇧", "V"]}
          shortcutMode="plus"
          side={side}
        >
          <IconButton icon={SlidersHorizontal} label="Display options" />
        </Tooltip>
        <Tooltip content="Copy link" side={side}>
          <IconButton icon={Link2} label="Copy link" />
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function Static() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <TooltipSurface content="Copy link" />
      <TooltipSurface content="Create issue" shortcut={["C"]} />
      <TooltipSurface content="Go to inbox" shortcut={["G", "I"]} />
      <TooltipSurface content="Display options" shortcut={["Ctrl", "⇧", "V"]} shortcutMode="plus" />
    </div>
  );
}

function usePlayground() {
  const [side, setSide] = useState<Side>("bottom");
  return {
    preview: <Toolbar side={side} />,
    controls: (
      <>
        <Field label="side">
          <Segmented
            label="side"
            value={side}
            onChange={setSide}
            options={[
              { value: "bottom", label: "bottom" },
              { value: "top", label: "top" },
            ]}
          />
        </Field>
        <p className="self-end text-body-sm text-secondary">
          Passe o mouse (abre em 500 ms) ou use Tab (abre na hora); Esc fecha.
        </p>
      </>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Tooltip",
        description:
          "Rótulo curto que nomeia um controle, com o atalho opcional em Kbd. Sem desenho no Figma: segue o Linear, com a superfície e a sombra dos overlays do design system.",
        whenToUse: [
          "Nomear um Icon Button ou um controle só de ícone",
          "Mostrar o atalho de teclado de uma ação",
        ],
        whenNotToUse: [
          "Informação necessária para concluir a tarefa: mostre na tela (helper text)",
          "Conteúdo interativo (links, botões): use Popover",
          "Erros de campo: use a mensagem do Field",
        ],
        playground,
        showcase: <Static />,
        states: null,
        statesNote:
          "Fechado ou aberto. Abre no hover depois de --tooltip-delay (500 ms) e no foco por teclado sem atraso; entre tooltips vizinhos, na hora. Os exemplos abertos desta página são estáticos (mesmas classes, sem Radix); o comportamento real está no playground.",
        themes: () => <Static />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Superfície de popover (bg-popover, borda border-strong, raio de contêiner de 10 px,
            sombra sm) com 28 px de altura mínima, 10 px nas laterais e 4 px em cima e embaixo.
            Texto de 12 px Regular em text-primary; o atalho vem à direita em Kbd, 8 px depois.
            Largura máxima de 240 px; textos mais longos quebram linha. Fica 4 px distante do
            gatilho, embaixo por padrão.
          </p>
        ),
        keyboard: [
          "Tab no gatilho abre o tooltip na hora.",
          "Esc fecha; sair do gatilho (Tab ou mouse) também fecha.",
        ],
        accessibility: [
          'Radix Tooltip: o texto vira aria-describedby do gatilho (role="tooltip").',
          "O gatilho continua com o próprio nome (label do Icon Button); o tooltip só descreve.",
          "Nunca coloque conteúdo interativo: o tooltip some ao tirar o foco.",
          "Texto primário sobre bg-popover (≥ 4,5:1); atalho em text-secondary (≥ 4,5:1).",
        ],
        content: [
          'Duas a quatro palavras em sentence case, sem ponto final ("Create issue").',
          "O mesmo texto do nome do controle, mais o atalho quando existir.",
        ],
        dos: [
          "Coloque um TooltipProvider na raiz: tooltips vizinhos abrem sem novo atraso",
          "Mostre o atalho quando existir",
        ],
        donts: [
          "Não use tooltip em controle desabilitado sem foco (ninguém chega a ele pelo teclado)",
          "Não repita um rótulo que já está visível",
        ],
        usage: `import { Tooltip, TooltipProvider } from "@vyzer/design-system/components";

// Raiz da aplicação
<TooltipProvider>
  <App />
</TooltipProvider>

<Tooltip content="Create issue" shortcut={["C"]}>
  <IconButton icon={SquarePen} label="Create issue" />
</Tooltip>`,
        props: [
          { name: "content", type: "string", description: "Texto curto." },
          { name: "shortcut", type: "string[]", description: "Teclas do atalho." },
          {
            name: "shortcutMode",
            type: '"then" | "plus"',
            default: '"then"',
            description: "Teclas em sequência ou juntas.",
          },
          {
            name: "children",
            type: "ReactElement",
            description: "Gatilho focável (IconButton, Button).",
          },
          {
            name: "side",
            type: '"top" | "right" | "bottom" | "left"',
            default: '"bottom"',
            description: "Lado preferido; vira se faltar espaço.",
          },
          {
            name: "align",
            type: '"start" | "center" | "end"',
            default: '"center"',
            description: "Alinhamento com o gatilho.",
          },
          {
            name: "portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema do contêiner.",
          },
          {
            name: "TooltipProvider",
            type: "componente",
            description: "Atraso pelo token --tooltip-delay; um por aplicação.",
          },
        ],
        decisions: [
          {
            decision: "Sem desenho no Figma: segue o Linear (texto curto e atalho à direita)",
            rule: "Regra da spec de fundação: sem nó, segue o Linear com os tokens existentes (.figma/01-design-tokens.md, Sem design)",
          },
          {
            decision: "Abre em 500 ms no hover (--tooltip-delay); na hora entre vizinhos",
            rule: "§8 atraso de 400–700 ms na primeira, instantâneo entre tooltips vizinhos",
          },
          {
            decision: "Abre no foco por teclado sem atraso; Esc fecha",
            rule: "WCAG 1.4.13 (conteúdo em hover ou foco: dispensável e persistente)",
          },
          {
            decision: "Superfície de popover, borda forte e sombra sm",
            rule: "§9 tooltip < popover < modal (Foundations → Shadows)",
          },
          {
            decision: "Raio de contêiner (10 px)",
            rule: "Foundations → Radius (tooltip no papel contêiner, §5)",
          },
          {
            decision: "28 px de altura mínima, com ou sem atalho",
            rule: "O Kbd de 20 px cabe com 3 px de folga; mesma altura do Button (§6)",
          },
          {
            decision: "Texto de 12 px Regular em text-primary, atalho em Kbd a 8 px",
            rule: "§2 metadados em 12 px; §10 gap de 0,5 a 0,6 × a fonte, arredondado ao grid",
          },
          {
            decision: "Entra deslizando 4 px a partir do gatilho em 180 ms; sai com fade",
            rule: "§8 overlays 150–200 ms, deslocamento de 4 a 8 px (Foundations → Motion)",
          },
          {
            decision: "Embaixo do gatilho por padrão, virando se faltar espaço",
            rule: "Comportamento do Linear (§7 lei de Jakob); tooltip não rola, então pode virar",
          },
        ],
      }}
    />
  );
}
