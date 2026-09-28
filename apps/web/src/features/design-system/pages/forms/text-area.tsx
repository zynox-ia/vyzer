import { Field as FormField, TextArea } from "@vyzer/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { StatesGrid } from "../../kit/states";

function usePlayground() {
  const [rows, setRows] = useState("3");
  const [state, setState] = useState<"default" | "error" | "disabled">("default");
  return {
    preview: (
      <div className="w-96">
        <FormField
          label="Description"
          description="Markdown is supported."
          error={
            state === "error"
              ? "Description is too long. Keep it under 2,000 characters."
              : undefined
          }
          disabled={state === "disabled"}
        >
          <TextArea rows={Number(rows)} placeholder="Add a description…" />
        </FormField>
      </div>
    ),
    controls: (
      <>
        <Field label="rows">
          <Segmented
            label="rows"
            value={rows}
            onChange={setRows}
            options={["2", "3", "5", "8"].map((r) => ({ value: r, label: r }))}
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
        title: "Text Area",
        description:
          "Campo de várias linhas para texto longo: descrição de issue, comentário, resumo.",
        whenToUse: [
          "Texto com mais de uma frase",
          "Conteúdo que a pessoa pode querer revisar antes de enviar",
        ],
        whenNotToUse: [
          "Valores curtos: use Text Input",
          "Edição rica (menções, blocos): editor da fase de Issues",
        ],
        playground,
        showcase: (
          <div className="grid max-w-3xl grid-cols-1 gap-4 tablet:grid-cols-2">
            <TextArea aria-label="2 linhas" rows={2} placeholder="Leave a comment…" />
            <TextArea aria-label="5 linhas" rows={5} placeholder="Add a description…" />
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              {
                label: "default",
                node: <TextArea aria-label="default" rows={2} placeholder="Leave a comment…" />,
              },
              {
                label: "hover",
                node: (
                  <TextArea
                    aria-label="hover"
                    rows={2}
                    placeholder="Leave a comment…"
                    data-preview="hover"
                  />
                ),
              },
              {
                label: "focus",
                node: (
                  <TextArea
                    aria-label="focus"
                    rows={2}
                    defaultValue="Looks good to me."
                    data-preview="focus"
                  />
                ),
              },
              {
                label: "error",
                node: <TextArea aria-label="error" rows={2} defaultValue="…" invalid />,
              },
              {
                label: "disabled",
                node: <TextArea aria-label="disabled" rows={2} defaultValue="Archived" disabled />,
              },
              {
                label: "read-only",
                node: (
                  <TextArea
                    aria-label="read-only"
                    rows={2}
                    defaultValue="Created by André"
                    readOnly
                  />
                ),
              },
            ]}
          />
        ),
        themes: () => (
          <FormField label="Project summary" description="One or two sentences.">
            <TextArea rows={3} placeholder="Add a short summary…" />
          </FormField>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Mesma caixa do Text Input, com padding vertical de 6 px e linha de 20 px. Cresce na
            vertical pelo canto (resize-y).
          </p>
        ),
        keyboard: ["Tab foca; Enter quebra a linha (não envia)."],
        accessibility: ["Rótulo, ajuda e erro via Field, como no Text Input."],
        content: ['Placeholder convida a escrever: "Add a description…".'],
        dos: ["Comece com 3 linhas em formulários"],
        donts: ["Não trave o resize em textos longos"],
        usage: `import { Field, TextArea } from "@vyzer/design-system/components";

<Field label="Description">
  <TextArea rows={3} placeholder="Add a description…" />
</Field>`,
        props: [
          { name: "rows", type: "number", default: "3", description: "Altura inicial em linhas." },
          { name: "invalid", type: "boolean", description: "Erro fora de um Field." },
          {
            name: "…",
            type: "TextareaHTMLAttributes",
            description: "value, onChange, placeholder etc.",
          },
        ],
        decisions: [
          { decision: "Linha de 20 px no corpo de 13 px", rule: "§2 1,45× arredondado a 4" },
          {
            decision: "Padding 6 px × 12 px",
            rule: "Figma 13:2010 (12 px à esquerda); §1 horizontal ≥ vertical",
          },
          {
            decision: "Mesma borda, raio e estados do Text Input",
            rule: "§11 similaridade: mesma função, mesma aparência",
          },
          {
            decision: "Borda border-field; foco sem acento (border-field-focus)",
            rule: "Figma 13:2010 (#2f3033, 1 px); foco pedido pelo responsável",
          },
        ],
      }}
    />
  );
}
