/**
 * Hover Card: prévia de uma pessoa (Figma 25:6786) e dos milestones de um projeto (25:6683). Os
 * cartões abertos da página são estáticos (PopoverSurface); os reais estão no playground.
 */
import {
  Avatar,
  Chip,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  PopoverSurface,
  ProjectIcon,
  PropertyButton,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { Clock, Diamond, Inbox, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { PROJECTS, TEAMS } from "../../kit/project-data";

const plugga = PROJECTS[1]!;
const zynox = TEAMS[0]!;

function Meta({ icon, children }: { icon: LucideIcon | "team"; children: string }) {
  return (
    <li className="flex items-center gap-2 text-body-sm text-secondary">
      <span className="flex size-4 items-center justify-center">
        {icon === "team" ? zynox.icon : <Icon icon={icon} />}
      </span>
      {children}
    </li>
  );
}

/** Pessoa (25:6786): avatar, nome e papel; time, hora local e issues atribuídas. */
function PersonCard() {
  return (
    <div className="flex w-72 flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <Avatar name="André Júnio" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-label-md text-primary">André Júnio</span>
          <span className="truncate text-body-sm text-secondary">Workspace admin</span>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        <Meta icon="team">Zynox</Meta>
        <Meta icon={Clock}>14:32 local time</Meta>
        <Meta icon={Inbox}>4 issues assigned</Meta>
      </ul>
    </div>
  );
}

const MILESTONES = [
  { name: "Private alpha", progress: 100, date: "Aug 29" },
  { name: "Beta launch", progress: 64, date: "Oct 2" },
  { name: "Public release", progress: 12, date: "Oct 30" },
];

/** Milestones de um projeto (25:6683): nome, andamento e data de cada um. */
function MilestonesCard() {
  return (
    <div className="flex w-72 flex-col gap-1 p-1.5">
      <span className="flex items-center gap-2 px-2 pt-1 pb-1.5 text-label-sm text-secondary">
        <ProjectIcon value={plugga.icon} />
        {plugga.label} milestones
      </span>
      <ul className="flex flex-col">
        {MILESTONES.map((m) => (
          <li key={m.name} className="flex h-menu-item items-center gap-2 px-2 text-body-md">
            <Icon
              icon={Diamond}
              className={m.progress === 100 ? "fill-secondary text-secondary" : "text-secondary"}
            />
            <span className="min-w-0 flex-1 truncate text-primary">{m.name}</span>
            <span className="text-body-sm text-secondary tabular-nums">{m.progress}%</span>
            <span className="w-12 text-right text-body-sm text-secondary tabular-nums">
              {m.date}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LivePerson() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <PropertyButton leading={<Avatar name="André Júnio" size="sm" />}>
          André Júnio
        </PropertyButton>
      </HoverCardTrigger>
      <HoverCardContent>
        <PersonCard />
      </HoverCardContent>
    </HoverCard>
  );
}

function LiveMilestones() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Chip icon={<Icon icon={Diamond} className="text-secondary" />} onClick={() => {}}>
          Beta launch
        </Chip>
      </HoverCardTrigger>
      <HoverCardContent>
        <MilestonesCard />
      </HoverCardContent>
    </HoverCard>
  );
}

function usePlayground() {
  const [example, setExample] = useState<"person" | "milestones">("person");
  return {
    preview: example === "person" ? <LivePerson /> : <LiveMilestones />,
    controls: (
      <>
        <Field label="exemplo">
          <Segmented
            label="exemplo"
            value={example}
            onChange={setExample}
            options={[
              { value: "person", label: "pessoa" },
              { value: "milestones", label: "milestones" },
            ]}
          />
        </Field>
        <p className="self-end text-body-sm text-secondary">
          Passe o ponteiro ou foque o gatilho com Tab; abre depois de 500 ms.
        </p>
      </>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Hover Card",
        description:
          "Prévia de uma pessoa ou de um objeto ao passar o ponteiro ou focar o gatilho (Figma 25:6786, pessoa; 25:6683, milestones). Radix HoverCard, na superfície dos popovers.",
        whenToUse: [
          "Mostrar quem é alguém a partir do avatar ou do nome",
          "Resumir um objeto ligado (milestones de um projeto, uma issue citada)",
        ],
        whenNotToUse: [
          "Conteúdo com ações ou campos: use Popover",
          "Só nomear um controle: use Tooltip",
          "Informação essencial: ela precisa estar também no destino do gatilho",
        ],
        playground,
        showcase: (
          <div className="flex flex-wrap items-start gap-6">
            <PopoverSurface>
              <PersonCard />
            </PopoverSurface>
            <PopoverSurface>
              <MilestonesCard />
            </PopoverSurface>
          </div>
        ),
        states: null,
        statesNote:
          "Fechado ou aberto. Abre no hover depois de --tooltip-delay (500 ms) e no foco do gatilho; fecha ao sair do gatilho e do cartão (300 ms de folga para o ponteiro atravessar) e com Esc. Os cartões abertos desta página são estáticos (PopoverSurface).",
        themes: () => (
          <div className="flex flex-col gap-4">
            <PopoverSurface className="w-max">
              <PersonCard />
            </PopoverSurface>
            <PopoverSurface className="w-max">
              <MilestonesCard />
            </PopoverSurface>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Superfície dos popovers (raio 12, border-strong, bg-popover, sombra md) a 4 px do
            gatilho, sempre para baixo. Pessoa: 16 px de respiro, avatar de 20 px, nome em 13 px/500
            e papel em 12 px; linhas de 12 px com ícone de 16 px. Milestones: 6 px de respiro,
            título de seção de 12 px/500 e linhas de 32 px com o losango, nome, andamento e data.
          </p>
        ),
        keyboard: [
          "Tab foca o gatilho e abre o cartão depois do mesmo atraso; sair do gatilho fecha.",
          "Esc fecha. O cartão não recebe foco: o conteúdo é complementar.",
        ],
        accessibility: [
          "Radix HoverCard: só para quem vê o ponteiro ou o foco; leitores de tela não entram no cartão.",
          "Por isso o gatilho leva ao mesmo conteúdo (perfil, projeto) quando ativado.",
          "Textos em text-primary e text-secondary (≥ 4,5:1 sobre bg-popover).",
        ],
        content: ["Resumo curto: nome, papel e dois ou três fatos; sem ações."],
        dos: ["Use um gatilho focável (botão, link, chip clicável)", "Mantenha o cartão estreito"],
        donts: ["Não ponha botões ou campos no cartão", "Não abra hover card sem atraso"],
        usage: `import { HoverCard, HoverCardContent, HoverCardTrigger } from "@vyzer/design-system/components";

<HoverCard>
  <HoverCardTrigger asChild>
    <PropertyButton leading={<Avatar name="André Júnio" size="sm" />}>André Júnio</PropertyButton>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="flex w-72 flex-col gap-3 p-4">…</div>
  </HoverCardContent>
</HoverCard>`,
        props: [
          {
            name: "HoverCard.openDelay",
            type: "number",
            default: "--tooltip-delay (500 ms)",
            description: "Atraso de abertura no hover.",
          },
          {
            name: "HoverCard.closeDelay, open, onOpenChange",
            type: "Radix",
            description: "Fechamento e controle.",
          },
          {
            name: "HoverCardContent.align",
            type: '"start" | "center" | "end"',
            default: '"start"',
            description: "Alinhamento; abre sempre para baixo.",
          },
          {
            name: "HoverCardContent.portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema do contêiner.",
          },
        ],
        decisions: [
          {
            decision: "Superfície popoverSurface, sempre para baixo, 4 px do gatilho",
            rule: "Mesma regra do Popover e do Menu (pedido do responsável)",
          },
          {
            decision: "Atraso de abertura pelo token --tooltip-delay",
            rule: "Um só atraso de hover no sistema (Foundations → Motion)",
          },
          {
            decision: "Avatar md (20 px) na pessoa, sem tamanho maior",
            rule: "Reuso do Avatar (sem prop nova)",
          },
          {
            decision: "Losango do lucide para milestone; concluído, preenchido",
            rule: "ADR-0013 (biblioteca única de ícones)",
          },
        ],
      }}
    />
  );
}
