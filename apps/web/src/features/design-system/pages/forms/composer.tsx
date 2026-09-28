import { Button, IconButton, SegmentedControl, TextArea } from "@vyzer/design-system/components";
import { Activity, Bot, Paperclip } from "lucide-react";
import { useState } from "react";
import { Code, Decisions, DocPage, DocSection, Prose } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

/** Formulário de update do projeto (Figma 1:6363), montado só com componentes do sistema. */
function Composer() {
  const [mode, setMode] = useState<"comment" | "update">("update");
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex w-full max-w-content flex-col rounded-container border border-default bg-surface focus-ring-within"
    >
      <div className="flex items-center gap-2 px-3 pt-3">
        <SegmentedControl
          label="Post type"
          value={mode}
          onValueChange={setMode}
          options={[
            { value: "comment", label: "Comment" },
            { value: "update", label: "Update" },
          ]}
        />
        {mode === "update" && (
          <Button icon={Activity} className="text-success-strong">
            On track
          </Button>
        )}
      </div>
      <TextArea
        variant="plain"
        rows={2}
        aria-label={mode === "update" ? "Project update" : "Comment"}
        placeholder={mode === "update" ? "Write a project update…" : "Leave a comment…"}
        className="mt-3"
      />
      {mode === "update" && (
        <div className="mx-4 mt-3 flex items-center gap-3 border-l-2 border-strong pl-3">
          <span className="text-label-sm text-secondary">Progress since Sep 18</span>
          <span className="text-label-sm text-primary">0% → 25%</span>
        </div>
      )}
      <div className="flex items-center justify-between px-3 py-3">
        <Button icon={Bot}>Write with Agent</Button>
        <div className="flex items-center gap-3">
          <IconButton icon={Paperclip} label="Attach images, files, or videos" size="md" />
          <Button type="submit">Post update</Button>
        </div>
      </div>
    </form>
  );
}

export function Page() {
  return (
    <DocPage
      title="Composer"
      description="Padrão de formulário para escrever um update ou comentário (Figma 1:6363). É composição, não um componente novo: card, Segmented Control, Text Area plain e Buttons."
    >
      <DocSection
        title="Ao vivo"
        description="Troque entre Comment e Update e clique no texto: o card inteiro mostra o foco."
      >
        <ThemePair>{() => <Composer />}</ThemePair>
      </DocSection>

      <DocSection title="Composição">
        <Prose>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>
              Card: <Code>rounded-container border-default bg-surface</Code> com{" "}
              <Code>focus-ring-within</Code> (o foco fica no card, não no texto).
            </li>
            <li>
              Cabeçalho: <Code>SegmentedControl</Code> e um <Code>Button</Code> secondary sm com
              ícone de status (texto <Code>text-success-strong</Code>).
            </li>
            <li>
              Corpo: <Code>TextArea variant=&quot;plain&quot;</Code> (sem borda, 16 px).
            </li>
            <li>
              Progresso: linha de citação com <Code>border-l-2 border-strong</Code>.
            </li>
            <li>Rodapé: Buttons secondary sm e um Icon Button ghost para anexos.</li>
          </ul>
        </Prose>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Card de raio 10 com borda e fundo de superfície",
            rule: "Figma 1:6364 (r10, borda #222325)",
          },
          {
            decision: "Botões e seletor em relevo (shadow-raised)",
            rule: "Figma: anel de 1 px a 9% + contato",
          },
          {
            decision: "Texto do corpo em 16 px, padding 16 × 4",
            rule: "Figma 15 px → 16 px da escala (§2 remove 15)",
          },
          { decision: "Foco no card inteiro", rule: "§12 foco visível; §11 região comum" },
          {
            decision: "Rodapé com ação principal à direita",
            rule: "§4 ações de conclusão no fim do fluxo",
          },
          {
            decision: 'Ícone do "Write with Agent" trocado para Bot',
            rule: "Fase 7 (AI e chat), item 9 — mesmo ícone de agente em todos os gatilhos (ListChecks era o valor antes da Fase 7)",
          },
        ]}
      />
    </DocPage>
  );
}
