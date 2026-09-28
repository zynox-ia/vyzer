import {
  Badge,
  Counter,
  HealthBadge,
  type BadgeTone,
  type Health,
} from "@vyzer/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { Code, DocTable } from "../../kit/doc";

const TONES: BadgeTone[] = ["neutral", "success", "info", "warning", "danger", "accent"];
const HEALTH: Health[] = ["on-track", "at-risk", "off-track", "none"];
const TONE_LABEL: Record<BadgeTone, string> = {
  neutral: "Draft",
  success: "Done",
  info: "In Review",
  warning: "At risk",
  danger: "Blocked",
  accent: "New",
};

function usePlayground() {
  const [tone, setTone] = useState<BadgeTone>("success");
  const [health, setHealth] = useState<Health>("on-track");
  return {
    preview: (
      <div className="flex items-center gap-6">
        <Badge tone={tone}>{TONE_LABEL[tone]}</Badge>
        <HealthBadge health={health} />
        <span className="inline-flex items-center gap-2 text-body-md text-primary">
          Inbox <Counter count={5} tone="accent" />
        </span>
      </div>
    ),
    controls: (
      <>
        <Field label="Badge tone">
          <Segmented
            label="Badge tone"
            value={tone}
            onChange={setTone}
            options={TONES.map((t) => ({ value: t, label: t }))}
          />
        </Field>
        <Field label="HealthBadge health">
          <Segmented
            label="Health"
            value={health}
            onChange={setHealth}
            options={HEALTH.map((h) => ({ value: h, label: h }))}
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
        title: "Badge",
        description:
          "Três peças para estado e quantidade: Badge (pílula de estado), HealthBadge (saúde do projeto, Figma 1:5143) e Counter (contagem ao lado de um rótulo, Figma 1:3214 e 1:6598).",
        whenToUse: [
          "Badge: estado curto de um item (Done, Blocked)",
          "HealthBadge: saúde de um projeto em listas e no detalhe",
          "Counter: quantidade de itens de um grupo, aba ou item da sidebar",
        ],
        whenNotToUse: [
          "Status de workflow de issue: use Status Icon + nome",
          "Propriedade editável: use Property Button",
        ],
        playground,
        showcase: (
          <div className="flex flex-col gap-4">
            <DocTable
              caption="Badge por tom"
              columns={["Tom", "Badge"]}
              rows={TONES.map((t) => [
                <Code key="t">{t}</Code>,
                <Badge key="b" tone={t}>
                  {TONE_LABEL[t]}
                </Badge>,
              ])}
            />
            <DocTable
              caption="HealthBadge"
              columns={["health", "HealthBadge"]}
              rows={HEALTH.map((h) => [
                <Code key="h">{h}</Code>,
                <HealthBadge key="b" health={h} />,
              ])}
            />
          </div>
        ),
        states: null,
        statesNote: "Não interativos. Quando precisam de ação, ficam dentro de um botão ou link.",
        themes: () => (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Badge key={t} tone={t}>
                  {TONE_LABEL[t]}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {HEALTH.map((h) => (
                <HealthBadge key={h} health={h} />
              ))}
            </div>
            <div className="flex gap-6 text-body-md text-primary">
              <span className="inline-flex items-center gap-2">
                My issues <Counter count={12} />
              </span>
              <span className="inline-flex items-center gap-2">
                Inbox <Counter count={5} tone="accent" />
              </span>
            </div>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Badge: pílula de 20 px, texto 12 px/500 -strong sobre a cor a 15%. HealthBadge: ícone de
            16 px + rótulo 12 px/500 na cor do estado, gap de 8, sem fundo. Counter: número de 12 px
            em text-secondary (ou terracota no destaque), algarismos tabulares.
          </p>
        ),
        keyboard: ["Não recebem foco."],
        accessibility: [
          "Sempre com texto: a cor nunca é o único indicador (§3).",
          "Texto de Badge ≥ 4,5:1 nos dois temas (Foundations → Colors, badges).",
          'Counter isolado precisa de contexto: "5 unread" no aria-label do item pai.',
        ],
        content: ["Rótulos de uma ou duas palavras, sentence case."],
        dos: ["Use o terracota do Counter só para não lidos"],
        donts: ["Não use Badge colorido para decoração"],
        usage: `import { Badge, Counter, HealthBadge } from "@vyzer/design-system/components";

<Badge tone="success">Done</Badge>
<HealthBadge health="at-risk" />
<Counter count={5} tone="accent" />`,
        props: [
          {
            name: "Badge.tone",
            type: "BadgeTone",
            default: '"neutral"',
            description: "Cor do estado.",
          },
          { name: "Badge.icon", type: "LucideIcon", description: "Ícone de 12 px opcional." },
          {
            name: "HealthBadge.health",
            type: '"on-track" | "at-risk" | "off-track" | "none"',
            description: "Saúde do projeto.",
          },
          { name: "Counter.count", type: "number", description: "Quantidade." },
          {
            name: "Counter.tone",
            type: '"neutral" | "accent"',
            default: '"neutral"',
            description: "Destaque.",
          },
          { name: "Counter.max", type: "number", default: "99", description: "Acima mostra 99+." },
        ],
        decisions: [
          {
            decision: "HealthBadge: ícone 16 + texto 12/500, gap 8",
            rule: "Figma 1:5143 (gap 8, 12 Medium)",
          },
          {
            decision: "Counter: 12 px text-secondary, raio 4",
            rule: "Figma 1:3214 e 1:6598 (12 Regular, r4)",
          },
          {
            decision: "Counter de destaque em terracota",
            rule: "ADR-0012/0013 (acento só em contadores de destaque)",
          },
          {
            decision: "Badge em pílula com texto -strong",
            rule: "§3 texto ≥ 4,5:1; Figma pílulas r100",
          },
          {
            decision: "Padding de 10 px de cada lado",
            rule: "Pedido do responsável: +2 px, como o chip do Select",
          },
          {
            decision:
              "HealthBadge on-track/off-track: disco a 25% + seta de tendência (HealthTrendIcon), no lugar de CircleCheck/TriangleAlert",
            rule: "Figma 25:5384 e 1:5177 (VYZ-36): diferença perceptível contra o glifo genérico anterior",
          },
          { decision: "Algarismos tabulares no Counter", rule: "§2 números alinhados em listas" },
        ],
      }}
    />
  );
}
