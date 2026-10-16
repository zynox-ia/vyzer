import { Checkbox, Field as FormField } from "@zynox/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { StatesGrid } from "../../kit/states";

type CheckState = "unchecked" | "checked" | "indeterminate";

function usePlayground() {
  const [checked, setChecked] = useState<CheckState>("checked");
  const [disabled, setDisabled] = useState<"no" | "yes">("no");
  return {
    preview: (
      <FormField label="Private team" orientation="horizontal" disabled={disabled === "yes"}>
        <Checkbox
          checked={checked === "indeterminate" ? "indeterminate" : checked === "checked"}
          onCheckedChange={(v) =>
            setChecked(v === "indeterminate" ? v : v ? "checked" : "unchecked")
          }
        />
      </FormField>
    ),
    controls: (
      <>
        <Field label="checked">
          <Segmented
            label="checked"
            value={checked}
            onChange={setChecked}
            options={[
              { value: "unchecked", label: "false" },
              { value: "checked", label: "true" },
              { value: "indeterminate", label: "indeterminate" },
            ]}
          />
        </Field>
        <Field label="disabled">
          <Segmented
            label="disabled"
            value={disabled}
            onChange={setDisabled}
            options={[
              { value: "no", label: "false" },
              { value: "yes", label: "true" },
            ]}
          />
        </Field>
      </>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Checkbox",
        description:
          "Marca uma opção independente ou vários itens de uma lista (seleção de linhas). Marcado usa a cor do texto primário, não o acento.",
        whenToUse: [
          "Opções que podem ser combinadas",
          "Seleção de várias linhas numa lista (bulk actions)",
        ],
        whenNotToUse: [
          "Opções exclusivas: use Radio",
          "Liga/desliga com efeito imediato: use Switch",
        ],
        playground,
        showcase: (
          <div className="flex items-center gap-6">
            <Checkbox aria-label="Unchecked" />
            <Checkbox aria-label="Checked" defaultChecked />
            <Checkbox aria-label="Indeterminate" checked="indeterminate" />
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              { label: "unchecked", node: <Checkbox aria-label="unchecked" /> },
              { label: "hover", node: <Checkbox aria-label="hover" data-preview="hover" /> },
              {
                label: "focus-visible",
                node: <Checkbox aria-label="focus" data-preview="focus" />,
              },
              { label: "checked", node: <Checkbox aria-label="checked" defaultChecked /> },
              {
                label: "indeterminate",
                node: <Checkbox aria-label="indeterminate" checked="indeterminate" />,
              },
              { label: "error", node: <Checkbox aria-label="error" invalid /> },
              { label: "disabled", node: <Checkbox aria-label="disabled" disabled /> },
              {
                label: "disabled checked",
                node: <Checkbox aria-label="disabled checked" disabled defaultChecked />,
              },
            ]}
          />
        ),
        themes: () => (
          <div className="flex flex-col gap-2">
            <FormField label="Private team" orientation="horizontal">
              <Checkbox defaultChecked />
            </FormField>
            <FormField label="Copy issues from template" orientation="horizontal">
              <Checkbox />
            </FormField>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Quadrado de 14 px com raio 4 e borda de controle; marcado ganha fundo text-primary e
            marca (check ou traço) em text-on-checked. Área de clique invisível de 24 px.
          </p>
        ),
        keyboard: ["Tab foca; Espaço alterna."],
        accessibility: [
          'Radix Checkbox: role="checkbox" e aria-checked (true, false, mixed).',
          "Rótulo clicável via Field horizontal.",
          "Borda ≥ 3:1 em todas as superfícies, inclusive linha selecionada.",
        ],
        content: ['Rótulo afirmativo: "Private team", não "Don\'t make public".'],
        dos: ['Use indeterminate no "selecionar todos" quando parte da lista está marcada'],
        donts: ["Não dispare ação imediata ao marcar (isso é Switch)"],
        usage: `import { Checkbox, Field } from "@zynox/design-system/components";

<Field label="Private team" orientation="horizontal">
  <Checkbox checked={value} onCheckedChange={setValue} />
</Field>`,
        props: [
          { name: "checked", type: 'boolean | "indeterminate"', description: "Controlado." },
          { name: "defaultChecked", type: "boolean", description: "Não controlado." },
          { name: "onCheckedChange", type: "(checked) => void", description: "Mudança de estado." },
          { name: "invalid", type: "boolean", description: "Borda de erro fora de um Field." },
          { name: "disabled", type: "boolean", description: "Desabilita." },
        ],
        decisions: [
          {
            decision: "14 px, raio 4, glifo de 10 px",
            rule: "Figma 1:5417 (14 × r3, consolidado em 4; marca de 10 × 9 com 2 px de folga)",
          },
          {
            decision: "Marcado em text-primary, não acento",
            rule: "ADR-0013 controles ativos; §3 orçamento de ênfase",
          },
          { decision: "Área de clique de 24 px", rule: "§6 alvo mínimo (14 + 2 × 5)" },
          { decision: "Borda border-control ≥ 3:1", rule: "§3 componentes não textuais" },
        ],
      }}
    />
  );
}
