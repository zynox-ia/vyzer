/**
 * General do Team (`/settings/teams/:team/general`, spec 2.2; Linear ao vivo,
 * `/settings/teams/VYZ/general`): Name com o botão de ícone, Identifier ("Used in issue IDs") e
 * Description ("A short summary shown on the team page"), no mesmo cartão de linhas de
 * rótulo/controle das outras páginas de Settings. Estimates, Create issues by email, Timezone e
 * Other ficam de fora por ora (D10 da spec, a confirmar item a item: exigem campos novos).
 *
 * Salva sozinho, como o Workspace (pedido do responsável, 29/09): texto ao sair do campo ou com
 * Enter (a Description, só ao sair), ícone na hora, toast "Saved" com Undo que regrava o valor
 * de antes. Identifier já usado volta como CONFLICT e vira erro no campo, sem perder o que foi
 * digitado. Leitura aberta a qualquer Member; edição só por Admin (D14).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type KeyboardEvent } from "react";
import type { ApiClient } from "@vyzer/contract";
import {
  IconPicker,
  ProjectIcon,
  TextArea,
  TextInput,
  useToast,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import { teamQueryOptions, teamsQueryOptions, updateTeamMutationOptions } from "@/services/teams";
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
  const trimmedName = name.trim();
  const nameError = trimmedName === "" ? NAME_REQUIRED : undefined;
  const keyError = !KEY_PATTERN.test(key) ? KEY_INVALID : keyConflict ? KEY_TAKEN : undefined;

  // Cada gravação mostra "Saved" com Undo (regrava o valor de antes, também sem aviso).
  const save = (patch: TeamPatch) => {
    const previous: TeamPatch = {};
    if ("name" in patch) previous.name = team.name;
    if ("key" in patch) previous.key = team.key;
    if ("icon" in patch) previous.icon = team.icon;
    if ("description" in patch) previous.description = team.description;
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
    </div>
  );
}
