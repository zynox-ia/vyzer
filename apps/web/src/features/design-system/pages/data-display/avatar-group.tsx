/**
 * Avatar Group: membros de um projeto ou time (sem frame no Figma; segue o Linear).
 */
import { AvatarGroup, type AvatarSize } from "@vyzer/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { PEOPLE } from "../../kit/issue-data";

function usePlayground() {
  const [size, setSize] = useState<AvatarSize>("md");
  const [count, setCount] = useState<"3" | "6">("6");
  return {
    preview: <AvatarGroup label="Members" people={PEOPLE.slice(0, Number(count))} size={size} />,
    controls: (
      <>
        <Field label="size">
          <Segmented
            label="size"
            value={size}
            onChange={setSize}
            options={[
              { value: "md", label: "md" },
              { value: "sm", label: "sm" },
            ]}
          />
        </Field>
        <Field label="pessoas">
          <Segmented
            label="pessoas"
            value={count}
            onChange={setCount}
            options={[
              { value: "3", label: "3" },
              { value: "6", label: "6 (+3)" },
            ]}
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
        title: "Avatar Group",
        description:
          'Pessoas de um projeto, time ou issue, em avatares sobrepostos. Acima do limite, o último lugar mostra "+N". O corte em volta de cada vizinho é uma máscara: funciona sobre qualquer fundo.',
        whenToUse: ["Membros de um projeto ou time numa linha, cartão ou cabeçalho"],
        whenNotToUse: [
          "Uma pessoa só: use Avatar",
          "Quando cada pessoa precisa ser escolhida: use um seletor (Combobox)",
        ],
        playground,
        showcase: (
          <div className="flex flex-col gap-4">
            {(["md", "sm"] as const).map((size) => (
              <div key={size} className="flex items-center gap-6">
                <span className="w-24 text-body-sm text-secondary">
                  {size === "md" ? "md · 20 px" : "sm · 16 px"}
                </span>
                <AvatarGroup label={`Members ${size}, 2`} people={PEOPLE.slice(0, 2)} size={size} />
                <AvatarGroup label={`Members ${size}, 4`} people={PEOPLE.slice(0, 4)} size={size} />
                <AvatarGroup label={`Members ${size}, 6`} people={PEOPLE} size={size} />
              </div>
            ))}
          </div>
        ),
        states: null,
        statesNote:
          "Não interativo. Com uma foto que falha, o avatar mostra o ícone de pessoa (Radix Avatar). Para mostrar quem é cada um, envolva o grupo num Hover Card.",
        themes: () => (
          <div className="flex items-center gap-6">
            <AvatarGroup label="Members" people={PEOPLE} />
            <div className="rounded-container border border-default bg-surface p-3">
              <AvatarGroup label="Members on a card" people={PEOPLE.slice(0, 3)} />
            </div>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Avatares do Avatar (20 ou 16 px) sobrepostos em 4 px (2 px no sm); cada um é recortado
            num círculo 2 px maior que o vizinho da direita (máscara radial, sem cor). O "+N" é um
            círculo do mesmo tamanho em bg-neutral-subtle com texto de 11 px em text-secondary.
          </p>
        ),
        keyboard: ["Não recebe foco."],
        accessibility: [
          "Lista com nome (label): cada avatar é uma imagem com o nome da pessoa.",
          'O "+N" lê a contagem e os nomes que ficaram de fora ("3 more: Luiza Prado, …").',
        ],
        content: ["Ordem: o responsável ou o lead primeiro, depois por atividade."],
        dos: ["Limite a 4 ou 5 lugares", "Dê nome ao grupo (Members, Assignees)"],
        donts: ["Não use o grupo como botão sem um gatilho focável em volta"],
        usage: `import { AvatarGroup } from "@vyzer/design-system/components";

<AvatarGroup label="Members" people={[{ name: "André Júnio" }, { name: "Marina Costa", src }]} max={4} />`,
        props: [
          { name: "label", type: "string", description: "Nome acessível do grupo." },
          { name: "people", type: "{ name, src? }[]", description: "Pessoas, em ordem." },
          {
            name: "max",
            type: "number",
            default: "4",
            description: 'Lugares no máximo, contando o "+N".',
          },
          { name: "size", type: '"sm" | "md"', default: '"md"', description: "16 · 20 px." },
        ],
        decisions: [
          {
            decision: "Sobreposição de 4 px (2 no sm) com corte de 2 px por máscara",
            rule: "Grid de 4 (§1); a máscara não depende da cor do fundo (lista, cartão, popover)",
          },
          {
            decision: '"+N" em bg-neutral-subtle e text-secondary',
            rule: "Mesmo par do Badge neutro (≥ 4,5:1)",
          },
          { decision: "Tamanhos do Avatar (sm, md), sem tamanho novo", rule: "Reuso" },
        ],
      }}
    />
  );
}
