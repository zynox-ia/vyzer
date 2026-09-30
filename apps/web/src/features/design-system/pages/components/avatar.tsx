import { Avatar } from "@vyzer/design-system/components";
import { ComponentPage } from "../../kit/component-page";

const PEOPLE = ["André Júnio", "Marina Costa", "Rafael B"];

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Avatar",
        description:
          "Foto de uma pessoa ou, sem foto, um ícone de pessoa sobre fundo neutro (Figma 1:931). Círculo, com respiro interno em volta do ícone.",
        whenToUse: ["Lead, membros e responsável em listas e seletores"],
        whenNotToUse: [
          '"Sem responsável": use o ícone UserRound em text-secondary, sem fundo',
          "Ícone de projeto: use ProjectIcon",
        ],
        playground: {
          preview: (
            <div className="flex items-center gap-3">
              <Avatar name="André Júnio" />
              <Avatar name="Marina Costa" size="sm" />
            </div>
          ),
          controls: (
            <p className="text-body-sm text-secondary">
              Sem foto (ou se ela falhar), mostra o ícone de pessoa.
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-col gap-4">
            {(["lg", "md", "sm"] as const).map((size) => (
              <div key={size} className="flex items-center gap-3">
                <span className="w-24 text-body-sm text-secondary">
                  {size === "lg" ? "lg · 32 px" : size === "md" ? "md · 20 px" : "sm · 16 px"}
                </span>
                {PEOPLE.map((name) => (
                  <Avatar key={name} name={`${name} ${size}`} size={size} />
                ))}
              </div>
            ))}
          </div>
        ),
        states: null,
        statesNote:
          "Não interativo. Carregando ou foto com erro: mostra o ícone de pessoa (Radix Avatar).",
        themes: () => (
          <div className="flex items-center gap-3">
            {PEOPLE.map((name) => (
              <Avatar key={name} name={name} />
            ))}
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            32 px (lg), 20 px (md) ou 16 px (sm), em círculo. Foto em object-cover; sem foto, fundo
            bg-neutral-subtle com o ícone UserRound em text-secondary: 20 px com 6 px de respiro no
            lg, 12 px com 4 px no md, 10 px com 3 px no sm.
          </p>
        ),
        keyboard: ["Não recebe foco."],
        accessibility: [
          'role="img" com o nome da pessoa (aria-label); o ícone fica oculto para leitores de tela.',
        ],
        content: ["Nome completo da pessoa: é o nome acessível."],
        dos: ["Passe sempre o nome, mesmo com foto"],
        donts: ["Não use o avatar para comunicar estado"],
        usage: `import { Avatar } from "@vyzer/design-system/components";

<Avatar name="André Júnio" src={user.photoUrl} size="sm" />`,
        props: [
          { name: "name", type: "string", description: "Nome acessível." },
          { name: "src", type: "string", description: "URL da foto." },
          {
            name: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "16 · 20 · 32 px.",
          },
        ],
        decisions: [
          {
            decision: "16 px ao lado do nome, foto em object-cover",
            rule: "Figma 1:931 (16 px, object-cover), conferido no nó",
          },
          {
            decision:
              "Círculo; ícone de 10 px (sm), 12 px (md) e 20 px (lg) para caber no círculo com respiro",
            rule: "Pedido do responsável; o ícone cabe no quadrado inscrito (≈ 0,7 × o diâmetro)",
          },
          {
            decision: "Sem foto: ícone de pessoa sobre fundo neutro, sem iniciais",
            rule: "Pedido do responsável; §4 contexto em text-secondary",
          },
          {
            decision: "Radix Avatar para carregamento e troca pelo ícone",
            rule: "AGENTS.md regra 6 (primitivos do radix-ui)",
          },
        ],
      }}
    />
  );
}
