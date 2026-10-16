import {
  Button,
  Field as FormField,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zynox/design-system/components";
import { Copy, Link } from "lucide-react";
import { Icon } from "@zynox/design-system/icons";
import { ComponentPage } from "../../kit/component-page";
import { StatesGrid } from "../../kit/states";

function Url({ preview }: { preview?: string }) {
  return (
    <InputGroup size="lg" className="w-80" invalid={preview === "error"}>
      <InputGroupAddon>
        <span className="text-body-md text-secondary">zynox.app.br/</span>
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Workspace URL"
        defaultValue="zynox"
        data-preview={preview}
        className="pl-0"
      />
    </InputGroup>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Input Group",
        description:
          "Campo com complementos: prefixo ou sufixo de texto, ícone, botão. O grupo carrega a borda, o foco e o erro; o input interno não tem borda.",
        whenToUse: ["Prefixo fixo (zynox.app.br/), unidade, ação ligada ao valor (copiar)"],
        whenNotToUse: ["Só um ícone ou um botão: use as props icon e trailing do Text Input"],
        playground: {
          preview: (
            <FormField label="Workspace URL" description="Letters, numbers and dashes.">
              <InputGroup size="lg" className="w-80">
                <InputGroupAddon>
                  <span className="text-body-md text-secondary">zynox.app.br/</span>
                </InputGroupAddon>
                <InputGroupInput defaultValue="zynox" className="pl-0" />
                <InputGroupAddon className="pr-2 pl-0">
                  <Button variant="ghost" icon={Copy}>
                    Copy
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </FormField>
          ),
          controls: (
            <p className="text-body-sm text-secondary">Composição livre de complementos.</p>
          ),
        },
        showcase: (
          <div className="flex flex-col gap-3">
            <Url />
            <InputGroup size="lg" className="w-80">
              <InputGroupAddon>
                <Icon icon={Link} />
              </InputGroupAddon>
              <InputGroupInput aria-label="Link" placeholder="Paste a link…" className="pl-1.5" />
            </InputGroup>
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              { label: "default", node: <Url /> },
              { label: "focus (no grupo)", node: <Url preview="focus" /> },
              { label: "error", node: <Url preview="error" /> },
            ]}
          />
        ),
        themes: () => <Url />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Contêiner com a caixa do campo (borda, raio 8, fundo) e foco via focus-field-within; 12
            px da borda até o primeiro conteúdo e 8 px até o botão à direita; complementos em
            text-secondary; input sem borda ocupando o espaço restante.
          </p>
        ),
        keyboard: ["Tab passa pelo input e pelos botões do grupo, na ordem visual."],
        accessibility: [
          "Use InputGroupInput: ele recebe o rótulo, a ajuda e o erro do Field.",
          "O prefixo é texto visível, não parte do valor.",
        ],
        content: ["Prefixo curto e reconhecível."],
        dos: ["Mantenha o foco visível no grupo inteiro"],
        donts: ["Não coloque mais de uma ação dentro do grupo"],
        usage: `import { InputGroup, InputGroupAddon } from "@zynox/design-system/components";

<Field label="Workspace URL">
  <InputGroup size="lg">
    <InputGroupAddon>zynox.app.br/</InputGroupAddon>
    <InputGroupInput defaultValue="zynox" />
  </InputGroup>
</Field>`,
        props: [
          { name: "size", type: "InputSize", default: '"lg"', description: "Altura do grupo." },
          { name: "invalid", type: "boolean", description: "Borda de erro." },
          {
            name: "InputGroupAddon",
            type: "componente",
            description: "Complemento com padding à esquerda.",
          },
        ],
        decisions: [
          {
            decision: "O grupo carrega borda e foco (focus-field-within)",
            rule: "§11 região comum; §12 foco visível",
          },
          {
            decision: "Padding 12 px à esquerda, 8 px à direita do botão",
            rule: "Figma 13:2010 (pl 12, pr 8)",
          },
          { decision: "Complementos em text-secondary", rule: "§4 rebaixar o que é contexto" },
        ],
      }}
    />
  );
}
