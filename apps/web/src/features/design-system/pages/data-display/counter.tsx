/**
 * Counter: a contagem ao lado de um rótulo (Figma 1:3214 e 1:6598). O componente é o mesmo da
 * página Badge; aqui, nos lugares de Data Display.
 */
import {
  Counter,
  ListGroup,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { Inbox, UserRound } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { issuesIn, statusValue } from "../../kit/issue-data";
import { StatesGrid } from "../../kit/states";

/** Item de sidebar estático (a sidebar chega na Fase 8). */
function NavItem({
  label,
  icon,
  count,
  accent = false,
}: {
  label: string;
  icon: typeof Inbox;
  count: number;
  accent?: boolean;
}) {
  return (
    <span className="flex h-nav-item w-56 items-center gap-2 rounded-control px-2 text-label-md text-secondary">
      <Icon icon={icon} />
      <span className="flex-1 truncate">{label}</span>
      <Counter count={count} tone={accent ? "accent" : "neutral"} />
    </span>
  );
}

function Places() {
  const inProgress = statusValue("in-progress");
  return (
    <div className="flex w-full max-w-prose flex-col gap-6">
      <div className="flex flex-col gap-1">
        <NavItem label="Inbox" icon={Inbox} count={5} accent />
        <NavItem label="My issues" icon={UserRound} count={12} />
      </div>
      <ListGroup
        title={inProgress.label}
        icon={inProgress.icon}
        count={issuesIn("in-progress").length}
        defaultOpen={false}
      >
        {null}
      </ListGroup>
      <Tabs defaultValue="assignees">
        <TabsList variant="pills" aria-label="Breakdown">
          <TabsTrigger value="assignees">
            Assignees <Counter count={4} />
          </TabsTrigger>
          <TabsTrigger value="labels">
            Labels <Counter count={3} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="assignees" className="pt-2 text-body-sm text-secondary">
          4 people with issues in this view.
        </TabsContent>
        <TabsContent value="labels" className="pt-2 text-body-sm text-secondary">
          3 labels in this view.
        </TabsContent>
      </Tabs>
    </div>
  );
}

function usePlayground() {
  const [count, setCount] = useState<"3" | "42" | "120">("42");
  const [tone, setTone] = useState<"neutral" | "accent">("neutral");
  return {
    preview: (
      <span className="flex items-center gap-2 text-label-md text-primary">
        Issues <Counter count={Number(count)} tone={tone} />
      </span>
    ),
    controls: (
      <>
        <Field label="count">
          <Segmented
            label="count"
            value={count}
            onChange={setCount}
            options={[
              { value: "3", label: "3" },
              { value: "42", label: "42" },
              { value: "120", label: "120 (99+)" },
            ]}
          />
        </Field>
        <Field label="tone">
          <Segmented
            label="tone"
            value={tone}
            onChange={setTone}
            options={[
              { value: "neutral", label: "neutral" },
              { value: "accent", label: "accent" },
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
        title: "Counter",
        description:
          "Quantidade ao lado de um rótulo: grupo da lista, coluna do board, aba e item da sidebar (Figma 1:3214 e 1:6598). Número de 12 px em algarismos tabulares; terracota só para não lidos.",
        whenToUse: [
          "Total de um grupo, coluna ou aba",
          "Não lidos na sidebar (tone accent, o único terracota em texto)",
        ],
        whenNotToUse: [
          "Estado (Done, At risk): use Badge",
          "Quantidade dentro de um valor (Blocked by 2): use Chip com count",
        ],
        playground,
        showcase: <Places />,
        states: (
          <StatesGrid
            states={[
              { label: "neutral", node: <Counter count={8} /> },
              { label: "accent (não lidos)", node: <Counter count={5} tone="accent" /> },
              { label: "acima do máximo", node: <Counter count={128} /> },
              { label: "max={9}", node: <Counter count={12} max={9} /> },
            ]}
          />
        ),
        themes: () => <Places />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Número de 12 px em text-secondary (ou text-accent), algarismos tabulares, largura mínima
            de 16 px e raio 4, sem fundo. Fica a 8 px do rótulo, alinhado ao centro da linha.
          </p>
        ),
        keyboard: ["Não recebe foco: é lido junto com o rótulo do item que o contém."],
        accessibility: [
          'Dentro de um botão, entra no nome ("In Progress 3").',
          'Isolado, dê contexto no item pai ("5 unread").',
          "A cor não é o único sinal: o número está sempre lá (contraste medido pelo axe nos dois temas).",
        ],
        content: ['Números inteiros; acima do máximo, "99+".'],
        dos: ["Use accent só para não lidos"],
        donts: ["Não mostre zero em listas: esconda o Counter"],
        usage: `import { Counter } from "@vyzer/design-system/components";

<Counter count={3} />
<Counter count={5} tone="accent" />`,
        props: [
          { name: "count", type: "number", description: "Quantidade." },
          {
            name: "tone",
            type: '"neutral" | "accent"',
            default: '"neutral"',
            description: "accent: não lidos.",
          },
          { name: "max", type: "number", default: "99", description: 'Acima mostra "99+".' },
        ],
        decisions: [
          {
            decision: "O Counter da página Badge, sem mudanças",
            rule: "Reuso (Figma 1:6892 usa 13 px; a escala do sistema fica em 12)",
          },
          {
            decision: "Sem o tom por status do Figma nos grupos (#a69597…)",
            rule: "ADR-0013: cor do status só no ícone; contagem em text-secondary",
          },
        ],
      }}
    />
  );
}
