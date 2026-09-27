import { Code, Decisions, DocPage, DocSection, DocTable } from "../../kit/doc";

const layers = [
  ["z-base", "0", "Conteúdo"],
  ["z-dropdown", "1000", "Dropdown, select, combobox, popover"],
  ["z-sticky", "1100", "Cabeçalhos fixos, toolbar"],
  ["z-overlay", "1200", "Scrim de modal e sheet"],
  ["z-modal", "1300", "Modal, sheet, command menu"],
  ["z-toast", "1400", "Toasts"],
  ["z-tooltip", "1500", "Tooltip (sempre por cima)"],
];

export function Page() {
  return (
    <DocPage
      title="Z-index"
      description="Camadas nomeadas, com folga de 100 entre elas. Nunca use números soltos."
    >
      <DocSection title="Camadas">
        <DocTable
          caption="Camadas"
          columns={["Utilitário", "Valor", "Uso"]}
          rows={layers.map(([u, v, use]) => [<Code key="u">{u}</Code>, v, use])}
        />
        <div aria-hidden className="relative h-56">
          {layers.slice(1).map(([u], i) => (
            <div
              key={u}
              className="absolute flex h-control-xl w-48 items-center rounded-container border border-strong bg-popover px-3 text-body-sm text-primary shadow-sm"
              style={{
                left: `calc(var(--spacing) * ${i * 6})`,
                top: `calc(var(--spacing) * ${i * 6})`,
              }}
            >
              {u}
            </div>
          ))}
        </div>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Tooltip acima de modal e toast",
            rule: "§11 figura e fundo: o que explica o foco atual fica por cima",
          },
          {
            decision: "Command menu na camada de modal",
            rule: "Linear: ⌘K abre sobre qualquer tela (§7 lei de Jakob)",
          },
        ]}
      />
    </DocPage>
  );
}
