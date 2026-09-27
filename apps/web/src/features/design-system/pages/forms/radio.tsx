import { Field as FormField, Radio, RadioGroup } from "@vyzer/design-system/components";
import { ComponentPage } from "../../kit/component-page";
import { StatesGrid } from "../../kit/states";

function Single({
  label,
  ...rest
}: {
  label: string;
  checked?: boolean;
  preview?: string;
  disabled?: boolean;
}) {
  return (
    <RadioGroup value={rest.checked ? "a" : ""} aria-label={label} disabled={rest.disabled}>
      <Radio value="a" label={label} data-preview={rest.preview} />
    </RadioGroup>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Radio",
        description: "Escolha exatamente uma opção de um grupo pequeno, com todas visíveis.",
        whenToUse: ["2 a 5 opções exclusivas que a pessoa precisa comparar"],
        whenNotToUse: ["Mais de 5 opções: use Select", "Opções combináveis: use Checkbox"],
        playground: {
          preview: (
            <FormField label="Issue visibility" description="Who can see issues in this team.">
              <RadioGroup defaultValue="team">
                <Radio value="workspace" label="Everyone in the workspace" />
                <Radio value="team" label="Team members only" />
                <Radio value="private" label="Only me" />
              </RadioGroup>
            </FormField>
          ),
          controls: (
            <p className="text-body-sm text-secondary">Use as setas para mover a seleção.</p>
          ),
        },
        showcase: (
          <RadioGroup aria-label="Priority" defaultValue="high" className="flex-row gap-6">
            <Radio value="urgent" label="Urgent" />
            <Radio value="high" label="High" />
            <Radio value="low" label="Low" />
          </RadioGroup>
        ),
        states: (
          <StatesGrid
            states={[
              { label: "unchecked", node: <Single label="Weekly" /> },
              { label: "hover", node: <Single label="Weekly" preview="hover" /> },
              { label: "focus-visible", node: <Single label="Weekly" preview="focus" /> },
              { label: "checked", node: <Single label="Weekly" checked /> },
              { label: "disabled", node: <Single label="Weekly" disabled /> },
            ]}
          />
        ),
        themes: () => (
          <RadioGroup aria-label="Cycle length" defaultValue="2">
            <Radio value="1" label="1 week" />
            <Radio value="2" label="2 weeks" />
          </RadioGroup>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Círculo de 14 px com borda de controle; marcado ganha borda text-primary e ponto de 6
            px. Rótulo ao lado, clicável.
          </p>
        ),
        keyboard: [
          "Tab entra no grupo pela opção marcada e sai do grupo.",
          "Setas movem e marcam a opção.",
        ],
        accessibility: [
          'Radix RadioGroup: role="radiogroup" rotulado pelo Field (aria-labelledby).',
          'Cada opção é role="radio" com rótulo próprio.',
        ],
        content: ["Rótulos curtos e paralelos; a opção padrão primeiro ou marcada."],
        dos: ["Sempre com uma opção marcada por padrão"],
        donts: ["Não use um único radio sozinho"],
        usage: `import { Field, Radio, RadioGroup } from "@vyzer/design-system/components";

<Field label="Issue visibility">
  <RadioGroup value={value} onValueChange={setValue}>
    <Radio value="team" label="Team members only" />
    <Radio value="private" label="Only me" />
  </RadioGroup>
</Field>`,
        props: [
          { name: "RadioGroup.value", type: "string", description: "Controlado." },
          { name: "RadioGroup.onValueChange", type: "(value) => void", description: "Mudança." },
          { name: "Radio.value", type: "string", description: "Valor da opção." },
          { name: "Radio.label", type: "ReactNode", description: "Rótulo visível." },
        ],
        decisions: [
          {
            decision: "Círculo (rounded-full)",
            rule: "§5 a forma carrega significado (exclusivo)",
          },
          {
            decision: "14 px, igual ao checkbox; alvo de 24 px",
            rule: "§6 alturas iguais entre equivalentes; alvo mínimo",
          },
          { decision: "Gap de 8 px entre opções", rule: "§1 escala; §11 proximidade" },
          { decision: "Marcado em text-primary", rule: "ADR-0013 controles ativos" },
        ],
      }}
    />
  );
}
