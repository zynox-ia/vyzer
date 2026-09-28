/**
 * Detalhe de issue (spec Fase 10, item 6; Figma 27:17223, Inbox → ZYN-241): corpo (título grande
 * editável, descrição, "+ Add sub-issues", ações do topo) e sidebar de propriedades, lado a lado.
 *
 * Layout provisório: a Fase 8 (App Shell) ainda não chegou, então esta página não tenta montar
 * sidebar, top bar, painel direito com scrim nem breadcrumbs — isso é dela. Em vez disso, o corpo
 * e a sidebar ficam dentro de um contêiner local simples (só bordas e tokens), fácil de trocar
 * pelo painel real depois: um único componente de página, sem prop nova no design system. Ver
 * `.figma/01-design-tokens.md` ("layout provisório até a VYZ-35").
 */
import {
  Avatar,
  Button,
  ColorDot,
  Combobox,
  IconButton,
  LabelPicker,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  PropertyButton,
  Skeleton,
  TextArea,
  type LabelColor,
  type ListOption,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import {
  Bookmark,
  CalendarDays,
  CircleDot,
  Copy as CopyIcon,
  Ellipsis,
  FileText,
  GitBranch,
  GitPullRequest,
  Link2,
  ListPlus,
  OctagonMinus,
  OctagonPause,
  Plus,
  SquareStack,
  Tag,
  Trash2,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { issueById, statusValue } from "../../kit/issue-data";
import { PatternPage } from "../../kit/pattern-page";
import {
  INITIAL_LABELS,
  LEADS,
  PRIORITIES,
  PROJECT_OPTIONS,
  PROJECT_STATUSES,
  TEAMS,
  type Priority,
  type ProjectStatus,
} from "../../kit/project-data";
import { StatesStack } from "../../kit/states";
import { useInlineEdit } from "../../kit/use-inline-edit";

const ASSIGN_OPTIONS: ListOption[] = [
  ...LEADS.map((o) => (o.value === "none" ? { ...o, label: "No assignee" } : o)),
  { value: "__invite__", label: "Invite and assign…", icon: <Icon icon={UserPlus} /> },
];

/**
 * Título grande (type-heading-1): mesma alternância de Patterns → Inline Editing, em escala maior.
 * h2, não h1: o h1 da página é o título da documentação ("Issue Detail", kit/doc.tsx); dentro do
 * conteúdo, o título da issue é o heading de maior destaque visual, mas não é o único h1 da página.
 */
function EditableIssueTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const edit = useInlineEdit<HTMLInputElement, HTMLButtonElement>({
    value,
    onSave,
    submitOnEnter: true,
  });
  if (edit.editing) {
    return (
      <input
        {...edit.fieldProps}
        aria-label="Title"
        className="type-heading-1 block w-full rounded-control bg-transparent px-1.5 py-1 text-primary outline-none focus-field"
      />
    );
  }
  return (
    // O botão dentro do h2 carrega o comportamento de editar (role="button" não é permitido num
    // heading — axe aria-allowed-role).
    <h2>
      <button
        type="button"
        {...edit.staticProps}
        aria-label={`Edit title: ${value}`}
        className="type-heading-1 block w-full cursor-text rounded-control px-1.5 py-1 text-left text-primary focus-ring hovered:bg-hover"
      >
        {value}
      </button>
    </h2>
  );
}

/**
 * Descrição em TextArea plain — sem editor de texto rico (decisão pendente da spec, adiada). Campo
 * sempre editável e sincronizado a cada tecla (sem draft nem gate no blur): apagar tudo e sair do
 * campo é um valor válido, não um estado preso sem salvar. Mesma escolha do Milestone Detail (a
 * spec só chama o título/nome de "editável inline"; a descrição segue o padrão do formulário de
 * criação do milestone e do Creation Composer).
 */
function EditableIssueDescription({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  return (
    <TextArea
      variant="plain"
      size="lg"
      autoGrow
      rows={2}
      value={value}
      onChange={(e) => onSave(e.target.value)}
      aria-label="Description"
      placeholder="Add description…"
      className="px-1.5"
    />
  );
}

type Announce = (message: string) => void;

/** Ações do topo: link, copiar, branch e "…" (More) — Figma 27:17223, ícones de ação. */
function TopActions({ announce }: { announce: Announce }) {
  return (
    <div className="flex items-center gap-1">
      <IconButton icon={Link2} label="Copy link" onClick={() => announce("Link copied")} />
      <Menu>
        <MenuTrigger asChild>
          <IconButton icon={CopyIcon} label="Copy" />
        </MenuTrigger>
        <MenuContent variant="dropdown">
          <MenuItem shortcut={["Ctrl", "C"]} onSelect={() => announce("Copied ID")}>
            Copy ID
          </MenuItem>
          <MenuItem onSelect={() => announce("Copied URL")}>Copy URL</MenuItem>
          <MenuItem onSelect={() => announce("Copied title")}>Copy title</MenuItem>
          <MenuItem
            shortcut={["Ctrl", "Shift", "C"]}
            onSelect={() => announce("Copied title as link")}
          >
            Copy title as link
          </MenuItem>
          <MenuItem onSelect={() => announce("Copied issue as Markdown")}>
            Copy issue as Markdown
          </MenuItem>
          <MenuItem onSelect={() => announce("Copied everything as Markdown")}>
            Copy everything as Markdown
          </MenuItem>
          <MenuItem icon={GitBranch} onSelect={() => announce("Copied git branch name")}>
            Copy git branch name
          </MenuItem>
          <MenuItem onSelect={() => announce("Copied as prompt")}>Copy as prompt</MenuItem>
        </MenuContent>
      </Menu>
      <IconButton
        icon={GitBranch}
        label="Copy git branch name"
        onClick={() => announce("Copied git branch name")}
      />
      <Menu>
        <MenuTrigger asChild>
          <IconButton icon={Ellipsis} label="More" />
        </MenuTrigger>
        <MenuContent variant="dropdown">
          <MenuSub>
            <MenuSubTrigger icon={UserRound}>Team</MenuSubTrigger>
            <MenuSubContent panelLabel="Team">
              {TEAMS.map((t) => (
                <MenuItem key={t.value} onSelect={() => announce(`Team: ${t.label}`)}>
                  {t.label} · {t.hint}
                </MenuItem>
              ))}
            </MenuSubContent>
          </MenuSub>
          <MenuItem
            icon={CalendarDays}
            shortcut={["Ctrl", "Shift", "D"]}
            onSelect={() => announce("Due date")}
          >
            Due date
          </MenuItem>
          <MenuItem icon={Link2} onSelect={() => announce("Add link")}>
            Add link
          </MenuItem>
          <MenuItem icon={GitPullRequest} onSelect={() => announce("Add pull request")}>
            Add pull request
          </MenuItem>
          <MenuItem icon={FileText} onSelect={() => announce("Add document")}>
            Add document
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger icon={ListPlus}>Create related</MenuSubTrigger>
            <MenuSubContent panelLabel="Create related">
              <MenuItem onSelect={() => announce("Create related issue")}>Issue…</MenuItem>
              <MenuItem onSelect={() => announce("Create related document")}>Document…</MenuItem>
            </MenuSubContent>
          </MenuSub>
          <MenuSub>
            <MenuSubTrigger icon={Link2}>Add relation</MenuSubTrigger>
            <MenuSubContent panelLabel="Add relation">
              {RELATION_ORDER.map((type) => (
                <MenuItem
                  key={type}
                  onSelect={() => announce(`Add relation: ${RELATION_LABELS[type]}`)}
                >
                  {RELATION_LABELS[type]}
                </MenuItem>
              ))}
            </MenuSubContent>
          </MenuSub>
          <MenuItem icon={CircleDot} onSelect={() => announce("Mark as duplicate")}>
            Mark as…
          </MenuItem>
          <MenuSeparator />
          <MenuSub>
            <MenuSubTrigger icon={CopyIcon}>Copy</MenuSubTrigger>
            <MenuSubContent panelLabel="Copy">
              <MenuItem onSelect={() => announce("Copied ID")}>Copy ID</MenuItem>
              <MenuItem onSelect={() => announce("Copied URL")}>Copy URL</MenuItem>
              <MenuItem onSelect={() => announce("Copied title")}>Copy title</MenuItem>
              <MenuItem shortcut={["Ctrl", "C"]} onSelect={() => announce("Copied title as link")}>
                Copy title as link
              </MenuItem>
              <MenuItem onSelect={() => announce("Copied issue as Markdown")}>
                Copy issue as Markdown
              </MenuItem>
              <MenuItem onSelect={() => announce("Copied everything as Markdown")}>
                Copy everything as Markdown
              </MenuItem>
              <MenuItem onSelect={() => announce("Copied git branch name")}>
                Copy git branch name
              </MenuItem>
              <MenuItem onSelect={() => announce("Copied as prompt")}>Copy as prompt</MenuItem>
            </MenuSubContent>
          </MenuSub>
          <MenuSub>
            <MenuSubTrigger icon={SquareStack}>Convert to</MenuSubTrigger>
            <MenuSubContent panelLabel="Convert to">
              <MenuItem icon={CircleDot} onSelect={() => announce("Convert to issue")}>
                Issue…
              </MenuItem>
              <MenuItem icon={SquareStack} onSelect={() => announce("Convert to sub-issue")}>
                Sub-issue…
              </MenuItem>
              <MenuItem icon={OctagonPause} onSelect={() => announce("Convert to parent issue")}>
                Parent issue…
              </MenuItem>
              <MenuItem icon={OctagonMinus} onSelect={() => announce("Convert to blocked issue")}>
                Blocked issue…
              </MenuItem>
              <MenuItem icon={OctagonMinus} onSelect={() => announce("Convert to blocking issue")}>
                Blocking issue…
              </MenuItem>
            </MenuSubContent>
          </MenuSub>
          <MenuItem icon={CopyIcon} onSelect={() => announce("Made a copy")}>
            Make a copy
          </MenuItem>
          <MenuItem icon={Bookmark} onSelect={() => announce("Favorited")}>
            Favorite
          </MenuItem>
          <MenuItem icon={CalendarDays} onSelect={() => announce("Remind me")}>
            Remind me…
          </MenuItem>
          <MenuItem icon={FileText} onSelect={() => announce("Showing description history")}>
            Show description history
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            icon={Trash2}
            className="text-danger-strong"
            onSelect={() => announce("Deleted")}
          >
            Delete…
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

type Properties = {
  status: ProjectStatus;
  priority: Priority;
  assignee: string;
  project: string;
  labels: string[];
};

/** Seção da sidebar com cabeçalho (Properties/Labels/Project/…): título 13 px/500 secundário. */
function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-label-md text-secondary">{title}</h3>
      {children}
    </div>
  );
}

type RelationType = "blocks" | "blocked-by" | "related" | "duplicate-of";

/**
 * O Linear real não tem uma seção "Related" genérica: o cabeçalho muda para o nome do tipo da
 * relação (conferido ao vivo em ZYN-89, VYZ-36, VYZ-37: "Blocked by"; VYZ-31/VYZ-30: "Related") —
 * e a seção some por completo quando não há relação daquele tipo (conferido em ZYN-1 e ZYN-2, sem
 * nenhuma issue relacionada: nem "Properties"/"Labels"/"Project" aparecem vazios, o Linear só
 * mostra o que existe).
 */
const RELATION_LABELS: Record<RelationType, string> = {
  blocks: "Blocks",
  "blocked-by": "Blocked by",
  related: "Related",
  "duplicate-of": "Duplicate of",
};
const RELATION_ORDER: RelationType[] = ["blocked-by", "blocks", "related", "duplicate-of"];

type Relation = { type: RelationType; issueId: string };

/**
 * Linha de issue relacionada: ícone de status + ID + título, como a Issue Row da Fase 5. O botão
 * "Remove relation" só aparece no hover/foco da linha (Linear real: só some da opacidade, não do
 * fluxo — group-hover/group-focus-within, sem componente novo).
 */
function RelatedRow({ issueId, onRemove }: { issueId: string; onRemove: () => void }) {
  const issue = issueById(issueId);
  const status = statusValue(issue.status);
  return (
    <div className="group/relation flex h-row items-center gap-1.5 px-1.5 text-body-md">
      <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
        {status.icon}
      </span>
      <span className="shrink-0 font-mono text-code text-secondary">{issue.id}</span>
      <span className="min-w-0 flex-1 truncate text-primary">{issue.title}</span>
      <IconButton
        icon={X}
        label={`Remove relation: ${issue.id} ${issue.title}`}
        size="sm"
        className="opacity-0 group-focus-within/relation:opacity-100 group-hover/relation:opacity-100"
        onClick={onRemove}
      />
    </div>
  );
}

/**
 * Uma seção por tipo de relação presente (Blocked by, Blocks, Related, Duplicate of), cada uma só
 * aparece se tiver pelo menos uma issue — e a área toda não renderiza nada sem nenhuma relação,
 * como no Linear real (a sidebar não tem um gatilho de adicionar relação; isso fica no menu More
 * do topo, igual ao Linear — ver TopActions).
 */
function RelationsArea({
  relations,
  onRemove,
}: {
  relations: Relation[];
  onRemove: (issueId: string) => void;
}) {
  const typesPresent = RELATION_ORDER.filter((type) => relations.some((r) => r.type === type));
  if (typesPresent.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {typesPresent.map((type) => (
        <SidebarSection key={type} title={RELATION_LABELS[type]}>
          <div className="flex flex-col">
            {relations
              .filter((r) => r.type === type)
              .map((r) => (
                <RelatedRow
                  key={r.issueId}
                  issueId={r.issueId}
                  onRemove={() => onRemove(r.issueId)}
                />
              ))}
          </div>
        </SidebarSection>
      ))}
    </div>
  );
}

/**
 * Sidebar de propriedades: Property Button em coluna dentro de seções com cabeçalho — Properties
 * (Status, Priority, Assignee), Labels, Project, e uma seção por tipo de relação presente — mesmo
 * agrupamento do Linear real (issue VYZ-31, conferido ao vivo em 28/09). Sem Team: o Linear real
 * não mostra Team na sidebar da issue (Team já está no menu "More" do topo).
 */
function PropertiesSidebar({
  value,
  onChange,
  labels,
  onCreateLabel,
  relations,
  onRemoveRelation,
}: {
  value: Properties;
  onChange: (next: Partial<Properties>) => void;
  labels: { value: string; label: string; color: LabelColor }[];
  onCreateLabel: (name: string, color: LabelColor) => string;
  relations: Relation[];
  onRemoveRelation: (issueId: string) => void;
}) {
  const status = PROJECT_STATUSES.find((s) => s.value === value.status);
  const priority = PRIORITIES.find((p) => p.value === value.priority);
  const assignee = ASSIGN_OPTIONS.find((a) => a.value === value.assignee);
  const project = PROJECT_OPTIONS.find((p) => p.value === value.project);
  const chosenLabels = labels.filter((l) => value.labels.includes(l.value));
  const firstLabel = chosenLabels[0];

  return (
    <div className="flex w-full flex-col gap-4 desktop:w-48">
      <SidebarSection title="Properties">
        <div className="flex flex-col gap-1.5">
          <Combobox
            label="Status"
            value={value.status}
            onValueChange={(v) => onChange({ status: v })}
            options={PROJECT_STATUSES}
            searchPlaceholder="Change status…"
            shortcut={["S"]}
            width="sm"
          >
            <PropertyButton leading={status?.icon} className="w-full max-w-none justify-start">
              {status?.label}
            </PropertyButton>
          </Combobox>
          <Combobox
            label="Priority"
            value={value.priority}
            onValueChange={(v) => onChange({ priority: v })}
            options={PRIORITIES}
            searchPlaceholder="Change priority…"
            shortcut={["P", "P"]}
            numberFrom={0}
          >
            <PropertyButton
              leading={priority?.icon}
              empty={value.priority === "none"}
              className="w-full max-w-none justify-start"
            >
              {value.priority === "none" ? "Priority" : priority?.label}
            </PropertyButton>
          </Combobox>
          <Combobox
            label="Assignee"
            value={value.assignee}
            onValueChange={(v) => onChange({ assignee: v })}
            options={ASSIGN_OPTIONS}
            searchable={false}
            numberFrom={0}
          >
            <PropertyButton
              leading={
                value.assignee === "none" ? (
                  <Icon icon={UserRound} />
                ) : value.assignee === "__invite__" ? (
                  <Icon icon={UserPlus} />
                ) : (
                  <Avatar name={assignee?.label ?? ""} size="sm" />
                )
              }
              empty={value.assignee === "none"}
              className="w-full max-w-none justify-start"
            >
              {value.assignee === "none" ? "Assignee" : assignee?.label}
            </PropertyButton>
          </Combobox>
        </div>
      </SidebarSection>
      <SidebarSection title="Labels">
        <LabelPicker
          labels={labels}
          value={value.labels}
          onValueChange={(v) => onChange({ labels: v })}
          onCreate={onCreateLabel}
        >
          <PropertyButton
            leading={firstLabel ? <ColorDot color={firstLabel.color} /> : <Icon icon={Tag} />}
            empty={chosenLabels.length === 0}
            className="w-full max-w-none justify-start"
          >
            {chosenLabels.length === 0
              ? "Labels"
              : chosenLabels.length === 1
                ? firstLabel?.label
                : `${chosenLabels.length} labels`}
          </PropertyButton>
        </LabelPicker>
      </SidebarSection>
      <SidebarSection title="Project">
        <Combobox
          label="Project"
          value={value.project}
          onValueChange={(v) => onChange({ project: v })}
          options={PROJECT_OPTIONS}
          searchPlaceholder="Change project…"
          width="sm"
        >
          <PropertyButton
            leading={project?.icon}
            empty={!project}
            className="w-full max-w-none justify-start"
          >
            {project?.label ?? "Project"}
          </PropertyButton>
        </Combobox>
      </SidebarSection>
      <RelationsArea relations={relations} onRemove={onRemoveRelation} />
    </div>
  );
}

const INITIAL_TITLE = "Sync Linear webhooks with the issue feed";
const INITIAL_DESCRIPTION =
  "Webhook events from Linear should update the issue feed within a few seconds, without a manual refresh. We should verify signatures and retry failed deliveries.";

/** Contêiner provisório: bordas e tokens só, no lugar do painel de detalhe da Fase 8. */
function ProvisionalContainer({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full max-w-content flex-col rounded-container border border-default bg-surface">
      {children}
    </div>
  );
}

function IssueDetailExample({
  loading = false,
  initialRelations = [
    { type: "blocked-by", issueId: "ZYN-38" },
    { type: "related", issueId: "ZYN-33" },
  ],
}: {
  loading?: boolean;
  initialRelations?: Relation[];
}) {
  const [title, setTitle] = useState(INITIAL_TITLE);
  const [description, setDescription] = useState(INITIAL_DESCRIPTION);
  const [properties, setProperties] = useState<Properties>({
    status: "in-progress",
    priority: "urgent",
    assignee: "andre",
    project: "plugga",
    labels: ["bug"],
  });
  const [labels, setLabels] = useState(INITIAL_LABELS);
  const [relations, setRelations] = useState<Relation[]>(initialRelations);
  const [message, setMessage] = useState("");

  const removeRelation = (issueId: string) => {
    setRelations((prev) => prev.filter((r) => r.issueId !== issueId));
    setMessage(`Relation removed: ${issueId}`);
  };

  const createLabel = (name: string, color: LabelColor) => {
    const value = `${name.toLowerCase().replaceAll(/\s+/g, "-")}-${labels.length}`;
    setLabels((prev) => [...prev, { value, label: name, color }]);
    return value;
  };

  if (loading) {
    return (
      <ProvisionalContainer>
        <div className="flex items-center justify-between border-b border-default px-4 py-2">
          <Skeleton shape="line" className="w-16" />
          <div className="flex gap-1">
            <Skeleton shape="block" className="size-control-md" />
            <Skeleton shape="block" className="size-control-md" />
            <Skeleton shape="block" className="size-control-md" />
            <Skeleton shape="block" className="size-control-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 p-4 desktop:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-3">
            <Skeleton shape="line" className="h-7 w-3/4" />
            <Skeleton shape="line" className="w-full" />
            <Skeleton shape="line" className="w-5/6" />
          </div>
          <div className="flex flex-col gap-4">
            {/* Três seções fixas de esqueleto (Properties: 3 linhas; Labels e Project: 1 cada). */}
            {[3, 1, 1].map((rows, section) => (
              // oxlint-disable-next-line react/no-array-index-key
              <div key={section} className="flex flex-col gap-1.5">
                <Skeleton shape="line" className="w-16" />
                {Array.from({ length: rows }, (_, i) => (
                  // oxlint-disable-next-line react/no-array-index-key
                  <Skeleton key={i} shape="line" className="w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </ProvisionalContainer>
    );
  }

  return (
    <ProvisionalContainer>
      <div className="flex items-center justify-between border-b border-default px-4 py-2">
        <span className="font-mono text-code text-secondary">ZYN-241</span>
        <TopActions announce={setMessage} />
      </div>
      <div className="grid grid-cols-1 gap-8 p-4 desktop:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-3">
          <EditableIssueTitle
            value={title}
            onSave={(v) => {
              setTitle(v);
              setMessage(`Title saved: “${v}”`);
            }}
          />
          <EditableIssueDescription value={description} onSave={setDescription} />
          <div>
            <Button variant="ghost" icon={Plus} onClick={() => setMessage("Add sub-issues")}>
              Add sub-issues
            </Button>
          </div>
        </div>
        <PropertiesSidebar
          value={properties}
          onChange={(next) => {
            setProperties((prev) => ({ ...prev, ...next }));
            setMessage("Property updated");
          }}
          labels={labels}
          onCreateLabel={createLabel}
          relations={relations}
          onRemoveRelation={removeRelation}
        />
      </div>
      <p aria-live="polite" className="min-h-4 px-4 pb-3 text-body-sm text-secondary">
        {message}
      </p>
    </ProvisionalContainer>
  );
}

function States() {
  return (
    <div className="flex flex-col gap-6">
      <StatesStack
        states={[
          { label: "padrão (com relações)", node: <IssueDetailExample /> },
          {
            label: "sem relações — a seção some por completo, como no Linear real",
            node: <IssueDetailExample initialRelations={[]} />,
          },
          { label: "carregando (Skeleton)", node: <IssueDetailExample loading /> },
        ]}
      />
      <p className="max-w-prose text-body-sm text-secondary">
        Vazio e erro não se aplicam ao corpo (uma issue sempre tem título) nem às propriedades; a
        seção de relações é o único bloco condicional (ver acima). Falha de carregamento é tratada
        pela Fase 8, dona da navegação e da busca dos dados.
      </p>
    </div>
  );
}

export function Page() {
  return (
    <PatternPage
      doc={{
        title: "Issue Detail",
        description:
          "Corpo (título grande editável, descrição, sub-issues) e sidebar de propriedades, lado a lado (Figma 27:17223, Inbox → ZYN-241). Layout provisório: um contêiner local simples no lugar do painel de detalhe da Fase 8 (App Shell), que ainda não existe.",
        live: <IssueDetailExample />,
        liveDescription:
          'Clique no título ou na descrição para editar; "Copy" e "More" abrem os menus do topo (Team, Copy, Convert to são submenus); as propriedades abrem o seletor de sempre.',
        states: <States />,
        themes: (theme) => <IssueDetailExample key={theme} />,
        composition: [
          <>
            Contêiner provisório: <code className="font-mono text-code">rounded-container</code>,{" "}
            <code className="font-mono text-code">border-default</code>,{" "}
            <code className="font-mono text-code">bg-surface</code> — só tokens, sem sidebar, top
            bar, painel direito nem breadcrumbs (isso é da Fase 8/VYZ-35); um só componente de
            página, fácil de trocar depois.
          </>,
          <>
            Título: mesmo hook <code className="font-mono text-code">useInlineEdit</code> de
            Patterns → Inline Editing, em{" "}
            <code className="font-mono text-code">type-heading-1</code> (maior, por ser o título de
            uma página inteira).
          </>,
          <>
            Descrição:{" "}
            <code className="font-mono text-code">TextArea variant=&quot;plain&quot; autoGrow</code>{" "}
            — sem editor de texto rico (decisão pendente da spec, adiada; ver VYZ-33).
          </>,
          <>
            Ações do topo: <code className="font-mono text-code">IconButton</code> +{" "}
            <code className="font-mono text-code">Menu</code>/
            <code className="font-mono text-code">MenuSub</code> (Team, Copy, Convert to e Add
            relation como submenus dentro de More, igual ao padrão já testado na Fase 3).
          </>,
          <>
            Sidebar: seções com cabeçalho (
            <code className="font-mono text-code">text-label-md text-secondary</code>, 13 px/500) —
            Properties (Status, Priority, Assignee), Labels, Project — cada uma com{" "}
            <code className="font-mono text-code">PropertyButton</code> em coluna, mesmo padrão do
            Creation Composer (Combobox/Label Picker como seletor). Sem Team: o Linear real não
            mostra Team na sidebar da issue.
          </>,
          <>
            Relações: uma seção por tipo presente (Blocked by, Blocks, Related, Duplicate of — o
            cabeçalho é o nome do tipo, não um "Related" genérico), cada linha com ícone de status +
            ID em <code className="font-mono text-code">font-mono text-code</code> + título, mesma
            linguagem visual da Issue Row (Fase 5), e um botão "Remove relation" que só aparece no
            hover/foco da linha. A área toda não renderiza nada sem nenhuma relação, como no Linear
            real; adicionar uma relação fica no menu More do topo ("Add relation", um{" "}
            <code className="font-mono text-code">MenuSub</code> com os quatro tipos, sem
            persistir), não na sidebar — o Linear real não tem esse gatilho na sidebar.
          </>,
          <>
            Carregando: <code className="font-mono text-code">Skeleton</code> no título, nas
            propriedades e no topo (a Activity desta issue está em Patterns → Activity &amp;
            Comments).
          </>,
        ],
        decisions: [
          {
            decision:
              "Layout provisório (contêiner local) até a Fase 8 (VYZ-35) trazer o painel de detalhe real",
            rule: "Pedido do responsável: não criar sidebar/top bar/painel direito/breadcrumbs aqui para não conflitar com a Fase 8 em paralelo",
          },
          {
            decision:
              "Sidebar em seções com cabeçalho (Properties, Labels, Project, e uma por tipo de relação), sem Team",
            rule: "Linear real (issue VYZ-31, conferido ao vivo em 28/09): a sidebar tem <h3> Properties/Labels/Project/Related (13 px/500, text-label-md text-secondary); Team não aparece — corrigido na revisão de fidelidade de 28/09",
          },
          {
            decision:
              'Relações: uma seção por tipo presente (cabeçalho = nome do tipo, ex. "Blocked by"), não um "Related" genérico; a seção some por completo sem nenhuma relação (nenhum estado vazio visível)',
            rule: 'Linear real, conferido ao vivo em ZYN-1, ZYN-2 (zero relações: nem "Labels" nem "Project" nem nenhum tipo de relação aparecem — Linear só mostra o que existe) e em ZYN-89, VYZ-36, VYZ-37 ("Blocked by") vs VYZ-31/VYZ-30 ("Related") — revisão de fidelidade, rodada 2 de 28/09. Corrige a premissa inicial (achado do coordenador) de que "Related" seria uma seção sempre visível com estado vazio: VYZ-31 e VYZ-30, os exemplos citados, têm uma relação real entre si',
          },
          {
            decision:
              'Sem gatilho de "Add relation" na sidebar; adicionar relação é um MenuSub novo no menu More do topo (mesmo lugar que já cria/copia/converte a issue), com os quatro tipos',
            rule: "Pedido do responsável (28/09), seguindo o Linear real: a sidebar não tem gatilho de adicionar relação (só 'Remove relation' por linha, no hover); reverte a decisão anterior de manter um botão fixo na sidebar",
          },
          {
            decision: '"Remove relation" só aparece no hover/foco da linha (opacity-0 → 100)',
            rule: "Linear real (issue VYZ-31, conferido ao vivo): o botão de remover só existe visível no hover da linha",
          },
          {
            decision: "Assign to = o próprio seletor de Assignee, com 'Invite and assign…' no fim",
            rule: "Spec Fase 10, item 6: 'lista de pessoas + Invite and assign…, capturado do menu de assignee em 27:19467'",
          },
          {
            decision: "Team, Copy e Convert to como MenuSub dentro de More; Copy também no topo",
            rule: "Figma 27:18222 (Team é o 1º item de More); 27:18970 e efa5e2b2 (submenus); mesma ação nos dois lugares",
          },
          {
            decision: "Atalhos de teclado só como rótulo (Kbd), sem ligação funcional",
            rule: "Spec Fase 10, §Comportamento: fora do escopo aqui",
          },
          {
            decision: "Sem editor de texto rico: TextArea plain para a descrição",
            rule: "Spec Fase 10, 'Decisões pendentes' — adiado, decisão do responsável em 28/09",
          },
          {
            decision:
              "Descrição sempre editável (TextArea plain, sincronizada a cada tecla), sem alternância texto ↔ campo como o título",
            rule: 'Spec Fase 10, item 3 (só o nome/título é chamado de "editável inline"); mesma escolha do Milestone Detail',
          },
        ],
      }}
    />
  );
}
