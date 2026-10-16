import { Button } from "@zynox/design-system/components";
import { useState } from "react";
import { Code, Decisions, DocPage, DocSection, DocTable } from "../../kit/doc";

const durations = [
  ["duration-fast", "--motion-fast", "120 ms", "—", "Hover, cor, toggle"],
  ["duration-normal", "--motion-normal", "180 ms", "140 ms", "Popover, menu, tooltip"],
  ["duration-slow", "--motion-slow", "240 ms", "180 ms", "Modal, sheet"],
];

const easings = [
  ["ease-enter", "cubic-bezier(0, 0, 0.2, 1)", "Entrada (ease-out: desacelera ao chegar)"],
  ["ease-exit", "cubic-bezier(0.4, 0, 1, 1)", "Saída (ease-in)"],
  ["ease-standard", "cubic-bezier(0.4, 0, 0.2, 1)", "Movimento dentro da tela (ease-in-out)"],
];

const animations = [
  ["animate-scale-in / -out", "Popover, dropdown: escala 0,97 → 1 + opacidade"],
  ["animate-slide-up / -down", "Tooltip, toast: 4 px + opacidade"],
  ["animate-dialog-in / -out", "Modal: escala 0,97 → 1, duração lenta"],
  ["animate-fade-in / -out", "Scrim, conteúdo que troca"],
];

function Demo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col items-start gap-4">
      <Button variant="primary" onClick={() => setOpen((o) => !o)}>
        {open ? "Close popover" : "Open popover"}
      </Button>
      <div className="h-28">
        {open && (
          <div className="w-56 animate-scale-in rounded-container border border-strong bg-popover p-3 shadow-md">
            <p className="text-label-md text-primary">Assign to</p>
            <p className="text-body-sm text-secondary">Entrada 180 ms com ease-out.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Page() {
  return (
    <DocPage
      title="Motion"
      description="Movimento curto e funcional: confirma a ação sem atrasar o fluxo."
    >
      <DocSection title="Durações" description="Saída ≈ 75% da entrada.">
        <DocTable
          caption="Durações"
          columns={["Utilitário", "Variável", "Entrada", "Saída", "Uso"]}
          rows={durations.map(([u, v, i, o, use]) => [
            <Code key="u">{u}</Code>,
            <Code key="v">{v}</Code>,
            i,
            o,
            use,
          ])}
        />
      </DocSection>

      <DocSection title="Easing">
        <DocTable
          caption="Curvas"
          columns={["Utilitário", "Curva", "Uso"]}
          rows={easings.map(([u, c, use]) => [
            <Code key="u">{u}</Code>,
            <Code key="c">{c}</Code>,
            use,
          ])}
        />
      </DocSection>

      <DocSection
        title="Animações"
        description={
          <>
            Os overlays do Radix usam <Code>data-[state=open]:animate-scale-in</Code> e{" "}
            <Code>data-[state=closed]:animate-scale-out</Code>.
          </>
        }
      >
        <DocTable
          caption="Animações"
          columns={["Utilitário", "Uso"]}
          rows={animations.map(([u, use]) => [<Code key="u">{u}</Code>, use])}
        />
        <Demo />
      </DocSection>

      <DocSection
        title="Movimento reduzido"
        description="Com prefers-reduced-motion: reduce, deslocamento e escala viram zero e todas as durações ficam em 100 ms: fica só a opacidade rápida."
      >
        {null}
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Micro-interações 120 ms",
            rule: "§8 100–150 ms; ≤ 100 ms parece instantâneo",
          },
          {
            decision: "Overlays 180 ms, modais 240 ms",
            rule: "§8 overlays 150–200 ms, modais 200–300 ms",
          },
          { decision: "Saídas 140 e 180 ms (≈ 75–78%)", rule: "§8 saída ≈ 70–80% da entrada" },
          { decision: "Entrada ease-out, saída ease-in, na tela ease-in-out", rule: "§8 easing" },
          {
            decision: "Escala 0,97 e deslocamento 4 px",
            rule: "§8 distância pequena (0,96–0,98; 4–8 px)",
          },
          { decision: "Tooltip abre em 500 ms (--tooltip-delay)", rule: "§8 atraso de 400–700 ms" },
          { decision: "Reduced motion: só opacidade, 100 ms", rule: "§8 prefers-reduced-motion" },
          {
            decision: "Botões não se movem no hover: só a cor de fundo muda, como no Linear",
            rule: "Pedido do responsável (padrão do Linear, §7 Jakob)",
          },
        ]}
      />
    </DocPage>
  );
}
