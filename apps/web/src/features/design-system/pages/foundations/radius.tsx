import { Code, Decisions, DocPage, DocSection, DocTable, Prose } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

const scale = [
  {
    token: "rounded-xs",
    px: "4",
    cls: "rounded-xs",
    figma: "checkbox 3, kbd 4, contador 4, trilho de tabs 5",
  },
  { token: "rounded-sm", px: "6", cls: "rounded-sm", figma: "linha do command menu 6" },
  { token: "rounded-md", px: "8", cls: "rounded-md", figma: "o mais usado: sidebar, menu, input" },
  {
    token: "rounded-lg",
    px: "10",
    cls: "rounded-lg",
    figma: "card de formulário e detalhe, command menu",
  },
  {
    token: "rounded-xl",
    px: "12",
    cls: "rounded-xl",
    figma: "painel, dropdown, popover, modal (21 descartado)",
  },
  {
    token: "rounded-full",
    px: "9999",
    cls: "rounded-full",
    figma: "pílula (48, 50, 72, 100, 9999)",
  },
];

const roles = [
  { token: "rounded-inline", value: "xs · 4", use: "badge de contagem, kbd, checkbox, tag" },
  {
    token: "rounded-control",
    value: "md · 8",
    use: "botão retangular, input, select, item de menu",
  },
  {
    token: "rounded-container",
    value: "lg · 10",
    use: "card de formulário, tooltip, command menu",
  },
  { token: "rounded-surface", value: "xl · 12", use: "modal, sheet, painel de conteúdo" },
];

type Origin = "Figma" | "Skill §5";

const components: [string, string, string, Origin, string][] = [
  ["Checkbox", "rounded-inline", "4", "Figma", "1:5417 (3 → 4)"],
  ["Kbd", "rounded-inline", "4", "Figma", "1:941, 1:8203"],
  ["Badge de contagem", "rounded-inline", "4", "Figma", "nav counter 1:6598, count badge 1:3214"],
  ["Trilho de tabs / segmented", "rounded-xs", "4", "Figma", "1:8439, 1:12569 (5 → 4)"],
  ["Item de tabs / segmented", "rounded-full", "full", "Figma", "itens em pílula dentro do trilho"],
  ["Chip / label de linha", "rounded-full", "full", "Figma", "1:6914, 1:8881 (r48)"],
  ["Pílula de status / health", "rounded-full", "full", "Figma", "1:5143 (r100)"],
  ["Button", "rounded-full", "full", "Figma", "botão pílula 1:12645"],
  ["Icon Button", "rounded-full", "full", "Figma", "botões redondos de 28 px da top bar"],
  ["Input / Search", "rounded-control", "8", "Figma", "busca 28 × r8; login 44 × r10"],
  ["Select", "rounded-control", "8", "Skill §5", "mesmo papel do input"],
  ["Item da sidebar", "rounded-control", "8", "Figma", "28 × r8"],
  ["Item de menu", "rounded-control", "8", "Figma", "1:929, 32 × r8, inset 6"],
  ["Linha de lista selecionada", "rounded-control", "8", "Figma", "1:5413"],
  ["Linha do command menu", "rounded-sm", "6", "Figma", "1:4654, inset 4 (10 − 4 = 6)"],
  ["Card do board", "rounded-md", "8", "Figma", "1:8859 (72 instâncias)"],
  ["Card de formulário / detalhe", "rounded-container", "10", "Figma", "1:5677, 1:6115, 1:12566"],
  ["Card de milestone", "rounded-xl", "12", "Figma", "1:3179"],
  ["Command menu", "rounded-container", "10", "Figma", "command menu 10"],
  ["Date picker", "rounded-md", "8", "Figma", "1:4"],
  ["Tooltip", "rounded-container", "10", "Skill §5", "papel contêiner"],
  ["Popover", "rounded-xl", "12", "Figma", "display options 1:8435, add filter 1:8198"],
  ["Dropdown menu", "rounded-xl", "12", "Figma", "1:904"],
  ["Modal / Dialog", "rounded-surface", "12", "Figma", "21 do Figma descartado: 12"],
  ["Sheet / Drawer", "rounded-surface", "12", "Skill §5", "superfície grande"],
  ["Painel de conteúdo", "rounded-surface", "12", "Figma", "1:5042"],
  ["Avatar de pessoa", "rounded-full", "full", "Figma", "16 × r8 (1:931)"],
  ["Avatar de workspace / team", "rounded-md", "8", "Figma", "20 × r8, quadrado (1:6766)"],
  ["Dot de label, swatch", "rounded-full", "full", "Figma", "9 × r4,5; 22 × r11"],
  ["Switch", "rounded-full", "full", "Figma", "1:8507 (r72)"],
  ["Radio, status", "rounded-full", "full", "Skill §5", "a forma carrega significado"],
];

export function Page() {
  return (
    <DocPage
      title="Radius"
      description="Os raios reais de cada componente no Figma, consolidados numa escala de seis valores e mapeados por papel. O raio cresce com o tamanho do elemento."
    >
      <DocSection
        title="Escala"
        description="Consolidada do inventário do Figma (quase-duplicados unidos)."
      >
        <DocTable
          caption="Escala de raio"
          columns={["Token", "px", "Amostra", "No Figma"]}
          rows={scale.map((s) => [
            <Code key="t">{s.token}</Code>,
            s.px,
            <span
              key="a"
              aria-hidden
              className={`${s.cls} block size-control-xl border border-control bg-control`}
            />,
            s.figma,
          ])}
        />
      </DocSection>

      <DocSection
        title="Papéis"
        description="Use o papel quando o componente não tiver um raio próprio no Figma. Quando o Figma define outro valor (popover e dropdown em 12, card do board em 8), o componente segue o Figma."
      >
        <DocTable
          caption="Papéis de raio"
          columns={["Papel", "Valor", "Uso"]}
          rows={roles.map((r) => [<Code key="t">{r.token}</Code>, r.value, r.use])}
        />
      </DocSection>

      <DocSection
        title="Componente → token"
        description="Origem: raio do Figma ou regra da skill (§5)."
      >
        <DocTable
          caption="Raio por componente"
          columns={["Componente", "Token", "px", "Origem", "Referência"]}
          rows={components.map(([name, token, px, origin, ref]) => [
            name,
            <Code key="t">{token}</Code>,
            px,
            origin,
            ref,
          ])}
        />
      </DocSection>

      <DocSection
        title="Aninhamento"
        description="Raio interno = raio externo − padding. Raios iguais aninhados parecem grossos nos cantos."
      >
        <ThemePair>
          {() => (
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-2">
                <div className="rounded-surface border border-default bg-surface p-2">
                  <div className="h-control-xl w-40 rounded-xs bg-selected" />
                </div>
                <span className="text-caption text-secondary">12 − 8 = 4 ✓</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="rounded-container border border-default bg-surface p-1">
                  <div className="h-control-xl w-40 rounded-sm bg-selected" />
                </div>
                <span className="text-caption text-secondary">10 − 4 = 6 ✓ (command menu)</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="rounded-surface border border-default bg-surface p-2">
                  <div className="h-control-xl w-40 rounded-surface bg-selected" />
                </div>
                <span className="text-caption text-secondary">12 dentro de 12 ✗</span>
              </div>
            </div>
          )}
        </ThemePair>
        <Prose>
          <p>
            Divergência do Figma: o item de menu tem raio 8 dentro do dropdown de raio 12 com inset
            6. Pela regra seria 12 − 6 = 6. O componente segue o Figma (8); a alternativa proposta é
            usar <Code>rounded-sm</Code> (6) no item quando o menu for implementado na Fase 3.
          </p>
        </Prose>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Escala 4 · 6 · 8 · 10 · 12 · full",
            rule: "Figma (inventário: 2, 3, 3,5, 4, 4,5, 5, 6, 8, 10, 12, pílulas); quase-duplicados unidos",
          },
          {
            decision: "inline 4 < control 8 < container 10 < surface 12",
            rule: "§5 o raio cresce com o tamanho do elemento",
          },
          {
            decision: "Modal em 12, não 21",
            rule: "Decisão do responsável (.figma/01-design-tokens.md)",
          },
          {
            decision: "Pílulas 48/50/72/100/9999 viram rounded-full",
            rule: "Figma normalizado (inventário c)",
          },
          {
            decision: "full só onde a forma comunica algo",
            rule: "§5 pílula com significado; Figma",
          },
          {
            decision: "Fora do Figma: interno = externo − padding",
            rule: "§5 regra de aninhamento",
          },
        ]}
      />
    </DocPage>
  );
}
