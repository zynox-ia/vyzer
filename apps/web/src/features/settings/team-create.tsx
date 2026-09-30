/**
 * Settings → Administration → Teams → Create team (spec `settings-administration.md`, sub-etapa
 * 2.1; sem frame no Figma e o formulário real do Linear estava bloqueado pelo limite de times do
 * plano, então segue o pattern Settings Form do design system com os campos da spec): ícone e
 * Name na mesma linha, e Identifier (a key, "Used as a prefix for team issues"). O slug vem do
 * nome, no servidor.
 *
 * A key sugerida acompanha o nome (as três primeiras letras, como o Linear sugere) até a pessoa
 * editá-la. Key duplicada volta como CONFLICT e vira erro no campo Identifier. Sucesso vai para
 * a configuração do Team e mostra o toast.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  IconPicker,
  TextInput,
  useToast,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import { createTeamMutationOptions, teamsQueryOptions } from "@/services/teams";
import { SettingsGroup, SettingsRow } from "./settings-row";

const KEY_PATTERN = /^[A-Z][A-Z0-9]*$/;
const KEY_INVALID = "Use capital letters and numbers, starting with a letter.";
const KEY_TAKEN = "This identifier is already taken.";

const DEFAULT_ICON: ProjectIconValue = { kind: "icon", name: "Users", color: "purple" };

/** Sugestão de key: até três letras ou números do nome, em maiúsculas, começando por letra. */
function suggestKey(name: string) {
  const letters = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const start = letters.search(/[A-Z]/);
  return start === -1 ? "" : letters.slice(start, start + 3);
}

export function TeamCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<ProjectIconValue>(DEFAULT_ICON);
  const [key, setKey] = useState("");
  const [keyEdited, setKeyEdited] = useState(false);
  const [serverKeyError, setServerKeyError] = useState<string>();
  const [serverNameError, setServerNameError] = useState<string>();

  const create = useMutation({
    ...createTeamMutationOptions(),
    onSuccess: async (team) => {
      await queryClient.invalidateQueries({ queryKey: teamsQueryOptions().queryKey });
      toast({ title: `${team.name} created`, variant: "success" });
      navigate(`/settings/teams/${team.slug}`);
    },
    onError: (error) => {
      const code = "code" in error ? error.code : undefined;
      if (code === "CONFLICT") setServerKeyError(KEY_TAKEN);
      else if (code === "BAD_REQUEST") setServerNameError(error.message);
      else {
        toast({
          title: "Could not create team",
          description: "Check your connection and try again.",
          variant: "error",
        });
      }
    },
  });

  const trimmedName = name.trim();
  const keyError = key !== "" && !KEY_PATTERN.test(key) ? KEY_INVALID : serverKeyError;
  const nameError = serverNameError;
  const canSubmit = trimmedName !== "" && key !== "" && KEY_PATTERN.test(key) && !create.isPending;

  const changeName = (value: string) => {
    setName(value);
    setServerNameError(undefined);
    if (!keyEdited) {
      setKey(suggestKey(value));
      setServerKeyError(undefined);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    create.mutate({ name: trimmedName, key, icon });
  };

  return (
    <div className="flex flex-col gap-1">
      <h1 className="type-heading-1 pb-6 text-primary">Create a new team</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <SettingsGroup>
          <SettingsRow label="Icon & name" error={nameError}>
            {(id) => (
              <div className="flex items-center gap-2">
                <IconPicker value={icon} onValueChange={setIcon} triggerLabel="Choose team icon" />
                <TextInput
                  id={id}
                  value={name}
                  maxLength={48}
                  invalid={Boolean(nameError)}
                  placeholder="Team name"
                  autoComplete="off"
                  onChange={(event) => changeName(event.target.value)}
                  className="w-52"
                />
              </div>
            )}
          </SettingsRow>
          <SettingsRow
            label="Identifier"
            description="Used as a prefix for team issues (e.g. ENG-123)"
            error={keyError}
          >
            {(id) => (
              <TextInput
                id={id}
                value={key}
                maxLength={7}
                invalid={Boolean(keyError)}
                autoComplete="off"
                onChange={(event) => {
                  setKeyEdited(true);
                  setServerKeyError(undefined);
                  setKey(event.target.value.toUpperCase());
                }}
                className="w-64"
              />
            )}
          </SettingsRow>
        </SettingsGroup>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={!canSubmit} loading={create.isPending}>
            Create team
          </Button>
        </div>
      </form>
    </div>
  );
}
