/**
 * Profile (Settings → Personal → Profile; spec `profile-settings.md`; Linear ao vivo, 30/09): foto,
 * e-mail (só leitura), Full name, Title e Username num cartão, e "Workspace access" com "Leave
 * workspace". `ProfileView` é só a tela (valores e callbacks); quem a liga à API escolhe de onde
 * vêm os dados e como gravam.
 *
 * Os campos de texto gravam ao sair do campo (blur) ou com Enter, não a cada tecla, e só se o valor
 * mudou e é válido; valor inválido fica no campo com o erro, sem ir para a API.
 *
 * Como o Linear: passar o mouse (ou o foco) na foto mostra um lápis sobre ela, e há um lápis ao lado
 * do e-mail. Trocar o e-mail depende de autenticação real, que o Zynox ainda não tem: sem
 * `onChangeEmail` o lápis aparece desabilitado.
 */
import { useRef, useState, type ChangeEvent } from "react";
import { Pencil } from "lucide-react";
import { Avatar, Button, Confirm, IconButton, TextInput } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import { SettingsGroup, SettingsRow } from "./settings-row";

export type ProfileValues = {
  email: string;
  name: string;
  title: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type ProfileEdit = { name?: string; title?: string | null; username?: string | null };

const NAME_REQUIRED = "Name is required.";
const USERNAME_INVALID = "Use one word, without spaces.";

const AVATAR_TYPES = "image/png,image/jpeg,image/webp,image/svg+xml";

/** Texto opcional: vazio vira `null`, como o banco guarda. */
const orNull = (value: string) => (value.trim() === "" ? null : value.trim());

export function ProfileView({
  values,
  onEdit,
  onUploadAvatar,
  onChangeEmail,
  uploading = false,
  uploadError,
  onLeave,
  canLeave = true,
  leaveHint,
  headingLevel = "h1",
}: {
  values: ProfileValues;
  onEdit: (patch: ProfileEdit) => void;
  onUploadAvatar: (file: File) => void;
  /** Abre a troca de e-mail; sem ela o lápis do e-mail fica desabilitado. */
  onChangeEmail?: () => void;
  uploading?: boolean;
  uploadError?: string;
  onLeave: () => void;
  /** Quando a regra de negócio não deixa sair (ex.: único Member); o botão fica desabilitado. */
  canLeave?: boolean;
  /** Explica por que "Leave workspace" está desabilitado. */
  leaveHint?: string;
  headingLevel?: "h1" | "h2";
}) {
  const [draft, setDraft] = useState<{ name?: string; title?: string; username?: string }>({});
  const fileInput = useRef<HTMLInputElement>(null);

  const name = draft.name ?? values.name;
  const title = draft.title ?? values.title ?? "";
  const username = draft.username ?? values.username ?? "";
  const nameError = name.trim() === "" ? NAME_REQUIRED : undefined;
  const usernameError = /\s/.test(username.trim()) ? USERNAME_INVALID : undefined;

  const clear = (key: keyof typeof draft) =>
    setDraft((current) => {
      const { [key]: _dropped, ...rest } = current;
      return rest;
    });

  const commitName = () => {
    if (draft.name === undefined) return;
    if (!nameError && name.trim() !== values.name) onEdit({ name: name.trim() });
    if (!nameError) clear("name");
  };
  const commitTitle = () => {
    if (draft.title === undefined) return;
    if (orNull(title) !== values.title) onEdit({ title: orNull(title) });
    clear("title");
  };
  const commitUsername = () => {
    if (draft.username === undefined) return;
    if (!usernameError && orNull(username) !== values.username) {
      onEdit({ username: orNull(username) });
    }
    if (!usernameError) clear("username");
  };
  // Enter tira o foco do campo; quem grava é o onBlur (uma vez só).
  const commitOnEnter = (event: { key: string; currentTarget: { blur: () => void } }) => {
    if (event.key === "Enter") event.currentTarget.blur();
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Limpa para poder escolher o mesmo arquivo de novo depois de um erro.
    event.target.value = "";
    if (file) onUploadAvatar(file);
  };

  const Heading = headingLevel;

  return (
    <div className="flex flex-col gap-1">
      <Heading className="type-heading-1 pb-6 text-primary">Profile</Heading>

      <SettingsGroup>
        <SettingsRow label="Profile picture" error={uploadError}>
          {() => (
            <>
              <input
                ref={fileInput}
                type="file"
                accept={AVATAR_TYPES}
                aria-label="Profile picture file"
                hidden
                onChange={onFile}
              />
              <button
                type="button"
                aria-label="Change profile picture"
                aria-busy={uploading || undefined}
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className="group relative rounded-full focus-ring disabled:opacity-disabled"
              >
                <Avatar name={values.name} src={values.avatarUrl ?? undefined} className="size-8" />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-surface/70 text-primary opacity-0 transition-opacity group-focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Icon icon={Pencil} size="xs" />
                </span>
              </button>
            </>
          )}
        </SettingsRow>
        <SettingsRow label="Email">
          {() => (
            <span className="flex items-center gap-2">
              <span className="text-body-md text-primary">{values.email}</span>
              <IconButton
                icon={Pencil}
                label="Change email"
                variant="secondary"
                size="sm"
                iconSize="sm"
                disabled={!onChangeEmail}
                onClick={onChangeEmail}
              />
            </span>
          )}
        </SettingsRow>
        <SettingsRow label="Full name" error={nameError}>
          {(id) => (
            <TextInput
              id={id}
              value={name}
              placeholder="Full name"
              autoComplete="name"
              invalid={Boolean(nameError)}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              onBlur={commitName}
              onKeyDown={commitOnEnter}
              className="w-45"
            />
          )}
        </SettingsRow>
        <SettingsRow label="Title" description="Your job title or role">
          {(id) => (
            <TextInput
              id={id}
              value={title}
              placeholder="Software engineer"
              autoComplete="organization-title"
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              onBlur={commitTitle}
              onKeyDown={commitOnEnter}
              className="w-45"
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Username"
          description="One word, like a nickname or first name"
          error={usernameError}
        >
          {(id) => (
            <TextInput
              id={id}
              value={username}
              placeholder="username"
              autoComplete="username"
              invalid={Boolean(usernameError)}
              onChange={(event) =>
                setDraft((current) => ({ ...current, username: event.target.value }))
              }
              onBlur={commitUsername}
              onKeyDown={commitOnEnter}
              className="w-45"
            />
          )}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Workspace access">
        <SettingsRow
          label="Remove yourself from workspace"
          description={canLeave ? undefined : leaveHint}
        >
          {() => (
            <Confirm
              title="Leave workspace?"
              description="You will lose access to this workspace and everything in it. This cannot be undone."
              confirmLabel="Leave workspace"
              onConfirm={onLeave}
            >
              <Button type="button" variant="ghost" disabled={!canLeave}>
                Leave workspace
              </Button>
            </Confirm>
          )}
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
