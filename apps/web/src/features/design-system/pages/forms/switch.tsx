import { Field as FormField, Switch } from "@zynox/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { StatesGrid } from "../../kit/states";

export function Page() {
  const [on, setOn] = useState(true);
  return (
    <ComponentPage
      doc={{
        title: "Switch",
        description: "Liga ou desliga uma configuração com efeito imediato, sem botão de salvar.",
        whenToUse: ["Preferências que valem na hora (notificações, mostrar sub-issues)"],
        whenNotToUse: [
          "Opção que só vale ao enviar um formulário: use Checkbox",
          "Escolha entre mais de dois estados: use Radio ou Segmented Control",
        ],
        playground: {
          preview: (
            <FormField
              label="Show sub-issues"
              orientation="horizontal"
              description={
                on ? "Sub-issues appear under their parent." : "Only top-level issues are listed."
              }
            >
              <Switch checked={on} onCheckedChange={setOn} />
            </FormField>
          ),
          controls: <p className="text-body-sm text-secondary">Clique no switch ou no rótulo.</p>,
        },
        showcase: (
          <div className="flex items-center gap-6">
            <Switch aria-label="Off" />
            <Switch aria-label="On" defaultChecked />
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              { label: "off", node: <Switch aria-label="off" /> },
              { label: "on", node: <Switch aria-label="on" defaultChecked /> },
              { label: "focus-visible", node: <Switch aria-label="focus" data-preview="focus" /> },
              { label: "disabled", node: <Switch aria-label="disabled" disabled /> },
              {
                label: "disabled on",
                node: <Switch aria-label="disabled on" disabled defaultChecked />,
              },
            ]}
          />
        ),
        themes: () => (
          <div className="flex flex-col gap-2">
            <FormField label="Email notifications" orientation="horizontal">
              <Switch defaultChecked />
            </FormField>
            <FormField label="Show empty groups" orientation="horizontal">
              <Switch />
            </FormField>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Trilho de 22 × 14 px (bg-track desligado, bg-checked ligado) e botão redondo de 10 px na
            cor do painel, com 2 px de folga; desliza 8 px em 120 ms.
          </p>
        ),
        keyboard: ["Tab foca; Espaço alterna."],
        accessibility: [
          'Radix Switch: role="switch" e aria-checked.',
          "Trilho desligado ≥ 3:1 contra a superfície (mesma cor da borda de controle); botão ≥ 3:1 contra o trilho.",
          "Área de clique de 26 × 24 px.",
        ],
        content: ['Rótulo descreve o que fica ligado: "Email notifications".'],
        dos: ["Aplique a mudança na hora e confirme de forma discreta"],
        donts: ['Não peça "Salvar" depois de um switch'],
        usage: `import { Field, Switch } from "@zynox/design-system/components";

<Field label="Email notifications" orientation="horizontal">
  <Switch checked={on} onCheckedChange={setOn} />
</Field>`,
        props: [
          { name: "checked", type: "boolean", description: "Controlado." },
          { name: "defaultChecked", type: "boolean", description: "Não controlado." },
          { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Mudança." },
          { name: "disabled", type: "boolean", description: "Desabilita." },
        ],
        decisions: [
          { decision: "22 × 14 px, pílula", rule: "Figma 1:8507 (toggle 22 × 14, r72)" },
          {
            decision: "Ligado em text-primary, não acento",
            rule: "ADR-0013 controles ativos (Figma usa o accent do Linear)",
          },
          {
            decision: "Trilho desligado com a cor de border-control",
            rule: "§3 não textual ≥ 3:1",
          },
          { decision: "Deslize em 120 ms", rule: "§8 micro-interação 100–150 ms" },
          { decision: "Área de clique ampliada para 24 px de altura", rule: "§6 alvo mínimo" },
        ],
      }}
    />
  );
}
