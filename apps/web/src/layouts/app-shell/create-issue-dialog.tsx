/**
 * "C" abre o Composer de criação de issue como overlay (spec, item 5), com as mesmas peças do
 * exemplo New issue da VYZ-33 (`features/design-system/pages/forms/creation-composer.tsx`):
 * TextInput plain heading, TextArea plain autoGrow e os Property Buttons de Team, Status,
 * Priority, Assignee e Labels (Combobox/LabelPicker). Composição nova aqui, em `apps/web`, sem
 * importar da página de documentação.
 *
 * Sem service de issues ainda (fora do escopo): "Create" mostra um Toast "Issue created" com o
 * título e fecha, sem persistir nada. Esc fecha sem criar.
 */
import { Box, CalendarDays, Ellipsis, Paperclip, Tag, Triangle, UserRound } from "lucide-react";
import { Dialog as DialogPrimitive, VisuallyHidden } from "radix-ui";
import { useId, useRef, useState, type FormEvent } from "react";
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
  MenuTrigger,
  PropertyButton,
  TextArea,
  TextInput,
  dialogStyles,
  useToast,
  type LabelColor,
  type LabelItem,
} from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import { cn } from "@zynox/design-system/cn";
import {
  ASSIGNEES,
  INITIAL_LABELS,
  PRIORITIES,
  STATUSES,
  TEAMS,
  teamOptionsFrom,
  type TeamOption,
} from "./create-issue-data";
import type { Team } from "@/features/projects/project-data";
import { useAppShell } from "./use-app-shell";

/** Team, Status, Priority, Assignee e Labels, na última linha do cartão (Figma 27:19344). */
function IssueProperties({ teamOptions }: { teamOptions: TeamOption[] }) {
  const [chosenTeam, setTeam] = useState<string>();
  // Sem escolha, o primeiro Team; sem nenhum Team, o seletor some.
  const team = chosenTeam ?? teamOptions[0]?.value ?? "";
  const [status, setStatus] = useState(STATUSES[0]!.value);
  const [priority, setPriority] = useState(PRIORITIES[0]!.value);
  const [assignee, setAssignee] = useState(ASSIGNEES[0]!.value);
  const [labels, setLabels] = useState<LabelItem[]>(INITIAL_LABELS);
  const [chosen, setChosen] = useState<string[]>([]);

  const currentTeam = teamOptions.find((t) => t.value === team);
  const currentStatus = STATUSES.find((s) => s.value === status);
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
      {teamOptions.length > 0 && (
        <Combobox
          label="Team"
          value={team}
          onValueChange={setTeam}
          options={teamOptions}
          searchPlaceholder="Change team…"
          width="sm"
        >
          <PropertyButton leading={currentTeam?.icon} aria-label={`Team: ${currentTeam?.label}`}>
            {currentTeam?.hint}
          </PropertyButton>
        </Combobox>
      )}
      <Combobox
        label="Status"
        value={status}
        onValueChange={setStatus}
        options={STATUSES}
        searchPlaceholder="Change status…"
        shortcut={["S"]}
        width="sm"
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
      <LabelPicker labels={labels} value={chosen} onValueChange={setChosen} onCreate={createLabel}>
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
      {/* Mais propriedades, como no Linear; sem ação real (fora do escopo até existir o service). */}
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
        <MenuContent variant="dropdown">
          <MenuItem icon={Box}>Project</MenuItem>
          <MenuItem icon={CalendarDays}>Due date</MenuItem>
          <MenuItem icon={Triangle}>Estimate</MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}

/** `teams`: os Teams reais; sem a prop, o Team de exemplo (a documentação em /design-system). */
export function CreateIssueDialog({
  teams,
  onSaveDraft,
}: {
  teams?: Team[];
  /** Fechar sem criar, com algo escrito, salva o que há como rascunho (sem tela própria para
   * retomá-lo: a Missão 02 tirou /drafts da sidebar, fora do sitemap). */
  onSaveDraft?: (draft: { title: string; description: string }) => void;
} = {}) {
  const teamOptions = teams ? teamOptionsFrom(teams) : TEAMS;
  const { createIssueOpen, setCreateIssueOpen, overlayReturnFocus } = useAppShell();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setCreateIssueOpen(false);
    setTitle("");
    setDescription("");
  };

  // Fechar sem criar (X, Esc, fora) guarda o que foi escrito como rascunho, como o Linear.
  const dismiss = () => {
    if (onSaveDraft && (title.trim() !== "" || description.trim() !== "")) {
      onSaveDraft({ title: title.trim(), description: description.trim() });
    }
    close();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (title.trim() === "") return;
    // Sem service de issues ainda: o Create só avisa e fecha, sem persistir nada.
    toast({ title: "Issue created", subject: { label: title } });
    close();
  };

  return (
    <DialogPrimitive.Root
      open={createIssueOpen}
      onOpenChange={(open) => (open ? setCreateIssueOpen(true) : dismiss())}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={dialogStyles.overlay}>
          <DialogPrimitive.Content
            aria-describedby={undefined}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              titleRef.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              // De onde a pessoa estava antes de QUALQUER overlay do shell (não só deste
              // diálogo): abrindo pelo Command Menu (⌘K → Create issue), é para lá que o foco
              // volta ao criar ou cancelar, não para a busca do Command Menu (já fechada).
              const target = overlayReturnFocus.current;
              if (!target?.isConnected) return;
              event.preventDefault();
              target.focus({ preventScroll: true });
            }}
            className="m-auto w-full max-w-180 outline-none data-[state=open]:animate-dialog-in data-[state=closed]:animate-scale-out"
          >
            <VisuallyHidden.Root asChild>
              <DialogPrimitive.Title>Create new issue</DialogPrimitive.Title>
            </VisuallyHidden.Root>
            <form
              id={formId}
              onSubmit={submit}
              className={cn(
                "flex w-full flex-col gap-1.5 rounded-container border border-default bg-surface p-3",
                "focus-ring-within",
              )}
            >
              <TextInput
                ref={titleRef}
                variant="plain"
                heading
                aria-label="Issue title"
                placeholder="Issue title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <TextArea
                variant="plain"
                size="md"
                autoGrow
                rows={1}
                aria-label="Description"
                placeholder="Add description…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <IssueProperties teamOptions={teamOptions} />
                <div className="ml-auto flex items-center gap-1.5">
                  <IconButton icon={Paperclip} label="Attach images, files, or videos" />
                  <Button variant="ghost" type="button" onClick={close}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={title.trim() === ""}>
                    Create
                  </Button>
                </div>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
