/**
 * Edição inline de título, descrição e propriedades (spec Fase 10, item 2). Nós 1:6023 (título) e
 * 1:6103 (descrição), soltos no Figma — segue o Linear para a alternância texto ↔ campo. As
 * propriedades reaproveitam o padrão Property Button do New Project e do Creation Composer
 * (VYZ-33), sem peça nova.
 */
import {
  Avatar,
  Combobox,
  ColorDot,
  LabelPicker,
  PropertyButton,
  TextArea,
  TextInput,
  type LabelColor,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { Tag, UserRound } from "lucide-react";
import { useState } from "react";
import { cn } from "@vyzer/design-system/cn";
import { useInlineEdit } from "../../kit/use-inline-edit";
import {
  INITIAL_LABELS,
  LEADS,
  PRIORITIES,
  PROJECT_STATUSES,
  type Priority,
  type ProjectStatus,
} from "../../kit/project-data";
import { PatternPage } from "../../kit/pattern-page";
import { StatesGrid } from "../../kit/states";

const ASSIGNEES = LEADS.map((o) => (o.value === "none" ? { ...o, label: "No assignee" } : o));

function EditableTitle({
  value,
  onSave,
  preview,
}: {
  value: string;
  onSave: (v: string) => void;
  preview?: "focus";
}) {
  const edit = useInlineEdit<HTMLInputElement, HTMLButtonElement>({
    value,
    onSave,
    submitOnEnter: true,
  });
  if (edit.editing) {
    return (
      <TextInput
        {...edit.fieldProps}
        variant="plain"
        heading
        aria-label="Title"
        className="type-heading-2 h-auto py-1"
      />
    );
  }
  return (
    // O h2 mantém a hierarquia de título; o botão dentro dele carrega o comportamento de editar
    // (role="button" não é permitido num heading — axe aria-allowed-role — por isso o botão real
    // fica aninhado, em vez do heading virar o próprio gatilho).
    <h2>
      <button
        type="button"
        {...edit.staticProps}
        aria-label={`Edit title: ${value}`}
        data-preview={preview}
        className="type-heading-2 block w-full cursor-text rounded-control px-1.5 py-1 text-left text-primary focus-ring hovered:bg-hover"
      >
        {value}
      </button>
    </h2>
  );
}

function EditableDescription({
  value,
  onSave,
  preview,
}: {
  value: string;
  onSave: (v: string) => void;
  preview?: "focus";
}) {
  const edit = useInlineEdit<HTMLTextAreaElement, HTMLDivElement>({
    value,
    onSave,
    submitOnEnter: false,
  });
  if (edit.editing) {
    return (
      <TextArea
        {...edit.fieldProps}
        variant="plain"
        size="lg"
        autoGrow
        rows={1}
        aria-label="Description"
        placeholder="Add description…"
        className="px-1.5"
      />
    );
  }
  return (
    <div
      {...edit.staticProps}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="button"
      aria-label={value ? `Edit description: ${value}` : "Add description"}
      data-preview={preview}
      className={cn(
        "min-h-control-lg cursor-text rounded-control px-1.5 py-1.5 text-body-lg focus-ring hovered:bg-hover",
        value ? "text-primary" : "text-placeholder",
      )}
    >
      {value || "Add description…"}
    </div>
  );
}

type PropertiesState = {
  status: ProjectStatus;
  priority: Priority;
  assignee: string;
  labels: string[];
};

/** Mesmo padrão do New Project / Creation Composer (VYZ-33): Property Button abre o seletor. */
function PropertiesRow({
  value,
  onChange,
  availableLabels,
  onCreateLabel,
}: {
  value: PropertiesState;
  onChange: (next: Partial<PropertiesState>) => void;
  availableLabels: { value: string; label: string; color: LabelColor }[];
  onCreateLabel: (name: string, color: LabelColor) => string;
}) {
  const status = PROJECT_STATUSES.find((s) => s.value === value.status);
  const priority = PRIORITIES.find((p) => p.value === value.priority);
  const assignee = ASSIGNEES.find((a) => a.value === value.assignee);
  const chosenLabels = availableLabels.filter((l) => value.labels.includes(l.value));
  const firstLabel = chosenLabels[0];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Combobox
        label="Status"
        value={value.status}
        onValueChange={(v) => onChange({ status: v })}
        options={PROJECT_STATUSES}
        searchPlaceholder="Change status…"
        shortcut={["S"]}
        width="sm"
      >
        <PropertyButton leading={status?.icon}>{status?.label}</PropertyButton>
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
        <PropertyButton leading={priority?.icon} empty={value.priority === "none"}>
          {value.priority === "none" ? "Priority" : priority?.label}
        </PropertyButton>
      </Combobox>
      <Combobox
        label="Assignee"
        value={value.assignee}
        onValueChange={(v) => onChange({ assignee: v })}
        options={ASSIGNEES}
        searchable={false}
        numberFrom={0}
      >
        <PropertyButton
          leading={
            value.assignee === "none" ? (
              <Icon icon={UserRound} />
            ) : (
              <Avatar name={assignee?.label ?? ""} size="sm" />
            )
          }
          empty={value.assignee === "none"}
        >
          {value.assignee === "none" ? "Assignee" : assignee?.label}
        </PropertyButton>
      </Combobox>
      <LabelPicker
        labels={availableLabels}
        value={value.labels}
        onValueChange={(v) => onChange({ labels: v })}
        onCreate={onCreateLabel}
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
    </div>
  );
}

const INITIAL_TITLE = "Sync Linear webhooks with the issue feed";
const INITIAL_DESCRIPTION =
  "Webhook events from Linear should update the issue feed within a few seconds, without a manual refresh.";

function InlineEditingExample() {
  const [title, setTitle] = useState(INITIAL_TITLE);
  const [description, setDescription] = useState(INITIAL_DESCRIPTION);
  const [properties, setProperties] = useState<PropertiesState>({
    status: "in-progress",
    priority: "high",
    assignee: "andre",
    labels: ["bug"],
  });
  const [labels, setLabels] = useState(INITIAL_LABELS);
  const [savedAt, setSavedAt] = useState<string>();

  const createLabel = (name: string, color: LabelColor) => {
    const value = `${name.toLowerCase().replaceAll(/\s+/g, "-")}-${labels.length}`;
    setLabels((prev) => [...prev, { value, label: name, color }]);
    return value;
  };

  return (
    <div className="flex w-full max-w-content flex-col gap-3">
      <EditableTitle
        value={title}
        onSave={(v) => {
          setTitle(v);
          setSavedAt(`Title saved: “${v}”`);
        }}
      />
      <EditableDescription
        value={description}
        onSave={(v) => {
          setDescription(v);
          setSavedAt("Description saved");
        }}
      />
      <PropertiesRow
        value={properties}
        onChange={(next) => {
          setProperties((prev) => ({ ...prev, ...next }));
          setSavedAt("Property updated");
        }}
        availableLabels={labels}
        onCreateLabel={createLabel}
      />
      <p aria-live="polite" className="min-h-4 text-body-sm text-secondary">
        {savedAt}
      </p>
    </div>
  );
}

function States() {
  const [value] = useState("Sync Linear webhooks with the issue feed");
  return (
    <div className="flex flex-col gap-6">
      <StatesGrid
        states={[
          {
            label: "título · padrão",
            node: <EditableTitle value={value} onSave={() => {}} />,
          },
          {
            label: "título · hover/foco",
            node: <EditableTitle value={value} onSave={() => {}} preview="focus" />,
          },
          {
            label: "título · editando",
            node: (
              <TextInput
                variant="plain"
                heading
                defaultValue={value}
                aria-label="Title"
                className="type-heading-2 h-auto py-1"
              />
            ),
          },
          {
            label: "descrição · vazia",
            node: <EditableDescription value="" onSave={() => {}} />,
          },
          {
            label: "descrição · preenchida",
            node: (
              <EditableDescription
                value="Webhook events should update the feed within seconds."
                onSave={() => {}}
              />
            ),
          },
          {
            label: "descrição · editando",
            node: (
              <TextArea
                variant="plain"
                size="lg"
                autoGrow
                rows={1}
                defaultValue="Webhook events should update the feed within seconds."
                aria-label="Description"
                className="px-1.5"
              />
            ),
          },
        ]}
      />
      <p className="max-w-prose text-body-sm text-secondary">
        Vazio não se aplica a título nem a propriedades (sempre têm um valor ou o rótulo vazio do
        Property Button); erro não se aplica (salvar é local, sem validação de servidor nesta
        documentação).
      </p>
    </div>
  );
}

export function Page() {
  return (
    <PatternPage
      doc={{
        title: "Inline Editing",
        description:
          "Título e descrição alternam entre texto estático e campo (TextInput/TextArea plain) ao clicar ou dar Enter; blur salva, Esc cancela. Propriedades reaproveitam o Property Button do New Project e do Creation Composer (Figma: nós soltos 1:6023 e 1:6103; comportamento segue o Linear).",
        live: <InlineEditingExample />,
        liveDescription:
          "Clique no título ou na descrição (ou Tab até eles e Enter) para editar; Enter salva o título, blur salva os dois, Esc cancela. As propriedades abrem o seletor de sempre.",
        states: <States />,
        themes: (theme) => <InlineEditingExample key={theme} />,
        composition: [
          <>
            Título:{" "}
            <code className="font-mono text-code">TextInput variant=&quot;plain&quot; heading</code>{" "}
            (já existe) por cima de um texto estático focável (foco de campo, sem acento).
          </>,
          <>
            Descrição:{" "}
            <code className="font-mono text-code">TextArea variant=&quot;plain&quot; autoGrow</code>{" "}
            (já existe); placeholder &quot;Add description…&quot; quando vazia.
          </>,
          <>
            Propriedades: <code className="font-mono text-code">Combobox</code>/
            <code className="font-mono text-code">LabelPicker</code> com{" "}
            <code className="font-mono text-code">PropertyButton</code> como gatilho — o mesmo
            padrão do New Project e do Creation Composer (VYZ-33), sem peça nova.
          </>,
          <>
            Hook compartilhado <code className="font-mono text-code">useInlineEdit</code> (
            <code className="font-mono text-code">kit/use-inline-edit.ts</code>): a alternância se
            repete em título, descrição e no nome do milestone (Patterns → Milestones); extraída
            como nota de implementação da spec, sem prop nova em componente do design system.
          </>,
        ],
        decisions: [
          {
            decision:
              "Alternância texto estático ↔ campo plain, com foco de campo (sem acento nem halo)",
            rule: "Spec Fase 10, item 2; ADR-0013 (foco de campo em todo o sistema)",
          },
          {
            decision: "Título salva com Enter ou blur; descrição só com blur; Esc cancela nos dois",
            rule: "Spec Fase 10, §Comportamento",
          },
          {
            decision: "O elemento em edição substitui o texto estático (não duplica os dois)",
            rule: "Spec Fase 10, §Teclado e acessibilidade",
          },
          {
            decision: "Ao salvar ou cancelar, o foco volta ao texto estático",
            rule: "WCAG 2.4.3 (ordem de foco previsível)",
          },
          {
            decision: "Propriedades reaproveitam Property Button + Combobox/Label Picker",
            rule: "Spec Fase 10, item 2 (mesmo padrão do New Project e do Creation Composer)",
          },
        ],
      }}
    />
  );
}
