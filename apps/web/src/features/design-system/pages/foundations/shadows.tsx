import { Code, Decisions, DocPage, DocSection, DocTable } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

const levels = [
  {
    token: "shadow-sm",
    cls: "shadow-sm",
    layers: "0 1 2 (α) + 0 2 4 (α × 0,6)",
    use: "Tooltip",
  },
  {
    token: "shadow-md",
    cls: "shadow-md",
    layers: "0 2 4 (α × 0,8) + 0 6 12 (α × 0,5)",
    use: "Popover, dropdown, command menu",
  },
  {
    token: "shadow-lg",
    cls: "shadow-lg",
    layers: "0 4 8 (α × 0,6) + 0 16 32 (α × 0,4)",
    use: "Modal, sheet",
  },
];

export function Page() {
  return (
    <DocPage
      title="Shadows"
      description="Sombra só em overlays (tooltip, popover, modal). Painéis e cards se separam por superfície e hairline."
    >
      <DocSection
        title="Níveis"
        description={
          <>
            Duas camadas: contato (curta, mais escura) e ambiente (longa, difusa). A opacidade base
            é <Code>--shadow-alpha</Code>: 0,5 no escuro (sombra preta sobre fundo quase preto
            precisa de mais) e 0,1 no claro.
          </>
        }
      >
        <DocTable
          caption="Níveis de sombra"
          columns={["Token", "Camadas (x y blur)", "Uso"]}
          rows={levels.map((l) => [<Code key="t">{l.token}</Code>, l.layers, l.use])}
        />
        <ThemePair>
          {() => (
            <div className="flex flex-wrap gap-8 rounded-container bg-panel p-8">
              {levels.map((l) => (
                <div
                  key={l.token}
                  className={`${l.cls} flex size-28 items-end rounded-container border border-strong bg-popover p-3`}
                >
                  <span className="text-caption text-secondary">{l.token}</span>
                </div>
              ))}
            </div>
          )}
        </ThemePair>
      </DocSection>

      <DocSection
        title="Relevo e contato"
        description={
          <>
            <Code>--raised</Code> (anel de 1 px a 9%/10% claro + a camada de contato) é o relevo de
            chips, botões secondary e cartões de valor (ADR-0013). <Code>--contact</Code> é só a
            camada de baixo — <Code>--raised</Code> a compõe, sem repetir o valor. Usada sozinha (
            <Code>shadow-contact</Code>) no painel de conteúdo do App Shell (<Code>ShellFrame</Code>
            ): medida ao vivo no Linear, o painel dele tem só a sombra de contato, sem o anel claro
            (aprovado pelo responsável, 28/09).
          </>
        }
      >
        <DocTable
          caption="Relevo e contato"
          columns={["Token", "Camadas", "Uso"]}
          rows={[
            [<Code key="t">shadow-raised</Code>, "Anel 1 px + contato", "Chips, botão secondary"],
            [
              <Code key="t">shadow-contact</Code>,
              "Só o contato",
              "Painel de conteúdo do App Shell",
            ],
          ]}
        />
      </DocSection>

      <Decisions
        items={[
          { decision: "Luz de cima: y > 0, x = 0", rule: "§9 elevação" },
          { decision: "Duas camadas, blur = 2 × y", rule: "§9 sombra realista" },
          {
            decision:
              "Mais alto = mais deslocamento e menos opacidade relativa (1 → 0,8 → 0,6 no contato)",
            rule: "§9 tooltip < popover < modal",
          },
          {
            decision: "Overlays mantêm border-strong; a borda separa, a sombra reforça",
            rule: "§9 tema escuro: superfície mais clara + hairline",
          },
          {
            decision: "Sem sombra em painel, card e botão",
            rule: "ADR-0013 sombra só em overlays (Figma raised descartado)",
          },
          {
            decision:
              "Exceção: o painel de conteúdo do App Shell usa shadow-contact (só a camada de contato, sem anel) — medido ao vivo no Linear",
            rule: "ADR-0013 (28/09), aprovado pelo responsável",
          },
        ]}
      />
    </DocPage>
  );
}
