import { Field as FormField, PasswordInput } from "@zynox/design-system/components";
import { ComponentPage } from "../../kit/component-page";
import { StatesGrid } from "../../kit/states";

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Password Input",
        description: "Campo de senha com botão para mostrar e ocultar o texto.",
        whenToUse: ["Senhas e segredos que a pessoa digita"],
        whenNotToUse: ["Tokens exibidos pelo sistema: use Code Block com copiar (Fase 9)"],
        playground: {
          preview: (
            <div className="w-72">
              <FormField label="Password" description="At least 12 characters.">
                <PasswordInput size="lg" defaultValue="correct horse battery" />
              </FormField>
            </div>
          ),
          controls: (
            <p className="text-body-sm text-secondary">
              Use o botão do campo para mostrar e ocultar.
            </p>
          ),
        },
        showcase: (
          <div className="flex max-w-72 flex-col gap-3">
            <PasswordInput aria-label="Password lg" size="lg" />
            <PasswordInput aria-label="Password xl" size="xl" />
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              {
                label: "default",
                node: <PasswordInput aria-label="default" defaultValue="secret-password" />,
              },
              {
                label: "focus",
                node: (
                  <PasswordInput
                    aria-label="focus"
                    defaultValue="secret-password"
                    data-preview="focus"
                  />
                ),
              },
              {
                label: "error",
                node: <PasswordInput aria-label="error" defaultValue="short" invalid />,
              },
              {
                label: "disabled",
                node: <PasswordInput aria-label="disabled" defaultValue="secret" disabled />,
              },
            ]}
          />
        ),
        themes: () => (
          <FormField label="Password" error="Password must have at least 12 characters.">
            <PasswordInput defaultValue="short" />
          </FormField>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Text Input com Icon Button à direita (Eye / EyeOff) que alterna o type entre password e
            text.
          </p>
        ),
        keyboard: ["Tab vai do campo para o botão de mostrar; Enter ou Espaço alterna."],
        accessibility: [
          'Botão com aria-pressed e nome que muda: "Show password" / "Hide password".',
          'autoComplete="current-password" por padrão; use "new-password" em cadastro.',
        ],
        content: ['Ajuda diz a regra antes do erro: "At least 12 characters."'],
        dos: ["Mostre a regra de senha na ajuda"],
        donts: ["Não bloqueie colar no campo"],
        usage: `import { Field, PasswordInput } from "@zynox/design-system/components";

<Field label="Password" description="At least 12 characters.">
  <PasswordInput autoComplete="new-password" />
</Field>`,
        props: [{ name: "…", type: "TextInputProps", description: "Exceto type e trailing." }],
        decisions: [
          {
            decision: "Mostrar/ocultar com aria-pressed",
            rule: "§12 estado selecionado anunciado; WCAG 4.1.2",
          },
          { decision: "Botão de 24 px dentro do campo", rule: "§6 alvo mínimo de 24 px" },
        ],
      }}
    />
  );
}
