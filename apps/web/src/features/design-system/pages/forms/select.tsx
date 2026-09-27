import { Field as FormField, Select, type ListOption } from "@vyzer/design-system/components";
import { PriorityIcon } from "@vyzer/design-system/icons";
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

const cycles: ListOption[] = [
  { value: "1", label: "1 week" },
  { value: "2", label: "2 weeks" },
  { value: "3", label: "3 weeks" },
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
            Gatilho field: caixa de 28 px como o Text Input, com chevron. Gatilho chip: Property
            Button. Popover de raio 12 com linhas de 32 px, destaque de raio 8 e marcação à direita.
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
        usage: `import { Field, Select } from "@vyzer/design-system/components";

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
            type: '"field" | "chip"',
            default: '"field"',
            description: "Aparência do gatilho.",
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
        ],
      }}
    />
  );
}
