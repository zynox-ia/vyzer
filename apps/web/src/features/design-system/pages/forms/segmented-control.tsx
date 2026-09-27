import { SegmentedControl, type SegmentedSize } from "@vyzer/design-system/components";
import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { StatesGrid } from "../../kit/states";

type Mode = "comment" | "update";

function usePlayground() {
  const [mode, setMode] = useState<Mode>("update");
  const [size, setSize] = useState<SegmentedSize>("sm");
  return {
    preview: (
      <SegmentedControl
        label="Post type"
        size={size}
        value={mode}
        onValueChange={setMode}
        options={[
          { value: "comment", label: "Comment" },
          { value: "update", label: "Update" },
        ]}
      />
    ),
    controls: (
      <Field label="size">
        <Segmented
          label="size"
          value={size}
          onChange={setSize}
          options={[
            { value: "sm", label: "sm" },
            { value: "md", label: "md" },
          ]}
        />
      </Field>
    ),
  };
}

function Static({ disabled }: { disabled?: boolean }) {
  return (
    <SegmentedControl
      label="Layout"
      value="list"
      onValueChange={() => {}}
      options={[
        { value: "list", label: "List" },
        { value: "board", label: "Board", disabled },
      ]}
    />
  );
}

export function Page() {
  const playground = usePlayground();
  const [layout, setLayout] = useState<"list" | "board">("list");
  return (
    <ComponentPage
      doc={{
        title: "Segmented Control",
        description:
          "Seletor em pílula (Figma 1:6366): um trilho com borda e a opção ativa em relevo. Troca o modo ou a visão sem sair da tela.",
        whenToUse: [
          "2 a 5 opções exclusivas de modo ou visão: Comment / Update, List / Board",
          "Quando o efeito é imediato na tela",
        ],
        whenNotToUse: [
          "Navegação entre páginas: use Tabs (Fase 5)",
          "Valores de formulário com rótulo: use Radio",
          "Mais de 5 opções: use Select",
        ],
        playground,
        showcase: (
          <div className="flex flex-wrap items-center gap-6">
            <SegmentedControl
              label="Post type"
              value="update"
              onValueChange={() => {}}
              options={[
                { value: "comment", label: "Comment" },
                { value: "update", label: "Update" },
              ]}
            />
            <SegmentedControl
              label="Layout"
              size="md"
              value={layout}
              onValueChange={setLayout}
              options={[
                { value: "list", label: "List", icon: List },
                { value: "board", label: "Board", icon: LayoutGrid },
              ]}
            />
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              { label: "ativo + inativo", node: <Static /> },
              { label: "opção desabilitada", node: <Static disabled /> },
            ]}
          />
        ),
        themes: () => (
          <SegmentedControl
            label="Post type"
            value="update"
            onValueChange={() => {}}
            options={[
              { value: "comment", label: "Comment" },
              { value: "update", label: "Update" },
            ]}
          />
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Trilho em pílula com borda border-default e fundo de controle; opções de 24 px (sm) ou
            28 px (md) com rótulo de 12 px/500. A ativa ganha fundo de controle forte, texto
            primário e o relevo (anel de 1 px + contato curto); as inativas ficam em text-secondary.
          </p>
        ),
        keyboard: [
          "Tab entra no grupo pela opção ativa.",
          "Setas movem o foco; Enter ou Espaço ativa.",
        ],
        accessibility: [
          "Radix ToggleGroup (type single): cada opção é um botão com aria-pressed; o grupo tem aria-label.",
          "Sempre há uma opção ativa: clicar na atual não desmarca.",
          "Opções inativas em text-secondary (≥ 4,5:1).",
        ],
        content: ["Rótulos de uma palavra, paralelos: Comment / Update, List / Board."],
        dos: ["Use para alternar visões da mesma informação"],
        donts: ["Não misture opções com e sem ícone no mesmo grupo"],
        usage: `import { SegmentedControl } from "@vyzer/design-system/components";

<SegmentedControl
  label="Post type"
  value={mode}
  onValueChange={setMode}
  options={[
    { value: "comment", label: "Comment" },
    { value: "update", label: "Update" },
  ]}
/>`,
        props: [
          { name: "label", type: "string", description: "Nome acessível do grupo." },
          { name: "value", type: "T", description: "Opção ativa." },
          { name: "onValueChange", type: "(value: T) => void", description: "Mudança." },
          {
            name: "options",
            type: "{ value, label, icon?, disabled? }[]",
            description: "Opções, na ordem.",
          },
          {
            name: "size",
            type: '"sm" | "md"',
            default: '"sm"',
            description: "Opções de 24 ou 28 px.",
          },
        ],
        decisions: [
          {
            decision: "Trilho em pílula com borda, opção ativa em relevo",
            rule: "Figma 1:6366 (Tab List)",
          },
          {
            decision: "Relevo = anel de 1 px a 9% + contato 0 0,5 1 1",
            rule: "Figma (anel branco 9% sobre #313133); token shadow-raised",
          },
          {
            decision: "Opções de 24 px, padding 8 px, 12 px/500",
            rule: "Figma 1:6367 (h 24, px 8, 12 Medium)",
          },
          {
            decision: "Inativa em text-secondary, ativa em text-primary",
            rule: "§4 rebaixar o que não está ativo",
          },
          { decision: "Sempre uma opção ativa", rule: "§7 lei de Jakob (comportamento do Linear)" },
        ],
      }}
    />
  );
}
