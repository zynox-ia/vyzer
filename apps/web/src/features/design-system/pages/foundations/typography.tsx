import { cn } from "@vyzer/design-system/cn";
import {
  DESIGN_WEIGHTS,
  measureWeightCoverage,
  type WeightCoverage,
} from "@vyzer/design-system/font-coverage";
import { useEffect, useState } from "react";
import { ContrastReport, type ContrastCheck } from "../../kit/color";
import { Code, Decisions, DocPage, DocSection, DocTable, Prose } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

type Level = {
  token: string;
  className: string;
  size: number;
  lineHeight: number;
  tracking: string;
  weight: number;
  family: "Figtree" | "JetBrains Mono";
  sample: string;
  use: string;
  rule: string;
};

const levels: Level[] = [
  {
    token: "type-metric",
    className: "type-metric",
    size: 47,
    lineHeight: 52,
    tracking: "−0,025 em",
    weight: 300,
    family: "Figtree",
    sample: "1,284",
    use: "Números de métricas",
    rule: "13 × 1,2⁷ = 46,6; 300 só ≥ 24 px (a Figtree não tem 200)",
  },
  {
    token: "type-display",
    className: "type-display",
    size: 32,
    lineHeight: 36,
    tracking: "−0,02 em",
    weight: 300,
    family: "Figtree",
    sample: "Welcome to Vyzer",
    use: "Telas vazias, onboarding",
    rule: "13 × 1,2⁵ = 32,3; LH 1,1× → 35,2 → 36",
  },
  {
    token: "type-title",
    className: "type-title",
    size: 27,
    lineHeight: 32,
    tracking: "−0,02 em",
    weight: 300,
    family: "Figtree",
    sample: "Mobile App Redesign",
    use: "Título de página (Project, Issue)",
    rule: "13 × 1,2⁴ = 27,0; LH 1,175× → 31,7 → 32; 300 só ≥ 24 px",
  },
  {
    token: "type-heading-1",
    className: "type-heading-1",
    size: 22,
    lineHeight: 24,
    tracking: "−0,015 em",
    weight: 500,
    family: "Figtree",
    sample: "Project overview",
    use: "Seção principal",
    rule: "13 × 1,2³ = 22,5; LH 1,175× → 25,9 → 24 (1,09×: exceção do arredondamento a 4)",
  },
  {
    token: "type-heading-2",
    className: "type-heading-2",
    size: 19,
    lineHeight: 24,
    tracking: "−0,01 em",
    weight: 500,
    family: "Figtree",
    sample: "Milestones",
    use: "Subseção, título de modal",
    rule: "13 × 1,2² = 18,7; LH 1,175× → 22,3 → 24 (1,26×: exceção do arredondamento a 4)",
  },
  {
    token: "type-heading-3",
    className: "type-heading-3",
    size: 16,
    lineHeight: 20,
    tracking: "−0,005 em",
    weight: 500,
    family: "Figtree",
    sample: "Properties",
    use: "Grupo, card",
    rule: "13 × 1,2 = 15,6; LH 1,175× → 18,8 → 20",
  },
  {
    token: "text-body-lg",
    className: "text-body-lg",
    size: 16,
    lineHeight: 24,
    tracking: "0",
    weight: 400,
    family: "Figtree",
    sample: "Redesign the onboarding flow for new workspaces.",
    use: "Descrição de issue e de página",
    rule: "LH 1,45× → 23,2 → 24",
  },
  {
    token: "text-body-md",
    className: "text-body-md",
    size: 13,
    lineHeight: 20,
    tracking: "0",
    weight: 400,
    family: "Figtree",
    sample: "Update the billing page copy before the launch.",
    use: "Base da UI: listas, corpo",
    rule: "Base 13 px; LH 1,45× → 18,9 → 20",
  },
  {
    token: "text-label-md",
    className: "text-label-md",
    size: 13,
    lineHeight: 20,
    tracking: "0",
    weight: 500,
    family: "Figtree",
    sample: "Create issue",
    use: "Botões, títulos de painel, itens de menu",
    rule: "Mesma métrica do body-md; 500 = ênfase",
  },
  {
    token: "text-body-sm",
    className: "text-body-sm",
    size: 12,
    lineHeight: 16,
    tracking: "+0,005 em",
    weight: 400,
    family: "Figtree",
    sample: "Updated 2 hours ago by André",
    use: "Metadados",
    rule: "12 px nomeado na skill para metadados; LH 17,4 → 16",
  },
  {
    token: "text-label-sm",
    className: "text-label-sm",
    size: 12,
    lineHeight: 16,
    tracking: "+0,005 em",
    weight: 500,
    family: "Figtree",
    sample: "In Progress",
    use: "Badges, chips, controles pequenos",
    rule: "Métrica do body-sm com 500",
  },
  {
    token: "text-caption",
    className: "text-caption",
    size: 11,
    lineHeight: 16,
    tracking: "+0,01 em",
    weight: 400,
    family: "Figtree",
    sample: "3 of 12",
    use: "Contadores, legendas",
    rule: "13 × 1,2⁻¹ = 10,8; 11 é o mínimo absoluto",
  },
  {
    token: "type-overline",
    className: "type-overline",
    size: 11,
    lineHeight: 16,
    tracking: "+0,06 em",
    weight: 500,
    family: "Figtree",
    sample: "Favorites",
    use: "Seção de sidebar, eyebrow",
    rule: "Caixa alta só em rótulos curtos, com tracking",
  },
  {
    token: "text-code",
    className: "font-mono text-code",
    size: 12,
    lineHeight: 16,
    tracking: "0",
    weight: 400,
    family: "JetBrains Mono",
    sample: "VYZ-128",
    use: "Código, identificadores",
    rule: "Mono um degrau abaixo do texto vizinho",
  },
  {
    token: "text-kbd",
    className: "font-mono text-kbd",
    size: 12,
    lineHeight: 16,
    tracking: "0",
    weight: 400,
    family: "JetBrains Mono",
    sample: "⌘ K",
    use: "Teclas de atalho",
    rule: "Figma 1:942 (12 px Regular)",
  },
];

/** Confirma no navegador que o arquivo servido tem o eixo de peso (a tinta cresce a cada peso). */
function Coverage({ family }: { family: string }) {
  const [result, setResult] = useState<WeightCoverage>();
  useEffect(() => {
    let cancelled = false;
    void measureWeightCoverage(family).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [family]);
  return (
    <li className="flex flex-col gap-1">
      <span className="text-label-md text-primary">{family}</span>
      <span className="text-body-sm text-secondary">
        {result
          ? DESIGN_WEIGHTS.map(
              (w) => `${w}: ${Math.round((result.inkByWeight[w] ?? 0) * 100)}% da tinta do 400`,
            ).join(" · ")
          : "medindo…"}
      </span>
      {result && (
        <span
          className={
            result.covered ? "text-body-sm text-success-strong" : "text-body-sm text-danger-strong"
          }
        >
          {result.covered
            ? "✓ o arquivo cobre 300–500 (cada peso escurece o traço)"
            : "✗ pesos sem efeito: o arquivo não cobre a faixa"}
        </span>
      )}
    </li>
  );
}

const thinChecks: ContrastCheck[] = [
  {
    label: "metric 47/300 · text-primary",
    fg: "--fg-primary",
    on: ["--bg-app", "--bg-panel", "--bg-surface"],
    target: 3,
    apca: 45,
  },
  {
    label: "metric 47/300 · text-secondary",
    fg: "--fg-secondary",
    on: ["--bg-app", "--bg-panel", "--bg-surface"],
    target: 3,
    apca: 45,
  },
  {
    label: "title 27/300 · text-primary",
    fg: "--fg-primary",
    on: ["--bg-app", "--bg-panel", "--bg-surface"],
    target: 3,
    apca: 45,
  },
  {
    label: "title 27/300 · text-secondary",
    fg: "--fg-secondary",
    on: ["--bg-app", "--bg-panel", "--bg-surface"],
    target: 3,
    apca: 45,
  },
];

export function Page() {
  return (
    <DocPage
      title="Typography"
      description="Figtree para tudo (corpo, interface, títulos e números grandes) e JetBrains Mono para código. Uma escala modular de razão 1,2 sobre a base de 13 px."
    >
      <DocSection
        title="Escala"
        description="Tamanho = 13 × 1,2ⁿ, arredondado. Alturas de linha em múltiplos de 4 para manter o ritmo vertical."
      >
        <DocTable
          caption="Escala tipográfica"
          columns={["Token", "Tamanho / linha", "Peso", "Tracking", "Família", "Uso", "Regra"]}
          rows={levels.map((l) => [
            <code key="t" className="font-mono text-code">
              {l.token}
            </code>,
            `${l.size} / ${l.lineHeight}`,
            l.weight,
            l.tracking,
            l.family,
            l.use,
            l.rule,
          ])}
        />
      </DocSection>

      <DocSection
        title="Escala aplicada"
        description="Os mesmos níveis, com os pesos, nos dois temas."
      >
        <ThemePair>
          {() => (
            <ul className="flex flex-col gap-4">
              {levels.map((l) => (
                <li key={l.token} className="flex flex-col gap-0.5">
                  <span className={cn(l.className, "text-primary")}>{l.sample}</span>
                  <span className="text-caption text-secondary">
                    {l.token} · {l.size}/{l.lineHeight} · {l.weight}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ThemePair>
      </DocSection>

      <DocSection
        title="Pesos"
        description="300 só a partir de 24 px, 400 e 500 em qualquer tamanho. Nunca 300 em texto de interface, labels, botões, badges, tabelas ou listas. A Figtree não tem 200 (eixo 300–900)."
      >
        <DocTable
          caption="Política de pesos"
          columns={["Peso", "Token", "Tamanho mínimo", "Onde"]}
          rows={[
            [
              "300",
              <Code key="c">font-light</Code>,
              "24 px",
              "type-metric, type-display, type-title",
            ],
            ["400", <Code key="c">font-normal</Code>, "qualquer", "corpo, metadados"],
            [
              "500",
              <Code key="c">font-medium</Code>,
              "qualquer",
              "ênfase: labels, botões, headings",
            ],
          ]}
        />
        <ThemePair>
          {() => (
            <div className="flex flex-col gap-3">
              <span className="type-metric text-primary">98.6%</span>
              <span className="type-display text-primary">Cycle 12 · 300</span>
              <span className="type-title text-primary">Roadmap Q4 · 300</span>
              <span className="text-body-md text-primary">Assigned to you · 400</span>
              <span className="text-label-md text-primary">Create issue · 500</span>
            </div>
          )}
        </ThemePair>
        <ul className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          <Coverage family="Figtree Variable" />
        </ul>
      </DocSection>

      <DocSection
        title="Contraste dos pesos finos no escuro"
        description="Traços finos perdem contraste percebido no escuro; o APCA mede isso melhor que o WCAG. Meta de títulos grandes: Lc ≥ 45."
      >
        <ContrastReport checks={thinChecks} />
        <Prose>
          <p>
            O peso 300 fica restrito a <Code>text-primary</Code>: é a combinação com folga no
            escuro. Em <Code>text-secondary</Code> o número está acima do mínimo, mas o traço fino
            some mais rápido; use 400 quando o texto for secundário.
          </p>
        </Prose>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Base 13 px, metadados 12 px, mínimo 11 px",
            rule: "§2 Escala (base de UI do Vyzer)",
          },
          {
            decision: "Razão 1,2 (terça menor): 11 · 13 · 16 · 19 · 22 · 27 · 32 · 47",
            rule: "§2 UI densa: 1,125–1,2; arredondar ao inteiro",
          },
          {
            decision: "14 e 15 px saíram; 39 px (1,2⁶) não entra",
            rule: "§2 remover tamanhos a menos de ~10% do vizinho; §2 ≤ 3 níveis por bloco",
          },
          {
            decision: "Linha 20 px no corpo de 13 px; 32 px no título de 27 px",
            rule: "§2 1,4–1,5× no corpo, 1,1–1,25× em títulos, múltiplo de 4",
          },
          {
            decision:
              "Tracking: +0,01 em (11), +0,005 em (12), 0 (13–16), −0,005 a −0,025 em nos títulos",
            rule: "§2 curva da skill (pequeno levemente positivo, títulos negativos); a Figtree não publica dynamic metrics",
          },
          {
            decision: "Figtree com altura-x 0,500 em (Inter: 0,546): pequeno ganha +0,005–0,01 em",
            rule: "§2 legibilidade em texto pequeno; medido no arquivo da fonte",
          },
          {
            decision: "Pesos 300 (≥ 24 px), 400 e 500; type-metric em 300",
            rule: "§2 pesos finos exigem tamanho grande",
          },
          {
            decision: "Texto corrido limitado a 66ch",
            rule: "§2 comprimento de linha 45–75, ideal 66",
          },
        ]}
      />
    </DocPage>
  );
}
