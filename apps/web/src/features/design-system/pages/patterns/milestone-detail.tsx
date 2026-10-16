/**
 * Detalhe de um milestone (spec Fase 10, item 3): sem frame no Figma — segue o Linear e a
 * descrição explícita da spec. Nome editável inline (padrão do item 2), data alvo (Date Picker),
 * descrição, Progress Bar com a porcentagem e a lista de issues do milestone (Issue List).
 */
import {
  Button,
  DatePicker,
  IssueList,
  IssueRow,
  ProgressBar,
  PropertyButton,
  TextArea,
  TextInput,
} from "@zynox/design-system/components";
import { formatDateValue, MONTHS_SHORT, type DateValue } from "@zynox/design-system/date";
import { Icon } from "@zynox/design-system/icons";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { issueById, rowProps } from "../../kit/issue-data";
import { MILESTONE_PROJECT, milestoneById, milestoneIssues } from "../../kit/milestone-data";
import { PatternPage } from "../../kit/pattern-page";
import { StatesGrid, StatesStack } from "../../kit/states";
import { useInlineEdit } from "../../kit/use-inline-edit";

/** Hoje fixo: mesmo ano de referência do Date Picker (navigation/date-picker.tsx). */
const TODAY = new Date(2026, 8, 27);

/**
 * Os dados de exemplo guardam a data alvo como texto curto ("Oct 2", kit/milestone-data.tsx); o
 * Date Picker trabalha com DateValue. Conversão só desta página, sem mudar os dados compartilhados.
 */
function parseSampleTargetDate(text: string): DateValue {
  const [monthAbbr, dayText] = text.split(" ");
  const month = MONTHS_SHORT.indexOf(monthAbbr ?? "") + 1;
  return {
    kind: "day",
    year: TODAY.getFullYear(),
    month: month || 1,
    day: Number(dayText) || 1,
  };
}

/** Mesmo padrão do título em Inline Editing (EditableTitle), em type-heading-2 para o contexto de
 * página: h2 estático que vira TextInput plain ao clicar/Enter; blur ou Enter salvam, Esc cancela. */
function EditableMilestoneName({
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
        aria-label="Milestone name"
        className="type-heading-2 h-auto py-1"
      />
    );
  }
  return (
    // O h2 mantém a hierarquia de título da página; o botão dentro dele carrega o comportamento de
    // editar (role="button" não é permitido num heading — axe aria-allowed-role).
    <h2>
      <button
        type="button"
        {...edit.staticProps}
        aria-label={`Edit milestone name: ${value}`}
        data-preview={preview}
        className="type-heading-2 block w-full cursor-text rounded-control px-1.5 py-1 text-left text-primary focus-ring hovered:bg-hover"
      >
        {value}
      </button>
    </h2>
  );
}

function MilestoneDetailExample({ portal }: { portal: boolean }) {
  const milestone = milestoneById("beta-launch");
  const [name, setName] = useState(milestone.name);
  const [description, setDescription] = useState(milestone.description ?? "");
  const [targetDate, setTargetDate] = useState<DateValue>(
    parseSampleTargetDate(milestone.targetDate),
  );
  const [lastAction, setLastAction] = useState("");
  const issues = milestoneIssues(milestone);

  return (
    <div className="flex w-full max-w-content flex-col gap-4">
      {/* Breadcrumb decorativo: a navegação real de projeto é o App Shell (Fase 8), fora do
          escopo aqui — a página mostra o padrão isolado, como todo item de /design-system. */}
      <Button
        variant="ghost"
        icon={ChevronLeft}
        className="-ml-3 self-start"
        onClick={() => setLastAction(`Back to ${MILESTONE_PROJECT.label}`)}
      >
        {MILESTONE_PROJECT.label}
      </Button>

      <div className="flex flex-col gap-3">
        <EditableMilestoneName
          value={name}
          onSave={(v) => {
            setName(v);
            setLastAction(`Name saved: "${v}"`);
          }}
        />

        <DatePicker
          label="Target date"
          value={targetDate}
          onValueChange={(v) => {
            setTargetDate(v);
            setLastAction(`Target date: ${formatDateValue(v)}`);
          }}
          today={TODAY}
          portal={portal}
        >
          <PropertyButton leading={<Icon icon={CalendarDays} />}>
            {formatDateValue(targetDate)}
          </PropertyButton>
        </DatePicker>

        {/* Descrição: TextArea plain sempre editável, sem alternância — a spec só chama a nome de
            "editável inline" (item 3); a descrição segue o mesmo tratamento do formulário de
            criação do milestone (item 3) e do Creation Composer. */}
        <TextArea
          variant="plain"
          size="lg"
          autoGrow
          rows={1}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Description"
          placeholder="Add description…"
          className="px-1.5"
        />

        <div className="flex items-center gap-2 px-1.5">
          <ProgressBar
            value={milestone.progress}
            label={`${milestone.name} progress`}
            className="max-w-64"
          />
          <span className="shrink-0 text-body-sm text-secondary tabular-nums">
            {milestone.progress}%
          </span>
        </div>
      </div>

      <IssueList label={`${milestone.name} issues`} onOpen={(id) => setLastAction(`Open ${id}`)}>
        {issues.map((issue) => (
          <IssueRow key={issue.id} value={issue.id} {...rowProps(issue)} />
        ))}
      </IssueList>

      <p aria-live="polite" className="min-h-4 text-body-sm text-secondary">
        {lastAction}
      </p>
    </div>
  );
}

function States() {
  const milestone = milestoneById("beta-launch");
  const target = parseSampleTargetDate(milestone.targetDate);
  const staticIssue = issueById("ZYN-35");
  return (
    <div className="flex flex-col gap-6">
      <StatesGrid
        states={[
          {
            label: "nome · padrão",
            node: <EditableMilestoneName value={milestone.name} onSave={() => {}} />,
          },
          {
            label: "nome · hover/foco",
            node: (
              <EditableMilestoneName value={milestone.name} onSave={() => {}} preview="focus" />
            ),
          },
          {
            label: "nome · editando",
            node: (
              <TextInput
                variant="plain"
                heading
                defaultValue={milestone.name}
                aria-label="Milestone name"
                className="type-heading-2 h-auto py-1"
              />
            ),
          },
          {
            label: "data alvo · padrão",
            node: (
              <PropertyButton leading={<Icon icon={CalendarDays} />}>
                {formatDateValue(target)}
              </PropertyButton>
            ),
          },
          {
            label: "data alvo · hover/foco",
            node: (
              <PropertyButton leading={<Icon icon={CalendarDays} />} data-preview="focus">
                {formatDateValue(target)}
              </PropertyButton>
            ),
          },
        ]}
      />
      <div className="flex flex-col gap-3 rounded-container border border-subtle bg-panel p-6">
        <span className="text-caption text-secondary">progresso</span>
        <div className="flex max-w-content flex-col gap-2">
          {[12, 64, 100].map((value) => (
            <div key={value} className="flex items-center gap-2">
              <ProgressBar value={value} label={`Progress ${value}%`} className="max-w-64" />
              <span className="shrink-0 text-body-sm text-secondary tabular-nums">{value}%</span>
            </div>
          ))}
        </div>
      </div>
      <StatesStack
        states={[
          {
            label: "issue · padrão",
            node: (
              <IssueList label={`Issue ${staticIssue.id}`}>
                <IssueRow value={staticIssue.id} {...rowProps(staticIssue)} />
              </IssueList>
            ),
          },
          {
            label: "issue · hover/foco",
            node: (
              <IssueList label={`Issue ${staticIssue.id}`}>
                <IssueRow value={staticIssue.id} {...rowProps(staticIssue)} data-preview="focus" />
              </IssueList>
            ),
          },
        ]}
      />
      <p className="max-w-prose text-body-sm text-secondary">
        Vazio, carregando e erro não se aplicam: o detalhe sempre mostra um milestone existente, com
        edição local e sem busca ao servidor (mesma nota do Settings Form e do Inline Editing).
      </p>
    </div>
  );
}

export function Page() {
  return (
    <PatternPage
      doc={{
        title: "Milestone Detail",
        description:
          'Detalhe de um milestone: sem frame no Figma (spec Fase 10, item 3) — nome editável inline (mesmo padrão do item 2), data alvo (Date Picker), descrição, Progress Bar com a porcentagem e as issues do milestone (Issue List). Exemplo: "Beta launch" (progresso parcial, descrição e issues).',
        live: <MilestoneDetailExample portal />,
        liveDescription:
          "Clique ou Tab + Enter no nome para editar (Enter ou blur salvam, Esc cancela); a data alvo abre o Date Picker; a descrição é um campo sempre editável; a lista de issues navega como a Issue List (↑ ↓ Home End, Enter abre — mensagem abaixo, sem rota real).",
        states: <States />,
        themes: (theme) => <MilestoneDetailExample key={theme} portal={false} />,
        composition: [
          <>
            Breadcrumb:{" "}
            <code className="font-mono text-code">Button variant=&quot;ghost&quot;</code> decorativo
            — a navegação real de projeto é o App Shell (Fase 8), fora do escopo aqui.
          </>,
          <>
            Nome: <code className="font-mono text-code">useInlineEdit</code> (
            <code className="font-mono text-code">kit/use-inline-edit.ts</code>), o mesmo hook e a
            mesma alternância do título em Inline Editing (item 2), em{" "}
            <code className="font-mono text-code">type-heading-2</code>.
          </>,
          <>
            Data alvo: <code className="font-mono text-code">DatePicker</code> +{" "}
            <code className="font-mono text-code">PropertyButton</code> (existentes, Navigation).
          </>,
          <>
            Descrição:{" "}
            <code className="font-mono text-code">TextArea variant=&quot;plain&quot;</code> sempre
            editável, sem alternância — só o nome é &quot;editável inline&quot; na spec.
          </>,
          <>
            Progresso: <code className="font-mono text-code">ProgressBar</code> (existente, Fase 4)
            com a porcentagem em texto ao lado.
          </>,
          <>
            Issues: <code className="font-mono text-code">IssueList</code>/
            <code className="font-mono text-code">IssueRow</code> (existentes, Fase 5), com{" "}
            <code className="font-mono text-code">rowProps</code> e{" "}
            <code className="font-mono text-code">milestoneIssues</code> de{" "}
            <code className="font-mono text-code">kit/issue-data.tsx</code> e{" "}
            <code className="font-mono text-code">kit/milestone-data.tsx</code>.
          </>,
        ],
        decisions: [
          {
            decision: "Sem frame no Figma; segue a descrição explícita da spec e o Linear",
            rule: 'Spec Fase 10, item 3 ("Detalhe do milestone: sem frame no Figma")',
          },
          {
            decision: "Nome com useInlineEdit (submitOnEnter), mesmo visual do título de página",
            rule: "Spec Fase 10, item 2 (padrão reaproveitado no milestone)",
          },
          {
            decision: "Descrição sempre editável (TextArea plain), sem alternância texto ↔ campo",
            rule: 'Spec Fase 10, item 3 (só o nome é chamado de "editável inline")',
          },
          {
            decision: "Breadcrumb decorativo (Button ghost), sem rota real",
            rule: "Spec Fase 10, §Dependências entre fases (breadcrumbs reais são do App Shell, Fase 8)",
          },
          {
            decision: 'Milestone de exemplo: "Beta launch" (progresso parcial, descrição, issues)',
            rule: "Cobre nome, data, descrição, progresso e issues num só exemplo",
          },
        ],
      }}
    />
  );
}
