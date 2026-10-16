/**
 * Lista de milestones e criação de milestone (spec Fase 10, item 3): nó 25:3409 (dentro do
 * Project Details) para a linha — losango do lucide (Fase 5, Hover Card: preenchido quando
 * concluído) + nome + "X% of N" + data + Icon Button "…" — e 1:3176 para o formulário "Create
 * milestone" (nome, descrição opcional, Cancel/Add milestone). Vazio: cabeçalho 1:6237,
 * confirmado ao vivo no Linear em 28/09 ("Add milestones to organize work within your project and
 * break it into more granular stages.").
 *
 * A linha é uma composição própria (MilestoneRow), não um componente novo: usa useIssueOption e
 * issueRowStyles exatamente como a Issue Row (issue-list.tsx), dentro de uma Issue List — mesma
 * navegação por teclado, sem reescrever o roving focus.
 */
import {
  Button,
  EmptyState,
  Field,
  IconButton,
  IssueList,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  TextArea,
  TextInput,
  issueRowStyles,
  useIssueOption,
} from "@zynox/design-system/components";
import { cn } from "@zynox/design-system/cn";
import { Icon } from "@zynox/design-system/icons";
import {
  Box,
  CalendarDays,
  Copy,
  Diamond,
  Ellipsis,
  FolderInput,
  Link,
  Link2,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { MILESTONES, milestoneById, type SampleMilestone } from "../../kit/milestone-data";
import { PatternPage } from "../../kit/pattern-page";
import { StatesStack } from "../../kit/states";

/**
 * Conteúdo da opção (role="option", seleção, clique que abre): o losango, o nome, "X% of N" e a
 * data. Só isso — uma listbox (role="listbox", regra ARIA aria-required-children) só pode conter
 * option/group como filho em toda a sua subárvore, então o botão "…" não pode morar aqui (nem
 * solto dentro da opção, nem ao lado dela dentro da Issue List): ver MilestoneActions, abaixo.
 */
function MilestoneOption({
  milestone,
  preview,
}: {
  milestone: SampleMilestone;
  preview?: "hover" | "focus";
}) {
  const option = useIssueOption("MilestoneOption", { value: milestone.id });
  return (
    <div {...option} data-preview={preview} className={issueRowStyles}>
      <Icon
        icon={Diamond}
        className={cn(
          "shrink-0",
          milestone.progress === 100 ? "fill-secondary text-secondary" : "text-secondary",
        )}
      />
      <span className="min-w-32 flex-1 truncate text-body-md text-primary">{milestone.name}</span>
      <span className="shrink-0 text-body-sm text-secondary tabular-nums">
        {milestone.progress}% of {milestone.issueIds.length}
      </span>
      <span className="w-12 shrink-0 text-right text-body-sm text-secondary tabular-nums">
        {milestone.targetDate}
      </span>
    </div>
  );
}

/**
 * O menu "…" de um milestone, numa coluna própria fora da Issue List (mesma altura de linha,
 * h-row, para alinhar visualmente com a opção correspondente). Seu próprio alvo de foco, à parte
 * da navegação por setas da lista — ver o comentário de MilestoneOption.
 */
function MilestoneActions({
  milestone,
  portal,
  onAction,
}: {
  milestone: SampleMilestone;
  portal: boolean;
  onAction: (label: string) => void;
}) {
  return (
    <div className="flex h-row items-center">
      <Menu>
        <MenuTrigger asChild>
          <IconButton icon={Ellipsis} label={`Milestone actions: ${milestone.name}`} />
        </MenuTrigger>
        <MenuContent variant="dropdown" portal={portal}>
          <MenuItem icon={Pencil} onSelect={() => onAction(`Edit “${milestone.name}”`)}>
            Edit…
          </MenuItem>
          <MenuItem
            icon={CalendarDays}
            onSelect={() => onAction(`Edit target date: ${milestone.name}`)}
          >
            Edit target date…
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger icon={Copy}>Copy</MenuSubTrigger>
            <MenuSubContent portal={portal}>
              <MenuItem icon={Link2} onSelect={() => onAction("Copy link")}>
                Copy link
              </MenuItem>
              <MenuItem icon={Link} onSelect={() => onAction("Copy name as link")}>
                Copy name as link
              </MenuItem>
              <MenuItem icon={ListChecks} onSelect={() => onAction("Copy link to issues")}>
                Copy link to issues
              </MenuItem>
            </MenuSubContent>
          </MenuSub>
          <MenuItem icon={FolderInput} onSelect={() => onAction(`Move “${milestone.name}” to…`)}>
            Move milestone to
          </MenuItem>
          <MenuItem icon={Box} onSelect={() => onAction(`Convert “${milestone.name}” to project`)}>
            Convert to project
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={Trash2} onSelect={() => onAction(`Delete “${milestone.name}”`)}>
            Delete…
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

/**
 * Formulário curto (1:3176): nome, descrição opcional, Cancel/Add milestone. Mais simples que o
 * Creation Composer (sem ícone nem property buttons) — Field vertical com TextInput padrão e
 * TextArea plain, como pede a spec.
 */
function CreateMilestoneForm({
  nameRef,
  onCancel,
  onCreate,
}: {
  nameRef: RefObject<HTMLInputElement | null>;
  onCancel: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const empty = name.trim() === "";

  useEffect(() => {
    nameRef.current?.focus();
  }, [nameRef]);

  return (
    // Esc em qualquer ponto do formulário cancela (mesmo padrão do Creation Composer).
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <form
      aria-label="New milestone"
      onSubmit={(e) => {
        e.preventDefault();
        if (!empty) onCreate(name.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !e.defaultPrevented) {
          e.preventDefault();
          onCancel();
        }
      }}
      className="flex w-full max-w-content flex-col gap-3 rounded-container border border-default bg-surface p-4 focus-ring-within"
    >
      <Field label="Name">
        <TextInput
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Milestone name"
        />
      </Field>
      <Field label="Description" description="Optional.">
        <TextArea
          variant="plain"
          autoGrow
          rows={1}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description…"
          className="px-1.5"
        />
      </Field>
      <div className="flex justify-end gap-1.5">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={empty}>
          Add milestone
        </Button>
      </div>
    </form>
  );
}

/** Abre e fecha o formulário a partir do gatilho "+ Add milestone"; foco volta ao gatilho ao sair. */
function useCreateMilestoneToggle(onCreated: (message: string) => void) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  return {
    open,
    triggerProps: {
      ref: trigger,
      "aria-expanded": open,
      onClick: () => setOpen(true),
    },
    formProps: {
      nameRef,
      onCancel: close,
      onCreate: (name: string) => {
        onCreated(`Milestone “${name}” created`);
        close();
      },
    },
  };
}

function MilestonesLive({ portal }: { portal: boolean }) {
  const [lastAction, setLastAction] = useState("");
  const t = useCreateMilestoneToggle(setLastAction);
  return (
    <div className="flex w-full max-w-content flex-col gap-2">
      <div className="flex items-start">
        <IssueList
          label="Milestones"
          onOpen={(id) => setLastAction(`Open ${milestoneById(id).name}`)}
          className="min-w-0 flex-1"
        >
          {MILESTONES.map((m) => (
            <MilestoneOption key={m.id} milestone={m} />
          ))}
        </IssueList>
        <div className="flex flex-col">
          {MILESTONES.map((m) => (
            <MilestoneActions key={m.id} milestone={m} portal={portal} onAction={setLastAction} />
          ))}
        </div>
      </div>
      <Button variant="ghost" icon={Plus} className="self-start" {...t.triggerProps}>
        Add milestone
      </Button>
      {t.open && <CreateMilestoneForm {...t.formProps} />}
      <p aria-live="polite" className="min-h-4 text-body-sm text-secondary">
        {lastAction}
      </p>
    </div>
  );
}

/** Uma linha estática (a opção precisa de uma Issue List ao redor; o menu fica ao lado, fora dela). */
function StaticMilestoneRow({
  milestone,
  preview,
}: {
  milestone: SampleMilestone;
  preview?: "hover" | "focus";
}) {
  return (
    <div className="flex items-start">
      <IssueList label={`Milestone ${milestone.name}`} className="min-w-0 flex-1">
        <MilestoneOption milestone={milestone} preview={preview} />
      </IssueList>
      <MilestoneActions milestone={milestone} portal onAction={() => {}} />
    </div>
  );
}

function States() {
  return (
    <div className="flex flex-col gap-6">
      <StatesStack
        states={[
          {
            label: "padrão",
            node: <StaticMilestoneRow milestone={milestoneById("beta-launch")} />,
          },
          {
            label: "hover",
            node: <StaticMilestoneRow milestone={milestoneById("beta-launch")} preview="hover" />,
          },
          {
            label: "focus-visible",
            node: <StaticMilestoneRow milestone={milestoneById("beta-launch")} preview="focus" />,
          },
          {
            label: "concluído (100%, losango preenchido)",
            node: <StaticMilestoneRow milestone={milestoneById("private-alpha")} />,
          },
        ]}
      />
      <div className="flex flex-col gap-2">
        <span className="text-caption text-secondary">vazio</span>
        <div className="rounded-container border border-subtle bg-panel">
          <EmptyState
            icon={Diamond}
            title="No milestones"
            action={
              <Button variant="ghost" icon={Plus}>
                Add milestone
              </Button>
            }
          >
            Add milestones to organize work within your project and break it into more granular
            stages.
          </EmptyState>
        </div>
      </div>
      <p className="max-w-prose text-body-sm text-secondary">
        Carregando e erro não se aplicam: a lista desta documentação é sempre estática, sem busca ao
        servidor (mesma nota do Settings Form e do Inline Editing).
      </p>
    </div>
  );
}

export function Page() {
  return (
    <PatternPage
      doc={{
        title: "Milestones",
        description:
          'Lista de milestones de um projeto (Figma 25:3409, dentro do Project Details) e o formulário curto de criação (1:3176): losango do lucide + nome + "X% of N" + data + Icon Button "…", numa Issue List. Vazio com o texto de 1:6237, confirmado ao vivo no Linear.',
        live: <MilestonesLive portal />,
        liveDescription:
          '↑ ↓ Home End navegam a lista; Enter abre o milestone (mensagem abaixo — sem rota real nesta documentação); o botão "…" abre com Enter/Espaço e fecha com Esc, devolvendo o foco a ele; "+ Add milestone" abre o formulário, Esc ou Cancel fecham e devolvem o foco ao gatilho.',
        states: <States />,
        themes: (theme) => <MilestonesLive key={theme} portal={false} />,
        composition: [
          <>
            Linha: <code className="font-mono text-code">useIssueOption</code> e{" "}
            <code className="font-mono text-code">issueRowStyles</code> (
            <code className="font-mono text-code">issue-list.tsx</code>), a mesma raiz da{" "}
            <code className="font-mono text-code">IssueRow</code>, dentro de uma{" "}
            <code className="font-mono text-code">IssueList</code> — sem componente novo.
          </>,
          <>
            Ícone: losango do lucide, preenchido quando concluído (decisão da Fase 5, Hover Card),
            outline nos demais casos.
          </>,
          <>
            Menu "…": <code className="font-mono text-code">Menu</code>/
            <code className="font-mono text-code">MenuSub</code> já existentes (Fase 3); os itens só
            registram a última ação (sem dado real pela API, fora do escopo desta fase).
          </>,
          <>
            Criar milestone: <code className="font-mono text-code">Field</code> vertical com{" "}
            <code className="font-mono text-code">TextInput</code> padrão e{" "}
            <code className="font-mono text-code">TextArea variant=&quot;plain&quot;</code>, mais
            simples que o Creation Composer (sem ícone nem property buttons).
          </>,
          <>
            Vazio: <code className="font-mono text-code">EmptyState</code> (existente, Fase 4) com o
            texto do nó 1:6237.
          </>,
        ],
        decisions: [
          {
            decision:
              "MilestoneRow reaproveita useIssueOption/issueRowStyles em vez de um componente novo",
            rule: "Regra do escopo 4 da spec: só o SelectionBar é peça nova nesta fase",
          },
          {
            decision: "Losango preenchido a 100%, outline nos demais",
            rule: "Fase 5 (Hover Card), ADR-0013 (biblioteca única de ícones)",
          },
          {
            decision:
              'O botão "…" fica fora da raiz role="option" da linha (wrapper relative + botão absoluto à direita), como seu próprio alvo de foco',
            rule: "axe nested-interactive não permite um controle focável dentro de um widget role option; nota de implementação, sem prop nova em IssueList/Menu",
          },
          {
            decision: "Itens do menu só registram a última ação (aria-live), sem efeito real",
            rule: "Spec Fase 10, §Fora do escopo (dados reais pela API)",
          },
          {
            decision: "Formulário de criação com Field + TextInput + TextArea plain, sem ícone",
            rule: "Spec Fase 10, item 3 (nó 1:3176: nome, descrição, Cancel/Add milestone)",
          },
          {
            decision: "Vazio com o texto exato do nó 1:6237",
            rule: "Confirmado ao vivo no Linear em 28/09 (ver briefing da tarefa)",
          },
        ],
      }}
    />
  );
}
