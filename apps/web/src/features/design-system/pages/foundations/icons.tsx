import { Icon, ICON_STROKE, type IconSize } from "@vyzer/design-system/icons";
import {
  Bell,
  CalendarDays,
  Inbox,
  Layers,
  ListFilter,
  Plus,
  Search,
  Settings,
  SquarePen,
  Tag,
  UserRound,
  Users,
} from "lucide-react";
import { Code, Decisions, DocPage, DocSection, DocTable } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

const sizes: [IconSize, number, string][] = [
  ["xs", 12, "Dentro de chips e badges de 20 px"],
  ["14", 14, "Icon Button de 28 px (md)"],
  ["sm", 16, "Padrão: ao lado de texto de 12–13 px"],
  ["md", 20, "Ao lado de texto de 16 px, botões xl"],
  ["lg", 24, "Estados vazios pequenos"],
  ["xl", 32, "Estados vazios"],
];

const glyphs = [
  { icon: Inbox, name: "Inbox" },
  { icon: SquarePen, name: "New issue" },
  { icon: Search, name: "Search" },
  { icon: ListFilter, name: "Filter" },
  { icon: Layers, name: "Projects" },
  { icon: Users, name: "Teams" },
  { icon: UserRound, name: "Assignee" },
  { icon: Tag, name: "Labels" },
  { icon: CalendarDays, name: "Due date" },
  { icon: Bell, name: "Notifications" },
  { icon: Settings, name: "Settings" },
  { icon: Plus, name: "Add" },
];

export function Page() {
  return (
    <DocPage
      title="Icons"
      description={`Ícones de linha da biblioteca lucide, com traço de ${ICON_STROKE} px em todos os tamanhos. A cor vem de currentColor.`}
    >
      <DocSection title="Tamanhos">
        <DocTable
          caption="Tamanhos de ícone"
          columns={["Tamanho", "px", "Amostra", "Uso"]}
          rows={sizes.map(([s, px, use]) => [
            <Code key="s">{s}</Code>,
            px,
            <Icon key="i" icon={Inbox} size={s} className="text-primary" />,
            use,
          ])}
        />
      </DocSection>

      <DocSection
        title="Ícone ao lado de texto"
        description="16 px ao lado de texto de 13 px, com 6 px de distância, centralizados pela altura x."
      >
        <ThemePair>
          {() => (
            <div className="flex flex-col gap-3">
              <span className="inline-flex items-center gap-1.5 text-body-md text-primary">
                <Icon icon={Inbox} className="text-secondary" />
                Inbox
              </span>
              <span className="inline-flex items-center gap-1 text-body-sm text-secondary">
                <Icon icon={CalendarDays} size="xs" />
                Due Oct 12
              </span>
            </div>
          )}
        </ThemePair>
      </DocSection>

      <DocSection title="Conjunto em uso">
        <ThemePair>
          {() => (
            <ul className="grid grid-cols-3 gap-3 tablet:grid-cols-4">
              {glyphs.map((g) => (
                <li key={g.name} className="flex items-center gap-1.5 text-body-sm text-secondary">
                  <Icon icon={g.icon} className="text-primary" />
                  {g.name}
                </li>
              ))}
            </ul>
          )}
        </ThemePair>
      </DocSection>

      <DocSection
        title="Acessibilidade"
        description={
          <>
            Sem <Code>label</Code>, o ícone é decorativo (<Code>aria-hidden</Code>). Botão só de
            ícone sempre tem rótulo acessível. Ícones de status e prioridade estão em Visual assets.
          </>
        }
      >
        {null}
      </DocSection>

      <Decisions
        items={[
          { decision: "16 px ao lado de 13 px", rule: "§10 ≈ 1,2–1,25 × o tamanho da fonte" },
          {
            decision: "Gap ícone–texto 6 px (13 px) e 4 px (12 px)",
            rule: "§10 0,4–0,6 × o tamanho, no grid",
          },
          {
            decision: `Traço único de ${ICON_STROKE} px (absoluteStrokeWidth)`,
            rule: "§10 mesmo stroke em todo o sistema; 2 px (1,5 do Figma + 0,5), decisão do responsável em 28/09 depois de testar 2,5 e 1,5",
          },
          { decision: "Cor por currentColor", rule: "§10 ícones herdam cor" },
          {
            decision: "Alvo de clique 24 px mesmo com ícone de 16 px",
            rule: "§6 padding invisível",
          },
          {
            decision: 'Degrau "14" entre xs e sm',
            rule: "Icon Button de 28 px medido contra o Linear (responsável, 28/09): nem 12 nem 16 batiam; nome literal em vez de 2xs/xs, que já ficam a meio caminho",
          },
        ]}
      />
    </DocPage>
  );
}
