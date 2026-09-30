/**
 * Formulário de chave de API compartilhado por "Create API key" e "Edit API key" (spec
 * `settings-security-api-usage.md`, API.2; Linear ao vivo, `/api-keys/new` e `/api-keys/<id>/edit`,
 * 29/09, os dois com os mesmos campos): **Key name**, **Permissions** (Full access ou Only select
 * permissions… com os cinco checkboxes) e Cancel/ação principal. **Team access** entra na API.4.
 *
 * Um Member comum não pede Full access nem Admin (a API recusa): essas opções ficam desabilitadas
 * para não convidar a uma ação que falha.
 */
import { useState, type FormEvent } from "react";
import type { ApiKeyPermission } from "@vyzer/contract";
import {
  Button,
  Checkbox,
  Field,
  HelperText,
  Radio,
  RadioGroup,
  TextInput,
} from "@vyzer/design-system/components";
import { ADMIN_ONLY_PERMISSIONS, PERMISSION_OPTIONS, type ApiKey } from "./api-key-shared";

type Mode = "full" | "select";

export type ApiKeyFormValues = { name: string; permissions: ApiKeyPermission[] | "full" };

function PermissionCheckboxes({
  selected,
  canRequestAdmin,
  onChange,
}: {
  selected: ApiKeyPermission[];
  canRequestAdmin: boolean;
  onChange: (next: ApiKeyPermission[]) => void;
}) {
  const toggle = (value: ApiKeyPermission, checked: boolean) =>
    onChange(checked ? [...selected, value] : selected.filter((item) => item !== value));

  return (
    <div className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 pt-1 pl-6">
      {PERMISSION_OPTIONS.map((option) => {
        const disabled = !canRequestAdmin && ADMIN_ONLY_PERMISSIONS.includes(option.value);
        const nameId = `permission-${option.value}-name`;
        const descriptionId = `permission-${option.value}-description`;
        return (
          <label
            key={option.value}
            className="col-span-2 grid grid-cols-subgrid items-center text-body-md text-primary select-none"
          >
            <span className="flex items-center gap-2">
              <Checkbox
                aria-labelledby={nameId}
                aria-describedby={descriptionId}
                disabled={disabled}
                checked={selected.includes(option.value)}
                onCheckedChange={(checked) => toggle(option.value, checked === true)}
              />
              <span id={nameId}>{option.label}</span>
            </span>
            <span id={descriptionId} className="text-secondary">
              {option.description}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function ApiKeyForm({
  initial,
  isAdmin,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  /** Chave existente (Edit); sem ela o formulário começa vazio (Create). */
  initial?: Pick<ApiKey, "name" | "permissions">;
  isAdmin: boolean;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: ApiKeyFormValues) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  // Só a escolha explícita vale; sem ela o modo vem da chave (Edit) ou do Role (Create).
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const [selected, setSelected] = useState<ApiKeyPermission[]>(
    initial && initial.permissions !== "full" ? initial.permissions : [],
  );

  const initialMode: Mode = initial
    ? initial.permissions === "full"
      ? "full"
      : "select"
    : isAdmin
      ? "full"
      : "select";
  const mode = chosenMode ?? initialMode;
  const trimmedName = name.trim();
  const cannotSubmit =
    trimmedName.length === 0 || (mode === "select" && selected.length === 0) || pending;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cannotSubmit) return;
    onSubmit({ name: trimmedName, permissions: mode === "full" ? "full" : selected });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Field label="Key name">
        <TextInput
          autoComplete="off"
          placeholder="A descriptive name for this API key…"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="Permissions">
        {/* A ajuda fica entre o rótulo e as opções, como no Linear (o Field a poria embaixo). */}
        <HelperText>Only enable the minimum permissions required for your use case</HelperText>
        <RadioGroup value={mode} onValueChange={(next) => setChosenMode(next as Mode)}>
          <Radio value="full" label="Full access" disabled={!isAdmin} />
          <Radio value="select" label="Only select permissions…" />
        </RadioGroup>
        {mode === "select" && (
          <PermissionCheckboxes
            selected={selected}
            canRequestAdmin={isAdmin}
            onChange={setSelected}
          />
        )}
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={cannotSubmit} loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
