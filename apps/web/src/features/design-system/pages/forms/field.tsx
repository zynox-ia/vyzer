import {
  Button,
  Checkbox,
  Field as FormField,
  FormLabel,
  FormMessage,
  HelperText,
  TextInput,
} from "@zynox/design-system/components";
import { ComponentPage } from "../../kit/component-page";
import { StatesGrid } from "../../kit/states";

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Field",
        description:
          "Estrutura de um campo de formulário: Label acima, Control, Description (Helper Text) e Error (Form Message). Liga tudo por id sem configuração.",
        whenToUse: [
          "Todo controle de formulário: Text Input, Text Area, Select, Radio Group, Checkbox, Switch",
        ],
        whenNotToUse: ["Busca de lista sem rótulo visível: Search Input com aria-label"],
        playground: {
          preview: (
            <form className="flex w-80 flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <FormField label="Team name" description="Shown in the sidebar." required>
                <TextInput size="lg" placeholder="Engineering" />
              </FormField>
              <FormField label="Team key" error="Team key is already in use. Try another." required>
                <TextInput size="lg" defaultValue="ENG" />
              </FormField>
              <FormField
                label="Private team"
                orientation="horizontal"
                description="Only members can see it."
              >
                <Checkbox />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary" type="submit">
                  Create team
                </Button>
              </div>
            </form>
          ),
          controls: (
            <p className="text-body-sm text-secondary">Formulário real de criação de Team.</p>
          ),
        },
        showcase: (
          <div className="grid max-w-3xl grid-cols-1 gap-6 tablet:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FormLabel htmlFor="fl-demo">Form Label</FormLabel>
              <TextInput id="fl-demo" placeholder="Controle" />
              <HelperText>Helper Text: orienta antes do erro.</HelperText>
            </div>
            <div className="flex flex-col gap-1.5">
              <FormLabel htmlFor="fm-demo" required>
                Required label
              </FormLabel>
              <TextInput id="fm-demo" invalid defaultValue="…" />
              <FormMessage>Form Message: o que houve e como corrigir.</FormMessage>
            </div>
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              {
                label: "com ajuda",
                node: (
                  <FormField label="Name" description="Your full name.">
                    <TextInput placeholder="André Júnio" />
                  </FormField>
                ),
              },
              {
                label: "obrigatório",
                node: (
                  <FormField label="Email" required>
                    <TextInput placeholder="name@company.com" />
                  </FormField>
                ),
              },
              {
                label: "erro",
                node: (
                  <FormField label="Email" error="Enter a valid email.">
                    <TextInput defaultValue="andre@" />
                  </FormField>
                ),
              },
              {
                label: "desabilitado",
                node: (
                  <FormField label="Workspace" disabled>
                    <TextInput defaultValue="Zynox" />
                  </FormField>
                ),
              },
            ]}
          />
        ),
        themes: () => (
          <div className="flex w-full max-w-72 flex-col gap-4">
            <FormField label="Display name" description="How others see you.">
              <TextInput placeholder="André" />
            </FormField>
            <FormField label="Username" error="Username is taken. Try another.">
              <TextInput defaultValue="andre" />
            </FormField>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Coluna com gap de 6 px: Label (13 px/500), Control, e embaixo Helper Text (12 px,
            secondary) ou Form Message (12 px, danger-strong, com ícone). No modo horizontal
            (checkbox, switch) o rótulo fica à direita do controle e a ajuda alinha com o texto.
          </p>
        ),
        keyboard: ["Clicar no rótulo foca ou alterna o controle.", "Ordem de Tab = ordem visual."],
        accessibility: [
          "Label ligado por htmlFor/id; grupos (Radio Group) por aria-labelledby.",
          "aria-describedby aponta para a ajuda ou para o erro; aria-invalid no erro.",
          'Obrigatório: asterisco visual + "(required)" para leitores de tela + required no controle.',
          "Erro com ícone e texto: a cor não é o único indicador.",
        ],
        content: [
          "Rótulo curto, sentence case, sem dois-pontos.",
          'Erro: "Team key is already in use. Try another."',
        ],
        dos: ["Mostre a ajuda antes de a pessoa errar"],
        donts: ["Não use placeholder no lugar do rótulo"],
        usage: `import { Field, TextInput } from "@zynox/design-system/components";

<Field label="Team key" description="Used in issue IDs (ENG-123)." error={error} required>
  <TextInput value={key} onChange={…} />
</Field>`,
        props: [
          { name: "label", type: "ReactNode", description: "Rótulo visível." },
          { name: "description", type: "ReactNode", description: "Ajuda abaixo do controle." },
          {
            name: "error",
            type: "ReactNode",
            description: "Erro; substitui a ajuda e marca aria-invalid.",
          },
          {
            name: "required",
            type: "boolean",
            default: "false",
            description: "Marca e repassa required.",
          },
          {
            name: "disabled",
            type: "boolean",
            default: "false",
            description: "Repassa disabled ao controle.",
          },
          {
            name: "orientation",
            type: '"vertical" | "horizontal"',
            default: '"vertical"',
            description: "Horizontal para checkbox e switch.",
          },
          { name: "id", type: "string", description: "Id do controle (gerado se omitido)." },
        ],
        decisions: [
          { decision: "Rótulo sempre visível e acima", rule: "§14 placeholder não é rótulo" },
          {
            decision: "Gap 6 px dentro do campo; 16 px entre campos",
            rule: "§11 proximidade (razão ≥ 2)",
          },
          {
            decision: "Erro substitui a ajuda, com ícone",
            rule: "§14; §3 cor nunca é o único indicador",
          },
          {
            decision: "Validação ao sair do campo ou ao enviar",
            rule: "§14 não validar a cada tecla",
          },
        ],
      }}
    />
  );
}
