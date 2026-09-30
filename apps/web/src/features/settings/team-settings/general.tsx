/**
 * General do Team (`/settings/teams/:team/general`, spec 2.2; Linear ao vivo,
 * `/settings/teams/VYZ/general`): Name com o botão de ícone, Identifier ("Used in issue IDs") e
 * Description ("A short summary shown on the team page"), no mesmo cartão de linhas de
 * rótulo/controle das outras páginas de Settings. Depois vêm os grupos do Linear que o
 * responsável aprovou construir (29/09, D10): Estimates (o Select do Team; o campo `estimate`
 * fica na Issue e os extras — Extended, Allow zero, Default estimate — não foram confirmados ao
 * vivo, ficam para depois), Create issues by email (só configuração: o Vyzer ainda não recebe
 * e-mail de verdade), Timezone e Other ("Enable detailed issue history").
 *
 * Salva sozinho, como o Workspace (pedido do responsável, 29/09): texto ao sair do campo ou com
 * Enter (a Description, só ao sair), ícone na hora, toast "Saved" com Undo que regrava o valor
 * de antes. Identifier já usado volta como CONFLICT e vira erro no campo, sem perder o que foi
 * digitado. Leitura aberta a qualquer Member; edição só por Admin (D14).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import type { ApiClient, Team } from "@vyzer/contract";
import {
  Button,
  Combobox,
  Confirm,
  IconPicker,
  ProjectIcon,
  Select,
  Switch,
  TextArea,
  TextInput,
  useToast,
  type ListOption,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import {
  resetTeamIssueEmailMutationOptions,
  teamQueryOptions,
  teamsQueryOptions,
  updateTeamMutationOptions,
} from "@/services/teams";
import { currentWorkspaceQueryOptions } from "@/services/workspace";
import { SettingsGroup, SettingsRow } from "../settings-row";
import { TeamBreadcrumb, useTeam } from "./layout";

type TeamPatch = Omit<Parameters<ApiClient["team"]["update"]>[0], "id">;

const NAME_REQUIRED = "Name is required.";
const KEY_INVALID = "Use capital letters and numbers, starting with a letter.";
const KEY_TAKEN = "This identifier is already taken.";
const KEY_PATTERN = /^[A-Z][A-Z0-9]*$/;
// Limites medidos ao vivo no Linear (Team → General): Name 48 e Identifier 7 caracteres.
const NAME_MAX = 48;
const KEY_MAX = 7;

type Estimation = Team["estimation"];

// As opções exatas do Linear (Team → General → Estimates, medido ao vivo em 29/09).
const ESTIMATION_OPTIONS: ListOption<Estimation>[] = [
  { value: "none", label: "Not in use" },
  { value: "exponential", label: "Exponential (1, 2, 4, 8, 16 Points)" },
  { value: "fibonacci", label: "Fibonacci (1, 2, 3, 5, 8 Points)" },
  { value: "linear", label: "Linear (1, 2, 3, 4, 5 Points)" },
  { value: "tshirt", label: "T-Shirt (XS, S, M, L, XL)" },
];

/** "GMT-3:00 – Brasilia Time": o rótulo do Linear, montado do fuso IANA pelo próprio navegador. */
function timezoneLabel(zone: string) {
  const part = (style: "longOffset" | "longGeneric") =>
    new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: style })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(part("longOffset") ?? "");
  const offset = match ? `GMT${match[1]}${Number(match[2])}:${match[3]}` : "GMT+0:00";
  // O Chromium devolve "Brasilia Standard Time"; o Linear mostra "Brasilia Time".
  const generic = (part("longGeneric") ?? zone).replace(/ (Standard|Daylight|Summer) /, " ");
  return `${offset} – ${generic}`;
}

let timezoneOptions: ListOption[] | undefined;
function getTimezoneOptions(): ListOption[] {
  timezoneOptions ??= Intl.supportedValuesOf("timeZone").map((zone) => ({
    value: zone,
    label: timezoneLabel(zone),
    keywords: [zone.replaceAll("_", " ")],
  }));
  return timezoneOptions;
}

function sameIcon(a: ProjectIconValue, b: ProjectIconValue) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function TeamGeneralPage() {
  const team = useTeam();
  const queryClient = useQueryClient();
  const toast = useToast();
  const current = useQuery(currentWorkspaceQueryOptions());
  const canEdit = current.data?.member.role === "admin";
  // Rascunho só do que a pessoa mexeu: o resto segue o dado salvo, sem efeito para sincronizar.
  const [draft, setDraft] = useState<{
    name?: string;
    key?: string;
    icon?: ProjectIconValue;
    description?: string;
    timezone?: string;
    estimation?: Estimation;
    detailedIssueHistory?: boolean;
    issueEmailEnabled?: boolean;
  }>({});
  const [keyConflict, setKeyConflict] = useState(false);

  const update = useMutation({
    ...updateTeamMutationOptions(),
    onSuccess: async (_saved, patch) => {
      // A sidebar, a lista de Teams e o nav de Settings leem estas queries.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teamQueryOptions(team.slug).queryKey }),
        queryClient.invalidateQueries({ queryKey: teamsQueryOptions().queryKey }),
      ]);
      setDraft((prev) => {
        const next = { ...prev };
        for (const field of Object.keys(patch)) delete next[field as keyof typeof next];
        return next;
      });
    },
  });

  const name = draft.name ?? team.name;
  const key = draft.key ?? team.key;
  const icon = draft.icon ?? team.icon;
  const description = draft.description ?? team.description ?? "";
  const timezone = draft.timezone ?? team.timezone;
  const estimation = draft.estimation ?? team.estimation;
  const detailedIssueHistory = draft.detailedIssueHistory ?? team.detailedIssueHistory;
  const issueEmailEnabled = draft.issueEmailEnabled ?? team.issueEmailEnabled;
  const trimmedName = name.trim();
  const nameError = trimmedName === "" ? NAME_REQUIRED : undefined;
  const keyError = !KEY_PATTERN.test(key) ? KEY_INVALID : keyConflict ? KEY_TAKEN : undefined;

  // Cada gravação mostra "Saved" com Undo (regrava o valor de antes, também sem aviso).
  const save = (patch: TeamPatch) => {
    // O valor de antes de cada campo mexido, para o Undo regravar.
    const previous = Object.fromEntries(
      Object.keys(patch).map((field) => [field, team[field as keyof Team]]),
    ) as TeamPatch;
    update.mutate(
      { id: team.id, ...patch },
      {
        onSuccess: () => {
          setKeyConflict(false);
          toast({
            title: "Saved",
            variant: "success",
            onUndo: () => update.mutate({ id: team.id, ...previous }),
          });
        },
        onError: (error) => {
          const conflict = "code" in error && error.code === "CONFLICT";
          if (conflict && "key" in patch) setKeyConflict(true);
          else {
            toast({
              title: "Could not save team",
              description: "Check your connection and try again.",
              variant: "error",
            });
          }
        },
      },
    );
  };

  const commitName = () => {
    if (canEdit && !nameError && trimmedName !== team.name) save({ name: trimmedName });
  };
  const commitKey = () => {
    if (canEdit && KEY_PATTERN.test(key) && key !== team.key) save({ key });
  };
  const commitDescription = () => {
    const next = description.trim();
    if (canEdit && next !== (team.description ?? ""))
      save({ description: next === "" ? null : next });
  };
  const commitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
  };

  return (
    <div className="flex flex-col">
      <TeamBreadcrumb team={team} page="General" />
      <h1 className="type-heading-1 pb-6 text-primary">General</h1>
      <SettingsGroup>
        <SettingsRow label="Name" error={nameError}>
          {(id) => (
            <div className="flex items-center gap-2">
              {canEdit ? (
                <IconPicker
                  value={icon}
                  onValueChange={(next) => {
                    setDraft((prev) => ({ ...prev, icon: next }));
                    if (!sameIcon(next, team.icon)) save({ icon: next });
                  }}
                  triggerLabel="Choose team icon"
                />
              ) : (
                <ProjectIcon value={icon} className="size-icon-md" />
              )}
              <TextInput
                id={id}
                value={name}
                maxLength={NAME_MAX}
                invalid={Boolean(nameError)}
                disabled={!canEdit}
                autoComplete="off"
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                onBlur={commitName}
                onKeyDown={commitOnEnter}
                className="w-52"
              />
            </div>
          )}
        </SettingsRow>
        <SettingsRow label="Identifier" description="Used in issue IDs" error={keyError}>
          {(id) => (
            <TextInput
              id={id}
              value={key}
              maxLength={KEY_MAX}
              invalid={Boolean(keyError)}
              disabled={!canEdit}
              autoComplete="off"
              onChange={(event) => {
                setKeyConflict(false);
                setDraft((prev) => ({ ...prev, key: event.target.value.toUpperCase() }));
              }}
              onBlur={commitKey}
              onKeyDown={commitOnEnter}
              className="w-64"
            />
          )}
        </SettingsRow>
      </SettingsGroup>

      {/* Como no Linear (medido ao vivo): a Description é uma seção própria — título, subtítulo e
          um cartão com a textarea inteira dentro, sem borda de campo. */}
      <section className="flex flex-col pt-8">
        <h2 className="type-heading-3 text-primary">Description</h2>
        <p className="pb-2 text-body-sm text-secondary">A short summary shown on the team page</p>
        <div className="rounded-container border border-subtle p-2.5 focus-ring-within">
          <TextArea
            variant="plain"
            size="md"
            aria-label="Team description"
            value={description}
            disabled={!canEdit}
            rows={2}
            placeholder="e.g. Builds and maintains core platform infrastructure"
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            onBlur={commitDescription}
          />
        </div>
      </section>

      <SettingsGroup
        title="Estimates"
        description="Used to estimate issue complexity and plan cycle capacity."
      >
        <SettingsRow label="Issue estimation">
          {(id) => (
            <Select<Estimation>
              id={id}
              trigger="field"
              value={estimation}
              disabled={!canEdit}
              options={ESTIMATION_OPTIONS}
              onValueChange={(next) => {
                setDraft((prev) => ({ ...prev, estimation: next }));
                if (next !== team.estimation) save({ estimation: next });
              }}
            />
          )}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="Create issues by email"
        description="Use a team-specific email address to create and collaborate on issues via email"
      >
        <SettingsRow label="Enable issue creation by email">
          {(id) => (
            <Switch
              id={id}
              checked={issueEmailEnabled}
              disabled={!canEdit}
              onCheckedChange={(next) => {
                setDraft((prev) => ({ ...prev, issueEmailEnabled: next }));
                save({ issueEmailEnabled: next });
              }}
            />
          )}
        </SettingsRow>
        {issueEmailEnabled && (
          <IssueEmailAddressRow
            address={team.issueEmailAddress}
            teamId={team.id}
            canEdit={canEdit}
          />
        )}
      </SettingsGroup>

      <SettingsGroup
        title="Timezone"
        description="Used for team schedules, dates, and cycle start times"
      >
        <SettingsRow label="Timezone">
          {(id) => (
            <Combobox
              label="Timezone"
              value={timezone}
              options={getTimezoneOptions()}
              searchPlaceholder="Search timezones…"
              width="md"
              onValueChange={(next) => {
                setDraft((prev) => ({ ...prev, timezone: next }));
                if (next !== team.timezone) save({ timezone: next });
              }}
            >
              <Button
                id={id}
                type="button"
                variant="secondary"
                disabled={!canEdit}
                trailingIcon={ChevronDown}
              >
                {timezoneLabel(timezone)}
              </Button>
            </Combobox>
          )}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Other">
        <SettingsRow
          label="Enable detailed issue history"
          description="Each change to an issue receives and persists a distinct history entry, creating a more detailed history for auditing purposes."
        >
          {(id) => (
            <Switch
              id={id}
              checked={detailedIssueHistory}
              disabled={!canEdit}
              onCheckedChange={(next) => {
                setDraft((prev) => ({ ...prev, detailedIssueHistory: next }));
                save({ detailedIssueHistory: next });
              }}
            />
          )}
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}

/**
 * Endereço do Team para criar issues por e-mail: mostrar, copiar e regerar (o antigo deixa de
 * valer, por isso o `Confirm`). Só configuração: o Vyzer ainda não recebe e-mail de verdade
 * (falta a infraestrutura de recebimento, MX e leitura da mensagem), e a ajuda diz isso.
 */
function IssueEmailAddressRow({
  address,
  teamId,
  canEdit,
}: {
  address: string;
  teamId: string;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const team = useTeam();
  const [copied, setCopied] = useState(false);
  const reset = useMutation({
    ...resetTeamIssueEmailMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teamQueryOptions(team.slug).queryKey });
      toast({ title: "Email address reset", variant: "success" });
    },
    onError: () => {
      toast({
        title: "Could not reset the email address",
        description: "Nothing was changed. Check your connection and try again.",
        variant: "error",
      });
    },
  });

  const copy = () => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast({ title: "Could not copy the address", variant: "error" }));
  };

  return (
    <SettingsRow
      label="Email address"
      description="Reserved for this team. Receiving email to create issues is not available yet."
    >
      {() => (
        <div className="flex flex-col items-end gap-2">
          <code className="max-w-72 text-right text-code break-all text-secondary">{address}</code>
          <div className="flex items-center gap-2">
            <Button type="button" icon={copied ? Check : Copy} onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Button>
            {canEdit && (
              <Confirm
                title="Reset email address?"
                description="A new address is generated and the current one stops working."
                confirmLabel="Reset address"
                onConfirm={() => reset.mutate({ id: teamId })}
              >
                <Button type="button" variant="ghost" loading={reset.isPending}>
                  Reset
                </Button>
              </Confirm>
            )}
          </div>
        </div>
      )}
    </SettingsRow>
  );
}
