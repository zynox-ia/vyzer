import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zynox/design-system/components";
import { ComponentPage } from "../../kit/component-page";

/** Variante pills (Figma 18:1132, painel Filter Breakdown). */
function PillsExample() {
  return (
    <Tabs defaultValue="projects" className="w-96">
      <TabsList variant="pills" aria-label="Breakdown">
        <TabsTrigger value="assignees">Assignees</TabsTrigger>
        <TabsTrigger value="labels">Labels</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
      </TabsList>
      <TabsContent value="assignees" className="p-4 text-body-md text-secondary">
        Issues per assignee.
      </TabsContent>
      <TabsContent value="labels" className="p-4 text-body-md text-secondary">
        Issues per label.
      </TabsContent>
      <TabsContent value="projects" className="p-4 text-body-md text-secondary">
        Issues per project.
      </TabsContent>
    </Tabs>
  );
}

function Example({ defaultValue = "overview" }: { defaultValue?: string }) {
  return (
    <Tabs defaultValue={defaultValue} className="w-96">
      <TabsList aria-label="Project">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="updates">Updates</TabsTrigger>
        <TabsTrigger value="issues">Issues</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="p-4 text-body-md text-secondary">
        Properties, milestones and the project description.
      </TabsContent>
      <TabsContent value="updates" className="p-4 text-body-md text-secondary">
        Health updates posted by the project lead.
      </TabsContent>
      <TabsContent value="issues" className="p-4 text-body-md text-secondary">
        Issues that belong to this project.
      </TabsContent>
    </Tabs>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Tabs",
        description:
          "Abas com sublinhado (Figma 1:1404, Icons / Emojis do Icon Picker): alternam painéis de conteúdo no mesmo lugar.",
        whenToUse: [
          "Vistas irmãs do mesmo objeto (Overview, Updates, Issues)",
          "Painéis dentro de um popover (Icons / Emojis)",
        ],
        whenNotToUse: [
          "Filtrar uma lista pelo valor: use Segmented Control",
          "Navegar entre páginas diferentes: use links da sidebar",
        ],
        playground: {
          preview: <Example />,
          controls: (
            <p className="text-body-sm text-secondary">
              Clique numa aba ou foque a lista e use ← →.
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-wrap items-start gap-8">
            <Example />
            <Example defaultValue="updates" />
            <PillsExample />
          </div>
        ),
        states: null,
        statesNote:
          "Ativa: texto primário e sublinhado de 1 px em fg-primary. Inativa: texto secundário. Hover: texto primário. Foco: anel de foco em volta da aba. Pills: todas em relevo; a ativa ganha a camada de pressionado e o texto primário; hover só no fundo das inativas.",
        themes: () => (
          <div className="flex flex-col gap-4">
            <Example />
            <PillsExample />
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Lista com hairline embaixo e 8 px de folga lateral; abas de 32 px de altura, rótulo de
            13 px/500 e 8 px de folga lateral. O sublinhado de 1 px da aba ativa fica sobre a
            hairline.
          </p>
        ),
        keyboard: [
          "Tab foca a aba ativa; ← → trocam de aba (ativação automática).",
          "Tab de novo leva ao painel.",
        ],
        accessibility: [
          'Radix Tabs: role="tablist", "tab" e "tabpanel" com aria-controls.',
          "A lista precisa de aria-label.",
          "Aba ativa não depende só de cor: o sublinhado a marca.",
        ],
        content: ["Rótulos de uma ou duas palavras, substantivos"],
        dos: ["Mantenha a ordem das abas estável"],
        donts: ["Não use mais de ~6 abas", "Não use abas para passos de um fluxo"],
        usage: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zynox/design-system/components";

<Tabs defaultValue="icons">
  <TabsList aria-label="Project icon">
    <TabsTrigger value="icons">Icons</TabsTrigger>
    <TabsTrigger value="emojis">Emojis</TabsTrigger>
  </TabsList>
  <TabsContent value="icons">…</TabsContent>
  <TabsContent value="emojis">…</TabsContent>
</Tabs>`,
        props: [
          {
            name: "Tabs.value / defaultValue",
            type: "string",
            description: "Aba ativa (controlada ou não).",
          },
          { name: "Tabs.onValueChange", type: "(value: string) => void", description: "Troca." },
          {
            name: "TabsList.variant",
            type: '"underline" | "pills"',
            default: '"underline"',
            description: "pills: pílulas de 28 px em relevo que dividem a largura.",
          },
          { name: "TabsTrigger.value", type: "string", description: "Valor da aba." },
          { name: "TabsContent.value", type: "string", description: "Painel da aba." },
        ],
        decisions: [
          {
            decision: "Sublinhado neutro (fg-primary), não na cor de acento",
            rule: "ADR-0013 (acento só no primário); divergência do Figma registrada em .figma/",
          },
          { decision: "Hairline de largura total sob a lista", rule: "Figma 1:1404" },
          { decision: "Radix Tabs", rule: "AGENTS.md regra 6 (Radix para primitivos)" },
          {
            decision:
              "Variante pills: 28 px, 12 px/500, relevo; ativa com camada de pressionado e texto primário",
            rule: "Figma 18:729 e 18:1132 (List / Board, Assignees / … / Projects); mesmo padrão do Segmented Control em pílulas",
          },
        ],
      }}
    />
  );
}
