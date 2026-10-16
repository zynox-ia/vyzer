/**
 * Toggle Group (Figma 18:870, chips de "Display properties" em 18:722 e 18:930).
 */
import { ToggleGroup, chipStyles } from "@zynox/design-system/components";
import { cn } from "@zynox/design-system/cn";
import { useId, useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { DEFAULT_PROPERTIES, LIST_PROPERTIES } from "../../kit/filter-data";
import { StatesGrid } from "../../kit/states";

/** Os chips do Figma 18:870, com o rótulo visível nomeando o grupo. */
function Properties({ initial = DEFAULT_PROPERTIES }: { initial?: string[] }) {
  const [value, setValue] = useState(initial);
  const labelId = useId();
  return (
    <div className="flex max-w-75 flex-col gap-3">
      <span id={labelId} className="text-label-sm text-secondary">
        Display properties
      </span>
      <ToggleGroup
        labelledBy={labelId}
        value={value}
        onValueChange={setValue}
        options={LIST_PROPERTIES}
      />
    </div>
  );
}

/**
 * Um chip do grupo em estado fixo, para a grade de estados: as mesmas classes do item
 * (chipStyles), com hover e foco reproduzidos por data-preview.
 */
function StateChip({
  on = false,
  preview,
  disabled,
}: {
  on?: boolean;
  preview?: "hover" | "focus";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      data-state={on ? "on" : "off"}
      data-preview={preview}
      disabled={disabled}
      className={cn(
        chipStyles.base,
        chipStyles.size.sm,
        chipStyles.variant.filled,
        chipStyles.interactive,
      )}
    >
      Status
    </button>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Toggle Group",
        description:
          'Chips que ligam e desligam de forma independente (Figma 18:870, "Display properties" em 18:722 e 18:930). Ligado: camada de pressionado e texto primário; desligado: relevo e texto secundário.',
        whenToUse: [
          "Escolher várias opções visíveis de uma vez: propriedades exibidas, colunas, filtros rápidos",
          "Poucas opções curtas que cabem em uma ou duas linhas",
        ],
        whenNotToUse: [
          "Escolha exclusiva entre visões: use Segmented Control",
          "Muitas opções ou com busca: use Combobox com multisseleção",
          "Uma única opção liga/desliga: use Switch ou Checkbox",
        ],
        playground: {
          preview: <Properties />,
          controls: (
            <p className="text-body-sm text-secondary">
              Clique para ligar e desligar; pelo teclado, Tab entra no grupo, as setas movem entre
              os chips e Espaço ou Enter alternam.
            </p>
          ),
        },
        showcase: <Properties />,
        states: (
          <StatesGrid
            states={[
              { label: "desligado", node: <StateChip /> },
              { label: "desligado + hover", node: <StateChip preview="hover" /> },
              { label: "ligado", node: <StateChip on /> },
              { label: "focus-visible", node: <StateChip preview="focus" /> },
              { label: "disabled", node: <StateChip disabled /> },
            ]}
          />
        ),
        themes: () => <Properties />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Chips de 24 px (o Chip filled de tamanho sm) com 8 px nas laterais e rótulo de 12
            px/500, 6 px entre si, quebrando linha. Desligado: fundo de controle forte, relevo e
            text-secondary. Ligado: a camada de pressionado por cima e text-primary.
          </p>
        ),
        keyboard: [
          "Tab entra no grupo pelo chip focado por último; Tab de novo sai.",
          "← → (e ↑ ↓) movem entre os chips, voltando ao início no fim.",
          "Espaço ou Enter ligam e desligam o chip focado.",
        ],
        accessibility: [
          "Radix ToggleGroup (type multiple): cada chip é um botão com aria-pressed.",
          "O grupo tem nome: label, ou labelledBy apontando para o rótulo visível.",
          "Ligado e desligado se distinguem por cor de texto e fundo; o estado também vai em aria-pressed.",
          "Texto em text-secondary e text-primary (≥ 4,5:1 nos dois temas).",
        ],
        content: ["Rótulos de uma ou duas palavras, na ordem em que aparecem na tela."],
        dos: [
          "Mantenha a ordem das opções igual à da tela",
          "Nomeie o grupo com um rótulo visível",
        ],
        donts: ["Não use para escolha exclusiva", "Não misture chips com e sem ícone"],
        usage: `import { ToggleGroup } from "@zynox/design-system/components";

<span id={labelId}>Display properties</span>
<ToggleGroup
  labelledBy={labelId}
  value={visible}
  onValueChange={setVisible}
  options={[{ value: "id", label: "ID" }, { value: "status", label: "Status" }]}
/>`,
        props: [
          { name: "value", type: "T[]", description: "Opções ligadas." },
          { name: "onValueChange", type: "(value: T[]) => void", description: "Mudança." },
          {
            name: "options",
            type: "{ value, label, disabled? }[]",
            description: "Opções, na ordem.",
          },
          { name: "label", type: "string", description: "Nome acessível do grupo." },
          {
            name: "labelledBy",
            type: "string",
            description: "Id do rótulo visível (no lugar de label).",
          },
          {
            name: "disabled",
            type: "boolean",
            default: "false",
            description: "Desabilita o grupo inteiro.",
          },
        ],
        decisions: [
          {
            decision: "Chips de 24 px, 12 px/500, 8 px nas laterais",
            rule: "Figma 18:871 (h 24, px 8, 12 Medium)",
          },
          {
            decision: "6 px entre os chips (Figma: ~5), quebrando linha",
            rule: "Figma 18:870; grid (skill §1); divergência já registrada",
          },
          {
            decision: "Desligado: fundo de controle forte, relevo e text-secondary",
            rule: "Figma 18:883 (#2a2b2c, anel 10% + contato, #9c9d9f)",
          },
          {
            decision: "Ligado: camada de pressionado e text-primary",
            rule: "Figma 18:871 (#3c3d3f, branco); mesmo padrão do Segmented Control em pílulas",
          },
          {
            decision: "Mesmas classes do Chip filled (chipStyles), sem cópia",
            rule: "§11 similaridade; o Display Options usa este componente",
          },
          {
            decision: "Hover só no fundo do desligado; foco pela linha de 1 px de campo",
            rule: "ADR-0013 (hover do Linear, foco de campo)",
          },
        ],
      }}
    />
  );
}
