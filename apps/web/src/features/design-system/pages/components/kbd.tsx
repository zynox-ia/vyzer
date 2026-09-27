import { Kbd, KbdSequence } from "@vyzer/design-system/components";
import { ComponentPage } from "../../kit/component-page";

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Kbd",
        description:
          'Tecla de atalho (Figma 1:941): caixa com borda de 1 px e raio 4. KbdSequence junta teclas em sequência ("P then P") ou em combinação ("Ctrl + K").',
        whenToUse: [
          "Mostrar o atalho de uma ação: topo dos seletores, tooltips, menus, command menu",
        ],
        whenNotToUse: ["Código ou identificadores: use Code (text-code)"],
        playground: {
          preview: (
            <div className="flex items-center gap-6">
              <KbdSequence keys={["P", "P"]} />
              <KbdSequence keys={["Ctrl", "K"]} mode="plus" />
              <KbdSequence keys={["G", "I"]} />
            </div>
          ),
          controls: (
            <p className="text-body-sm text-secondary">Sequência (then) e combinação (+).</p>
          ),
        },
        showcase: (
          <div className="flex flex-wrap items-center gap-2">
            {["S", "P", "Esc", "⌘", "⇧", "Enter", "1"].map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </div>
        ),
        states: null,
        statesNote: "Não interativo: é só a representação de uma tecla.",
        themes: () => (
          <div className="flex items-center gap-4">
            <KbdSequence keys={["S"]} />
            <KbdSequence keys={["P", "P"]} />
            <KbdSequence keys={["Ctrl", "K"]} mode="plus" />
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Caixa de 20 px de altura e 20 px de largura mínima, borda border-default de 1 px, raio
            4, tecla em JetBrains Mono 12 px text-secondary. Na sequência, &quot;then&quot; ou
            &quot;+&quot; em 11 px entre as teclas.
          </p>
        ),
        keyboard: ["Não recebe foco."],
        accessibility: [
          "Elemento <kbd> nativo: leitores de tela anunciam como teclado.",
          "Texto das teclas em text-secondary (≥ 4,5:1).",
        ],
        content: ["Nomes curtos: Ctrl, Alt, ⇧, Esc, Enter; letras em maiúscula."],
        dos: ["Mostre o atalho ao lado da ação que ele dispara"],
        donts: ["Não use Kbd como botão"],
        usage: `import { Kbd, KbdSequence } from "@vyzer/design-system/components";

<KbdSequence keys={["P", "P"]} />      // P then P
<KbdSequence keys={["Ctrl", "K"]} mode="plus" />
<Kbd>Esc</Kbd>`,
        props: [
          { name: "KbdSequence.keys", type: "string[]", description: "Teclas, na ordem." },
          {
            name: "KbdSequence.mode",
            type: '"then" | "plus"',
            default: '"then"',
            description: "Sequência ou combinação.",
          },
        ],
        decisions: [
          { decision: "Borda de 1 px e raio 4", rule: "Figma 1:941 (borda #292a2d, r4)" },
          {
            decision: "Altura e largura mínima de 20 px",
            rule: "Figma 18 → 20 (grid de 4, §1; h-control-xs)",
          },
          {
            decision: "Tecla em JetBrains Mono 12 px",
            rule: "ADR-0013 (mono para teclas); Figma usa 12 Regular sans",
          },
          { decision: '"then" em 11 px', rule: "Figma 10 px → 11 px, o mínimo da escala (§2)" },
        ],
      }}
    />
  );
}
