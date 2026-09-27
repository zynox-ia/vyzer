import { Code, Decisions, DocPage, DocSection, DocTable } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

const controls = [
  { size: "xs", px: 20, cls: "h-control-xs", use: "Chips densos, controles de toolbar" },
  { size: "sm", px: 24, cls: "h-control-sm", use: "Botões de ícone em listas, filtros" },
  { size: "md", px: 28, cls: "h-control-md", use: "Padrão: botões, inputs, selects" },
  { size: "lg", px: 32, cls: "h-control-lg", use: "Formulários, modais" },
  { size: "xl", px: 40, cls: "h-control-xl", use: "Ações de destaque (login no Figma: 44)" },
];

const icons = [
  { size: "xs", px: 12, cls: "size-icon-xs" },
  { size: "sm", px: 16, cls: "size-icon-sm" },
  { size: "md", px: 20, cls: "size-icon-md" },
  { size: "lg", px: 24, cls: "size-icon-lg" },
  { size: "xl", px: 32, cls: "size-icon-xl" },
];

const density = [
  { token: "h-row", comfortable: 44, compact: 36, use: "Linha de lista (Figma: 44, 1:6898)" },
  { token: "h-menu-item", comfortable: 32, compact: 28, use: "Item de menu (Figma: 32)" },
  { token: "h-nav-item", comfortable: 28, compact: 24, use: "Item da sidebar (Figma: 28)" },
  { token: "h-field", comfortable: 32, compact: 28, use: "Campo de formulário" },
  {
    token: "h-command-item",
    comfortable: 36,
    compact: 32,
    use: "Linha do command menu (Figma: 34)",
  },
  { token: "px-cell-x", comfortable: 12, compact: 8, use: "Padding horizontal de célula" },
];

const rows = ["Fix login redirect loop", "Add Brevo email provider", "Design System foundations"];

export function Page() {
  return (
    <DocPage
      title="Sizing"
      description="Uma escala de alturas compartilhada entre Button, Input, Select e IconButton: componentes equivalentes no mesmo tamanho têm exatamente a mesma altura."
    >
      <DocSection title="Alturas de controle">
        <DocTable
          caption="Alturas de controle"
          columns={["Tamanho", "Altura", "Classe", "Amostra", "Uso"]}
          rows={controls.map((c) => [
            c.size,
            `${c.px} px`,
            <Code key="c">{c.cls}</Code>,
            <span
              key="s"
              aria-hidden
              className={`${c.cls} block w-20 rounded-control border border-control bg-control`}
            />,
            c.use,
          ])}
        />
      </DocSection>

      <DocSection title="Ícones">
        <div className="flex flex-wrap items-end gap-6">
          {icons.map((i) => (
            <div key={i.size} className="flex flex-col items-center gap-2">
              <span aria-hidden className={`${i.cls} block rounded-inline bg-inverse`} />
              <span className="text-caption text-secondary">
                {i.size} · {i.px}
              </span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Área de clique"
        description="Mínimo de 24 × 24 px. Quando o visual é menor (ícone de 16 px), a área cresce com padding invisível, não o ícone."
      >
        <ThemePair>
          {() => (
            <div className="flex items-center gap-4">
              <span className="relative inline-flex size-control-sm items-center justify-center rounded-control border border-dashed border-control">
                <span aria-hidden className="block size-icon-sm rounded-inline bg-inverse" />
              </span>
              <span className="text-body-sm text-secondary">
                Ícone 16 px dentro de alvo de 24 px
              </span>
            </div>
          )}
        </ThemePair>
      </DocSection>

      <DocSection
        title="Densidade"
        description={
          <>
            Densidade muda espaço, não fonte. Compact desce um degrau em altura e padding. Ative com{" "}
            <Code>data-density=&quot;compact&quot;</Code> no contêiner.
          </>
        }
      >
        <DocTable
          caption="Tokens de densidade"
          columns={["Token", "Comfortable", "Compact", "Uso"]}
          rows={density.map((d) => [
            <Code key="t">{d.token}</Code>,
            `${d.comfortable} px`,
            `${d.compact} px`,
            d.use,
          ])}
        />
        <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
          {(["comfortable", "compact"] as const).map((mode) => (
            <div key={mode} data-density={mode} className="flex flex-col gap-2">
              <p className="type-overline text-secondary">{mode}</p>
              <ul className="overflow-hidden rounded-container border border-default bg-panel">
                {rows.map((r) => (
                  <li
                    key={r}
                    className="flex h-row items-center border-t border-subtle px-cell-x text-body-md text-primary first:border-t-0"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Controles 20 · 24 · 28 · 32 · 40 px",
            rule: "§6 escala de alturas compartilhada",
          },
          { decision: "Padrão md = 28 px", rule: "§6 desktop confortável 28–32 px" },
          { decision: "Área de clique mínima 24 px", rule: "§6 WCAG 2.2, 2.5.8" },
          {
            decision: "Ícones 12 · 16 · 20 · 24 · 32 px",
            rule: "§10 ícone ≈ altura da linha (13 px → 16 px)",
          },
          {
            decision: "Linha de lista 44 px (comfortable) e 36 px (compact)",
            rule: "Figma 1:6898 (44); a skill §13 sugere 32–36: o Figma vence e o compact fica nos 36",
          },
          {
            decision: "Item de menu 32 px e item da sidebar 28 px",
            rule: "Figma (inventário b e a)",
          },
          {
            decision: "Command menu 36 px em vez dos 34 px do Figma",
            rule: "§1 grid de 4 px (34 fica fora do grid)",
          },
        ]}
      />
    </DocPage>
  );
}
