import { Field as FormField, Select, type ListOption } from "@zynox/design-system/components";
import { PriorityIcon } from "@zynox/design-system/icons";
import { CalendarRange } from "lucide-react";
import { ComponentPage } from "../../kit/component-page";
import { StatesGrid } from "../../kit/states";

type P = "none" | "urgent" | "high" | "medium" | "low";

const priorities: ListOption<P>[] = [
  { value: "none", label: "No priority", icon: <PriorityIcon priority="none" /> },
  { value: "urgent", label: "Urgent", icon: <PriorityIcon priority="urgent" /> },
  { value: "high", label: "High", icon: <PriorityIcon priority="high" /> },
  { value: "medium", label: "Medium", icon: <PriorityIcon priority="medium" /> },
  { value: "low", label: "Low", icon: <PriorityIcon priority="low" /> },
];

const cycleIcon = <CalendarRange className="size-4 text-secondary" />;

const cycles: ListOption[] = [
  { value: "1", label: "1 week", icon: cycleIcon },
  { value: "2", label: "2 weeks", icon: cycleIcon },
  { value: "3", label: "3 weeks", icon: cycleIcon },
];

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Select",
        description:
          "Escolha de um valor numa lista curta, sem busca (Radix Select). Mesmo visual dos dropdowns de propriedade do Figma. Gatilho de campo (formulário) ou de chip (propriedade).",
        whenToUse: ["Até ~10 opções conhecidas", "Campo de formulário com valor único"],
        whenNotToUse: [
          "Listas longas ou que pedem busca: use Combobox",
          "2 a 5 opções visíveis de uma vez: use Radio ou Segmented Control",
        ],
        playground: {
          preview: (
            <div className="flex w-72 flex-col gap-4">
              <FormField label="Cycle length">
                <Select options={cycles} defaultValue="2" />
              </FormField>
              <Select
                trigger="chip"
                aria-label="Priority"
                options={priorities}
                defaultValue="high"
              />
            </div>
          ),
          controls: (
            <p className="text-body-sm text-secondary">
              Setas navegam, letras pulam, Enter escolhe, Esc fecha.
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-wrap items-start gap-6">
            <div className="w-56">
              <Select aria-label="Priority field" options={priorities} placeholder="Set priority" />
            </div>
            <Select
              trigger="chip"
              aria-label="Priority chip"
              options={priorities}
              defaultValue="urgent"
            />
            <Select
              trigger="button"
              aria-label="Cycle button"
              className="w-30"
              options={cycles}
              defaultValue="2"
            />
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              {
                label: "placeholder",
                node: <Select aria-label="p" options={cycles} placeholder="Select…" />,
              },
              {
                label: "com valor",
                node: <Select aria-label="v" options={cycles} defaultValue="1" />,
              },
              { label: "erro", node: <Select aria-label="e" options={cycles} invalid /> },
              {
                label: "disabled",
                node: <Select aria-label="d" options={cycles} defaultValue="1" disabled />,
              },
            ]}
          />
        ),
        themes: () => (
          <div className="flex w-full max-w-64 flex-col gap-3">
            <Select aria-label="Cycle" options={cycles} defaultValue="2" portal={false} />
            <Select
              trigger="chip"
              aria-label="Priority"
              options={priorities}
              defaultValue="medium"
              portal={false}
            />
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Gatilho field: caixa de 32 px como o Text Input, na largura do conteúdo, com chevron.
            Gatilho chip: Property Button. Popover de raio 12 com linhas de 32 px, destaque de raio
            8 e marcação à direita.
          </p>
        ),
        keyboard: [
          "Enter, Espaço ou ↓ abrem; ↑ ↓ navegam; letras pulam; Enter escolhe; Esc fecha.",
        ],
        accessibility: [
          'Radix Select: role="combobox" no gatilho e "listbox" na lista.',
          "Dentro de Field: rótulo, ajuda e erro ligados ao gatilho.",
        ],
        content: ["Opções curtas e paralelas; placeholder diz o que escolher."],
        dos: ["Ordene por significado (prioridade) ou alfabeticamente"],
        donts: ["Não use para mais de ~10 opções sem busca"],
        usage: `import { Field, Select } from "@zynox/design-system/components";

<Field label="Cycle length">
  <Select options={[{ value: "1", label: "1 week" }, …]} value={v} onValueChange={setV} />
</Field>
<Select trigger="chip" aria-label="Priority" options={priorities} value={p} onValueChange={setP} />`,
        props: [
          {
            name: "options",
            type: "ListOption[]",
            description: "{ value, label, icon?, group?, disabled? }.",
          },
          { name: "value / defaultValue", type: "string", description: "Controlado ou não." },
          { name: "onValueChange", type: "(value) => void", description: "Mudança." },
          {
            name: "trigger",
            type: '"field" | "chip" | "button"',
            default: '"field"',
            description:
              "Aparência do gatilho. button: 24 px, raio 8, com chevron, para Display Options.",
          },
          { name: "placeholder", type: "string", default: '"Select…"', description: "Sem valor." },
          {
            name: "portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema.",
          },
        ],
        decisions: [
          {
            decision: "Popover de raio 12, borda forte, sombra md",
            rule: "Figma 1:935 (r12, borda #323336)",
          },
          {
            decision: "Linhas de 32 px, destaque de raio 8 a 6 px da borda",
            rule: "Figma 1:1000 (h 32, r8, inset 6)",
          },
          {
            decision: "Ícone de 16, gap 8, rótulo 13 px",
            rule: "Figma 1:951 (16, gap 8, 13 Regular)",
          },
          {
            decision: "Marcação do selecionado à direita, em text-secondary",
            rule: "Figma 1:961 (check 16)",
          },
          {
            decision: "Gatilho field com as mesmas alturas do Text Input",
            rule: "§6 alturas iguais entre equivalentes",
          },
          {
            decision: "Gatilho field: borda border-field, padding 12 px, foco sem acento",
            rule: "Figma 13:2010 (#2f3033, pl 12); foco pedido pelo responsável",
          },
          {
            decision: "Gatilho field e chip na largura do conteúdo",
            rule: "Pedido do responsável; §14 a largura sugere o tamanho do conteúdo",
          },
          {
            decision: "Lista e opções sem o halo de foco; o destaque é só o fundo bg-selected",
            rule: "Pedido do responsável: o halo terracota poluía a lista",
          },
          {
            decision: "Foco do chip igual ao hover (fundo de hover), sem terracota nem halo",
            rule: "Pedido do responsável (mesmo padrão do Property Button)",
          },
          {
            decision: "Gatilho chip com padding 8 px à esquerda e 10 px à direita",
            rule: "Pedido do responsável: +2 px sobre o Figma (6 / 8) para dar respiro",
          },
          {
            decision:
              "Gatilho button: 24 px, raio 8, relevo, 12 px Regular, chevron de 12 e foco em linha de 1 px",
            rule: "Figma 18:757 (Display Options); foco do sistema (focus-ring)",
          },
          {
            decision: "Slot de ícone de 16 px só quando alguma opção da lista tem ícone",
            rule: "Pedido do responsável: lista só de texto sem recuo vazio (vale também para o Combobox)",
          },
        ],
      }}
    />
  );
}
