import { Field as FormField, TextInput, type InputSize } from "@vyzer/design-system/components";
import { AtSign } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { Code, DocTable } from "../../kit/doc";
import { StatesGrid } from "../../kit/states";

const SIZES: InputSize[] = ["sm", "md", "lg", "xl"];
const SIZE_PX: Record<InputSize, number> = { sm: 24, md: 28, lg: 32, xl: 40 };

function usePlayground() {
  const [size, setSize] = useState<InputSize>("lg");
  const [state, setState] = useState<"default" | "error" | "disabled" | "readonly">("default");
  const [icon, setIcon] = useState<"no" | "yes">("no");
  return {
    preview: (
      <div className="w-72">
        <FormField
          label="Email"
          description="We send invites to this address."
          error={state === "error" ? "Enter a valid email, like name@company.com." : undefined}
          disabled={state === "disabled"}
        >
          <TextInput
            size={size}
            icon={icon === "yes" ? AtSign : undefined}
            placeholder="name@company.com"
            readOnly={state === "readonly"}
            defaultValue={state === "readonly" ? "andre@zynox.com" : undefined}
          />
        </FormField>
      </div>
    ),
    controls: (
      <>
        <Field label="size">
          <Segmented
            label="size"
            value={size}
            onChange={setSize}
            options={SIZES.map((s) => ({ value: s, label: s }))}
          />
        </Field>
        <Field label="estado">
          <Segmented
            label="estado"
            value={state}
            onChange={setState}
            options={[
              { value: "default", label: "default" },
              { value: "error", label: "error" },
              { value: "disabled", label: "disabled" },
              { value: "readonly", label: "read-only" },
            ]}
          />
        </Field>
        <Field label="icon">
          <Segmented
            label="icon"
            value={icon}
            onChange={setIcon}
            options={[
              { value: "no", label: "sem" },
              { value: "yes", label: "com" },
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
        title: "Text Input",
        description: "Campo de uma linha para texto curto: nome, email, identificador.",
        whenToUse: [
          "Valores curtos digitados pela pessoa",
          "Sempre dentro de um Field, com rótulo visível",
        ],
        whenNotToUse: [
          "Texto longo: use Text Area",
          "Escolha entre opções conhecidas: use Select ou Radio",
          "Busca: use Search Input",
        ],
        playground,
        showcase: (
          <DocTable
            caption="Tamanhos"
            columns={["Tamanho", "Altura", "Campo"]}
            rows={SIZES.map((s) => [
              <Code key="s">{s}</Code>,
              `${SIZE_PX[s]} px`,
              <TextInput
                key="i"
                size={s}
                aria-label={`Team name ${s}`}
                placeholder="Engineering"
              />,
            ])}
          />
        ),
        states: (
          <StatesGrid
            states={[
              {
                label: "default",
                node: <TextInput aria-label="default" placeholder="Engineering" />,
              },
              {
                label: "hover",
                node: (
                  <TextInput
                    aria-label="hover"
                    placeholder="Engineering"
                    className=""
                    data-preview="hover"
                  />
                ),
              },
              {
                label: "focus",
                node: (
                  <TextInput
                    aria-label="focus"
                    defaultValue="Engineering"
                    className=""
                    data-preview="focus"
                  />
                ),
              },
              { label: "error", node: <TextInput aria-label="error" defaultValue="ENG" invalid /> },
              {
                label: "disabled",
                node: <TextInput aria-label="disabled" defaultValue="Engineering" disabled />,
              },
              {
                label: "read-only",
                node: <TextInput aria-label="read-only" defaultValue="ENG-128" readOnly />,
              },
            ]}
          />
        ),
        themes: () => (
          <div className="flex w-full max-w-72 flex-col gap-4">
            <FormField label="Team name" description="Shown in the sidebar.">
              <TextInput placeholder="Engineering" />
            </FormField>
            <FormField label="Team key" error="Team key is already in use. Try another.">
              <TextInput defaultValue="ENG" />
            </FormField>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Caixa com borda de controle (3:1), fundo de campo, texto 13 px e placeholder em
            text-placeholder. Ícone opcional à esquerda e conteúdo à direita (botão, atalho), que
            transformam o campo num Input Group.
          </p>
        ),
        keyboard: [
          "Tab foca; o foco aparece também ao clicar (campos de texto sempre mostram o foco).",
        ],
        accessibility: [
          "Rótulo visível via Field (label for); placeholder não é rótulo.",
          "Dentro de Field com erro: aria-invalid e aria-describedby apontando para a mensagem.",
          "Placeholder ≥ 4,5:1 nas superfícies de campo (Foundations → Colors).",
        ],
        content: [
          'Placeholder com exemplo do formato ("name@company.com"), nunca instrução essencial.',
          "Erro diz o que houve e como corrigir.",
        ],
        dos: ["Largura proporcional ao conteúdo esperado", "Valide ao sair do campo ou ao enviar"],
        donts: ["Não valide a cada tecla", "Não use placeholder como rótulo"],
        usage: `import { Field, TextInput } from "@vyzer/design-system/components";

<Field label="Team name" description="Shown in the sidebar." required>
  <TextInput placeholder="Engineering" />
</Field>`,
        props: [
          {
            name: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "24 · 28 · 32 · 40 px.",
          },
          { name: "icon", type: "LucideIcon", description: "Ícone à esquerda." },
          {
            name: "trailing",
            type: "ReactNode",
            description: "Conteúdo à direita (botão, atalho).",
          },
          {
            name: "invalid",
            type: "boolean",
            description: "Erro fora de um Field; dentro dele vem do error.",
          },
          {
            name: "…",
            type: "InputHTMLAttributes",
            description: "value, onChange, placeholder, readOnly etc.",
          },
        ],
        decisions: [
          {
            decision: "Raio 8 (rounded-control)",
            rule: "Figma: busca 28 × r8, inputs r8 (1:5687)",
          },
          { decision: "Mesmas alturas do Button", rule: "§6 alturas iguais entre equivalentes" },
          {
            decision: "Texto 13 px, padding horizontal 8 px",
            rule: "Figma 13 Regular (p-6 em inputs sem borda); com borda, 8 px pela §1 (8–12 px em controles de 28–32)",
          },
          { decision: "Borda border-control (≥ 3:1)", rule: "§3 componentes não textuais" },
          {
            decision: "Hover sobe para border-control-hover (um degrau mais forte)",
            rule: "§12 estados; §4 o estado ativo ganha contraste",
          },
          {
            decision: "Erro: borda danger + mensagem com ícone",
            rule: "§3 cor nunca é o único indicador; §14",
          },
          {
            decision: "Rótulo acima, ajuda abaixo, erro substitui a ajuda",
            rule: "§14 formulários",
          },
        ],
      }}
    />
  );
}
