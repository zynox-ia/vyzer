/**
 * Atualização de projeto com saúde (spec Fase 10, item 5; Figma 25:5446, popover sobre a lista de
 * Projects). Reaproveita o padrão Composer já existente (Forms → Composer, forms/composer.tsx),
 * dentro de um Popover (Fase 3): no lugar do texto estático "On track", um HealthBadge clicável
 * (badge.tsx) é o gatilho de mudança de saúde, e a linha única "Progress since Sep 18" vira a
 * lista de milestones com delta (kit/milestone-data.tsx).
 */
import {
  Button,
  HealthBadge,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverSurface,
  PopoverTrigger,
  ProjectIcon,
  TextArea,
  type Health,
} from "@vyzer/design-system/components";
import { cn } from "@vyzer/design-system/cn";
import { Icon } from "@vyzer/design-system/icons";
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Diamond,
  ListChecks,
  Paperclip,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { PatternPage } from "../../kit/pattern-page";
import { PROJECTS } from "../../kit/project-data";
import { MILESTONES } from "../../kit/milestone-data";
import { StatesGrid, StatesStack } from "../../kit/states";

const plugga = PROJECTS[1]!; // Plugga OS

const HEALTH_OPTIONS: { value: Health; label: string; icon: LucideIcon }[] = [
  { value: "on-track", label: "On track", icon: CircleCheck },
  { value: "at-risk", label: "At risk", icon: TriangleAlert },
  { value: "off-track", label: "Off track", icon: CircleAlert },
  { value: "none", label: "No updates", icon: CircleDashed },
];

/**
 * Chrome do gatilho de saúde: mesmo par hover/foco do Property Button (foco = hover, sem acento
 * nem halo — property-button.tsx). Composição de página: o HealthBadge (já existe) só ganha um
 * <button> simples ao redor, sem peça nova no design system.
 */
const healthTriggerClass = cn(
  "relative inline-flex h-control-sm items-center rounded-full border border-transparent px-1.5 outline-none select-none focus-halo-none",
  "transition-[color,background-color,background-image] duration-fast ease-standard",
  "focused:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))]",
  "hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))]",
);

/** Milestones com delta (0% → X%, data) no lugar da linha única "Progress since Sep 18". */
function MilestoneDeltaList() {
  return (
    <div className="mx-4 mt-3 flex flex-col gap-1.5 border-l-2 border-strong pl-3">
      {MILESTONES.map((m) => (
        <div key={m.id} className="flex items-center gap-2 text-label-sm">
          <Icon
            icon={Diamond}
            size="xs"
            className={cn(
              "shrink-0",
              m.progress === 100 ? "fill-secondary text-secondary" : "text-secondary",
            )}
          />
          <span className="min-w-0 flex-1 truncate text-secondary">{m.name}</span>
          <span className="shrink-0 text-primary tabular-nums">
            {m.progressSince ?? 0}% → {m.progress}%
          </span>
          <span className="w-12 shrink-0 text-right text-secondary tabular-nums">
            {m.targetDate}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Composer em modo update, dentro do Popover: sem o alternador Comment/Update do Composer avulso
 * (Forms) — este popover é sempre uma atualização de saúde do projeto (Figma 25:5446). Card
 * próprio: a superfície já vem do PopoverContent/PopoverSurface (borda, raio, sombra), por isso
 * o formulário não repete borda/fundo.
 */
function ProjectUpdateComposer({
  health,
  onHealthChange,
  onPosted,
}: {
  health: Health;
  onHealthChange: (h: Health) => void;
  onPosted: () => void;
}) {
  const submit = () => onPosted();
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex w-96 flex-col"
    >
      <div className="flex items-center gap-2 px-3 pt-3">
        <Menu>
          <MenuTrigger asChild>
            <button type="button" className={healthTriggerClass}>
              <HealthBadge health={health} />
            </button>
          </MenuTrigger>
          <MenuContent variant="dropdown">
            {HEALTH_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} icon={opt.icon} onSelect={() => onHealthChange(opt.value)}>
                {opt.label}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </div>
      <TextArea
        variant="plain"
        rows={2}
        aria-label="Project update"
        placeholder="Write a project update…"
        className="mt-3"
        onKeyDown={onKeyDown}
      />
      <MilestoneDeltaList />
      <div className="flex items-center justify-between px-3 py-3">
        <Button icon={ListChecks}>Write with Agent</Button>
        <div className="flex items-center gap-3">
          <IconButton icon={Paperclip} label="Attach images, files, or videos" size="md" />
          <Button type="submit">Post update</Button>
        </div>
      </div>
    </form>
  );
}

/** Linha de projeto simplificada (não é a lista inteira — spec: "não precisa da lista completa"). */
function ProjectUpdateExample() {
  const [health, setHealth] = useState<Health>("off-track");
  const [open, setOpen] = useState(false);
  const [posted, setPosted] = useState<string>();

  return (
    <div className="flex w-full max-w-content flex-col gap-3">
      <div className="flex h-row items-center gap-2 rounded-control px-cell-x hovered:bg-hover">
        <ProjectIcon value={plugga.icon} />
        <span className="min-w-0 flex-1 truncate text-body-md text-primary">{plugga.label}</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={healthTriggerClass}>
              <HealthBadge health={health} />
            </button>
          </PopoverTrigger>
          <PopoverContent label="Project update" align="end" className="w-96">
            <ProjectUpdateComposer
              health={health}
              onHealthChange={setHealth}
              onPosted={() => {
                setPosted(
                  `Update posted · ${HEALTH_OPTIONS.find((h) => h.value === health)?.label}`,
                );
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <p aria-live="polite" className="min-h-4 text-body-sm text-secondary">
        {posted}
      </p>
    </div>
  );
}

function States() {
  return (
    <div className="flex flex-col gap-6">
      <StatesGrid
        states={[
          {
            label: "saúde · on track",
            node: (
              <button type="button" className={healthTriggerClass}>
                <HealthBadge health="on-track" />
              </button>
            ),
          },
          {
            label: "saúde · at risk",
            node: (
              <button type="button" className={healthTriggerClass}>
                <HealthBadge health="at-risk" />
              </button>
            ),
          },
          {
            label: "saúde · off track",
            node: (
              <button type="button" className={healthTriggerClass}>
                <HealthBadge health="off-track" />
              </button>
            ),
          },
          {
            label: "saúde · sem updates",
            node: (
              <button type="button" className={healthTriggerClass}>
                <HealthBadge health="none" />
              </button>
            ),
          },
          {
            label: "gatilho · hover",
            node: (
              <button type="button" data-preview="hover" className={healthTriggerClass}>
                <HealthBadge health="off-track" />
              </button>
            ),
          },
          {
            label: "gatilho · foco",
            node: (
              <button type="button" data-preview="focus" className={healthTriggerClass}>
                <HealthBadge health="off-track" />
              </button>
            ),
          },
        ]}
      />
      <StatesStack
        states={[
          {
            label: "popover aberto (composer)",
            node: (
              <PopoverSurface className="w-96">
                <ProjectUpdateComposer
                  health="off-track"
                  onHealthChange={() => {}}
                  onPosted={() => {}}
                />
              </PopoverSurface>
            ),
          },
        ]}
      />
      <p className="max-w-prose text-body-sm text-secondary">
        Vazio não se aplica ao popover (o composer sempre mostra os mesmos campos); a saúde{" "}
        &quot;none&quot; (&quot;No updates&quot;) é o equivalente a vazio para o indicador.
        Carregando e erro seguem os mesmos estados já existentes do Button (loading) e do Composer
        (Forms), sem peça nova aqui.
      </p>
    </div>
  );
}

export function Page() {
  return (
    <PatternPage
      doc={{
        title: "Project Update",
        description:
          "Popover de atualização de projeto sobre a lista de Projects (Figma 25:5446): reaproveita o Composer existente (ver também Forms → Composer) em modo update, com HealthBadge clicável no lugar do texto estático “On track” e a lista de milestones com delta no lugar da linha única “Progress since Sep 18”.",
        live: <ProjectUpdateExample />,
        liveDescription:
          "Clique no indicador de saúde da linha para abrir o popover; dentro dele, clique no indicador do cabeçalho para mudar a saúde. ⌘/Ctrl+Enter publica a atualização; Esc fecha o popover sem publicar.",
        states: <States />,
        themes: (theme) => <ProjectUpdateExample key={theme} />,
        composition: [
          <>
            Gatilho de saúde: <code className="font-mono text-code">HealthBadge</code> (já existe,{" "}
            <code className="font-mono text-code">badge.tsx</code>) dentro de um{" "}
            <code className="font-mono text-code">&lt;button&gt;</code> simples com o mesmo par
            hover/foco do <code className="font-mono text-code">PropertyButton</code> — composição
            de página, sem peça nova.
          </>,
          <>
            <code className="font-mono text-code">Popover</code>/
            <code className="font-mono text-code">PopoverContent</code> (Fase 3): abre sempre para
            baixo, com a superfície de popover (raio 12, bg-popover, shadow-md).
          </>,
          <>
            Composer: mesma composição do Forms → Composer (
            <code className="font-mono text-code">TextArea variant=&quot;plain&quot;</code>,{" "}
            <code className="font-mono text-code">Button</code>/
            <code className="font-mono text-code">IconButton</code> no rodapé), só em modo update —
            sem o <code className="font-mono text-code">SegmentedControl</code> Comment/Update do
            Composer avulso.
          </>,
          <>
            Milestones com delta:{" "}
            <code className="font-mono text-code">kit/milestone-data.tsx</code> (
            <code className="font-mono text-code">MILESTONES</code>), losango do lucide (
            <code className="font-mono text-code">Diamond</code>, preenchido quando 100%, mesmo
            padrão do Hover Card de Fase 5) — cada linha com nome, X% → Y% e data.
          </>,
          <>
            Menu de saúde: <code className="font-mono text-code">Menu</code>/
            <code className="font-mono text-code">MenuContent</code>/
            <code className="font-mono text-code">MenuItem</code> (Fase 3) com as quatro opções do{" "}
            <code className="font-mono text-code">Health</code> (on track, at risk, off track, sem
            updates).
          </>,
        ],
        decisions: [
          {
            decision: "Sem o SegmentedControl Comment/Update do Composer avulso dentro do popover",
            rule: "O popover do projeto é sempre uma atualização de saúde (Figma 25:5446); o Composer de Forms continua com o alternador, intacto",
          },
          {
            decision:
              "HealthBadge dentro de um botão simples como gatilho, na linha e no cabeçalho do composer",
            rule: "Spec Fase 10, item 5",
          },
          {
            decision: "Milestones com delta (0% → X%, data) no lugar da linha única",
            rule: "Spec Fase 10, item 5",
          },
          {
            decision: "⌘/Ctrl+Enter publica; Esc fecha o popover sem publicar",
            rule: "Spec Fase 10, §Comportamento (item 5); Esc é o padrão do Popover (Radix)",
          },
        ],
      }}
    />
  );
}
