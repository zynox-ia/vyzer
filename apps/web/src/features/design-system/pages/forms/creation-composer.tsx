/**
 * Composer de criação: cartão com nome, descrição opcional e ferramentas, para criar uma view,
 * issue ou projeto sem sair da lista. É composição, não um componente novo; as peças vêm do
 * design system.
 * - New view (Figma 26:6859, em uso no frame 1:7477 abaixo das abas de view): o padrão base.
 * - New project: o padrão base, com Property Buttons no rodapé.
 * - New issue: as peças do New Project, no arranjo do Figma 27:19344 (propriedades e ações na
 *   última linha).
 */
import {
  Avatar,
  Button,
  Chip,
  ColorDot,
  Combobox,
  DisplayOptions,
  FilterMenu,
  IconButton,
  IconPicker,
  LabelPicker,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  PropertyButton,
  TextArea,
  TextInput,
  type FilterValue,
  type LabelColor,
  type ListOption,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import {
  Box,
  CalendarDays,
  Ellipsis,
  Layers,
  ListFilter,
  Paperclip,
  Pencil,
  Plus,
  SlidersHorizontal,
  Tag,
  Triangle,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ComponentPage } from "../../kit/component-page";
import { FILTER_SECTIONS } from "../../kit/filter-data";
import {
  INITIAL_LABELS,
  LEADS,
  PRIORITIES,
  PROJECT_STATUSES,
  TEAMS,
  type Priority,
  type ProjectStatus,
} from "../../kit/project-data";
import { StatesGrid } from "../../kit/states";
import { ViewOptions } from "../../kit/view-options";

/** Padrão base (26:6859): New view e New project. */
type BaseKind = "view" | "project";

const KINDS: Record<
  BaseKind,
  {
    nameLabel: string;
    placeholder: string;
    submit: string;
    /** Ícone inicial do botão de ícone, em cinza (Figma 26:6866: #bec2c8 → text-secondary). */
    icon: ProjectIconValue;
  }
> = {
  // Camadas: o ícone de view do Figma (26:6866, e o do rascunho "New view", 1:7537)
  view: {
    nameLabel: "View name",
    placeholder: "All issues",
    submit: "Create view",
    icon: { kind: "icon", name: "Layers", color: "grey" },
  },
  // Box: o ícone inicial do New Project (página New Project, Figma 1:2)
  project: {
    nameLabel: "Project name",
    placeholder: "Project name",
    submit: "Create project",
    icon: { kind: "icon", name: "Box", color: "grey" },
  },
};

/** Assignee usa as pessoas da lista de Lead (página New Project), com o vazio de issue. */
const ASSIGNEES: ListOption[] = LEADS.map((o) =>
  o.value === "none" ? { ...o, label: "No assignee" } : o,
);

type ComposerOptions = {
  initialTitle?: string;
  initialDescription?: string;
  /** Foca o nome ao montar (cartão aberto pela pessoa). */
  autoFocus?: boolean;
  /** Ref do nome, para quem abre o cartão levar o foco de volta a ele. */
  titleRef?: RefObject<HTMLInputElement | null>;
  onCancel: () => void;
  onCreate: (name: string) => void;
};

/**
 * Estado e teclado comuns aos cartões. Enter no nome vai para a descrição; ⌘/Ctrl+Enter em
 * qualquer ponto do cartão confirma; Esc cancela. Teclas vindas de um popover aberto ficam com
 * ele: o Radix marca o Esc com preventDefault, e os popovers (em portal ou não) ficam fora do
 * cartão ou dentro de [data-radix-popper-content-wrapper].
 */
function useComposer({
  initialTitle = "",
  initialDescription = "",
  autoFocus = false,
  titleRef,
  onCancel,
  onCreate,
}: ComposerOptions) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const ownTitle = useRef<HTMLInputElement>(null);
  const titleInput = titleRef ?? ownTitle;
  const descriptionInput = useRef<HTMLTextAreaElement>(null);
  const empty = title.trim() === "";

  useEffect(() => {
    if (autoFocus) titleInput.current?.focus();
  }, [autoFocus, titleInput]);

  return {
    empty,
    formProps: {
      onSubmit: (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!empty) onCreate(title.trim());
      },
      onKeyDown: (e: KeyboardEvent<HTMLFormElement>) => {
        const target = e.target as Element;
        const inCard =
          e.currentTarget.contains(target) &&
          !target.closest("[data-radix-popper-content-wrapper]");
        if (e.defaultPrevented || !inCard) return;
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.currentTarget.requestSubmit();
        }
      },
    },
    titleProps: {
      ref: titleInput,
      value: title,
      autoComplete: "off",
      onChange: (e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value),
      // Enter (com ou sem Shift/Alt) vai para a descrição e nunca envia o form sozinho.
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter" || e.metaKey || e.ctrlKey || e.nativeEvent.isComposing) return;
        e.preventDefault();
        descriptionInput.current?.focus();
      },
    },
    descriptionProps: {
      ref: descriptionInput,
      value: description,
      onChange: (e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value),
    },
  };
}

type CardProps = ComposerOptions & {
  /** Nome do formulário (landmark): único na página. Sem ele, o formulário não vira landmark. */
  label?: string;
  /** Sem portal, os popovers do cartão herdam o tema do contêiner. */
  portal?: boolean;
  /** Reproduz o foco do cartão na documentação (data-preview). */
  preview?: "focus";
  id?: string;
};

/** Rodapé do New view (Figma 26:6886): Filter e Display options em Icon Buttons de relevo. */
function ViewTools({ portal }: { portal: boolean }) {
  const [filters, setFilters] = useState<FilterValue>({});
  return (
    <div className="ml-auto flex items-center gap-1.5">
      <FilterMenu
        sections={FILTER_SECTIONS}
        value={filters}
        onValueChange={setFilters}
        shortcut={["F"]}
        portal={portal}
      >
        <IconButton
          variant="secondary"
          icon={ListFilter}
          label="Add filter"
          className="text-secondary"
        />
      </FilterMenu>
      <DisplayOptions
        label="Display options"
        portal={portal}
        trigger={
          <IconButton
            variant="secondary"
            icon={SlidersHorizontal}
            label="Display options"
            className="text-secondary"
          />
        }
      >
        <ViewOptions portal={portal} />
      </DisplayOptions>
    </div>
  );
}

/** Rodapé do New project: Status, Priority e Lead (as listas da página New Project). */
function ProjectTools({ portal }: { portal: boolean }) {
  const [status, setStatus] = useState<ProjectStatus>("backlog");
  const [priority, setPriority] = useState<Priority>("none");
  const [lead, setLead] = useState("none");
  const currentStatus = PROJECT_STATUSES.find((s) => s.value === status);
  const currentPriority = PRIORITIES.find((p) => p.value === priority);
  const currentLead = LEADS.find((l) => l.value === lead);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Combobox
        label="Status"
        value={status}
        onValueChange={setStatus}
        options={PROJECT_STATUSES}
        searchPlaceholder="Change status…"
        shortcut={["S"]}
        width="sm"
        portal={portal}
      >
        <PropertyButton leading={currentStatus?.icon}>{currentStatus?.label}</PropertyButton>
      </Combobox>
      <Combobox
        label="Priority"
        value={priority}
        onValueChange={setPriority}
        options={PRIORITIES}
        searchPlaceholder="Change priority…"
        shortcut={["P", "P"]}
        numberFrom={0}
        portal={portal}
      >
        <PropertyButton leading={currentPriority?.icon} empty={priority === "none"}>
          {priority === "none" ? "Priority" : currentPriority?.label}
        </PropertyButton>
      </Combobox>
      <Combobox
        label="Lead"
        value={lead}
        onValueChange={setLead}
        options={LEADS}
        searchable={false}
        numberFrom={0}
        portal={portal}
      >
        <PropertyButton leading={<Icon icon={UserRound} />} empty={lead === "none"}>
          {lead === "none" ? "Lead" : currentLead?.label}
        </PropertyButton>
      </Combobox>
    </div>
  );
}

/**
 * O padrão base (26:6859): grade de três colunas (botão de ícone, nome, ações) com a descrição
 * embaixo, na coluna do nome; rodapé de ferramentas com hairline.
 */
function CreationComposer({
  kind,
  label,
  placeholder,
  portal = true,
  preview,
  id,
  ...options
}: CardProps & {
  kind: BaseKind;
  /** Placeholder do nome (New view: o nome da vista atual, Figma 26:6871). */
  placeholder?: string;
}) {
  const config = KINDS[kind];
  const [icon, setIcon] = useState(config.icon);
  const c = useComposer(options);
  return (
    // Esc e ⌘/Ctrl+Enter em qualquer ponto do cartão: o teclado é delegado ao form, e o foco fica
    // nos controles de dentro dele.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <form
      {...c.formProps}
      id={id}
      aria-label={label}
      data-preview={preview}
      className="flex w-full max-w-content flex-col rounded-container border border-default bg-surface focus-ring-within"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 p-3">
        {/* Ordem no DOM = ordem do Tab: ícone, nome, descrição, ações, rodapé. */}
        <div className="col-start-1 row-start-1 flex">
          <IconPicker value={icon} onValueChange={setIcon} portal={portal} />
        </div>
        <TextInput
          {...c.titleProps}
          variant="plain"
          heading
          aria-label={config.nameLabel}
          placeholder={placeholder ?? config.placeholder}
          className="col-start-2 row-start-1"
        />
        <TextArea
          {...c.descriptionProps}
          variant="plain"
          size="md"
          autoGrow
          rows={1}
          aria-label="Description"
          placeholder="Description (optional)"
          className="col-span-2 col-start-2 row-start-2"
        />
        <div className="col-start-3 row-start-1 flex items-center gap-1.5">
          <Button variant="ghost" onClick={options.onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={c.empty}>
            {config.submit}
          </Button>
        </div>
      </div>
      <div className="border-t border-default px-3 py-2">
        <div className="flex min-h-control-md items-center">
          {kind === "view" ? <ViewTools portal={portal} /> : <ProjectTools portal={portal} />}
        </div>
      </div>
    </form>
  );
}

/**
 * Propriedades do New issue: as peças do New Project (Property Buttons com Combobox e Label
 * Picker) e o Icon Button "…" abrindo um Menu.
 */
function IssueProperties({ portal }: { portal: boolean }) {
  const [team, setTeam] = useState("zynox");
  const [status, setStatus] = useState<ProjectStatus>("backlog");
  const [priority, setPriority] = useState<Priority>("none");
  const [assignee, setAssignee] = useState("none");
  const [labels, setLabels] = useState(INITIAL_LABELS);
  const [chosen, setChosen] = useState<string[]>([]);
  const currentTeam = TEAMS.find((t) => t.value === team);
  const currentStatus = PROJECT_STATUSES.find((s) => s.value === status);
  const currentPriority = PRIORITIES.find((p) => p.value === priority);
  const currentAssignee = ASSIGNEES.find((a) => a.value === assignee);
  const chosenLabels = labels.filter((l) => chosen.includes(l.value));
  const firstLabel = chosenLabels[0];

  const createLabel = (name: string, color: LabelColor) => {
    const value = `${name.toLowerCase().replaceAll(/\s+/g, "-")}-${labels.length}`;
    setLabels((prev) => [...prev, { value, label: name, color }]);
    return value;
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Combobox
        label="Team"
        value={team}
        onValueChange={setTeam}
        options={TEAMS}
        searchPlaceholder="Change team…"
        width="sm"
        portal={portal}
      >
        <PropertyButton leading={currentTeam?.icon} aria-label={`Team: ${currentTeam?.label}`}>
          {currentTeam?.hint}
        </PropertyButton>
      </Combobox>
      <Combobox
        label="Status"
        value={status}
        onValueChange={setStatus}
        options={PROJECT_STATUSES}
        searchPlaceholder="Change status…"
        shortcut={["S"]}
        width="sm"
        portal={portal}
      >
        <PropertyButton leading={currentStatus?.icon}>{currentStatus?.label}</PropertyButton>
      </Combobox>
      <Combobox
        label="Priority"
        value={priority}
        onValueChange={setPriority}
        options={PRIORITIES}
        searchPlaceholder="Change priority…"
        shortcut={["P", "P"]}
        numberFrom={0}
        portal={portal}
      >
        <PropertyButton leading={currentPriority?.icon} empty={priority === "none"}>
          {priority === "none" ? "Priority" : currentPriority?.label}
        </PropertyButton>
      </Combobox>
      <Combobox
        label="Assignee"
        value={assignee}
        onValueChange={setAssignee}
        options={ASSIGNEES}
        searchable={false}
        numberFrom={0}
        portal={portal}
      >
        <PropertyButton
          leading={
            assignee === "none" ? (
              <Icon icon={UserRound} />
            ) : (
              <Avatar name={currentAssignee?.label ?? ""} size="sm" />
            )
          }
          empty={assignee === "none"}
        >
          {assignee === "none" ? "Assignee" : currentAssignee?.label}
        </PropertyButton>
      </Combobox>
      <LabelPicker
        labels={labels}
        value={chosen}
        onValueChange={setChosen}
        onCreate={createLabel}
        portal={portal}
      >
        <PropertyButton
          leading={firstLabel ? <ColorDot color={firstLabel.color} /> : <Icon icon={Tag} />}
          empty={chosenLabels.length === 0}
        >
          {chosenLabels.length === 0
            ? "Labels"
            : chosenLabels.length === 1
              ? firstLabel?.label
              : `${chosenLabels.length} labels`}
        </PropertyButton>
      </LabelPicker>
      {/* Mais propriedades, como no Linear; sem ação real (a criação fica fora do escopo). */}
      <Menu>
        <MenuTrigger asChild>
          <IconButton
            variant="secondary"
            size="sm"
            icon={Ellipsis}
            label="More actions"
            className="text-secondary"
          />
        </MenuTrigger>
        <MenuContent variant="dropdown" portal={portal}>
          <MenuItem icon={Box}>Project</MenuItem>
          <MenuItem icon={CalendarDays}>Due date</MenuItem>
          <MenuItem icon={Triangle}>Estimate</MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

/**
 * New issue: o nome e a descrição do padrão base (sem botão de ícone) e, na última linha, as
 * propriedades à esquerda e anexo, Cancel e Create à direita, como no Figma 27:19344.
 */
function IssueComposer({ label, portal = true, preview, id, ...options }: CardProps) {
  const c = useComposer(options);
  return (
    // Esc e ⌘/Ctrl+Enter em qualquer ponto do cartão (ver CreationComposer).
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <form
      {...c.formProps}
      id={id}
      aria-label={label}
      data-preview={preview}
      className="flex w-full max-w-content flex-col gap-1.5 rounded-container border border-default bg-surface p-3 focus-ring-within"
    >
      <TextInput
        {...c.titleProps}
        variant="plain"
        heading
        aria-label="Issue title"
        placeholder="Issue title"
      />
      <TextArea
        {...c.descriptionProps}
        variant="plain"
        size="md"
        autoGrow
        rows={1}
        aria-label="Description"
        placeholder="Add description…"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <IssueProperties portal={portal} />
        <div className="ml-auto flex items-center gap-1.5">
          <IconButton icon={Paperclip} label="Attach images, files, or videos" />
          <Button variant="ghost" onClick={options.onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={c.empty}>
            Create
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * Abre e fecha um composer a partir de um gatilho que fica sempre na tela: abrir foca o nome;
 * fechar (Cancel, Esc ou criar) devolve o foco ao gatilho.
 */
function useComposerToggle(noun: string) {
  const [open, setOpen] = useState(true);
  const [autoFocus, setAutoFocus] = useState(false);
  const [message, setMessage] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLInputElement>(null);
  const composerId = useId();
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  return {
    open,
    message,
    triggerProps: {
      ref: trigger,
      "aria-expanded": open,
      "aria-controls": open ? composerId : undefined,
      onClick: () => {
        setMessage("");
        if (open) title.current?.focus();
        else {
          setAutoFocus(true);
          setOpen(true);
        }
      },
    },
    composerProps: {
      id: composerId,
      autoFocus,
      titleRef: title,
      onCancel: close,
      onCreate: (name: string) => {
        setMessage(`${noun} “${name}” created`);
        close();
      },
    },
  };
}

function Feedback({ message }: { message: string }) {
  return (
    <p aria-live="polite" className="min-h-4 text-body-sm text-secondary">
      {message}
    </p>
  );
}

const VIEWS = [
  { value: "active", label: "Active" },
  { value: "backlog", label: "Backlog" },
  { value: "all", label: "All issues" },
];

/**
 * New view como no frame 1:7477: as vistas salvas, o rascunho "New view" (que abre o composer) e
 * o cartão logo abaixo. O placeholder do nome é o nome da vista atual.
 */
function NewViewExample() {
  const [view, setView] = useState("all");
  const t = useComposerToggle("View");
  const current = VIEWS.find((v) => v.value === view);
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {VIEWS.map((v) => (
          <Chip
            key={v.value}
            variant="filled"
            active={view === v.value}
            onClick={() => setView(v.value)}
          >
            {v.label}
          </Chip>
        ))}
        <Chip
          variant="draft"
          icon={<Icon icon={Layers} className="text-secondary" />}
          trailing={<Icon icon={Pencil} />}
          {...t.triggerProps}
        >
          New view
        </Chip>
      </div>
      {t.open && (
        <CreationComposer
          kind="view"
          label="New view"
          placeholder={current?.label}
          {...t.composerProps}
        />
      )}
      <Feedback message={t.message} />
    </div>
  );
}

/** New issue e New project: o gatilho "New …" e o cartão de cada um. */
function TriggeredExample({ kind }: { kind: "issue" | "project" }) {
  const t = useComposerToggle(kind === "issue" ? "Issue" : "Project");
  const name = `New ${kind}`;
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <Button icon={Plus} {...t.triggerProps}>
        {name}
      </Button>
      {t.open &&
        (kind === "issue" ? (
          <IssueComposer label={name} {...t.composerProps} />
        ) : (
          <CreationComposer kind="project" label={name} {...t.composerProps} />
        ))}
      <Feedback message={t.message} />
    </div>
  );
}

function Example({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-caption text-secondary">{title}</figcaption>
      <div className="rounded-container border border-subtle bg-panel p-6">{children}</div>
    </figure>
  );
}

type StaticProps = Omit<CardProps, "onCancel" | "onCreate">;

/** Cartões de documentação (estados e temas): nada acontece ao cancelar ou criar. */
function StaticComposer(props: StaticProps & { kind: BaseKind }) {
  return <CreationComposer {...props} onCancel={() => {}} onCreate={() => {}} />;
}

function StaticIssueComposer(props: StaticProps) {
  return <IssueComposer {...props} onCancel={() => {}} onCreate={() => {}} />;
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-2">
      <span className="text-caption text-secondary">{label}</span>
      {children}
    </li>
  );
}

function States() {
  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-6 rounded-container border border-subtle bg-panel p-6">
        <State label="padrão: vazio, só os placeholders; primário desabilitado">
          <StaticComposer kind="view" />
        </State>
        <State label="preenchido">
          <StaticComposer
            kind="view"
            initialTitle="Bugs this week"
            initialDescription="Open bugs created in the last 7 days, grouped by priority."
          />
        </State>
        <State label="foco: linha de campo no cartão, sem acento nem halo">
          <StaticComposer kind="view" initialTitle="Bugs this week" preview="focus" />
        </State>
        <State label="New issue: vazio, Create desabilitado">
          <StaticIssueComposer />
        </State>
        <State label="New issue: preenchido e com foco">
          <StaticIssueComposer
            initialTitle="CRM agent with human approval"
            initialDescription="Draft replies need a human approval before they are sent."
            preview="focus"
          />
        </State>
      </ul>
      <StatesGrid
        states={[
          {
            label: "Cancel · hover",
            node: (
              <Button variant="ghost" data-preview="hover">
                Cancel
              </Button>
            ),
          },
          {
            label: "primário · hover",
            node: (
              <Button variant="primary" data-preview="hover">
                Create view
              </Button>
            ),
          },
          {
            label: "primário · desabilitado",
            node: (
              <Button variant="primary" disabled>
                Create view
              </Button>
            ),
          },
          {
            label: "ferramenta · hover",
            node: (
              <IconButton
                variant="secondary"
                icon={ListFilter}
                label="Add filter"
                className="text-secondary"
                data-preview="hover"
              />
            ),
          },
          {
            label: "ferramenta · focus-visible",
            node: (
              <IconButton
                variant="secondary"
                icon={SlidersHorizontal}
                label="Display options"
                className="text-secondary"
                data-preview="focus"
              />
            ),
          },
          {
            label: "Property Button · hover",
            node: (
              <PropertyButton leading={<Icon icon={UserRound} />} empty data-preview="hover">
                Lead
              </PropertyButton>
            ),
          },
        ]}
      />
    </div>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Creation Composer",
        description:
          "Padrão para criar uma view, issue ou projeto sem sair da lista: cartão com nome, descrição opcional, ações e ferramentas (Figma 26:6859, em uso no frame 1:7477 abaixo das abas de view). New project repete o padrão; New issue reutiliza as peças do New Project. É composição, não um componente novo.",
        whenToUse: [
          "Criar um item a partir de uma lista, com nome e descrição, sem abrir uma tela nova",
          'Salvar a vista atual como uma view nova (o rascunho "New view" abre o cartão)',
          "Criar issue ou projeto já com as propriedades principais",
        ],
        whenNotToUse: [
          "Comentário ou update de projeto: use Composer",
          "Formulários longos, com campos obrigatórios além do nome: use Fields num formulário",
          "Editar um item existente: edite no próprio item",
        ],
        playground: {
          preview: <NewViewExample />,
          controls: (
            <p className="max-w-prose text-body-sm text-secondary">
              Digite o nome e confirme com Create view ou ⌘/Ctrl+Enter; Enter no nome leva à
              descrição; Cancel ou Esc fecham o cartão. O rascunho &quot;New view&quot; abre o
              cartão de novo, com o foco no nome. Filter e Display options abrem os popovers do
              design system.
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-col gap-8">
            <Example title="New issue: peças do New Project; propriedades e ações na última linha">
              <TriggeredExample kind="issue" />
            </Example>
            <Example title="New project: o padrão base, com Status, Priority e Lead no rodapé">
              <TriggeredExample kind="project" />
            </Example>
          </div>
        ),
        states: <States />,
        themes: (theme) => (
          <div className="flex flex-col gap-4">
            <StaticComposer kind="view" label={`New view, ${theme} theme`} portal={false} />
            <StaticIssueComposer label={`New issue, ${theme} theme`} portal={false} />
          </div>
        ),
        anatomy: (
          <div className="flex max-w-prose flex-col gap-3 text-body-md text-secondary">
            <p>
              Cartão rounded-container com borda border-default e fundo bg-surface, sem sombra, que
              mostra o foco de campo quando o nome ou a descrição têm foco (focus-ring-within).
              Corpo com 12 px de padding e 6 px entre as linhas, numa grade de três colunas: botão
              de ícone de 28 px (gatilho padrão do Icon Picker), nome (TextInput plain heading, 16
              px/500) e ações (Cancel ghost e o primário, Buttons de 28 px). A descrição (TextArea
              plain md, 13 px) fica na linha de baixo, na coluna do nome: o texto dos dois começa no
              mesmo ponto. Rodapé com hairline border-default e 8 × 12 px: no New view, Filter e
              Display options (Icon Buttons secondary de 28 px) à direita; no New project, Property
              Buttons à esquerda.
            </p>
            <p>
              New issue: o mesmo nome e a mesma descrição, sem botão de ícone; na última linha, os
              Property Buttons do New Project (Team, Status, Priority, Assignee, Labels) e o Icon
              Button &quot;…&quot; à esquerda; anexo, Cancel e Create à direita.
            </p>
            <p>
              A descrição cresce com o texto até 288 px e então rola. Limitação: o Firefox ainda não
              tem field-sizing, então lá ela fica com uma linha e rola desde o começo.
            </p>
          </div>
        ),
        keyboard: [
          "Ao abrir, o foco vai para o nome.",
          "Tab: nome → descrição → ações → rodapé (Shift+Tab a partir do nome chega ao botão de ícone); no New issue, nome → descrição → propriedades → anexo → Cancel → Create.",
          "Enter no nome vai para a descrição; na descrição, Enter quebra a linha.",
          "⌘/Ctrl+Enter em qualquer ponto do cartão confirma (nada acontece com o nome vazio).",
          "Esc cancela e fecha, como Cancel; com um popover aberto, fecha só o popover. Ao fechar, o foco volta ao gatilho.",
        ],
        accessibility: [
          'O cartão é um form com nome ("New view"); nome e descrição têm rótulo (aria-label), o placeholder não é rótulo.',
          "O botão de confirmar fica desabilitado (disabled) enquanto o nome está vazio.",
          'O gatilho (rascunho "New view", "New issue") tem aria-expanded e aria-controls apontando para o cartão aberto.',
          'O resultado ("View … created") é anunciado numa região aria-live.',
          'Botões só de ícone com nome: "Choose icon", "Add filter", "Display options", "More actions", "Attach images, files, or videos". O chip do time diz "Team: Zynox".',
        ],
        content: [
          'Confirmar com verbo: "Create view", "Create project"; no New issue, "Create".',
          'Descrição marcada como opcional no placeholder: "Description (optional)"; no New issue, "Add description…".',
          'New view: o placeholder do nome é o nome da vista atual ("All issues").',
        ],
        dos: [
          "Abra o cartão logo abaixo de onde o item vai aparecer",
          "Mostre só as propriedades que valem na criação",
        ],
        donts: [
          "Não peça mais que o nome para criar",
          "Não feche o cartão com Esc enquanto um popover está aberto",
        ],
        usage: `import {
  Button, IconPicker, TextArea, TextInput,
} from "@vyzer/design-system/components";

<form
  aria-label="New view"
  onSubmit={create}
  onKeyDown={(e) => {
    if (e.defaultPrevented) return;
    if (e.key === "Escape") cancel();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.requestSubmit();
  }}
  className="flex flex-col rounded-container border border-default bg-surface focus-ring-within"
>
  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 p-3">
    <IconPicker value={icon} onValueChange={setIcon} />
    <TextInput variant="plain" heading aria-label="View name" placeholder="All issues" />
    <TextArea variant="plain" size="md" autoGrow rows={1} aria-label="Description"
      placeholder="Description (optional)" className="col-span-2 col-start-2 row-start-2" />
    <div className="col-start-3 row-start-1 flex gap-1.5">
      <Button variant="ghost" onClick={cancel}>Cancel</Button>
      <Button variant="primary" type="submit" disabled={!name}>Create view</Button>
    </div>
  </div>
  <div className="flex border-t border-default px-3 py-2">{/* ferramentas */}</div>
</form>`,
        props: [
          {
            name: 'TextInput variant="plain"',
            type: "variante",
            description: "Nome sem borda nem fundo, 6 px de padding; o cartão mostra o foco.",
          },
          {
            name: "TextInput heading",
            type: "boolean",
            default: "false",
            description: "Só no plain: texto de título, 16 px/500.",
          },
          {
            name: 'TextArea variant="plain" size="md"',
            type: "variante",
            description: "Descrição de 13 px com 6 px de padding.",
          },
          {
            name: "TextArea autoGrow",
            type: "boolean",
            default: "false",
            description: "Cresce com o texto até 288 px e depois rola.",
          },
          {
            name: "IconPicker (sem children)",
            type: "componente",
            description:
              'Botão de ícone padrão, quadrado de 28 px, com o valor atual; nome em triggerLabel ("Choose icon").',
          },
          {
            name: "FilterMenu · DisplayOptions",
            type: "componente",
            description: "Ferramentas do New view, com Icon Buttons secondary como gatilhos.",
          },
          {
            name: "Combobox · LabelPicker · Menu",
            type: "componente",
            description:
              "Propriedades de issue e projeto, com Property Buttons e Icon Button como gatilhos.",
          },
        ],
        decisions: [
          {
            decision:
              "Cartão rounded-container, border-default, bg-surface, sem sombra (Figma: r10, #222325, relevo curto)",
            rule: "Figma 26:6859; mesma borda do Composer (1:6364); ADR-0013 (sombra só em overlays)",
          },
          {
            decision: "Hairline do rodapé em border-default (Figma: #2b2c2e)",
            rule: "Figma 26:6883; mesma regra da hairline interna do Filter Menu (18:354)",
          },
          {
            decision: "Corpo com 12 px de padding e 6 px entre as linhas; rodapé 8 × 12 px",
            rule: "Figma 26:6862 e 26:6883",
          },
          {
            decision: "Nome em 16 px/500 (TextInput plain heading)",
            rule: "Figma 26:6871 (15 px/500) → degrau de 16 da escala (ADR-0013: escala 13 × 1,2ⁿ)",
          },
          {
            decision: "Descrição em 13 px com 6 px de padding (TextArea plain md)",
            rule: "Figma 26:6881 (32 px, p 6, 13 Regular)",
          },
          {
            decision: "Descrição alinhada ao nome pela grade, não por recuo fixo",
            rule: "Figma 26:6880 (recuo de 35 = botão de 28 + 6 + 1 da captura)",
          },
          {
            decision:
              "Botão de ícone quadrado de 28 px, rounded-xs, bg-pressed; hover só soma bg-hover",
            rule: "Figma 26:6865 (28 × 28, r4, rgba(190,194,200,0,17) → camada de 10%, a mais próxima); gatilho padrão do Icon Picker",
          },
          {
            decision: "Ícones iniciais em cinza: camadas (view) e caixa (projeto)",
            rule: "Figma 26:6866 (camadas #bec2c8 → text-secondary); Box é o ícone inicial da página New Project (1:2)",
          },
          {
            decision:
              "Descrição cresce até 288 px (max-h-72) e depois rola; no Firefox fica com uma linha e rola",
            rule: "Grade de 4 (§1); mesmo limite da lista do Icon Picker. field-sizing: content ainda não existe no Firefox",
          },
          {
            decision: "Cancel ghost e primário em Buttons de 28 px (Figma: 24 px, padding 8)",
            rule: "ADR-0013: Button de tamanho único (28 px, 12 px de padding)",
          },
          {
            decision: "Primário no Button primary do Vyzer, não no accent do Linear #5e6ad2",
            rule: "ADR-0013 (sem o acento do Linear)",
          },
          {
            decision:
              "Filter e Display options em Icon Buttons secondary de 28 px, ícone de 16 em text-secondary",
            rule: "Figma 26:6891 e 26:6898 (28 px, relevo, ícone de 14 em #98999c); escala de ícones 12 · 16",
          },
          {
            decision:
              "New project: Status, Priority e Lead à esquerda do rodapé, com 28 px de altura mínima",
            rule: "Listas da página New Project; lead é de projeto (ADR-0001); mesma geometria do 26:6884",
          },
          {
            decision:
              "New issue reutiliza as peças do New Project (Property Buttons com Combobox e Label Picker, Icon Button com Menu), sem botão de ícone",
            rule: "Pedido do responsável: o design system vale mais que a fidelidade ao nó 27:19344",
          },
          {
            decision: "Foco no cartão inteiro (linha de campo), sem terracota nem halo",
            rule: "ADR-0013 (foco de campo em todo o sistema); mesmo padrão do Composer",
          },
          {
            decision:
              "Ordem do Tab igual à ordem de leitura; no padrão base, as ações vêm depois da descrição",
            rule: "Spec VYZ-33; ordem do DOM, com as ações posicionadas na grade (WCAG 2.4.3)",
          },
          {
            decision:
              "Enter no nome vai para a descrição; ⌘/Ctrl+Enter em qualquer ponto do cartão confirma; Esc cancela; confirmar desabilitado sem nome",
            rule: "Linear (Jakob, §7); spec VYZ-33",
          },
          {
            decision: "Esc e ⌘/Ctrl+Enter com um popover aberto ficam com o popover",
            rule: "Radix (a camada mais alta trata o Esc primeiro); §7 previsibilidade",
          },
          {
            decision: "Ao fechar, o foco volta ao gatilho; o resultado é anunciado em aria-live",
            rule: "WCAG 2.4.3 (ordem de foco) e 4.1.3 (mensagens de status)",
          },
          {
            decision: 'New view: placeholder do nome é o nome da vista atual ("All issues")',
            rule: "Figma 26:6871 e 1:7477",
          },
        ],
      }}
    />
  );
}
