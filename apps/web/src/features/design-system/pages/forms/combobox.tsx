import {
  Combobox,
  ComboboxPanel,
  PopoverSurface,
  PropertyButton,
  type ListOption,
} from "@vyzer/design-system/components";
import { PriorityIcon, StatusIcon } from "@vyzer/design-system/icons";
import { UserRound } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";

type Priority = "none" | "urgent" | "high" | "medium" | "low";
type Status = "backlog" | "todo" | "in-progress" | "in-review" | "done" | "canceled" | "duplicate";

const priorities: ListOption<Priority>[] = [
  { value: "none", label: "No priority", icon: <PriorityIcon priority="none" /> },
  { value: "urgent", label: "Urgent", icon: <PriorityIcon priority="urgent" /> },
  { value: "high", label: "High", icon: <PriorityIcon priority="high" /> },
  { value: "medium", label: "Medium", icon: <PriorityIcon priority="medium" /> },
  { value: "low", label: "Low", icon: <PriorityIcon priority="low" /> },
];

const statuses: ListOption<Status>[] = [
  { value: "backlog", label: "Backlog", icon: <StatusIcon type="backlog" /> },
  { value: "todo", label: "Todo", icon: <StatusIcon type="unstarted" /> },
  {
    value: "in-progress",
    label: "In Progress",
    icon: <StatusIcon type="started" progress={1 / 2} />,
  },
  {
    value: "in-review",
    label: "In Review",
    icon: <StatusIcon type="started" progress={2 / 3} tone="success" />,
  },
  { value: "done", label: "Done", icon: <StatusIcon type="completed" /> },
  { value: "canceled", label: "Canceled", icon: <StatusIcon type="canceled" /> },
  { value: "duplicate", label: "Duplicate", icon: <StatusIcon type="duplicate" /> },
];

const leads: ListOption[] = [
  { value: "none", label: "No lead", icon: <UserRound className="size-4 text-secondary" /> },
  { value: "andre", label: "André Júnio", group: "Users from the project team" },
  { value: "marina", label: "Marina Costa", group: "Users from the project team" },
];

function PriorityPicker() {
  const [value, setValue] = useState<Priority>("none");
  const current = priorities.find((p) => p.value === value);
  return (
    <Combobox
      label="Priority"
      value={value}
      onValueChange={setValue}
      options={priorities}
      searchPlaceholder="Change priority…"
      shortcut={["P", "P"]}
      numberFrom={0}
    >
      <PropertyButton leading={current?.icon} empty={value === "none"}>
        {value === "none" ? "Priority" : current?.label}
      </PropertyButton>
    </Combobox>
  );
}

function StatusPicker() {
  const [value, setValue] = useState<Status>("in-progress");
  const current = statuses.find((s) => s.value === value);
  return (
    <Combobox
      label="Status"
      value={value}
      onValueChange={setValue}
      options={statuses}
      searchPlaceholder="Change status…"
      shortcut={["S"]}
    >
      <PropertyButton leading={current?.icon}>{current?.label}</PropertyButton>
    </Combobox>
  );
}

/** Painel aberto e fixo na página (sem popover): interativo, mas não flutua nem rouba foco. */
function PriorityPanel() {
  const [value, setValue] = useState<Priority>("none");
  return (
    <PopoverSurface className="w-72">
      <ComboboxPanel
        label="Priority"
        value={value}
        onValueChange={setValue}
        options={priorities}
        searchPlaceholder="Change priority…"
        shortcut={["P", "P"]}
        numberFrom={0}
      />
    </PopoverSurface>
  );
}

function StatusPanel() {
  const [value, setValue] = useState<Status>("in-progress");
  return (
    <PopoverSurface className="w-60">
      <ComboboxPanel
        label="Status"
        value={value}
        onValueChange={setValue}
        options={statuses}
        searchPlaceholder="Change status…"
        shortcut={["S"]}
      />
    </PopoverSurface>
  );
}

function LeadPicker() {
  const [value, setValue] = useState("none");
  const current = leads.find((l) => l.value === value);
  return (
    <Combobox
      label="Lead"
      value={value}
      onValueChange={setValue}
      options={leads}
      searchable={false}
      numberFrom={0}
    >
      <PropertyButton leading={<UserRound />} empty={value === "none"}>
        {value === "none" ? "Lead" : current?.label}
      </PropertyButton>
    </Combobox>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Combobox",
        description:
          'Seletor com busca no topo (Figma 1:935 "Change priority…", 6:1543 "Change status…", 1:904 "Lead"): filtra enquanto digita, marca o valor atual e aceita os números (0–9) para escolher direto.',
        whenToUse: [
          "Propriedades de issue e projeto: status, priority, lead, labels, project",
          "Listas longas ou que a pessoa conhece pelo nome",
        ],
        whenNotToUse: [
          "Até ~5 opções sem necessidade de busca: use Select",
          "Ações (não valores): use Menu",
        ],
        playground: {
          preview: (
            <div className="flex flex-wrap gap-2">
              <StatusPicker />
              <PriorityPicker />
              <LeadPicker />
            </div>
          ),
          controls: (
            <p className="text-body-sm text-secondary">
              Abra, digite para filtrar, use ↑ ↓ e Enter, ou aperte o número da opção.
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-wrap items-start gap-8">
            <PriorityPanel />
            <StatusPanel />
          </div>
        ),
        states: null,
        statesNote:
          'Linha destacada (↑ ↓ ou mouse): bg-selected em raio 8. Valor atual: marca à direita. Sem resultados: "No results". Com busca preenchida, os números somem e as teclas numéricas voltam a digitar.',
        themes: () => <PriorityPanel />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Popover de raio 12. Cabeçalho de 36 px com a busca (placeholder 13 px) e o atalho em Kbd
            à direita, separado da lista por uma hairline. Lista com 6 px de folga e linhas de 32
            px: ícone de 16, rótulo de 13, marca do valor atual e número de atalho em 12 px/500.
          </p>
        ),
        keyboard: [
          "Enter ou Espaço no gatilho abre com o foco na busca.",
          "Digitar filtra; ↑ ↓ navegam (circular); Enter escolhe e fecha.",
          "Com a busca vazia, a tecla do número (0–9) escolhe a opção.",
          "Esc fecha e devolve o foco ao gatilho.",
        ],
        accessibility: [
          "cmdk: a busca é um combobox que controla a listbox (aria-activedescendant).",
          "Radix Popover gerencia foco e fechamento; o popover tem o nome do seletor.",
          "Números são decorativos (aria-hidden); a escolha também funciona por teclado comum.",
        ],
        content: [
          'Placeholder com verbo: "Change priority…", "Change status…".',
          "Mostre o atalho que abre o seletor (P then P, S).",
        ],
        dos: ["Mantenha a ordem das opções estável (os números dependem dela)"],
        donts: ["Não reordene opções pelo uso recente: quebra os atalhos numéricos"],
        usage: `import { Combobox, PropertyButton } from "@vyzer/design-system/components";

<Combobox
  label="Priority"
  value={priority}
  onValueChange={setPriority}
  options={priorities}
  searchPlaceholder="Change priority…"
  shortcut={["P", "P"]}
>
  <PropertyButton leading={<PriorityIcon priority={priority} />}>High</PropertyButton>
</Combobox>`,
        props: [
          { name: "label", type: "string", description: "Nome acessível do seletor." },
          { name: "value", type: "T", description: "Valor atual (marcado)." },
          { name: "onValueChange", type: "(value: T) => void", description: "Escolha." },
          {
            name: "options",
            type: "ListOption<T>[]",
            description: "{ value, label, icon?, keywords?, group?, disabled? }.",
          },
          {
            name: "searchPlaceholder",
            type: "string",
            default: '"Search…"',
            description: "Texto da busca.",
          },
          {
            name: "searchable",
            type: "boolean",
            default: "true",
            description: "false: lista curta sem busca (Lead); a lista recebe o foco e o teclado.",
          },
          {
            name: "shortcut",
            type: "string[]",
            description: "Atalho que abre o seletor (Kbd no topo).",
          },
          {
            name: "numbered",
            type: "boolean",
            default: "true",
            description: "Números e teclas numéricas.",
          },
          {
            name: "numberFrom",
            type: "0 | 1",
            default: "1",
            description:
              'Número da primeira opção: 0 quando ela é "nenhum" (No priority, No lead).',
          },
          { name: "children", type: "ReactElement", description: "Gatilho (Property Button)." },
          {
            name: "portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema.",
          },
        ],
        decisions: [
          {
            decision:
              "Multisseleção: a caixa desmarcada só aparece na linha em destaque; o espaço fica reservado",
            rule: "Figma 22:2039 (submenus de filtro)",
          },
          {
            decision: "Cabeçalho de busca de 36 px com hairline embaixo",
            rule: "Figma 1:936 (h 36, borda #292a2d)",
          },
          {
            decision: "Busca alinhada a 14 px, igual ao texto das linhas",
            rule: "Figma pl 14; §11 alinhamento vence o grid aqui",
          },
          { decision: "Atalho em Kbd à direita da busca", rule: "Figma 1:940 (P then P)" },
          {
            decision: 'Números à direita (0 para "nenhum"), 12 px/500 secondary',
            rule: "Figma 1:965 (12 Medium #9c9d9f); §7 Jakob (Linear)",
          },
          { decision: "Marca do valor atual antes do número", rule: "Figma 1:961" },
          {
            decision: "Popover de raio 12 e linhas de 32 px com destaque r8",
            rule: "Figma 1:935 e 1:1000",
          },
        ],
      }}
    />
  );
}
