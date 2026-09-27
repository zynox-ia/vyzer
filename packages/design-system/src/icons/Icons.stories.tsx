import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bot, Inbox, Search, Settings, Sparkles, Zap } from "lucide-react";
import { Icon, type IconSize } from "./Icon";
import { PriorityIcon, type Priority } from "./PriorityIcon";
import { StatusIcon } from "./StatusIcon";

const meta = {
  title: "Foundations/Icons",
  component: StatusIcon,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Ícones de linha vêm do lucide (`Icon`), com traço 1,5 e cor por `currentColor`. Ícones de status e prioridade são os desenhos exatos do Figma (nós 6:1543 e 1:935). Decorativos por padrão (`aria-hidden`); passe `label` quando o ícone for a única informação.",
      },
    },
  },
  args: { type: "started", progress: 1 / 3, size: "md" },
  argTypes: {
    type: {
      control: "select",
      options: ["backlog", "unstarted", "started", "completed", "canceled", "duplicate"],
    },
    progress: { control: { type: "range", min: 0, max: 1, step: 1 / 6 } },
    tone: {
      control: "select",
      options: [undefined, "neutral", "success", "info", "warning", "danger"],
    },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
} satisfies Meta<typeof StatusIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Ajuste tipo, progresso, tom e tamanho nos controles. */
export const Playground: Story = {
  args: { label: "In Progress" },
};

const sizes: IconSize[] = ["xs", "sm", "md", "lg", "xl"];

/** Tamanhos 12, 16, 20, 24 e 32 px, alinhados opticamente ao texto. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 text-secondary">
      {sizes.map((s) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <Icon icon={Sparkles} size={s} />
          <code className="text-code text-primary">{s}</code>
        </div>
      ))}
    </div>
  ),
};

/** Ícones de linha: decorativos ao lado de texto, com rótulo quando sozinhos. */
export const LineIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-3 text-body-md">
      <span className="flex items-center gap-2 text-primary">
        <Icon icon={Inbox} className="text-secondary" /> Inbox
      </span>
      <span className="flex items-center gap-2 text-primary">
        <Icon icon={Bot} className="text-secondary" /> Novo agente
      </span>
      <span className="flex items-center gap-2 text-primary">
        <Icon icon={Zap} className="text-secondary" /> Executar automação
      </span>
      <span className="flex items-center gap-4 text-secondary">
        <Icon icon={Search} label="Pesquisar conversas" />
        <Icon icon={Settings} label="Configurações" />
      </span>
    </div>
  ),
};

const workflow = [
  { name: "Backlog", type: "backlog" },
  { name: "Todo", type: "unstarted" },
  { name: "In Progress", type: "started", progress: 1 / 3 },
  { name: "In Review", type: "started", progress: 1 / 2, tone: "info" },
  { name: "Done", type: "completed" },
  { name: "Canceled", type: "canceled" },
  { name: "Duplicate", type: "duplicate" },
] as const;

/** Workflow do Linear: cada status tem formato próprio; cor só reforça. */
export const Workflow: Story = {
  render: () => (
    <ul className="flex flex-col gap-2 text-body-md">
      {workflow.map((s) => (
        <li key={s.name} className="flex items-center gap-2 text-primary">
          <StatusIcon
            type={s.type}
            progress={"progress" in s ? s.progress : undefined}
            tone={"tone" in s ? s.tone : undefined}
          />
          {s.name}
        </li>
      ))}
    </ul>
  ),
};

/** Progresso do setor em sextos, como no Figma (Ready, In Progress, In Review, Verifying, Blocked). */
export const Progress: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {[1, 2, 3, 4, 5].map((n) => (
        <StatusIcon key={n} type="started" progress={n / 6} size="md" label={`${n} de 6`} />
      ))}
      <StatusIcon type="started" progress={5 / 6} tone="danger" size="md" label="Blocked" />
    </div>
  ),
};

const priorities: { p: Priority; name: string }[] = [
  { p: "none", name: "No priority" },
  { p: "urgent", name: "Urgent" },
  { p: "high", name: "High" },
  { p: "medium", name: "Medium" },
  { p: "low", name: "Low" },
];

/** Prioridade: Urgent em danger; High, Medium e Low neutros, em barras. */
export const Priorities: Story = {
  render: () => (
    <ul className="flex flex-col gap-2 text-body-md">
      {priorities.map(({ p, name }) => (
        <li key={p} className="flex items-center gap-2 text-primary">
          <PriorityIcon priority={p} />
          {name}
        </li>
      ))}
    </ul>
  ),
};

/** Workflow e prioridade no tema claro (o teste de acessibilidade roda nos dois temas). */
export const LightTheme: Story = {
  globals: { theme: "light" },
  render: () => (
    <div className="flex gap-10 bg-app p-4 text-body-md">
      <ul className="flex flex-col gap-2">
        {workflow.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-primary">
            <StatusIcon
              type={s.type}
              progress={"progress" in s ? s.progress : undefined}
              tone={"tone" in s ? s.tone : undefined}
            />
            {s.name}
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-2">
        {priorities.map(({ p, name }) => (
          <li key={p} className="flex items-center gap-2 text-primary">
            <PriorityIcon priority={p} />
            {name}
          </li>
        ))}
      </ul>
    </div>
  ),
};
