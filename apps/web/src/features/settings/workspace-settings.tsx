/**
 * Settings → Administration → Workspace (spec `settings-administration.md`, sub-etapa 1.1 e
 * correção 1.1b; Linear ao vivo, `/zynox-dev/settings/workspace`, medido lado a lado 28/09, sem
 * frame no Figma). A premissa é copiar o Linear campo a campo, inclusive o que ele mostra
 * desabilitado: quatro cartões, cada linha com rótulo e ajuda à esquerda e controle à direita
 * (input de 256 px), como o `SettingsGroup`/`SettingsRow` de Preferences.
 *
 * - Sem título: ícone (`IconPicker`, no lugar do upload de logo — sem storage de arquivos, ver
 *   spec D1), Name e URL (prefixo + slug).
 * - Time & region: primeiro mês do ano fiscal (Select) e Region, só leitura.
 * - Member onboarding: Welcome message e Default home view, sempre desabilitados com "Available
 *   on Enterprise", como o Linear mostra fora do plano Enterprise. Só apresentação.
 * - Danger zone: "Delete workspace" de verdade, com `Confirm` (danger). Imediato e sem volta,
 *   sem a janela de restauração do Linear (mesma linguagem do ADR-0016 para Team).
 *
 * Salva sozinho, sem botão Save, como o Linear (pedido do responsável, 29/09, no lugar do D16 da
 * spec): texto ao sair do campo ou com Enter, ícone e mês na hora, toast "Saved" com Undo a cada
 * gravação (pedido do responsável, 29/09); falha mostra um aviso e mantém o valor digitado. Leitura aberta a
 * qualquer Member; edição só por Admin (D14): a API devolve FORBIDDEN de qualquer forma, aqui os
 * controles ficam desabilitados para não convidar a uma ação que falha.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type KeyboardEvent } from "react";
import type { ApiClient } from "@vyzer/contract";
import {
  Alert,
  Button,
  Confirm,
  IconPicker,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  ProjectIcon,
  Select,
  Skeleton,
  TextInput,
  useToast,
  type ListOption,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import {
  currentWorkspaceQueryOptions,
  deleteWorkspaceMutationOptions,
  updateWorkspaceMutationOptions,
} from "@/services/workspace";
import { SettingsGroup, SettingsRow } from "./settings-row";

const NAME_REQUIRED = "Name is required.";
const SLUG_INVALID = "Use lowercase letters, numbers and hyphens, e.g. my-workspace.";
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Prefixo do endereço do Workspace, mostrado antes do slug (no Linear: `linear.app/`). */
const URL_PREFIX = "vyzer.app/";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_OPTIONS: ListOption[] = MONTHS.map((label, index) => ({
  value: String(index + 1),
  label,
}));

/** Campos que esta tela edita; `apiKeyPolicy` é da página API (spec settings-security-api-usage). */
type WorkspacePatch = Omit<Parameters<ApiClient["workspace"]["update"]>[0], "apiKeyPolicy">;

function sameIcon(a: ProjectIconValue, b: ProjectIconValue) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function SkeletonRow({ last, control }: { last?: boolean; control: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-4 ${last ? "" : "border-b border-subtle"}`}
    >
      <Skeleton className="w-24" />
      <Skeleton shape="block" className={control} />
    </div>
  );
}

function WorkspaceSettingsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Loading workspace settings.</span>
      <div className="flex flex-col rounded-container border border-subtle px-4">
        <SkeletonRow control="size-control-md rounded-xs" />
        <SkeletonRow control="h-control-lg w-64" />
        <SkeletonRow last control="h-control-lg w-64" />
      </div>
      <div className="flex flex-col rounded-container border border-subtle px-4">
        <SkeletonRow control="h-control-lg w-24" />
        <SkeletonRow last control="h-4 w-24" />
      </div>
    </div>
  );
}

export function WorkspaceSettingsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const current = useQuery(currentWorkspaceQueryOptions());
  const update = useMutation({
    ...updateWorkspaceMutationOptions(),
    onSuccess: async (_saved, patch) => {
      // A sidebar e o WorkspaceMenu leem a mesma query: refazê-la atualiza nome e ícone sem
      // recarregar a página. O rascunho só some para o que foi salvo; o resto continua.
      await queryClient.invalidateQueries({ queryKey: currentWorkspaceQueryOptions().queryKey });
      setDraft((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(patch) as (keyof WorkspacePatch)[]) delete next[key];
        return next;
      });
    },
    onError: () => {
      toast({
        title: "Could not save workspace",
        description: "Check your connection and try again.",
        variant: "error",
      });
    },
  });
  const remove = useMutation({
    ...deleteWorkspaceMutationOptions(),
    onSuccess: () => {
      // Sem navegação pós-exclusão: dali em diante toda chamada da API falha e o AppShell já
      // trata esse erro (workspaceStatus).
      toast({ title: "Workspace deleted", variant: "success" });
    },
    onError: () => {
      toast({
        title: "Could not delete workspace",
        description: "Nothing was deleted. Check your connection and try again.",
        variant: "error",
      });
    },
  });
  // Rascunho só do que a pessoa mexeu: o resto segue o dado salvo, sem efeito para sincronizar.
  const [draft, setDraft] = useState<{
    name?: string;
    icon?: ProjectIconValue;
    slug?: string;
    fiscalYearStartMonth?: number;
    logoUrl?: string | null;
  }>({});

  if (current.isPending) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Workspace</h1>
        <WorkspaceSettingsSkeleton />
      </div>
    );
  }

  if (current.isError) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Workspace</h1>
        <Alert
          tone="danger"
          role="alert"
          title="Could not load workspace settings"
          action={
            <Button type="button" variant="secondary" onClick={() => void current.refetch()}>
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      </div>
    );
  }

  const { workspace, member } = current.data;
  const canEdit = member.role === "admin";
  const name = draft.name ?? workspace.name;
  const icon = draft.icon ?? workspace.icon;
  const slug = draft.slug ?? workspace.slug;
  const month = String(draft.fiscalYearStartMonth ?? workspace.fiscalYearStartMonth);
  const trimmedName = name.trim();
  const trimmedSlug = slug.trim();
  const nameError = trimmedName === "" ? NAME_REQUIRED : undefined;
  const slugError = SLUG_PATTERN.test(trimmedSlug) ? undefined : SLUG_INVALID;
  const nameChanged = trimmedName !== workspace.name;
  const slugChanged = trimmedSlug !== workspace.slug;

  // Salva sozinho, como o Linear: texto ao sair do campo (ou Enter), ícone e mês na hora. Valor
  // inválido fica no campo com o erro, sem ir para a API; falha da API mantém o rascunho.
  // Cada gravação mostra "Saved" com Undo, que regrava o valor de antes (também sem aviso).
  const save = (patch: WorkspacePatch) => {
    const previous: WorkspacePatch = {};
    if ("name" in patch) previous.name = workspace.name;
    if ("icon" in patch) previous.icon = workspace.icon;
    if ("slug" in patch) previous.slug = workspace.slug;
    if ("fiscalYearStartMonth" in patch) {
      previous.fiscalYearStartMonth = workspace.fiscalYearStartMonth;
    }
    update.mutate(patch, {
      onSuccess: () =>
        toast({ title: "Saved", variant: "success", onUndo: () => update.mutate(previous) }),
    });
  };
  const commitName = () => {
    if (canEdit && nameChanged && !nameError) save({ name: trimmedName });
  };
  const commitSlug = () => {
    if (canEdit && slugChanged && !slugError) save({ slug: trimmedSlug });
  };
  const commitOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="type-heading-1 pb-4 text-primary">Workspace</h1>
      <div className="flex flex-col gap-4">
        <SettingsGroup>
          <SettingsRow label="Icon" description="Shown next to the workspace name in the sidebar">
            {() =>
              canEdit ? (
                <IconPicker
                  value={icon}
                  onValueChange={(next) => {
                    setDraft((prev) => ({ ...prev, icon: next }));
                    if (!sameIcon(next, workspace.icon)) save({ icon: next });
                  }}
                  triggerLabel="Choose workspace icon"
                />
              ) : (
                <ProjectIcon value={icon} className="size-icon-md" />
              )
            }
          </SettingsRow>
          <SettingsRow label="Name" error={nameError}>
            {(id) => (
              <TextInput
                id={id}
                value={name}
                invalid={Boolean(nameError)}
                disabled={!canEdit}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={commitName}
                onKeyDown={commitOnEnter}
                className="w-64"
              />
            )}
          </SettingsRow>
          <SettingsRow label="URL" error={slugError}>
            {(id) => (
              <InputGroup invalid={Boolean(slugError)} className="w-64">
                <InputGroupAddon>{URL_PREFIX}</InputGroupAddon>
                <InputGroupInput
                  id={id}
                  value={slug}
                  disabled={!canEdit}
                  aria-invalid={Boolean(slugError) || undefined}
                  onChange={(e) => setDraft((prev) => ({ ...prev, slug: e.target.value }))}
                  onBlur={commitSlug}
                  onKeyDown={commitOnEnter}
                />
              </InputGroup>
            )}
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Time & region">
          <SettingsRow
            label="First month of the fiscal year"
            description="Used when grouping projects and issues quarterly, half-yearly, and yearly"
          >
            {(id) => (
              <Select
                id={id}
                trigger="button"
                value={month}
                disabled={!canEdit}
                onValueChange={(next) => {
                  const fiscalYearStartMonth = Number(next);
                  setDraft((prev) => ({ ...prev, fiscalYearStartMonth }));
                  if (fiscalYearStartMonth !== workspace.fiscalYearStartMonth) {
                    save({ fiscalYearStartMonth });
                  }
                }}
                options={MONTH_OPTIONS}
              />
            )}
          </SettingsRow>
          <SettingsRow
            label="Region"
            description="Set when a workspace is created and cannot be changed."
          >
            {() => <span className="text-body-md text-secondary">{workspace.region}</span>}
          </SettingsRow>
        </SettingsGroup>
      </div>

      <SettingsGroup title="Member onboarding">
        <SettingsRow label="Welcome message">
          {() => (
            <Button type="button" variant="ghost" disabled>
              Available on Enterprise
            </Button>
          )}
        </SettingsRow>
        <SettingsRow label="Default home view">
          {() => (
            <Button type="button" variant="ghost" disabled>
              Available on Enterprise
            </Button>
          )}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Danger zone">
        <SettingsRow
          label="Delete workspace"
          description="Permanently delete this workspace, immediately"
        >
          {() => (
            <Confirm
              title="Delete workspace?"
              description="This permanently deletes the workspace and everything in it. It happens immediately and cannot be undone."
              confirmLabel="Delete workspace"
              onConfirm={() => remove.mutate()}
            >
              <Button
                type="button"
                variant="danger"
                disabled={!canEdit || remove.isPending}
                loading={remove.isPending}
              >
                Delete workspace
              </Button>
            </Confirm>
          )}
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
