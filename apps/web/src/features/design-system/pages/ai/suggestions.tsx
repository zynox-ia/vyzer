/**
 * Sugestões da tela vazia do agente (Figma 27:6907 New chat, 27:7230 diálogo compacto, 1:3581
 * painel de New Project). Fase 7 — spec, item 1.
 */
import { useState } from "react";
import { Chip, SuggestionCard, TextInput } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import { Decisions, DocPage, DocSection, Prose } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";
import { COMPACT_SUGGESTIONS, FULL_SUGGESTIONS } from "@/features/agent/data";

function FullDemo() {
  const [filled, setFilled] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <TextInput
        aria-label="Composer (preenchido pela sugestão)"
        placeholder="Ask Zynox…"
        value={filled}
        readOnly
      />
      <div className="grid grid-cols-1 gap-2 tablet:grid-cols-3">
        {FULL_SUGGESTIONS.map((s) => (
          <SuggestionCard
            key={s.title}
            icon={s.icon}
            title={s.title}
            description={s.description}
            onClick={() => setFilled(s.title)}
          />
        ))}
      </div>
    </div>
  );
}

function CompactDemo() {
  const [filled, setFilled] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <TextInput
        aria-label="Composer (preenchido pela sugestão)"
        placeholder="Ask Zynox…"
        value={filled}
        readOnly
      />
      <div className="flex flex-col items-start gap-1.5">
        {COMPACT_SUGGESTIONS.map((s) => (
          <Chip
            key={s.title}
            variant="filled"
            icon={<Icon icon={s.icon} />}
            onClick={() => setFilled(s.title)}
          >
            {s.title}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function Page() {
  return (
    <DocPage
      title="Sugestões"
      description="Tela vazia do agente: até 3 sugestões que preenchem o composer ao clicar (não enviam), como no Linear. Duas densidades — cartão (página cheia, 27:6907) e pílula (painel compacto, 27:7230, 1:3581)."
    >
      <DocSection
        title="Página cheia — cartão"
        description="Ícone, título de 1 linha e descrição de até 2 linhas, em grade de 3 colunas."
      >
        <ThemePair>{() => <FullDemo />}</ThemePair>
        <Prose>
          Composição nova (SuggestionCard, packages/design-system): não existe como componente de
          base no Figma, como o Composer de comentário (forms/composer.tsx).
        </Prose>
      </DocSection>

      <DocSection
        title="Painel compacto — pílula"
        description="Ícone + rótulo, empilhadas. Reaproveita o Chip (variant=filled) — sem componente novo."
      >
        <ThemePair>{() => <CompactDemo />}</ThemePair>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Cartão em rounded-control (8), título text-label-md, descrição text-body-sm",
            rule: 'Medido ao vivo em linear.app/zynox-dev/agent — diverge do texto da spec (rounded-container/type-heading-3): vale o Linear (regra do responsável, "Como usar o Figma nesta entrega").',
          },
          {
            decision: "Pílula compacta reaproveita o Chip (variant=filled), não um componente novo",
            rule: "AGENTS.md, regra 1 — reutilizar antes de criar",
          },
          {
            decision: "Clique preenche o composer, não envia",
            rule: "spec, Comportamento — igual ao Linear",
          },
        ]}
      />
    </DocPage>
  );
}
